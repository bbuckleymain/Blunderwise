import { BrowserWindow, app, dialog, ipcMain, shell } from 'electron';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { IPC, type BotMoveRequest, type DataInfo, type DrillFilter, type LlmProvider, type MoveCheckRequest, type SaveGameRequest, type Settings } from '../shared/api';
import { parseBackup } from './backupFile';
import { Library } from './library';
import { families as bookFamilies, pickBookMove, trackOpening } from '../openings/book';
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
      autoplayPolicy: 'no-user-gesture-required',
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
  const dataDir = app.getPath('userData');
  const backupDir = path.join(dataDir, 'backups');
  db = new Db(path.join(dataDir, 'blunderwise.sqlite'));
  try {
    db.backupIfDue(backupDir); // a rolling daily safety copy (the last 7 are kept)
  } catch (e) {
    console.error('Automatic backup failed', e);
  }
  const settings = new SettingsStore(db);
  engines = new EngineManager(() => settings.get(), process.resourcesPath);
  const coach = new CoachService(engines, db, settings);
  const library = new Library(db, coach);
  const store = db;
  const eng = engines;

  ipcMain.handle(IPC.engineStatus, () => eng.status());
  ipcMain.handle(IPC.engineRestart, () => {
    eng.restart();
    return eng.status();
  });
  ipcMain.handle(IPC.botMove, async (_e, req: BotMoveRequest) => {
    // Stockfish plays random book moves in the opening so games differ (and can steer into a chosen opening).
    if (req.opponent === 'stockfish' && req.useBook && Number(req.fen.split(' ')[5] ?? '1') <= 10) {
      const book = pickBookMove(req.fen, req.bookFamily);
      if (book) return book;
    }
    const r =
      req.opponent === 'maia'
        ? await eng.maiaEngine(req.maiaRating).getBestMove(req.fen, { nodes: 1 })
        : await eng.opponent().getBestMove(req.fen, { skill: req.skill, movetimeMs: req.movetimeMs });
    return r.bestMove;
  });
  // --- your data: where it lives, backups, moving it between installs
  const todayStamp = (): string => new Date().toISOString().slice(0, 10);
  const parent = (): BrowserWindow | undefined => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  ipcMain.handle(IPC.gamesRecord, () => store.opponentRecord());
  ipcMain.handle(IPC.dataInfo, (): DataInfo => {
    const c = store.counts();
    return { folder: dataDir, databaseBytes: statSync(store.path).size, games: c.games, drills: c.drills, backups: Db.listBackups(backupDir) };
  });
  ipcMain.handle(IPC.dataBackupNow, () => {
    mkdirSync(backupDir, { recursive: true });
    const name = `blunderwise-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}-manual.sqlite`;
    store.backupTo(path.join(backupDir, name));
    return name;
  });
  ipcMain.handle(IPC.dataExportBackup, async () => {
    const win = parent();
    const options = { title: 'Save a backup of your games', defaultPath: `blunderwise-backup-${todayStamp()}.json`, filters: [{ name: 'Blunderwise backup', extensions: ['json'] }] };
    const r = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (r.canceled || !r.filePath) return null;
    const data = store.exportAll();
    writeFileSync(r.filePath, JSON.stringify(data));
    return { path: r.filePath, games: data.games.length, drills: data.drills.length };
  });
  ipcMain.handle(IPC.dataExportPgn, async () => {
    const win = parent();
    const options = { title: 'Save all games as PGN', defaultPath: `blunderwise-games-${todayStamp()}.pgn`, filters: [{ name: 'PGN', extensions: ['pgn'] }] };
    const r = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (r.canceled || !r.filePath) return null;
    const pgns = store.allPgns();
    writeFileSync(r.filePath, `${pgns.join('\n\n')}\n`);
    return { path: r.filePath, games: pgns.length };
  });
  ipcMain.handle(IPC.dataImportBackup, async () => {
    const win = parent();
    const options = { title: 'Choose a Blunderwise backup', properties: ['openFile' as const], filters: [{ name: 'Blunderwise backup', extensions: ['json'] }] };
    const r = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    const file = r.filePaths[0];
    if (r.canceled || !file) return null;
    const backup = parseBackup(readFileSync(file, 'utf8')); // throws a readable error for a wrong or damaged file
    // Protect what is already there before merging.
    mkdirSync(backupDir, { recursive: true });
    store.backupTo(path.join(backupDir, `pre-import-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}.sqlite`));
    return store.importBackup(backup);
  });
  ipcMain.handle(IPC.dataOpenFolder, async () => {
    await shell.openPath(dataDir);
  });
  ipcMain.handle(IPC.prefetch, (_e, fen: string) => coach.prefetch(fen));
  ipcMain.handle(IPC.checkMove, (_e, req: MoveCheckRequest) => coach.checkMove(req));
  ipcMain.handle(IPC.narrate, (_e, ctx: MistakeContext) => coach.narrate(ctx));
  ipcMain.handle(IPC.threat, (_e, fen: string) => coach.threat(fen));
  ipcMain.handle(IPC.openingTrack, (_e, fens: string[]) => trackOpening(fens));
  ipcMain.handle(IPC.openingFamilies, () => [...bookFamilies()]);
  ipcMain.handle(IPC.openingReport, () => store.openingReport());
  ipcMain.handle(IPC.cached, (_e, ctx: MistakeContext) => coach.cached(ctx));
  ipcMain.handle(IPC.hint, async (_e, fen: string) => (await coach.analyzeFen(fen)).bestMove);
  ipcMain.handle(IPC.gamesSave, (_e, req: SaveGameRequest) => {
    const id = store.saveGame(req);
    library.analyzeInBackground(id); // feeds the report and drills
    return id;
  });
  ipcMain.handle(IPC.importLichess, (_e, username: string, max: number) => {
    settings.set({ lichessUsername: username });
    return library.importLichess(username, max);
  });
  ipcMain.handle(IPC.importChessCom, (_e, username: string, max: number) => {
    settings.set({ chesscomUsername: username });
    return library.importChessCom(username, max);
  });
  ipcMain.handle(IPC.analyzeAll, (e) => library.analyzeAll((p) => e.sender.send(IPC.libraryProgress, p)));
  ipcMain.handle(IPC.analyzeGame, (_e, id: number) => library.analyzeGame(id));
  ipcMain.handle(IPC.report, () => store.report());
  ipcMain.handle(IPC.drillsDue, (_e, filter: DrillFilter, limit: number) => store.dueDrills(Date.now(), filter, limit));
  ipcMain.handle(IPC.drillsCounts, () => store.drillCounts(Date.now()));
  ipcMain.handle(IPC.drillsAnswer, (_e, id: number, uci: string) => library.answerDrill(id, uci));
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
