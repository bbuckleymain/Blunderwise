"use strict";

// preload/preload.ts
var import_electron = require("electron");

// shared/api.ts
var IPC = {
  engineStatus: "engine:status",
  engineRestart: "engine:restart",
  botMove: "engine:botMove",
  prefetch: "coach:prefetch",
  checkMove: "coach:checkMove",
  narrate: "coach:narrate",
  hint: "coach:hint",
  gamesSave: "games:save",
  gamesList: "games:list",
  gamesGet: "games:get",
  reviewAnalyze: "review:analyze",
  reviewProgress: "review:progress",
  settingsGet: "settings:get",
  settingsSet: "settings:set",
  keyStatus: "settings:keyStatus",
  setApiKey: "settings:setApiKey",
  testApiKey: "settings:testApiKey",
  importLichess: "library:importLichess",
  importChessCom: "library:importChessCom",
  analyzeAll: "library:analyzeAll",
  analyzeGame: "library:analyzeGame",
  libraryProgress: "library:progress",
  report: "library:report",
  drillsDue: "drills:due",
  drillsCounts: "drills:counts",
  drillsAnswer: "drills:answer"
};

// preload/preload.ts
function invoke(channel, ...args) {
  return import_electron.ipcRenderer.invoke(channel, ...args);
}
var api = {
  engine: {
    status: () => invoke(IPC.engineStatus),
    restart: () => invoke(IPC.engineRestart),
    botMove: (req) => invoke(IPC.botMove, req)
  },
  coach: {
    prefetch: (fen) => invoke(IPC.prefetch, fen),
    checkMove: (req) => invoke(IPC.checkMove, req),
    narrate: (ctx) => invoke(IPC.narrate, ctx),
    hint: (fen) => invoke(IPC.hint, fen)
  },
  games: {
    save: (req) => invoke(IPC.gamesSave, req),
    list: () => invoke(IPC.gamesList),
    get: (id) => invoke(IPC.gamesGet, id)
  },
  library: {
    importLichess: (username, max) => invoke(IPC.importLichess, username, max),
    importChessCom: (username, max) => invoke(IPC.importChessCom, username, max),
    analyzeAll: () => invoke(IPC.analyzeAll),
    analyzeGame: (id) => invoke(IPC.analyzeGame, id),
    onProgress: (cb) => {
      const listener = (_e, p) => cb(p);
      import_electron.ipcRenderer.on(IPC.libraryProgress, listener);
      return () => import_electron.ipcRenderer.removeListener(IPC.libraryProgress, listener);
    },
    report: () => invoke(IPC.report)
  },
  drills: {
    due: (tag, limit) => invoke(IPC.drillsDue, tag, limit),
    counts: () => invoke(IPC.drillsCounts),
    answer: (id, uci) => invoke(IPC.drillsAnswer, id, uci)
  },
  review: {
    analyze: (pgn, myColor) => invoke(IPC.reviewAnalyze, pgn, myColor),
    onProgress: (cb) => {
      const listener = (_e, p) => cb(p);
      import_electron.ipcRenderer.on(IPC.reviewProgress, listener);
      return () => import_electron.ipcRenderer.removeListener(IPC.reviewProgress, listener);
    }
  },
  settings: {
    get: () => invoke(IPC.settingsGet),
    set: (patch) => invoke(IPC.settingsSet, patch),
    keyStatus: (provider) => invoke(IPC.keyStatus, provider),
    setApiKey: (provider, key) => invoke(IPC.setApiKey, provider, key),
    testApiKey: () => invoke(IPC.testApiKey)
  }
};
import_electron.contextBridge.exposeInMainWorld("coachApi", api);
//# sourceMappingURL=preload.cjs.map
