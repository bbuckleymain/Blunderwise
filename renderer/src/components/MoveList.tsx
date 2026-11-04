import { useEffect, useState } from 'react';
import type { Explanation } from '../../../explain/types';
import type { MoveCheck } from '../../../shared/api';
import { api } from '../api';

const MARK: Record<MoveCheck['classification'], string> = { good: '', inaccuracy: '?!', mistake: '?', blunder: '??' };
const LABEL: Record<MoveCheck['classification'], string> = { good: 'Good move', inaccuracy: 'Inaccuracy', mistake: 'Mistake', blunder: 'Blunder' };

export interface MoveListProps {
  readonly sans: readonly string[];
  readonly checks: ReadonlyMap<number, MoveCheck>;
  readonly current?: number;
  readonly onSelect?: (ply: number) => void;
  /** Plies (from the start) that followed opening theory. */
  readonly bookPlies?: number;
}

interface Hover {
  readonly ply: number;
  readonly check: MoveCheck;
  readonly x: number;
  readonly y: number;
}

const POPOVER_WIDTH = 360;

/** Hover card explaining a marked move. Shows the coach's AI text if cached, otherwise the instant explanation. */
function MovePopover(props: { hover: Hover; cached: Explanation | null }): React.JSX.Element | null {
  const { check } = props.hover;
  const e = props.cached ?? check.instant?.explanation ?? null;
  if (!e) return null;
  const left = Math.max(8, Math.min(props.hover.x, window.innerWidth - POPOVER_WIDTH - 8));
  const flipUp = props.hover.y > window.innerHeight - 240;
  return (
    <div
      className={`move-popover ${check.classification}`}
      style={{ left, width: POPOVER_WIDTH, ...(flipUp ? { bottom: window.innerHeight - props.hover.y + 26 } : { top: props.hover.y + 4 }) }}
    >
      <div className="coach-top">
        <span className={`badge ${check.classification}`}>{LABEL[check.classification]}</span>
        <span className="coach-move">{check.san}</span>
        <span className="coach-source">{props.cached ? 'Coach' : 'Quick explanation'}</span>
      </div>
      <div className="popover-headline">{e.headline}</div>
      <div className="popover-text">{e.explanation}</div>
      {check.bestMoveSan && (
        <div className="popover-best">
          Better: <strong>{check.bestMoveSan}</strong>
        </div>
      )}
    </div>
  );
}

export function MoveList(p: MoveListProps): React.JSX.Element {
  const [hover, setHover] = useState<Hover | null>(null);
  const [cached, setCached] = useState<Map<number, Explanation | null>>(new Map());

  // Look up the coach's cached AI explanation once per hovered move (cache only: no AI calls on hover).
  useEffect(() => {
    const ctx = hover?.check.ctx;
    if (!hover || !ctx || cached.has(hover.ply)) return;
    const ply = hover.ply;
    let alive = true;
    void api()
      .coach.cached(ctx)
      .then((e) => alive && setCached((m) => new Map(m).set(ply, e)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [hover, cached]);

  if (p.sans.length === 0) return <div className="empty-note">Moves appear here as you play.</div>;

  const rows: React.JSX.Element[] = [];
  for (let i = 0; i < p.sans.length; i += 2) {
    const cell = (ply: number): React.JSX.Element | null => {
      const san = p.sans[ply];
      if (san === undefined) return <span className="ml-move" />;
      const c = p.checks.get(ply);
      const explainable = c && c.classification !== 'good' && c.instant;
      const className = `ml-move ${c ? c.classification : ''} ${p.current === ply ? 'current' : ''} ${explainable ? 'explainable' : ''} ${p.bookPlies !== undefined && ply < p.bookPlies ? 'book' : ''}`;
      const hoverProps =
        explainable && c
          ? {
              onMouseEnter: (ev: React.MouseEvent<HTMLElement>) => {
                const r = ev.currentTarget.getBoundingClientRect();
                setHover({ ply, check: c, x: r.left, y: r.bottom });
              },
              onMouseLeave: () => setHover(null),
              onFocus: (ev: React.FocusEvent<HTMLElement>) => {
                const r = ev.currentTarget.getBoundingClientRect();
                setHover({ ply, check: c, x: r.left, y: r.bottom });
              },
              onBlur: () => setHover(null),
            }
          : {};
      const label = `${san}${c ? MARK[c.classification] : ''}`;
      return p.onSelect ? (
        <button type="button" className={className} aria-current={p.current === ply ? 'true' : undefined} onClick={() => p.onSelect?.(ply)} {...hoverProps}>
          {label}
        </button>
      ) : (
        <span className={className} {...hoverProps}>
          {label}
        </span>
      );
    };
    rows.push(
      <div className="ml-row" key={i}>
        <span className="ml-num">{i / 2 + 1}.</span>
        {cell(i)}
        {cell(i + 1)}
      </div>,
    );
  }
  return (
    <div className="move-list">
      {rows}
      {hover && <MovePopover hover={hover} cached={cached.get(hover.ply) ?? null} />}
    </div>
  );
}
