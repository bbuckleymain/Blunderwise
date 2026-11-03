import type { MoveCheck } from '../../../shared/api';

const MARK: Record<MoveCheck['classification'], string> = { good: '', inaccuracy: '?!', mistake: '?', blunder: '??' };

export interface MoveListProps {
  readonly sans: readonly string[];
  readonly checks: ReadonlyMap<number, MoveCheck>;
  readonly current?: number;
  readonly onSelect?: (ply: number) => void;
}

export function MoveList(p: MoveListProps): React.JSX.Element {
  const rows: React.JSX.Element[] = [];
  for (let i = 0; i < p.sans.length; i += 2) {
    const cell = (ply: number): React.JSX.Element | null => {
      const san = p.sans[ply];
      if (san === undefined) return <span className="ml-move" />;
      const c = p.checks.get(ply);
      return (
        <span
          className={`ml-move ${c ? c.classification : ''} ${p.current === ply ? 'current' : ''}`}
          onClick={p.onSelect ? () => p.onSelect?.(ply) : undefined}
        >
          {san}
          {c ? MARK[c.classification] : ''}
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
  return <div className="move-list">{rows}</div>;
}
