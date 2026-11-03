import { safeStorage } from 'electron';
import { DEFAULT_GEMINI_MODEL } from '../explain/narrator/gemini';
import { DEFAULT_OPENROUTER_MODEL } from '../explain/narrator/openrouter';
import type { KeyStatus, LlmProvider, Settings, StopOn } from '../shared/api';
import type { Db } from './db';

export const DEFAULT_SETTINGS: Settings = {
  stopOn: 'blunder',
  botMovetimeMs: 400,
  analysisDepth: 16,
  llmProvider: 'gemini',
  geminiModel: DEFAULT_GEMINI_MODEL,
  openrouterModel: DEFAULT_OPENROUTER_MODEL,
  stockfishPath: '',
  lc0Path: '',
  maiaWeightsDir: '',
  lichessUsername: '',
  chesscomUsername: '',
  openingVariety: true,
  boardTheme: 'brown',
  sounds: true,
};

const KEY_SETTING: Record<LlmProvider, string> = { gemini: 'geminiKey', openrouter: 'openrouterKey' };

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fallback;
}

export function sanitize(raw: Partial<Settings>, base: Settings): Settings {
  const stopOn: StopOn = raw.stopOn === 'mistake' || raw.stopOn === 'blunder' ? raw.stopOn : base.stopOn;
  return {
    stopOn,
    botMovetimeMs: clampInt(raw.botMovetimeMs ?? base.botMovetimeMs, 50, 10000, base.botMovetimeMs),
    analysisDepth: clampInt(raw.analysisDepth ?? base.analysisDepth, 8, 30, base.analysisDepth),
    llmProvider: raw.llmProvider === 'openrouter' || raw.llmProvider === 'gemini' ? raw.llmProvider : base.llmProvider,
    geminiModel: typeof raw.geminiModel === 'string' && raw.geminiModel.trim() ? raw.geminiModel.trim() : base.geminiModel,
    openrouterModel: typeof raw.openrouterModel === 'string' && raw.openrouterModel.trim() ? raw.openrouterModel.trim() : base.openrouterModel,
    stockfishPath: typeof raw.stockfishPath === 'string' ? raw.stockfishPath.trim() : base.stockfishPath,
    lc0Path: typeof raw.lc0Path === 'string' ? raw.lc0Path.trim() : base.lc0Path,
    maiaWeightsDir: typeof raw.maiaWeightsDir === 'string' ? raw.maiaWeightsDir.trim() : base.maiaWeightsDir,
    lichessUsername: typeof raw.lichessUsername === 'string' ? raw.lichessUsername.trim() : base.lichessUsername,
    chesscomUsername: typeof raw.chesscomUsername === 'string' ? raw.chesscomUsername.trim() : base.chesscomUsername,
    openingVariety: typeof raw.openingVariety === 'boolean' ? raw.openingVariety : base.openingVariety,
    boardTheme: raw.boardTheme === 'green' || raw.boardTheme === 'blue' || raw.boardTheme === 'gray' || raw.boardTheme === 'brown' ? raw.boardTheme : base.boardTheme,
    sounds: typeof raw.sounds === 'boolean' ? raw.sounds : base.sounds,
  };
}

export class SettingsStore {
  private cached: Settings;

  constructor(private readonly db: Db) {
    let stored: Partial<Settings> = {};
    try {
      stored = JSON.parse(db.getSetting('settings') ?? '{}') as Partial<Settings>;
    } catch {
      stored = {};
    }
    this.cached = sanitize(stored, DEFAULT_SETTINGS);
  }

  get(): Settings {
    return this.cached;
  }

  set(patch: Partial<Settings>): Settings {
    this.cached = sanitize({ ...this.cached, ...patch }, this.cached);
    this.db.setSetting('settings', JSON.stringify(this.cached));
    return this.cached;
  }

  keyStatus(provider: LlmProvider): KeyStatus {
    const backend = process.platform === 'linux' ? safeStorage.getSelectedStorageBackend() : 'os';
    const encrypted = safeStorage.isEncryptionAvailable() && backend !== 'basic_text';
    return { hasKey: this.db.getSetting(KEY_SETTING[provider]) !== null, storageBackend: backend, encrypted };
  }

  /** Stores an API key encrypted with the OS keyring (KWallet / GNOME keyring via safeStorage). */
  setApiKey(provider: LlmProvider, key: string | null): KeyStatus {
    const name = KEY_SETTING[provider];
    if (key === null || key.trim() === '') {
      this.db.setSetting(name, null);
    } else if (safeStorage.isEncryptionAvailable()) {
      this.db.setSetting(name, `enc:${safeStorage.encryptString(key.trim()).toString('base64')}`);
    } else {
      this.db.setSetting(name, `plain:${key.trim()}`);
    }
    return this.keyStatus(provider);
  }

  getApiKey(provider: LlmProvider): string | null {
    const v = this.db.getSetting(KEY_SETTING[provider]);
    if (!v) return null;
    if (v.startsWith('plain:')) return v.slice(6);
    if (v.startsWith('enc:')) {
      try {
        return safeStorage.decryptString(Buffer.from(v.slice(4), 'base64'));
      } catch {
        return null;
      }
    }
    return null;
  }
}
