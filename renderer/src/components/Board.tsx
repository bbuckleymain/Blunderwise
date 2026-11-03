import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { DrawShape } from 'chessground/draw';
import type { Color as CgColor, Key } from 'chessground/types';
import { useEffect, useRef } from 'react';

export interface BoardProps {
  readonly fen: string;
  readonly orientation: CgColor;
  readonly turnColor: CgColor;
  /** Which side the user may move; undefined = view only. */
  readonly movableColor?: CgColor;
  readonly dests?: Map<Key, Key[]>;
  readonly lastMove?: [Key, Key];
  readonly check?: boolean;
  readonly shapes?: DrawShape[];
  readonly highlight?: readonly Key[];
  /** Hint: the square of the piece the engine would move. */
  readonly hintSquare?: Key;
  readonly onMove?: (from: Key, to: Key) => void;
}

/** Thin React wrapper around chessground. */
export function Board(props: BoardProps): React.JSX.Element {
  const el = useRef<HTMLDivElement>(null);
  const cg = useRef<Api | null>(null);
  const onMoveRef = useRef(props.onMove);
  onMoveRef.current = props.onMove;

  const config = (): Config => ({
    fen: props.fen,
    orientation: props.orientation,
    turnColor: props.turnColor,
    lastMove: props.lastMove,
    check: props.check ?? false,
    coordinates: true,
    animation: { enabled: true, duration: 180 },
    highlight: {
      lastMove: true,
      check: true,
      custom: new Map<Key, string>([
        ...(props.highlight ?? []).map((k): [Key, string] => [k, 'coach-highlight']),
        ...(props.hintSquare ? [[props.hintSquare, 'hint-square'] as [Key, string]] : []),
      ]),
    },
    movable: {
      free: false,
      color: props.movableColor,
      dests: props.movableColor ? props.dests : new Map(),
      showDests: true,
      events: { after: (from, to) => onMoveRef.current?.(from, to) },
    },
    premovable: { enabled: false },
    draggable: { enabled: true, showGhost: true },
    drawable: { enabled: true, visible: true, autoShapes: props.shapes ?? [] },
  });

  useEffect(() => {
    if (!el.current) return;
    cg.current = Chessground(el.current, config());
    return () => {
      cg.current?.destroy();
      cg.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cg.current?.set(config());
    // set() doesn't redraw the SVG layer, so push arrows explicitly (otherwise old arrows linger).
    cg.current?.setAutoShapes(props.shapes ?? []);
  });

  return <div className="board" data-fen={props.fen} ref={el} />;
}
