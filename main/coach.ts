import { Chess } from 'chess.js';
import { classifyMove, isDecidedEitherWay } from '../analysis/classify';
import { isBookPosition } from '../openings/book';
import { negateScore, type Score } from '../analysis/score';
import { winProbability } from '../analysis/winProbability';
import type { EngineEval } from '../engine/types';
import { cachedExplanation, explainInstantly, explainMistake } from '../explain';
import { GeminiClient } from '../explain/narrator/gemini';
import type { LlmClient } from '../explain/narrator/llm';
import { OpenRouterClient } from '../explain/narrator/openrouter';
import type { ExplainResult, Explanation, MistakeContext } from '../explain/types';
import type { MoveCheck, MoveCheckRequest, ReviewProgress, ReviewedMove, ThreatInfo } from '../shared/api';
import type { Db } from './db';
import type { EngineManager } from './engineManager';
import type { SettingsStore } from './settings';

const fenKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

/** live = the game you are playing; bulk = background analysis on its own engine. */
export type Lane = 'live' | 'bulk';

function uciOf(m: { from: string; to: string; promotion?: string }): string {
  return `${m.from}${m.to}${m.promotion ?? ''}`;
}

/** Live coaching + review on top of the engines and the explanation pipeline. */
export class CoachService {
  private readonly inflight = new Map<string, Promise<EngineEval>>();

  constructor(
    private readonly engines: EngineManager,
    private readonly db: Db,
    private readonly settings: SettingsStore,
  ) {}

