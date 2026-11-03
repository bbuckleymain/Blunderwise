import { Chess, type Color, type Square } from 'chess.js';
import type { DrawShape } from 'chessground/draw';
import type { Key } from 'chessground/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExplainResult } from '../../explain/types';
import type { EngineStatus, MoveCheck, OpponentKind } from '../../shared/api';
import { api } from './api';
import { gameResult, isPromotion, legalDests, uciFrom, uciTo } from './chessUtil';
import { Board } from './components/Board';
import { CoachCard } from './components/CoachCard';
import { MoveList } from './components/MoveList';
import { PromotionPicker, type PromoPiece } from './components/PromotionPicker';

type Phase = 'setup' | 'my-turn' | 'checking' | 'coach' | 'bot' | 'over';

interface Setup {
  myColor: Color;
  opponent: OpponentKind;
  skill: number;
  maiaRating: number;
}

interface CoachState {
  check: MoveCheck;
  result: ExplainResult;
  narrating: boolean;
  revealed: boolean;
}

const cg = (c: Color): 'white' | 'black' => (c === 'w' ? 'white' : 'black');

export function PlayScreen(props: { onReview: (gameId: number) => void }): React.JSX.Element {
  const chess = useRef(new Chess());
  const [fen, setFen] = useState(chess.current.fen());
  const [phase, setPhase] = useState<Phase>('setup');
  const [setup, setSetup] = useState<Setup>({ myColor: 'w', opponent: 'stockfish', skill: 5, maiaRating: 1100 });
  const [flipped, setFlipped] = useState(false);
  const [checks, setChecks] = useState<Map<number, MoveCheck>>(new Map());
  const [coach, setCoach] = useState<CoachState | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [over, setOver] = useState<{ result: string; reason: string; gameId: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [movetime, setMovetime] = useState(400);
  const gen = useRef(0); // invalidates async work from an abandoned game

  useEffect(() => {
    void api().engine.status().then(setStatus);
    void api().settings.get().then((s) => setMovetime(s.botMovetimeMs));
  }, []);

  const sync = (): void => setFen(chess.current.fen());
  const opponentName = (s: Setup): string => (s.opponent === 'maia' ? `Maia ${s.maiaRating}` : `Stockfish level ${s.skill}`);

  const finish = useCallback(
    async (result: string, reason: string, s: Setup): Promise<void> => {
      const c = chess.current;
      c.setHeader('Event', 'Blunderwise game');
      c.setHeader('Date', new Date().toISOString().slice(0, 10).replace(/-/g, '.'));
      c.setHeader('White', s.myColor === 'w' ? 'You' : opponentName(s));
      c.setHeader('Black', s.myColor === 'b' ? 'You' : opponentName(s));
      c.setHeader('Result', result);
      setPhase('over');
      setCoach(null);
      try {
        const gameId = await api().games.save({ myColor: s.myColor, opponent: opponentName(s), result, pgn: c.pgn() });
        setOver({ result, reason, gameId });
      } catch (e) {
        setOver({ result, reason, gameId: null });
        setError(`Could not save the game: ${String(e)}`);
      }
    },
    [],
  );

  const botTurn = useCallback(
    async (s: Setup): Promise<void> => {
      const myGen = gen.current;
      setPhase('bot');
      try {
        const uci = await api().engine.botMove({
          fen: chess.current.fen(),
          opponent: s.opponent,
          skill: s.skill,
          maiaRating: s.maiaRating,
          movetimeMs: movetime,
        });
        if (myGen !== gen.current) return;
        if (!uci) throw new Error('The bot returned no move');
        chess.current.move({ from: uciFrom(uci), to: uciTo(uci), promotion: uci[4] });
        sync();
        const r = gameResult(chess.current);
        if (r.over) {
          await finish(r.result, r.reason, s);
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

  const start = (): void => {
    gen.current += 1;
    chess.current = new Chess();
    sync();
    setChecks(new Map());
    setCoach(null);
    setOver(null);
    setError(null);
    setFlipped(false);
    if (setup.myColor === 'b') void botTurn(setup);
    else {
      setPhase('my-turn');
      void api().coach.prefetch(chess.current.fen());
    }
  };

  const playMine = async (uci: string): Promise<void> => {
    const myGen = gen.current;
    const c = chess.current;
    const fenBefore = c.fen();
    const ply = c.history().length;
    try {
      c.move({ from: uciFrom(uci), to: uciTo(uci), promotion: uci[4] });
    } catch {
      sync();
      return;
    }
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
      setCoach({ check: thisCheck, result: check.instant, narrating: true, revealed: false });
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
  const last = history[history.length - 1];
  const shapes: DrawShape[] = [];
  if (coach?.revealed && coach.check.bestMoveUci) {
    shapes.push({ orig: uciFrom(coach.check.moveUci), dest: uciTo(coach.check.moveUci), brush: 'red' });
    shapes.push({ orig: uciFrom(coach.check.bestMoveUci), dest: uciTo(coach.check.bestMoveUci), brush: 'green' });
  }
  const highlight = coach?.revealed ? (coach.result.explanation.highlightSquares as readonly Key[]) : [];
  const orientation = flipped ? (setup.myColor === 'w' ? 'black' : 'white') : cg(setup.myColor);
  const myTurn = phase === 'my-turn';

  return (
    <div className="play">
      <div className="board-col">
        <Board
          fen={fen}
          orientation={orientation}
          turnColor={cg(chess.current.turn())}
          movableColor={myTurn ? cg(setup.myColor) : undefined}
          dests={myTurn ? legalDests(chess.current) : undefined}
          lastMove={last ? [last.from, last.to] : undefined}
          check={chess.current.isCheck()}
          shapes={shapes}
          highlight={highlight}
          onMove={onBoardMove}
        />
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
              <select
                value={setup.opponent}
                onChange={(e) => setSetup({ ...setup, opponent: e.target.value === 'maia' ? 'maia' : 'stockfish' })}
              >
                <option value="stockfish">Stockfish</option>
                <option value="maia" disabled={!status?.maia.ok}>
                  Maia (human-like){status && !status.maia.ok ? ' — set up in Settings' : ''}
                </option>
              </select>
            </label>
            {setup.opponent === 'stockfish' ? (
              <label>
                Skill level: {setup.skill}
                <input type="range" min={0} max={20} value={setup.skill} onChange={(e) => setSetup({ ...setup, skill: Number(e.target.value) })} />
              </label>
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
            {status && !status.stockfish.ok && <div className="error">{status.stockfish.error ?? 'Stockfish is not available.'}</div>}
            <button className="primary big" onClick={start} disabled={!status?.stockfish.ok}>
              Start game
            </button>
          </div>
        ) : (
          <div className="panel">
            <div className="game-head">
              <span>
                You ({setup.myColor === 'w' ? 'White' : 'Black'}) vs {opponentName(setup)}
              </span>
              <span className="status">
                {phase === 'my-turn' && 'Your move'}
                {phase === 'checking' && 'Coach is checking your move…'}
                {phase === 'bot' && 'Opponent is thinking…'}
                {phase === 'coach' && 'Coach stopped the game'}
                {phase === 'over' && over && `Game over: ${over.result} (${over.reason})`}
              </span>
            </div>
            <div className="toolbar">
              <button onClick={() => setFlipped((f) => !f)}>Flip board</button>
              {phase !== 'over' && <button onClick={resign}>Resign</button>}
              <button onClick={() => { gen.current += 1; setPhase('setup'); }}>New game</button>
              {phase === 'over' && over?.gameId != null && (
                <button className="primary" onClick={() => over.gameId != null && props.onReview(over.gameId)}>
                  Review game
                </button>
              )}
            </div>
          </div>
        )}

        {coach && (
          <CoachCard
            check={coach.check}
            result={coach.result}
            narrating={coach.narrating}
            revealed={coach.revealed}
            onTakeBack={takeBack}
            onReveal={() => setCoach({ ...coach, revealed: true })}
            onPlayOn={playOn}
          />
        )}

        {phase !== 'setup' && (
          <div className="panel grow">
            <MoveList sans={chess.current.history()} checks={checks} />
          </div>
        )}
      </div>
    </div>
  );
}
