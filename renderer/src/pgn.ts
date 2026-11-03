/** Copy a PGN to the clipboard, or hand it to the user as a .pgn file. */
export async function copyPgn(pgn: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(pgn);
    return true;
  } catch {
    return false;
  }
}

export function savePgn(pgn: string, name: string): void {
  const url = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^\w.-]+/g, '_')}.pgn`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
