import type { Color } from 'chess.js';

export type PromoPiece = 'q' | 'r' | 'b' | 'n';
const NAMES: Record<PromoPiece, string> = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' };

export function PromotionPicker(props: { color: Color; onPick: (p: PromoPiece) => void; onCancel: () => void }): React.JSX.Element {
  const color = props.color === 'w' ? 'white' : 'black';
  return (
    <div className="overlay" onClick={props.onCancel}>
      <div className="promo" onClick={(e) => e.stopPropagation()}>
        <div className="promo-title">Promote to</div>
        <div className="promo-row cg-wrap">
          {(Object.keys(NAMES) as PromoPiece[]).map((p) => (
            <button key={p} className="promo-btn" onClick={() => props.onPick(p)} title={NAMES[p]}>
              <piece className={`${NAMES[p]} ${color}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      piece: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
