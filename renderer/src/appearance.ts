import type { BoardTheme } from '../../shared/api';
import { setSoundsEnabled } from './sounds';

export const BOARD_THEMES: readonly { id: BoardTheme; label: string }[] = [
  { id: 'brown', label: 'Classic brown' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'gray', label: 'Gray' },
];

/** Board colours are plain CSS (see styles.css), switched by an attribute on <html>. */
export function applyAppearance(s: { boardTheme: BoardTheme; sounds: boolean }): void {
  document.documentElement.dataset.board = s.boardTheme;
  setSoundsEnabled(s.sounds);
}
