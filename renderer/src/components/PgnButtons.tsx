import { useState } from 'react';
import { copyPgn, savePgn } from '../pgn';

export function PgnButtons(props: { pgn: string; name: string }): React.JSX.Element {
  const [note, setNote] = useState<string | null>(null);
  return (
    <>
      <button
        onClick={async () => {
          setNote((await copyPgn(props.pgn)) ? 'PGN copied' : 'Could not copy');
          setTimeout(() => setNote(null), 2000);
        }}
      >
        Copy PGN
      </button>
      <button onClick={() => savePgn(props.pgn, props.name)}>Save PGN</button>
      {note && <span className="muted">{note}</span>}
    </>
  );
}
