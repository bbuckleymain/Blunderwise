import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type CoachApi, type LibraryProgress, type ReviewProgress } from '../shared/api';

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
    hint: (fen) => invoke(IPC.hint, fen),
    threat: (fen) => invoke(IPC.threat, fen),
    cached: (ctx) => invoke(IPC.cached, ctx),
  },
  games: {
    save: (req) => invoke(IPC.gamesSave, req),
    list: () => invoke(IPC.gamesList),
    get: (id) => invoke(IPC.gamesGet, id),
  },
  library: {
    importLichess: (username, max) => invoke(IPC.importLichess, username, max),
    importChessCom: (username, max) => invoke(IPC.importChessCom, username, max),
    analyzeAll: () => invoke(IPC.analyzeAll),
    analyzeGame: (id) => invoke(IPC.analyzeGame, id),
    onProgress: (cb) => {
      const listener = (_e: Electron.IpcRendererEvent, p: LibraryProgress): void => cb(p);
      ipcRenderer.on(IPC.libraryProgress, listener);
      return () => ipcRenderer.removeListener(IPC.libraryProgress, listener);
    },
    report: () => invoke(IPC.report),
  },
  openings: {
    track: (fens) => invoke(IPC.openingTrack, fens),
    families: () => invoke(IPC.openingFamilies),
    report: () => invoke(IPC.openingReport),
  },
  drills: {
    due: (filter, limit) => invoke(IPC.drillsDue, filter, limit),
    counts: () => invoke(IPC.drillsCounts),
    answer: (id, uci) => invoke(IPC.drillsAnswer, id, uci),
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
