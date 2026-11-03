import { useEffect, useState } from 'react';
import type { EngineStatus, KeyStatus, Settings } from '../../shared/api';
import { api } from './api';

export function SettingsScreen(): React.JSX.Element {
  const [s, setS] = useState<Settings | null>(null);
  const [key, setKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void api().settings.get().then(setS);
    void api().engine.status().then(setStatus);
  }, []);

  const provider = s?.llmProvider;
  useEffect(() => {
    if (provider) void api().settings.keyStatus(provider).then(setKeyStatus);
    setKey('');
    setMsg(null);
  }, [provider]);

  if (!s) return <div className="panel">Loading…</div>;
  const save = async (patch: Partial<Settings>): Promise<void> => {
    setS(await api().settings.set(patch));
  };
  const saveEngines = async (): Promise<void> => {
    await api().settings.set({ stockfishPath: s.stockfishPath, lc0Path: s.lc0Path, maiaWeightsDir: s.maiaWeightsDir });
    setStatus(await api().engine.restart());
  };

  return (
    <div className="settings">
      <div className="panel">
        <h2>Coach (AI explanations)</h2>
        <label>
          Provider
          <select value={s.llmProvider} onChange={(e) => void save({ llmProvider: e.target.value === 'openrouter' ? 'openrouter' : 'gemini' })}>
            <option value="gemini">Google Gemini</option>
            <option value="openrouter">OpenRouter (free models)</option>
          </select>
        </label>
        <p className="muted">
          {s.llmProvider === 'gemini'
            ? 'Get a free key at aistudio.google.com.'
            : 'Get a free key at openrouter.ai/keys. "openrouter/free" picks a free model for each request (50 requests/day, or 1,000/day after a one-time $10 credit purchase).'}{' '}
          Without a key the coach still explains every blunder with its built-in templates.
        </p>
        <label>
          API key {keyStatus?.hasKey ? '(saved)' : '(not set)'}
          <input type="password" value={key} placeholder={keyStatus?.hasKey ? '••••••••' : 'paste your key'} onChange={(e) => setKey(e.target.value)} />
        </label>
        {keyStatus && !keyStatus.encrypted && (
          <div className="warn">
            No system keyring found (backend: {keyStatus.storageBackend}). The key will be stored unencrypted. Run KWallet or GNOME Keyring to encrypt it.
          </div>
        )}
        <div className="toolbar">
          <button className="primary" disabled={!key.trim()} onClick={async () => { setKeyStatus(await api().settings.setApiKey(s.llmProvider, key)); setKey(''); setMsg('Key saved.'); }}>
            Save key
          </button>
          <button disabled={!keyStatus?.hasKey} onClick={async () => { setMsg('Testing…'); const r = await api().settings.testApiKey(); setMsg(r.message); }}>
            Test key
          </button>
          <button disabled={!keyStatus?.hasKey} onClick={async () => { setKeyStatus(await api().settings.setApiKey(s.llmProvider, null)); setMsg('Key removed.'); }}>
            Remove key
          </button>
        </div>
        {s.llmProvider === 'gemini' ? (
          <label>
            Model
            <input value={s.geminiModel} onChange={(e) => setS({ ...s, geminiModel: e.target.value })} onBlur={() => void save({ geminiModel: s.geminiModel })} />
          </label>
        ) : (
          <label>
            Model (openrouter/free, or a specific model ending in :free)
            <input value={s.openrouterModel} onChange={(e) => setS({ ...s, openrouterModel: e.target.value })} onBlur={() => void save({ openrouterModel: s.openrouterModel })} />
          </label>
        )}
        {msg && <div className="muted">{msg}</div>}
      </div>

      <div className="panel">
        <h2>Coaching</h2>
        <label>
          Stop the game on
          <select value={s.stopOn} onChange={(e) => void save({ stopOn: e.target.value === 'mistake' ? 'mistake' : 'blunder' })}>
            <option value="blunder">Blunders only</option>
            <option value="mistake">Mistakes and blunders</option>
          </select>
        </label>
        <label>
          Analysis depth: {s.analysisDepth}
          <input type="range" min={10} max={22} value={s.analysisDepth} onChange={(e) => void save({ analysisDepth: Number(e.target.value) })} />
        </label>
        <label>
          Bot think time: {s.botMovetimeMs} ms
          <input type="range" min={100} max={3000} step={100} value={s.botMovetimeMs} onChange={(e) => void save({ botMovetimeMs: Number(e.target.value) })} />
        </label>
      </div>

      <div className="panel">
        <h2>Engines</h2>
        <label>
          Stockfish path (empty = auto: /usr/bin/stockfish)
          <input value={s.stockfishPath} onChange={(e) => setS({ ...s, stockfishPath: e.target.value })} />
        </label>
        <div className={status?.stockfish.ok ? 'ok' : 'error'}>
          Stockfish: {status ? (status.stockfish.ok ? `OK (${status.stockfish.path ?? ''})` : status.stockfish.error) : '…'}
        </div>
        <label>
          lc0 path for Maia (empty = auto: /usr/bin/lc0)
          <input value={s.lc0Path} onChange={(e) => setS({ ...s, lc0Path: e.target.value })} />
        </label>
        <label>
          Maia weights folder (contains maia-1100.pb.gz … maia-1900.pb.gz)
          <input value={s.maiaWeightsDir} onChange={(e) => setS({ ...s, maiaWeightsDir: e.target.value })} />
        </label>
        <div className={status?.maia.ok ? 'ok' : 'warn'}>
          Maia: {status ? (status.maia.ok ? `OK, ratings ${status.maia.ratings.join(', ')}` : status.maia.error) : '…'}
        </div>
        <button onClick={() => void saveEngines()}>Save &amp; restart engines</button>
      </div>
    </div>
  );
}
