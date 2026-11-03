import { useEffect, useState } from 'react';
import type { GameRecord } from '../../shared/api';
import { api } from './api';

export function GamesScreen(props: { onReview: (id: number) => void }): React.JSX.Element {
  const [games, setGames] = useState<GameRecord[] | null>(null);
  useEffect(() => {
    void api().games.list().then(setGames);
  }, []);
  if (!games) return <div className="panel">Loading…</div>;
  return (
    <div className="panel games">
      <h2>Your games</h2>
      {games.length === 0 && <div className="muted">No games yet. Play one!</div>}
      <table>
        <tbody>
          {games.map((g) => (
            <tr key={g.id}>
              <td>{new Date(g.createdAt).toLocaleString()}</td>
              <td>{g.myColor === 'w' ? 'White' : 'Black'} vs {g.opponent}</td>
              <td>{g.result}</td>
              <td>
                <button onClick={() => props.onReview(g.id)}>Review</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
