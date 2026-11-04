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
  threat: "coach:threat",
  openingTrack: "openings:track",
  openingFamilies: "openings:families",
  openingReport: "openings:report",
  cached: "coach:cached",
  gamesSave: "games:save",
  gamesList: "games:list",
  gamesGet: "games:get",
  gamesRecord: "games:record",
  dataInfo: "data:info",
  dataBackupNow: "data:backupNow",
  dataExportBackup: "data:exportBackup",
  dataExportPgn: "data:exportPgn",
  dataImportBackup: "data:importBackup",
  dataOpenFolder: "data:openFolder",
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
    hint: (fen) => invoke(IPC.hint, fen),
    threat: (fen) => invoke(IPC.threat, fen),
    cached: (ctx) => invoke(IPC.cached, ctx)
  },
  games: {
    save: (req) => invoke(IPC.gamesSave, req),
    list: () => invoke(IPC.gamesList),
    record: () => invoke(IPC.gamesRecord),
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
  openings: {
    track: (fens) => invoke(IPC.openingTrack, fens),
    families: () => invoke(IPC.openingFamilies),
    report: () => invoke(IPC.openingReport)
  },
  drills: {
    due: (filter, limit) => invoke(IPC.drillsDue, filter, limit),
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
  data: {
    info: () => invoke(IPC.dataInfo),
    backupNow: () => invoke(IPC.dataBackupNow),
    exportBackup: () => invoke(IPC.dataExportBackup),
    exportPgn: () => invoke(IPC.dataExportPgn),
    importBackup: () => invoke(IPC.dataImportBackup),
    openFolder: () => invoke(IPC.dataOpenFolder)
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
