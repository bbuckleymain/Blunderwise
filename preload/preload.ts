import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type CoachApi, type ReviewProgress } from '../shared/api';

/** ipcRenderer.invoke is untyped; pin the result type at the boundary instead of leaking `any`. */
function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api: CoachApi = {
  engine: {
    status: () => invoke(IPC.engineStatus),
    restart: () => invoke(IPC.engineRestart),
    botMove: (req) => invoke(IPC.botMove, req),
  },
  coach: {
    prefetch: (fen) => invoke(IPC.prefetch, fen),
    checkMove: (req) => invoke(IPC.checkMove, req),
    narrate: (ctx) => invoke(IPC.narrate, ctx),
  },
  games: {
    save: (req) => invoke(IPC.gamesSave, req),
    list: () => invoke(IPC.gamesList),
    get: (id) => invoke(IPC.gamesGet, id),
  },
  review: {
    analyze: (pgn, myColor) => invoke(IPC.reviewAnalyze, pgn, myColor),
    onProgress: (cb) => {
      const listener = (_e: Electron.IpcRendererEvent, p: ReviewProgress): void => cb(p);
      ipcRenderer.on(IPC.reviewProgress, listener);
      return () => ipcRenderer.removeListener(IPC.reviewProgress, listener);
    },
  },
  settings: {
    get: () => invoke(IPC.settingsGet),
    set: (patch) => invoke(IPC.settingsSet, patch),
    keyStatus: (provider) => invoke(IPC.keyStatus, provider),
    setApiKey: (provider, key) => invoke(IPC.setApiKey, provider, key),
    testApiKey: () => invoke(IPC.testApiKey),
  },
};

contextBridge.exposeInMainWorld('coachApi', api);
