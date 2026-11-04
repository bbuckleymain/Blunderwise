import { useEffect, useState } from 'react';
import type { GameRecord, LibraryProgress, OpponentRecordRow } from '../../shared/api';
import { api } from './api';
import { Skeleton } from './components/Skeleton';
import { PgnButtons } from './components/PgnButtons';

const SOURCE: Record<GameRecord['source'], string> = { bot: 'vs bot', lichess: 'Lichess', chesscom: 'Chess.com' };

export function GamesScreen(props: { onReview: (id: number) => void }): React.JSX.Element {
  const [games, setGames] = useState<GameRecord[] | null>(null);
  const [lichess, setLichess] = useState('');
  const [chesscom, setChesscom] = useState('');
  const [count, setCount] = useState(20);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [progress, setProgress] = useState<LibraryProgress | null>(null);
  const [record, setRecord] = useState<OpponentRecordRow[]>([]);

  const refresh = async (): Promise<void> => {
    const [g, r] = await Promise.all([api().games.list(), api().games.record()]);
    setGames(g);
    setRecord(r);
  };
  useEffect(() => {
    void refresh();
    void api().settings.get().then((s) => {
      setLichess(s.lichessUsername);
      setChesscom(s.chesscomUsername);
    });
    return api().library.onProgress(setProgress);
  }, []);

  const run = async (label: string, job: () => Promise<string>): Promise<void> => {
    setBusy(label);
    setMsg(null);
    try {
      setMsg({ text: await job(), error: false });
    } catch (e) {
      setMsg({ text: `${label} failed: ${e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(e)}`, error: true });
    } finally {
      setBusy(null);
      setProgress(null);
      await refresh();
    }
  };

  const importFrom = (site: 'lichess' | 'chesscom'): Promise<void> =>
    run(site === 'lichess' ? 'Lichess import' : 'Chess.com import', async () => {
      const name = site === 'lichess' ? lichess : chesscom;
      const r = site === 'lichess' ? await api().library.importLichess(name, count) : await api().library.importChessCom(name, count);
      return `Fetched ${r.fetched} games, ${r.added} new. Click "Analyse all" to add them to your report and drills.`;
    });

  if (!games) return <Skeleton />;
  const unanalyzed = games.filter((g) => !g.analyzed).length;

  return (
    <div className="games-page">
      <div className="panel">
        <h2>Import your games</h2>
        <div className="import-row">
          <label>
            Lichess username
            <input value={lichess} onChange={(e) => setLichess(e.target.value)} placeholder="e.g. TwoCan" />
          </label>
          <button disabled={!lichess.trim() || busy !== null} onClick={() => void importFrom('lichess')}>Import from Lichess</button>
        </div>
        <div className="import-row">
          <label>
            Chess.com username
            <input value={chesscom} onChange={(e) => setChesscom(e.target.value)} placeholder="e.g. TwoCan" />
          </label>
          <button disabled={!chesscom.trim() || busy !== null} onClick={() => void importFrom('chesscom')}>Import from Chess.com</button>
        </div>
        <div className="import-row">
          <label>
            How many recent games
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={unanalyzed === 0 || busy !== null}
            onClick={() => void run('Analysis', async () => `Analysed ${await api().library.analyzeAll()} games.`)}
          >
            Analyse all ({unanalyzed})
          </button>
        </div>
        {busy && <div className="muted">{busy}…</div>}
        {progress && progress.games > 0 && (
          <>
            <div className="muted">
              Game {Math.min(progress.game + 1, progress.games)} of {progress.games}
              {progress.moves ? ` · move ${progress.move}/${progress.moves}` : ''}
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ transform: `scaleX(${(progress.game + (progress.moves ? progress.move / progress.moves : 0)) / progress.games})` }} />
            </div>
          </>
        )}
        {msg && <div className={msg.error ? 'error' : 'ok'}>{msg.text}</div>}
      </div>

      {record.length > 0 && (
        <div className="panel">
          <h2>Your record against the bots</h2>
          <table className="tag-table">
            <thead>
              <tr className="muted small">
                <td>Opponent</td>
                <td className="num">Games</td>
                <td>Won / drawn / lost</td>
                <td>Last played</td>
              </tr>
            </thead>
            <tbody>
              {record.map((r) => (
                <tr key={r.opponent}>
                  <td className="tag-name">{r.opponent}</td>
                  <td className="num">{r.games}</td>
                  <td>
                    {r.wins} / {r.draws} / {r.losses} <span className="muted small">({Math.round((100 * (r.wins + r.draws / 2)) / r.games)}%)</span>
                  </td>
                  <td className="muted">{new Date(r.lastPlayed).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel games">
        <h2>Your games ({games.length})</h2>
        {games.length === 0 && <div className="muted">No games yet. Play one, or import from Lichess / Chess.com.</div>}
        <table>
          <tbody>
            {games.map((g) => (
              <tr key={g.id}>
                <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                <td className="muted">{SOURCE[g.source]}</td>
                <td>
                  {g.myColor === 'w' ? 'White' : 'Black'} vs {g.opponent}
                  {g.opening && <div className="muted small">{g.opening}</div>}
                </td>
                <td>{g.result}</td>
                <td className="muted">{g.analyzed ? '✓ analysed' : ''}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => props.onReview(g.id)}>Review</button>
                    <PgnButtons pgn={g.pgn} name={`blunderwise-game-${g.id}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
