import { Chess } from 'chess.js';
import type { DrawShape } from 'chessground/draw';
import type { Key } from 'chessground/types';
import { useEffect, useMemo, useState } from 'react';
import type { ExplainResult } from '../../explain/types';
import type { GameRecord, MoveCheck, ReviewProgress, ReviewedMove } from '../../shared/api';
import { api } from './api';
import { uciFrom, uciTo } from './chessUtil';
import { Board } from './components/Board';
import { CoachCard } from './components/CoachCard';
import { MoveList } from './components/MoveList';

const START = new Chess().fen();

export function ReviewScreen(props: { gameId: number; onBack: () => void }): React.JSX.Element {
  const [game, setGame] = useState<GameRecord | null>(null);
  const [moves, setMoves] = useState<ReviewedMove[] | null>(null);
  const [progress, setProgress] = useState<ReviewProgress>({ done: 0, total: 0 });
  const [ply, setPly] = useState(-1);
  const [explained, setExplained] = useState<Map<number, ExplainResult>>(new Map());
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const off = api().review.onProgress((p) => alive && setProgress(p));
    void (async () => {
      try {
        const g = await api().games.get(props.gameId);
        if (!g || !alive) return;
        setGame(g);
        const m = await api().review.analyze(g.pgn, g.myColor);
        if (alive) setMoves(m);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
      off();
    };
  }, [props.gameId]);

  const mistakes = useMemo(() => (moves ?? []).filter((m) => m.mine && m.check?.ctx), [moves]);
  const current = moves && ply >= 0 ? moves[ply] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!moves) return;
      const last = moves.length - 1;
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(-1, p - 1));
      else if (e.key === 'ArrowRight') setPly((p) => Math.min(last, p + 1));
      else if (e.key === 'Home') setPly(-1);
      else if (e.key === 'End') setPly(last);
      else if (e.key === 'ArrowDown') setPly((p) => mistakes.find((m) => m.ply > p)?.ply ?? p);
      else if (e.key === 'ArrowUp') setPly((p) => [...mistakes].reverse().find((m) => m.ply < p)?.ply ?? p);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moves, mistakes]);

  // Fetch the explanation for the selected mistake (cached in main).
  useEffect(() => {
    const ctx = current?.check?.ctx;
    if (!current || !ctx || explained.has(current.ply)) return;
    const p = current.ply;
    setLoading(p);
    api()
      .coach.narrate(ctx)
      .then((r) => setExplained((m) => new Map(m).set(p, r)))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading((l) => (l === p ? null : l)));
  }, [current, explained]);

  if (error && !moves) return <div className="panel error">{error}</div>;
  if (!game || !moves) {
    const pct = progress.total ? Math.round((100 * progress.done) / progress.total) : 0;
    return (
      <div className="panel review-loading">
        <h2>Analyzing your moves…</h2>
        <div className="progress"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
        <div>{progress.done} / {progress.total} moves</div>
      </div>
    );
  }

  const fen = current ? current.fenAfter : START;
  const check: MoveCheck | null = current?.check ?? null;
  const shapes: DrawShape[] = [];
  if (current && check?.ctx && check.bestMoveUci) {
    shapes.push({ orig: uciFrom(current.uci), dest: uciTo(current.uci), brush: 'red' });
    shapes.push({ orig: uciFrom(check.bestMoveUci), dest: uciTo(check.bestMoveUci), brush: 'green' });
  }
  const exp = current ? explained.get(current.ply) ?? current.check?.instant ?? null : null;
  const checksMap = new Map<number, MoveCheck>();
  for (const m of moves) if (m.check) checksMap.set(m.ply, m.check);
  const turn = new Chess(fen).turn();

  return (
    <div className="play">
      <div className="board-col">
        <Board
          fen={fen}
          orientation={game.myColor === 'w' ? 'white' : 'black'}
          turnColor={turn === 'w' ? 'white' : 'black'}
          lastMove={current ? [uciFrom(current.uci), uciTo(current.uci)] : undefined}
          shapes={shapes}
          highlight={exp && check?.ctx ? (exp.explanation.highlightSquares as readonly Key[]) : []}
        />
        <div className="nav-hint">← → move · ↑ ↓ previous/next mistake · Home/End</div>
      </div>
      <div className="side-col">
        <div className="panel">
          <div className="game-head">
            <span>Review: You ({game.myColor === 'w' ? 'White' : 'Black'}) vs {game.opponent} · {game.result}</span>
            <button onClick={props.onBack}>Back</button>
          </div>
          <h4>Your mistakes ({mistakes.length})</h4>
          {mistakes.length === 0 && <div className="muted">No inaccuracies, mistakes or blunders. Nice game!</div>}
          <div className="mistake-list">
            {mistakes.map((m) => (
              <button key={m.ply} className={`mistake-item cls-${m.check?.classification ?? 'good'} ${ply === m.ply ? 'current' : ''}`} onClick={() => setPly(m.ply)}>
                {Math.floor(m.ply / 2) + 1}{m.ply % 2 === 0 ? '.' : '…'} {m.san} <span className="muted">(best {m.check?.bestMoveSan ?? '?'})</span>
              </button>
            ))}
          </div>
        </div>
        {current && check?.ctx && exp && (
          <CoachCard check={check} result={exp} narrating={loading === current.ply} revealed />
        )}
        <div className="panel grow">
          <MoveList sans={moves.map((m) => m.san)} checks={checksMap} current={ply} onSelect={setPly} />
        </div>
      </div>
    </div>
  );
}
