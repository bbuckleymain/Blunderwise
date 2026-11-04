import type { ExplainResult } from '../../../explain/types';
import type { MoveCheck } from '../../../shared/api';

const LABEL: Record<MoveCheck['classification'], string> = {
  good: 'Good move',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

/** 0 = just the verdict, 1 = what the opponent can do now, 2 = the full explanation and the best move. */
export type RevealLevel = 0 | 1 | 2;

export interface CoachCardProps {
  readonly check: MoveCheck;
  readonly result: ExplainResult;
  readonly narrating: boolean;
  readonly level: RevealLevel;
  readonly onTakeBack?: () => void;
  readonly onLevel?: (l: RevealLevel) => void;
  readonly onPlayOn?: () => void;
}

const cap = (s: string): string => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

export function CoachCard(p: CoachCardProps): React.JSX.Element {
  const e = p.result.explanation;
  const threat = p.result.facts.refutationLineSan[0];
  const top = p.result.tags[0];
  return (
    <div className={`coach-card ${p.check.classification}`}>
      <div className="coach-top">
        <span className={`badge ${p.check.classification}`}>{LABEL[p.check.classification]}</span>
        <span className="coach-move">{p.check.san}</span>
        <span className="coach-source">
          {p.narrating ? 'Coach is thinking…' : p.result.source === 'llm' ? 'Coach' : 'Quick explanation'}
        </span>
      </div>
      <div className="coach-body" key={p.level}>
      {p.level === 0 && (
        <p className="coach-text">
          That move gives away too much. Take it back and look for something better, or ask the coach for help.
        </p>
      )}
      {p.level === 1 && (
        <>
          <p className="coach-text">
            {threat ? (
              <>
                Look at what your opponent can do now: <strong>{threat}</strong> (yellow arrow).
              </>
            ) : (
              'Look at what your opponent can do now.'
            )}
          </p>
          {top && top.tag !== 'positionalLoss' && <p className="coach-text">{cap(top.evidence)}.</p>}
        </>
      )}
      {p.level === 2 && (
        <>
          <h3 className="coach-headline">{e.headline}</h3>
          <p className="coach-text">{e.explanation}</p>
          <p className="coach-lesson">
            <strong>Remember:</strong> {e.lesson}
          </p>
        </>
      )}
      </div>
      {(p.onTakeBack || p.onLevel || p.onPlayOn) && (
        <div className="coach-actions">
          {p.onTakeBack && <button className="primary" onClick={p.onTakeBack}>Take back</button>}
          {p.onLevel && p.level === 0 && <button onClick={() => p.onLevel?.(1)}>What did I miss?</button>}
          {p.onLevel && p.level < 2 && <button onClick={() => p.onLevel?.(2)}>Show best move</button>}
          {p.onPlayOn && <button onClick={p.onPlayOn}>Play on</button>}
        </div>
      )}
    </div>
  );
}
