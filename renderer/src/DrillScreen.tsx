import { Chess, type Square } from 'chess.js';
import type { DrawShape } from 'chessground/draw';
import type { Key } from 'chessground/types';
import { useCallback, useEffect, useState } from 'react';
import type { ExplainResult, MotifTag } from '../../explain/types';
import type { DrillAnswer, DrillCounts, DrillRecord } from '../../shared/api';
import { api } from './api';
import { isPromotion, legalDests, uciFrom, uciTo } from './chessUtil';
import { Board } from './components/Board';
import { CoachCard } from './components/CoachCard';
import { PromotionPicker, type PromoPiece } from './components/PromotionPicker';
import { MOTIF_LABEL, inHowLong } from './labels';

const cg = (c: 'w' | 'b'): 'white' | 'black' => (c === 'w' ? 'white' : 'black');

export function DrillScreen(props: { tag: MotifTag | null; onClearTag: () => void }): React.JSX.Element {
  const [queue, setQueue] = useState<DrillRecord[] | null>(null);
  const [counts, setCounts] = useState<DrillCounts | null>(null);
  const [fen, setFen] = useState<string>('');
  const [answer, setAnswer] = useState<DrillAnswer | null>(null);
  const [checking, setChecking] = useState(false);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [hint, setHint] = useState(false);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, done: 0 });

  const load = useCallback(async () => {
    const [q, c] = await Promise.all([api().drills.due(props.tag, 50), api().drills.counts()]);
    setQueue(q);
    setCounts(c);
    setFen(q[0]?.fen ?? '');
    setAnswer(null);
    setExplain(null);
    setHint(false);
  }, [props.tag]);

  useEffect(() => {
    setScore({ right: 0, done: 0 });
    void load();
  }, [load]);

  const drill = queue?.[0];

  const submit = async (uci: string): Promise<void> => {
    if (!drill) return;
    const c = new Chess(drill.fen);
    try {
      c.move({ from: uciFrom(uci), to: uciTo(uci), promotion: uci[4] });
    } catch {
      return;
    }
    setFen(c.fen());
    setChecking(true);
    try {
      const a = await api().drills.answer(drill.id, uci);
      setAnswer(a);
      setScore((s) => ({ right: s.right + (a.correct ? 1 : 0), done: s.done + 1 }));
      if (!a.correct && a.check.ctx) {
        setExplain(a.check.instant);
        setNarrating(true);
        api()
          .coach.narrate(a.check.ctx)
          .then(setExplain)
          .catch(() => undefined)
          .finally(() => setNarrating(false));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  };

  const onMove = (from: Key, to: Key): void => {
    if (!drill || answer || checking) return;
    const chess = new Chess(drill.fen);
    if (isPromotion(chess, from as Square, to as Square)) setPromo({ from: from as Square, to: to as Square });
    else void submit(`${from}${to}`);
  };

  const next = (): void => {
    const rest = (queue ?? []).slice(1);
    setQueue(rest);
    setFen(rest[0]?.fen ?? '');
    setAnswer(null);
    setExplain(null);
    setHint(false);
    if (rest.length === 0) void load();
  };

  const retry = (): void => {
    if (!drill) return;
    setFen(drill.fen);
    setAnswer(null);
    setExplain(null);
  };

  if (!queue || !counts) return <div className="panel">Loading…</div>;

  if (!drill) {
    return (
      <div className="panel drill-empty">
        <h2>{props.tag ? `No ${MOTIF_LABEL[props.tag].toLowerCase()} drills due` : 'No drills due'}</h2>
        {score.done > 0 && <p>This session: {score.right} / {score.done} correct.</p>}
        <p className="muted">
          {counts.total === 0
            ? 'Drills are made automatically from your mistakes and blunders: play a game, or import and analyse your games in Games.'
            : `You have ${counts.total} drills. ${counts.nextDueAt ? `The next one is due in ${inHowLong(counts.nextDueAt)}.` : ''}`}
        </p>
        {props.tag && <button onClick={props.onClearTag}>Show all drills</button>}
      </div>
    );
  }

  const shapes: DrawShape[] = [];
  if (answer && !answer.correct) {
    shapes.push({ orig: uciFrom(drill.bestUci), dest: uciTo(drill.bestUci), brush: 'green' });
  }
  const myTurn = !answer && !checking;
  const position = new Chess(fen || drill.fen);

  return (
    <div className="play">
      <div className="board-col">
        <Board
          fen={answer && !answer.correct ? drill.fen : fen || drill.fen}
          orientation={cg(drill.myColor)}
          turnColor={cg(position.turn())}
          movableColor={myTurn ? cg(drill.myColor) : undefined}
          dests={myTurn ? legalDests(position) : undefined}
          shapes={shapes}
          highlight={explain && answer && !answer.correct ? (explain.explanation.highlightSquares as readonly Key[]) : []}
          onMove={onMove}
        />
        {promo && (
          <PromotionPicker
            color={drill.myColor}
            onPick={(p: PromoPiece) => {
              const u = `${promo.from}${promo.to}${p}`;
              setPromo(null);
              void submit(u);
            }}
            onCancel={() => {
              setPromo(null);
              setFen(drill.fen);
            }}
          />
        )}
      </div>
      <div className="side-col">
        {error && <div className="error" onClick={() => setError(null)}>{error}</div>}
        <div className="panel">
          <div className="game-head">
            <span>
              Drill {props.tag ? `· ${MOTIF_LABEL[props.tag]}` : ''} · {queue.length} due
            </span>
            {props.tag && <button onClick={props.onClearTag}>All drills</button>}
          </div>
          <h3 className="coach-headline">Find a better move than {drill.playedSan}</h3>
          <p className="muted">
            In one of your games you played <strong>{drill.playedSan}</strong> here ({drill.classification}). You are{' '}
            {drill.myColor === 'w' ? 'White' : 'Black'}.
          </p>
          {!answer && (
            <div className="toolbar">
              <button onClick={() => setHint(true)} disabled={hint || drill.tags.length === 0}>
                Hint
              </button>
              {hint && <span className="muted">Theme: {drill.tags.map((t) => MOTIF_LABEL[t]).join(', ')}</span>}
            </div>
          )}
          {checking && <p className="muted">Checking…</p>}
          {answer?.correct && (
            <div className="ok-box">
              <strong>Correct!</strong>{' '}
              {answer.check.moveUci === drill.bestUci ? `${drill.bestSan} is the best move.` : `${answer.check.san} works too (the engine's top move was ${drill.bestSan}).`}{' '}
              <span className="muted">Next review in {inHowLong(answer.nextDueAt)}.</span>
            </div>
          )}
          {answer && !answer.correct && (
            <div className="bad-box">
              <strong>Not quite.</strong> {answer.check.san} isn't it; the best move was <strong>{drill.bestSan}</strong> (green arrow). This drill comes back in{' '}
              {inHowLong(answer.nextDueAt)}.
            </div>
          )}
          {answer && (
            <div className="toolbar">
              <button className="primary" onClick={next}>Next drill</button>
              {!answer.correct && <button onClick={retry}>Try again</button>}
            </div>
          )}
        </div>
        {answer && !answer.correct && explain && answer.check.ctx && (
          <CoachCard check={answer.check} result={explain} narrating={narrating} revealed />
        )}
      </div>
    </div>
  );
}