  /** Engine eval for the side to move, cached in SQLite and de-duplicated while in flight. */
  analyzeFen(fen: string, lane: Lane = 'live'): Promise<EngineEval> {
    const depth = this.settings.get().analysisDepth;
    const key = `${fenKey(fen)}@${depth}`;
    const chess = new Chess(fen);
    if (chess.isCheckmate()) return Promise.resolve({ cp: null, mate: -1, pv: [], bestMove: null });
    if (chess.isDraw() || chess.isStalemate()) return Promise.resolve({ cp: 0, mate: null, pv: [], bestMove: null });
    const cached = this.db.getAnalysis(fenKey(fen), depth);
    if (cached) return Promise.resolve(cached);
    const running = this.inflight.get(key);
    if (running) return running;
    const job = (lane === 'bulk' ? this.engines.bulk() : this.engines.coach())
      .evaluate(fen, depth)
      .then((e) => {
        this.db.putAnalysis(fenKey(fen), depth, e);
        return e;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, job);
    return job;
  }

  /**
   * What would the opponent do if you passed? Never calls the AI: flips the side to move, asks the engine,
   * and describes the answer in words. "Nothing urgent" when passing would cost you little.
   */
  async threat(fen: string): Promise<ThreatInfo> {
    const now = new Chess(fen);
    if (now.isGameOver()) return { uci: null, san: null, text: 'The game is over.' };
    if (now.inCheck()) return { uci: null, san: null, text: 'You are in check: deal with the check first.' };
    const me = now.turn();
    const parts = fen.split(' ');
    parts[1] = me === 'w' ? 'b' : 'w';
    parts[3] = '-';
    const flipped = parts.join(' ');
    let opp: Chess;
    try {
      opp = new Chess(flipped);
    } catch {
      return { uci: null, san: null, text: 'Nothing urgent.' };
    }
    const [mine, theirs] = await Promise.all([this.analyzeFen(fen), this.analyzeFen(flipped)]);
    const myWinNow = winProbability({ cp: mine.cp, mate: mine.mate });
    const myWinIfPass = 100 - winProbability({ cp: theirs.cp, mate: theirs.mate });
    const best = theirs.bestMove;
    if (!best) return { uci: null, san: null, text: 'Nothing urgent.' };
    const m = opp.move(parseUciMove(best));
    const mate = theirs.mate !== null && theirs.mate > 0 && theirs.mate <= 3;
    if (!mate && myWinNow - myWinIfPass < 8) {
      return { uci: null, san: null, text: 'Nothing urgent: your opponent has no strong threat right now.' };
    }
    const names: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
    let text: string;
    if (mate) text = `Your opponent threatens ${m.san}, leading to checkmate.`;
    else if (m.captured) text = `Your opponent threatens ${m.san}, capturing your ${names[m.captured]} on ${m.to}.`;
    else if (m.san.includes('+')) text = `Your opponent threatens ${m.san}, a check that wins ground.`;
    else text = `Your opponent threatens ${m.san}, which would put you in trouble.`;
    return { uci: best, san: m.san, text };
  }

  async prefetch(fen: string): Promise<void> {
    await this.analyzeFen(fen).catch(() => undefined);
  }

  async checkMove(req: MoveCheckRequest, lane: Lane = 'live'): Promise<MoveCheck> {
    const chess = new Chess(req.fenBefore);
    const move = chess.move(parseUciMove(req.moveUci));
    const before = await this.analyzeFen(req.fenBefore, lane);
    const best = before.bestMove;
    const bestSan = best ? sanOf(req.fenBefore, best) : null;

    const base = { moveUci: req.moveUci, san: move.san, bestMoveUci: best, bestMoveSan: bestSan };
    const evalBefore: Score = { cp: before.cp, mate: before.mate };
    const wpB = winProbability(evalBefore);

    if (chess.isCheckmate()) {
      return { ...base, classification: 'good', winProbBefore: wpB, winProbAfter: 100, stop: false, book: isBookPosition(chess.fen()), ctx: null, instant: null };
    }
    const afterRaw = await this.analyzeFen(chess.fen(), lane);
    const evalAfter = negateScore({ cp: afterRaw.cp, mate: afterRaw.mate });
    const wpA = winProbability(evalAfter);
    let classification = classifyMove(wpB, wpA);
    if (best === req.moveUci) classification = 'good'; // engine noise between two searches
    // Known opening theory is not a mistake: only a serious drop (e.g. a gambit that really fails) is still flagged.
    const book = isBookPosition(chess.fen());
    if (book && (classification === 'inaccuracy' || classification === 'mistake') && wpB - wpA < 5) classification = 'good';

    const flagged = classification !== 'good' && !isDecidedEitherWay(wpB, wpA) && best !== null;
    if (!flagged || !best) {
      return { ...base, classification, winProbBefore: wpB, winProbAfter: wpA, stop: false, book, ctx: null, instant: null };
    }
    const ctx: MistakeContext = {
      fen: req.fenBefore,
      movePlayedUci: req.moveUci,
      bestMoveUci: best,
      evalBefore,
      evalAfter,
      winProbBefore: wpB,
      winProbAfter: wpA,
      bestLine: before.pv.length > 0 ? before.pv : [best],
      refutationLine: afterRaw.pv,
      moveNumber: Number(req.fenBefore.split(' ')[5] ?? '1'),
      myColor: req.myColor,
    };
    const stopOn = this.settings.get().stopOn;
    const stop = classification === 'blunder' || (stopOn === 'mistake' && classification === 'mistake');
    let instant: ExplainResult | null = null;
    try {
      instant = explainInstantly(ctx);
    } catch (e) {
      console.error('explainInstantly failed', e);
    }
    return { ...base, classification, winProbBefore: wpB, winProbAfter: wpA, stop, book, ctx, instant };
  }

  /** The LLM for the selected provider, or null when that provider has no key (template-only). */
  private llm(timeoutMs?: number): { client: LlmClient; label: string; lastModel: () => string | null } | null {
    const s = this.settings.get();
    const key = this.settings.getApiKey(s.llmProvider);
    if (!key) return null;
    if (s.llmProvider === 'openrouter') {
      const client = new OpenRouterClient({ apiKey: key, model: s.openrouterModel, timeoutMs });
      return { client, label: `OpenRouter (${s.openrouterModel})`, lastModel: () => client.lastModel };
    }
    const client = new GeminiClient({ apiKey: key, model: s.geminiModel, timeoutMs });
    return { client, label: `Gemini (${s.geminiModel})`, lastModel: () => null };
  }

  cached(ctx: MistakeContext): Promise<Explanation | null> {
    return cachedExplanation(ctx, this.db.explanationStore());
  }

  narrate(ctx: MistakeContext): Promise<ExplainResult> {
    return explainMistake(ctx, { llm: this.llm()?.client ?? null, cache: this.db.explanationStore() });
  }

  async testApiKey(): Promise<{ ok: boolean; message: string }> {
    const llm = this.llm(30000);
    if (!llm) return { ok: false, message: 'No API key saved for this provider.' };
    try {
      await llm.client.complete('Reply with the JSON object {"ok": true}.', 'ping');
      const used = llm.lastModel();
      return { ok: true, message: `${llm.label} answered${used ? ` using ${used}` : ''}.` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async reviewGame(pgn: string, myColor: 'w' | 'b', onProgress: (p: ReviewProgress) => void, lane: Lane = 'live'): Promise<ReviewedMove[]> {
    const game = new Chess();
    game.loadPgn(pgn);
    const history = game.history({ verbose: true });
    const total = history.filter((m) => m.color === myColor).length;
    let done = 0;
    onProgress({ done, total });
    const out: ReviewedMove[] = [];
    for (const [ply, m] of history.entries()) {
      const mine = m.color === myColor;
      let check: MoveCheck | null = null;
      if (mine) {
        check = await this.checkMove({ fenBefore: m.before, moveUci: uciOf(m), myColor }, lane);
        done += 1;
        onProgress({ done, total });
      }
      out.push({ ply, fenBefore: m.before, fenAfter: m.after, san: m.san, uci: uciOf(m), mine, check });
    }
    return out;
  }
}

export function parseUciMove(uci: string): { from: string; to: string; promotion?: string } {
  const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
  return promotion ? { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion } : { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

function sanOf(fen: string, uci: string): string | null {
  try {
    return new Chess(fen).move(parseUciMove(uci)).san;
  } catch {
    return null;
  }
}
