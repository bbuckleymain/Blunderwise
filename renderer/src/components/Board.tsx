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

  // Only touch chessground when something it shows actually changed. Re-applying the whole config on every
  // React render (e.g. a ticking clock) would cancel half-made moves and erase arrows the user drew.
  const boardKey = (): string =>
    JSON.stringify([props.fen, props.orientation, props.turnColor, props.movableColor ?? null, props.lastMove ?? null, props.check ?? false, props.highlight ?? [], props.hintSquare ?? null]);
  const shapesKey = (): string => JSON.stringify(props.shapes ?? []);
  const applied = useRef({ board: '', shapes: '' });

  useEffect(() => {
    if (!el.current) return;
    cg.current = Chessground(el.current, config());
    applied.current = { board: boardKey(), shapes: shapesKey() };
    return () => {
      cg.current?.destroy();
      cg.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const api = cg.current;
    if (!api) return;
    const bk = boardKey();
    const sk = shapesKey();
    if (bk !== applied.current.board) {
      applied.current.board = bk;
      api.set(config());
      applied.current.shapes = '';
    }
    if (sk !== applied.current.shapes) {
      applied.current.shapes = sk;
      // set() doesn't redraw the SVG layer, so push arrows explicitly (otherwise old arrows linger).
      api.setAutoShapes(props.shapes ?? []);
    }
  });

  // chessground caches where the board is on screen. When the layout shifts (clocks appear above it, the window
  // scrolls) that cache goes stale and clicks land on the wrong square, so refresh it before every press.
  const refreshBounds = (): void => cg.current?.state.dom.bounds.clear();

  return <div className="board" data-fen={props.fen} ref={el} onMouseDownCapture={refreshBounds} onTouchStartCapture={refreshBounds} />;
}
