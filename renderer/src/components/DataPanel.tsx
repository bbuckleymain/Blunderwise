import { useCallback, useEffect, useState } from 'react';
import type { DataInfo } from '../../../shared/api';
import { api } from '../api';

const size = (bytes: number): string => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;
const clean = (e: unknown): string => (e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(e));

/** Where your games live, automatic backups, and moving them between installs or versions. */
export function DataPanel(): React.JSX.Element {
  const [info, setInfo] = useState<DataInfo | null>(null);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setInfo(await api().data.info()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const run = async (job: () => Promise<string | null>): Promise<void> => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await job();
      if (text) setMsg({ text, error: false });
    } catch (e) {
      setMsg({ text: clean(e), error: true });
    } finally {
      setBusy(false);
      await load();
    }
  };

  const lastBackup = info?.backups[0];
  return (
    <div className="panel">
      <h2>Your data</h2>
      <p className="muted small">
        Your games, drills and settings are saved on this computer and stay when you update the app. A safety copy is made automatically every day (the last 7 are kept) and before any update changes the database.
      </p>
      {info && (
        <p className="small">
          <strong>{plural(info.games, 'game')}</strong> and <strong>{plural(info.drills, 'drill')}</strong> · database {size(info.databaseBytes)}
          <br />
          <span className="muted">Stored in {info.folder}</span>
          <br />
          <span className="muted">{lastBackup ? `Latest backup: ${new Date(lastBackup.at).toLocaleString()} (${plural(info.backups.length, 'backup')} kept)` : 'No backup yet'}</span>
        </p>
      )}
      <div className="toolbar">
        <div className="tool-group">
          <button
            className="accent"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = await api().data.exportBackup();
                return r ? `Saved ${plural(r.games, 'game')} and ${plural(r.drills, 'drill')} to ${r.path}` : null;
              })
            }
          >
            Export backup
          </button>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = await api().data.importBackup();
                return r ? `Imported ${plural(r.games, 'new game')} and ${plural(r.drills, 'drill')}${r.skipped ? ` (${r.skipped} already in your library)` : ''}. Open Games and click "Analyse all" to add new games to your report.` : null;
              })
            }
          >
            Import backup
          </button>
        </div>
        <div className="tool-group">
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = await api().data.exportPgn();
                return r ? `Saved ${plural(r.games, 'game')} as PGN to ${r.path}` : null;
              })
            }
          >
            Export all as PGN
          </button>
          <button disabled={busy} onClick={() => void run(async () => `Backup saved: ${await api().data.backupNow()}`)}>
            Back up now
          </button>
          <button disabled={busy} onClick={() => void api().data.openFolder()}>
            Open folder
          </button>
        </div>
      </div>
      {msg && <div className={msg.error ? 'error' : 'ok-box'}>{msg.text}</div>}
      <p className="muted small">
        Tip: a backup file lets you move your library to another computer, or between the Flatpak and a pacman install (they keep separate data folders). Importing never overwrites or duplicates games you already have.
      </p>
    </div>
  );
}
