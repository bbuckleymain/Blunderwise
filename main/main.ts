import { BrowserWindow, app, ipcMain, shell } from 'electron';
import path from 'node:path';
import { IPC, type BotMoveRequest, type LlmProvider, type MoveCheckRequest, type SaveGameRequest, type Settings } from '../shared/api';
import type { Color, MistakeContext } from '../explain/types';
import { CoachService } from './coach';
import { Db } from './db';
import { EngineManager } from './engineManager';
import { SettingsStore } from './settings';

// Prefer native Wayland on Wayland sessions (KDE/GNOME on CachyOS), fall back to X11.
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

let db: Db | null = null;
let engines: EngineManager | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Blunderwise',
    backgroundColor: '#1e1f22',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(path.join(__dirname, '../renderer/index.html'));
  return win;
}

void app.whenReady().then(() => {
  db = new Db(path.join(app.getPath('userData'), 'blunderwise.sqlite'));
  const settings = new SettingsStore(db);
  engines = new EngineManager(() => settings.get(), process.resourcesPath);
  const coach = new CoachService(engines, db, settings);
  const store = db;
  const eng = engines;

  ipcMain.handle(IPC.engineStatus, () => eng.status());
  ipcMain.handle(IPC.engineRestart, () => {
    eng.restart();
    return eng.status();
  });
  ipcMain.handle(IPC.botMove, async (_e, req: BotMoveRequest) => {
    const r =
      req.opponent === 'maia'
        ? await eng.maiaEngine(req.maiaRating).getBestMove(req.fen, { nodes: 1 })
        : await eng.opponent().getBestMove(req.fen, { skill: req.skill, movetimeMs: req.movetimeMs });
    return r.bestMove;
  });
  ipcMain.handle(IPC.prefetch, (_e, fen: string) => coach.prefetch(fen));
  ipcMain.handle(IPC.checkMove, (_e, req: MoveCheckRequest) => coach.checkMove(req));
  ipcMain.handle(IPC.narrate, (_e, ctx: MistakeContext) => coach.narrate(ctx));
  ipcMain.handle(IPC.gamesSave, (_e, req: SaveGameRequest) => store.saveGame(req));
  ipcMain.handle(IPC.gamesList, () => store.listGames());
  ipcMain.handle(IPC.gamesGet, (_e, id: number) => store.getGame(id));
  ipcMain.handle(IPC.reviewAnalyze, (e, pgn: string, myColor: Color) =>
    coach.reviewGame(pgn, myColor, (p) => e.sender.send(IPC.reviewProgress, p)),
  );
  ipcMain.handle(IPC.settingsGet, () => settings.get());
  ipcMain.handle(IPC.settingsSet, (_e, patch: Partial<Settings>) => {
    const before = settings.get();
    const next = settings.set(patch);
    if (before.stockfishPath !== next.stockfishPath || before.lc0Path !== next.lc0Path || before.maiaWeightsDir !== next.maiaWeightsDir) {
      eng.restart();
    }
    return next;
  });
  ipcMain.handle(IPC.keyStatus, (_e, provider: LlmProvider) => settings.keyStatus(provider));
  ipcMain.handle(IPC.setApiKey, (_e, provider: LlmProvider, key: string | null) => settings.setApiKey(provider, key));
  ipcMain.handle(IPC.testApiKey, () => coach.testApiKey());

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  engines?.dispose();
  db?.close();
  app.quit();
});
