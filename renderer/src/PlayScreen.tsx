import { Chess, type Color, type Square } from 'chess.js';
import type { DrawShape } from 'chessground/draw';
import type { Key } from 'chessground/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DRAW_SURVIVAL_MOVES, type EndgamePosition } from '../../endgames/positions';
import { buildPlan, type PlanResult } from '../../explain/plan';
import type { ExplainResult } from '../../explain/types';
import type { EngineStatus, MoveCheck, OpeningTrackInfo, OpponentKind, ThreatInfo } from '../../shared/api';
import { api } from './api';
import { gameResult, isPromotion, legalDests, uciFrom, uciTo } from './chessUtil';
import { Board } from './components/Board';
import { CoachCard, type RevealLevel } from './components/CoachCard';
import { MoveList } from './components/MoveList';
import { PgnButtons } from './components/PgnButtons';
import { PromotionPicker, type PromoPiece } from './components/PromotionPicker';
import { playSound, soundForMove } from './sounds';

type Phase = 'setup' | 'my-turn' | 'checking' | 'coach' | 'bot' | 'over';

interface Setup {
  myColor: Color;
  opponent: OpponentKind;
  skill: number;
  maiaRating: number;
  /** 'none' or 'minutes+increment', e.g. '5+0'. */
  timeControl: string;
  /** Opening family the bot steers towards ('' = any). */
  bookFamily: string;
}

interface CoachState {
  check: MoveCheck;
  result: ExplainResult;
  narrating: boolean;
  level: RevealLevel;
}

export interface EndgameLaunch {
  readonly nonce: number;
  readonly endgame: EndgamePosition;
}

const TIME_CONTROLS: readonly { id: string; label: string }[] = [
  { id: 'none', label: 'No clock' },
  { id: '3+0', label: '3 min' },
  { id: '5+0', label: '5 min' },
  { id: '10+0', label: '10 min' },
  { id: '15+10', label: '15 min + 10 s' },
];

const DEFAULT_SETUP: Setup = { myColor: 'w', opponent: 'stockfish', skill: 5, maiaRating: 1100, timeControl: 'none', bookFamily: '' };

const cg = (c: Color): 'white' | 'black' => (c === 'w' ? 'white' : 'black');
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

function parseTime(tc: string): { baseMs: number; incMs: number } | null {
  const m = /^(\d+)\+(\d+)$/.exec(tc);
  return m ? { baseMs: Number(m[1]) * 60_000, incMs: Number(m[2]) * 1000 } : null;
}

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function validFen(text: string): boolean {
  try {
    new Chess(text.trim());
    return true;
  } catch {
    return false;
  }
}

