import type { ExplainResult } from '../../../explain/types';
import type { MoveCheck } from '../../../shared/api';

const LABEL: Record<MoveCheck['classification'], string> = {
  good: 'Good move',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

export interface CoachCardProps {
  readonly check: MoveCheck;
  readonly result: ExplainResult;
  readonly narrating: boolean;
  /** When false, only a hint is shown (for "take back and try again"). */
  readonly revealed: boolean;
  readonly onTakeBack?: () => void;
  readonly onReveal?: () => void;
  readonly onPlayOn?: () => void;
}

export function CoachCard(p: CoachCardProps): React.JSX.Element {
  const e = p.result.explanation;
  const threat = p.result.facts.refutationLineSan[0];
  return (
    <div className={`coach-card ${p.check.classification}`}>
      <div className="coach-top">
        <span className={`badge ${p.check.classification}`}>{LABEL[p.check.classification]}</span>
        <span className="coach-move">{p.check.san}</span>
        <span className="coach-source">
          {p.narrating ? 'Coach is thinking…' : p.result.source === 'llm' ? 'Coach' : 'Quick explanation'}
        </span>
      </div>
      <h3 className="coach-headline">{e.headline}</h3>
      {p.revealed ? (
        <>
          <p className="coach-text">{e.explanation}</p>
          <p className="coach-lesson">
            <strong>Remember:</strong> {e.lesson}
          </p>
        </>
      ) : (
        <p className="coach-text">
          {threat ? (
            <>
              Look at what your opponent can do after {p.check.san}: <strong>{threat}</strong>. Take the move back and find something better, or show the answer.
            </>
          ) : (
            'Take the move back and look for something better, or show the answer.'
          )}
        </p>
      )}
      {(p.onTakeBack || p.onReveal || p.onPlayOn) && (
        <div className="coach-actions">
          {p.onTakeBack && <button className="primary" onClick={p.onTakeBack}>Take back</button>}
          {p.onReveal && !p.revealed && <button onClick={p.onReveal}>Show best move</button>}
          {p.onPlayOn && <button onClick={p.onPlayOn}>Play on</button>}
        </div>
      )}
    </div>
  );
}