export function PlayScreen(props: { onReview: (gameId: number) => void; launch?: EndgameLaunch | null }): React.JSX.Element {
  const chess = useRef(new Chess());
  const [fen, setFen] = useState(chess.current.fen());
  const [phase, setPhase] = useState<Phase>('setup');
  const [setup, setSetup] = useState<Setup>(DEFAULT_SETUP);
  const [flipped, setFlipped] = useState(false);
  const [checks, setChecks] = useState<Map<number, MoveCheck>>(new Map());
  const [coach, setCoach] = useState<CoachState | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [over, setOver] = useState<{ result: string; reason: string; gameId: number | null; note: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [movetime, setMovetime] = useState(400);
  const [variety, setVariety] = useState(true);
  const [families, setFamilies] = useState<string[]>([]);
  /** Looking back at an earlier position: index into history (-1 = start). null = live game. */
  const [viewPly, setViewPly] = useState<number | null>(null);
  /** Hint for the current position: level 1 = which piece, level 2 = the whole move. */
  const [hint, setHint] = useState<{ fen: string; uci: string; level: 1 | 2 } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [threat, setThreat] = useState<{ fen: string; info: ThreatInfo } | null>(null);
  const [threatLoading, setThreatLoading] = useState(false);
  const [plan, setPlan] = useState<{ fen: string; plan: PlanResult } | null>(null);
  const [planFocus, setPlanFocus] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [goal, setGoal] = useState<EndgamePosition | null>(null);
  const [opening, setOpening] = useState<OpeningTrackInfo | null>(null);
  const [clockView, setClockView] = useState<{ w: number; b: number } | null>(null);
  const gen = useRef(0); // invalidates async work from an abandoned game
  const goalRef = useRef<EndgamePosition | null>(null);
  const customRef = useRef(false);
  const varietyRef = useRef(true);
  const clocks = useRef<{ w: number; b: number; inc: number } | null>(null);

  useEffect(() => {
    void api().engine.status().then(setStatus);
    void api().settings.get().then((s) => {
      setMovetime(s.botMovetimeMs);
      setVariety(s.openingVariety);
      varietyRef.current = s.openingVariety;
    });
    void api().openings.families().then(setFamilies);
  }, []);

  const sync = (): void => {
    setFen(chess.current.fen());
    setViewPly(null);
    setHint(null);
    setThreat(null);
    setPlan(null);
    setPlanFocus(null);
  };
  const opponentName = (s: Setup): string => (s.opponent === 'maia' ? `Maia ${s.maiaRating}` : `Stockfish level ${s.skill}`);

  const finish = useCallback(async (result: string, reason: string, s: Setup): Promise<void> => {
    const c = chess.current;
    const g = goalRef.current;
    c.setHeader('Event', g ? `Endgame trainer: ${g.title}` : 'Blunderwise game');
    c.setHeader('Date', new Date().toISOString().slice(0, 10).replace(/-/g, '.'));
    c.setHeader('White', s.myColor === 'w' ? 'You' : opponentName(s));
    c.setHeader('Black', s.myColor === 'b' ? 'You' : opponentName(s));
    c.setHeader('Result', result);
    setPhase('over');
    setCoach(null);
    playSound('end');
    let note: string | null = null;
    if (g) {
      const won = (result === '1-0' && s.myColor === 'w') || (result === '0-1' && s.myColor === 'b');
      if (g.goal === 'win') note = won ? 'Goal reached: you converted the win. Well done!' : result === '1/2-1/2' ? 'Not converted: it ended in a draw. Review the game to see where the win slipped.' : 'The win was lost. Review the game to see why.';
      else note = result === '1/2-1/2' ? 'Goal reached: you held the draw. Well done!' : 'The draw was lost. Review the game to see where.';
    }
    try {
      const gameId = await api().games.save({ myColor: s.myColor, opponent: g ? `Stockfish (${g.title})` : opponentName(s), result, pgn: c.pgn() });
      setOver({ result, reason, gameId, note });
    } catch (e) {
      setOver({ result, reason, gameId: null, note });
      setError(`Could not save the game: ${String(e)}`);
    }
  }, []);

  const botTurn = useCallback(
    async (s: Setup): Promise<void> => {
      const myGen = gen.current;
      setPhase('bot');
      try {
        const uci = await api().engine.botMove({
          fen: chess.current.fen(),
          opponent: s.opponent,
          skill: goalRef.current ? 20 : s.skill,
          maiaRating: s.maiaRating,
          movetimeMs: goalRef.current ? Math.max(movetime, 800) : movetime,
          useBook: s.opponent === 'stockfish' && varietyRef.current && !customRef.current,
          bookFamily: s.bookFamily === '' ? null : s.bookFamily,
        });
        if (myGen !== gen.current) return;
        if (!uci) throw new Error('The bot returned no move');
        const m = chess.current.move({ from: uciFrom(uci), to: uciTo(uci), promotion: uci[4] });
        playSound(soundForMove(m));
        if (clocks.current) clocks.current[other(s.myColor)] += clocks.current.inc;
        sync();
        const r = gameResult(chess.current);
        if (r.over) {
          await finish(r.result, r.reason, s);
          return;
        }
        const g = goalRef.current;
        if (g && g.goal === 'draw' && chess.current.history().length >= 2 * DRAW_SURVIVAL_MOVES) {
          await finish('1/2-1/2', `you held for ${DRAW_SURVIVAL_MOVES} moves`, s);
          return;
        }
        setPhase('my-turn');
        void api().coach.prefetch(chess.current.fen());
      } catch (e) {
        if (myGen === gen.current) {
          setError(`Bot move failed: ${e instanceof Error ? e.message : String(e)}`);
          setPhase('my-turn');
        }
      }
    },
    [finish, movetime],
  );

  /** Start a game; `fenText` starts from a custom position, `endgame` adds a goal. */
  const startGame = useCallback(
    (s: Setup, fenText: string | null, endgame: EndgamePosition | null): void => {
      let c: Chess;
      try {
        c = fenText ? new Chess(fenText.trim()) : new Chess();
      } catch {
        setError('That position is not valid. Check the FEN.');
        return;
      }
      if (c.isGameOver()) {
        setError(c.isCheckmate() ? 'That position is already checkmate: choose one where the game is still going.' : 'That position is already a draw: choose one where the game is still going.');
        return;
      }
      gen.current += 1;
      chess.current = c;
      goalRef.current = endgame;
      customRef.current = fenText !== null;
      setGoal(endgame);
      sync();
      setChecks(new Map());
      setCoach(null);
      setOver(null);
      setError(null);
      setFlipped(false);
      setOpening(null);
      const tc = parseTime(s.timeControl);
      clocks.current = tc ? { w: tc.baseMs, b: tc.baseMs, inc: tc.incMs } : null;
      setClockView(tc ? { w: tc.baseMs, b: tc.baseMs } : null);
      if (c.turn() !== s.myColor) void botTurn(s);
      else {
        setPhase('my-turn');
        void api().coach.prefetch(c.fen());
      }
    },
    [botTurn],
  );

  // Launched from the endgame trainer.
  const launchNonce = props.launch?.nonce;
  useEffect(() => {
    const l = props.launch;
    if (!l) return;
    const s: Setup = { ...DEFAULT_SETUP, myColor: l.endgame.playAs, opponent: 'stockfish', skill: 20 };
    setSetup(s);
    startGame(s, l.endgame.fen, l.endgame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchNonce]);

  // Which opening is this? (not for custom positions)
  useEffect(() => {
    if (phase === 'setup' || customRef.current) {
      setOpening(null);
      return;
    }
    let alive = true;
    void api()
      .openings.track(chess.current.history({ verbose: true }).map((m) => m.after))
      .then((t) => alive && setOpening(t))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [fen, phase]);

  // Clocks: only the side to move ticks, and only while it is actually thinking.
  useEffect(() => {
    if (!clocks.current || (phase !== 'my-turn' && phase !== 'bot')) return;
    const side: Color = phase === 'my-turn' ? setup.myColor : other(setup.myColor);
    let last = performance.now();
    const id = window.setInterval(() => {
      const cl = clocks.current;
      if (!cl) return;
      const now = performance.now();
      cl[side] = Math.max(0, cl[side] - (now - last));
      last = now;
      setClockView({ w: cl.w, b: cl.b });
      if (cl[side] <= 0) {
        window.clearInterval(id);
        gen.current += 1;
        void finish(side === 'w' ? '0-1' : '1-0', 'time', setup);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, setup, finish]);

  const playMine = async (uci: string): Promise<void> => {
    const myGen = gen.current;
    const c = chess.current;
    const fenBefore = c.fen();
    const ply = c.history().length;
    try {
      const m = c.move({ from: uciFrom(uci), to: uciTo(uci), promotion: uci[4] });
      playSound(soundForMove(m));
    } catch {
      sync();
      return;
    }
    if (clocks.current) clocks.current[setup.myColor] += clocks.current.inc;
    sync();
    setPhase('checking');
    let check: MoveCheck | null = null;
    try {
      check = await api().coach.checkMove({ fenBefore, moveUci: uci, myColor: setup.myColor });
    } catch (e) {
      setError(`Coach could not check the move: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (myGen !== gen.current) return;
    if (check) {
      const ch = check;
      setChecks((m) => new Map(m).set(ply, ch));
    }
    const r = gameResult(c);
    if (check?.stop && check.instant && check.ctx) {
      const ctx = check.ctx;
      const thisCheck = check;
      setCoach({ check: thisCheck, result: check.instant, narrating: true, level: 0 });
      setPhase('coach');
      api()
        .coach.narrate(ctx)
        .then((res) => setCoach((cs) => (cs && cs.check === thisCheck ? { ...cs, result: res, narrating: false } : cs)))
        .catch(() => setCoach((cs) => (cs && cs.check === thisCheck ? { ...cs, narrating: false } : cs)));
      return;
    }
    if (r.over) {
      await finish(r.result, r.reason, setup);
      return;
    }
    await botTurn(setup);
  };

  const onBoardMove = (from: Key, to: Key): void => {
    if (phase !== 'my-turn') return;
    const f = from as Square;
    const t = to as Square;
    if (isPromotion(chess.current, f, t)) {
      setPromo({ from: f, to: t });
      return;
    }
    void playMine(`${f}${t}`);
  };

  const onPromo = (p: PromoPiece): void => {
    if (!promo) return;
    const uci = `${promo.from}${promo.to}${p}`;
    setPromo(null);
    void playMine(uci);
  };

  /** Undo my last move and the bot's reply to it, so it is my turn again. */
  const takeBackMove = (): void => {
    if (phase !== 'my-turn') return;
    const c = chess.current;
    const hist = c.history({ verbose: true });
    const lastMine = [...hist].reverse().findIndex((m) => m.color === setup.myColor);
    if (lastMine < 0) return;
    const undoCount = lastMine + 1;
    const firstRemoved = hist.length - undoCount;
    for (let i = 0; i < undoCount; i++) c.undo();
    sync();
    setChecks((m) => new Map([...m].filter(([ply]) => ply < firstRemoved)));
    setCoach(null);
    void api().coach.prefetch(c.fen());
  };

  const showHint = async (): Promise<void> => {
    if (phase !== 'my-turn') return;
    const current = chess.current.fen();
    if (hint && hint.fen === current) {
      setHint({ ...hint, level: 2 });
      return;
    }
    setHintLoading(true);
    try {
      const uci = await api().coach.hint(current);
      if (uci && chess.current.fen() === current) setHint({ fen: current, uci, level: 1 });
    } catch (e) {
      setError(`Hint failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setHintLoading(false);
    }
  };

  const showThreat = async (): Promise<void> => {
    if (phase !== 'my-turn') return;
    const current = chess.current.fen();
    setThreatLoading(true);
    try {
      const info = await api().coach.threat(current);
      if (chess.current.fen() === current) setThreat({ fen: current, info });
    } catch (e) {
      setError(`Could not check threats: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setThreatLoading(false);
    }
  };

  const showPlan = (): void => {
    if (phase !== 'my-turn') return;
    setPlan({ fen: chess.current.fen(), plan: buildPlan(chess.current.fen()) });
    setPlanFocus(null);
  };

  const historyLen = chess.current.history().length;
  useEffect(() => {
    if (phase === 'setup') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      const last = historyLen - 1;
      if (e.key === 'ArrowLeft') setViewPly((v) => Math.max(-1, (v ?? last) - 1));
      else if (e.key === 'ArrowRight') setViewPly((v) => (v === null || v + 1 >= last ? null : v + 1));
      else if (e.key === 'Home') setViewPly(-1);
      else if (e.key === 'End' || e.key === 'Escape') setViewPly(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, historyLen]);

  const takeBack = (): void => {
    const ply = chess.current.history().length - 1;
    chess.current.undo();
    sync();
    setChecks((m) => {
      const n = new Map(m);
      n.delete(ply);
      return n;
    });
    setCoach(null);
    setPhase('my-turn');
  };

  const playOn = (): void => {
    setCoach(null);
    const r = gameResult(chess.current);
    if (r.over) void finish(r.result, r.reason, setup);
    else void botTurn(setup);
  };

  const resign = (): void => {
    gen.current += 1;
    void finish(setup.myColor === 'w' ? '0-1' : '1-0', 'resignation', setup);
  };

  // Board decorations
  const history = chess.current.history({ verbose: true });
  const viewing = viewPly !== null && phase !== 'setup';
  const viewed = viewing ? history[viewPly] : undefined;
  const viewFen = viewing ? (viewed ? viewed.after : (history[0]?.before ?? fen)) : fen;
  const last = viewing ? viewed : history[history.length - 1];
  const shapes: DrawShape[] = [];
  const activeHint = !viewing && hint && hint.fen === fen && phase === 'my-turn' ? hint : null;
  const activeThreat = !viewing && threat && threat.fen === fen && phase === 'my-turn' ? threat.info : null;
  const activePlan = !viewing && plan && plan.fen === fen && phase === 'my-turn' ? plan.plan : null;
  if (activeHint?.level === 2) shapes.push({ orig: uciFrom(activeHint.uci), dest: uciTo(activeHint.uci), brush: 'blue' });
  if (activeThreat?.uci) shapes.push({ orig: uciFrom(activeThreat.uci), dest: uciTo(activeThreat.uci), brush: 'yellow' });
  if (coach && coach.level >= 1) {
    const first = coach.check.ctx?.refutationLine[0];
    if (first) shapes.push({ orig: uciFrom(first), dest: uciTo(first), brush: 'yellow' });
  }
  if (coach && coach.level === 2 && coach.check.bestMoveUci) {
    shapes.push({ orig: uciFrom(coach.check.moveUci), dest: uciTo(coach.check.moveUci), brush: 'red' });
    shapes.push({ orig: uciFrom(coach.check.bestMoveUci), dest: uciTo(coach.check.bestMoveUci), brush: 'green' });
  }
  const planSquares = activePlan && planFocus !== null ? (activePlan.items[planFocus]?.squares ?? []) : [];
  const highlight: readonly Key[] = coach?.level === 2 ? (coach.result.explanation.highlightSquares as readonly Key[]) : (planSquares as readonly Key[]);
  const orientation = flipped ? (setup.myColor === 'w' ? 'black' : 'white') : cg(setup.myColor);
  const myTurn = phase === 'my-turn' && !viewing;
  const canTakeBack = phase === 'my-turn' && history.some((m) => m.color === setup.myColor);
  const topColor: Color = orientation === 'white' ? 'b' : 'w';
  const bottomColor: Color = other(topColor);
  const customValid = !useCustom || customText.trim() === '' || validFen(customText);
  const showMine = phase === 'my-turn' && !viewing;

  const clockBox = (color: Color): React.JSX.Element | null => {
    if (!clockView) return null;
    const ms = clockView[color];
    const active = (phase === 'my-turn' && color === setup.myColor) || (phase === 'bot' && color !== setup.myColor);
    return <span className={`clock ${active ? 'active' : ''} ${ms < 20_000 ? 'low' : ''}`}>{formatClock(ms)}</span>;
  };

  return (
    <div className="play">
      <div className="board-col">
        {clockView && phase !== 'setup' && (
          <div className="clock-row" style={{ marginBottom: 6 }}>
            <span className="muted">{topColor === setup.myColor ? 'You' : 'Opponent'}</span>
            {clockBox(topColor)}
          </div>
        )}
        <Board
          fen={viewFen}
          orientation={orientation}
          turnColor={cg(viewing ? new Chess(viewFen).turn() : chess.current.turn())}
          movableColor={myTurn ? cg(setup.myColor) : undefined}
          dests={myTurn ? legalDests(chess.current) : undefined}
          lastMove={last ? [last.from, last.to] : undefined}
          check={viewing ? new Chess(viewFen).isCheck() : chess.current.isCheck()}
          shapes={shapes}
          highlight={viewing ? [] : highlight}
          hintSquare={activeHint ? uciFrom(activeHint.uci) : undefined}
          animate={!viewing}
          onMove={onBoardMove}
        />
        {clockView && phase !== 'setup' && (
          <div className="clock-row">
            <span className="muted">{bottomColor === setup.myColor ? 'You' : 'Opponent'}</span>
            {clockBox(bottomColor)}
          </div>
        )}
        {phase !== 'setup' && (
          <div className="nav-row">
            <button aria-label="Go to the start of the game" title="Start (Home)" onClick={() => setViewPly(-1)} disabled={history.length === 0}>⏮</button>
            <button aria-label="Previous move" title="Back (←)" onClick={() => setViewPly((v) => Math.max(-1, (v ?? history.length - 1) - 1))} disabled={history.length === 0 || viewPly === -1}>◀</button>
            <button aria-label="Next move" title="Forward (→)" onClick={() => setViewPly((v) => (v === null || v + 1 >= history.length - 1 ? null : v + 1))} disabled={!viewing}>▶</button>
            <button aria-label="Back to the current position" title="Back to the game (End)" onClick={() => setViewPly(null)} disabled={!viewing}>⏭</button>
            {viewing && <span className="viewing">Looking back · move {viewPly + 1} of {history.length}</span>}
            <span className="muted arrows-hint">Right-click and drag to draw arrows</span>
          </div>
        )}
        {promo && <PromotionPicker color={setup.myColor} onPick={onPromo} onCancel={() => { setPromo(null); sync(); }} />}
      </div>

      <div className="side-col">
        {error && (
          <div className="error" onClick={() => setError(null)}>
            {error}
          </div>
        )}

        {phase === 'setup' ? (
          <div className="panel">
            <h2>New game</h2>
            <label>
              You play
              <select value={setup.myColor} onChange={(e) => setSetup({ ...setup, myColor: e.target.value === 'b' ? 'b' : 'w' })}>
                <option value="w">White</option>
                <option value="b">Black</option>
              </select>
            </label>
            <label>
              Opponent
              <select value={setup.opponent} onChange={(e) => setSetup({ ...setup, opponent: e.target.value === 'maia' ? 'maia' : 'stockfish' })}>
                <option value="stockfish">Stockfish</option>
                <option value="maia" disabled={!status?.maia.ok}>
                  Maia (human-like){status && !status.maia.ok ? ' — set up in Settings' : ''}
                </option>
              </select>
            </label>
            {setup.opponent === 'stockfish' ? (
              <>
                <label>
                  Skill level: {setup.skill}
                  <input type="range" min={0} max={20} value={setup.skill} onChange={(e) => setSetup({ ...setup, skill: Number(e.target.value) })} />
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={variety}
                    onChange={(e) => {
                      setVariety(e.target.checked);
                      varietyRef.current = e.target.checked;
                      void api().settings.set({ openingVariety: e.target.checked });
                    }}
                  />
                  Bot plays varied openings (book moves)
                </label>
                {variety && (
                  <label>
                    Bot steers towards
                    <select value={setup.bookFamily} onChange={(e) => setSetup({ ...setup, bookFamily: e.target.value })}>
                      <option value="">Any opening</option>
                      {families.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            ) : (
              <label>
                Maia rating
                <select value={setup.maiaRating} onChange={(e) => setSetup({ ...setup, maiaRating: Number(e.target.value) })}>
                  {(status?.maia.ratings ?? []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Clock
              <select value={setup.timeControl} onChange={(e) => setSetup({ ...setup, timeControl: e.target.value })}>
                {TIME_CONTROLS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
              Start from a custom position (FEN)
            </label>
            {useCustom && (
              <>
                <input value={customText} placeholder="paste a FEN, e.g. 8/8/8/4k3/8/8/4P3/4K3 w - - 0 1" onChange={(e) => setCustomText(e.target.value)} />
                {!customValid && <div className="error">That is not a valid position.</div>}
              </>
            )}
            {status && !status.stockfish.ok && <div className="error">{status.stockfish.error ?? 'Stockfish is not available.'}</div>}
            <button
              className="primary big"
              onClick={() => startGame(setup, useCustom && customText.trim() !== '' ? customText : null, null)}
              disabled={!status?.stockfish.ok || !customValid}
            >
              Start game
            </button>
          </div>
        ) : (
          <div className="panel">
            {goal && (
              <div className="goal-banner">
                <strong>{goal.title}</strong> · {goal.goal === 'win' ? 'Goal: win the game' : `Goal: hold the draw for ${DRAW_SURVIVAL_MOVES} moves`}
                <div className="muted">{goal.idea}</div>
              </div>
            )}
            <div className="game-head">
              <span>
                You ({setup.myColor === 'w' ? 'White' : 'Black'}) vs {goal ? 'Stockfish' : opponentName(setup)}
              </span>
              <span className="status">
                {phase === 'my-turn' && 'Your move'}
                {phase === 'checking' && 'Coach is checking your move…'}
                {phase === 'bot' && 'Opponent is thinking…'}
                {phase === 'coach' && 'Coach stopped the game'}
                {phase === 'over' && over && `Game over: ${over.result} (${over.reason})`}
              </span>
            </div>
            {opening && (opening.opening || opening.bookPlies > 0) && !customRef.current && (
              <div className="opening-line">
                <span className="opening-name">{opening.opening ? `${opening.opening.name} (${opening.opening.eco})` : 'Opening'}</span>
                {opening.leftBook ? (
                  <span className="pill out">out of book after move {Math.ceil(opening.bookPlies / 2) || 1}</span>
                ) : (
                  <span className="pill book">in book</span>
                )}
              </div>
            )}
            <div className="toolbar">
              <div className="tool-group">
                <button className="accent" onClick={() => void showHint()} disabled={!showMine || hintLoading || activeHint?.level === 2}>
                  {hintLoading ? 'Thinking…' : activeHint ? 'Show the move' : 'Hint'}
                </button>
                <button onClick={() => void showThreat()} disabled={!showMine || threatLoading} title="What would my opponent do if I passed?">
                  {threatLoading ? 'Checking…' : 'Threats?'}
                </button>
                <button onClick={showPlan} disabled={!showMine} title="Ideas for what to do in this position">
                  Plan
                </button>
              </div>
              <div className="tool-group">
                <button onClick={takeBackMove} disabled={!canTakeBack || viewing}>Take back</button>
                <button onClick={() => setFlipped((f) => !f)}>Flip board</button>
                {phase !== 'over' && <button onClick={resign}>Resign</button>}
                <button
                  onClick={() => {
                    gen.current += 1;
                    goalRef.current = null;
                    setGoal(null);
                    setPhase('setup');
                  }}
                >
                  New game
                </button>
              </div>
              {phase === 'over' && (
                <div className="tool-group">
                  {over?.gameId != null && (
                    <button className="primary" onClick={() => over.gameId != null && props.onReview(over.gameId)}>
                      Review game
                    </button>
                  )}
                  <PgnButtons pgn={chess.current.pgn()} name={`blunderwise-${new Date().toISOString().slice(0, 10)}`} />
                </div>
              )}
            </div>
            {phase === 'over' && over?.note && <div className={over.note.startsWith('Goal reached') ? 'ok-box' : 'bad-box'}>{over.note}</div>}
            {activeHint && (
              <div className="muted hint-text">{activeHint.level === 1 ? 'The highlighted piece has the best move. Press again to see it.' : "Blue arrow: the engine's best move."}</div>
            )}
            {activeThreat && <div className="info-box">{activeThreat.text}{activeThreat.uci ? ' (yellow arrow)' : ''}</div>}
            {activePlan && (
              <div className="info-box">
                <strong>Ideas for you</strong>
                {activePlan.items.map((it, i) => (
                  <button key={it.id} className="plan-item" style={{ '--i': i } as React.CSSProperties} onClick={() => setPlanFocus(planFocus === i ? null : i)} title="Click to highlight the squares">
                    {it.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {coach && (
          <CoachCard
            check={coach.check}
            result={coach.result}
            narrating={coach.narrating}
            level={coach.level}
            onTakeBack={takeBack}
            onLevel={(l) => setCoach({ ...coach, level: l })}
            onPlayOn={playOn}
          />
        )}

        {phase !== 'setup' && (
          <div className="panel grow">
            <MoveList
              sans={chess.current.history()}
              checks={checks}
              current={viewing ? viewPly : history.length - 1}
              onSelect={(p) => setViewPly(p >= history.length - 1 ? null : p)}
              bookPlies={customRef.current ? 0 : (opening?.bookPlies ?? 0)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
