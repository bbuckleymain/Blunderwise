/**
 * DEV-ONLY end-to-end smoke test: launches the built app, plays vs Stockfish, blunders the queen on purpose,
 * checks the coach stops the game, then reviews the game. Screenshots go to $SMOKE_OUT (default ./smoke-out).
 *   npm run build && xvfb-run -a npx tsx scripts/smoke.ts
 *   SMOKE_EXE="release/linux-unpacked/blunderwise" xvfb-run -a npx tsx scripts/smoke.ts   # packaged app
 */
import { Chess, type Square } from 'chess.js';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Board, see } from '../explain/board';

interface Loc { count(): Promise<number>; isVisible(): Promise<boolean>; click(): Promise<void>; boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>; getAttribute(n: string): Promise<string | null>; waitFor(o?: { timeout?: number; state?: string }): Promise<void>; first(): Loc }
interface Page { locator(s: string): Loc; getByText(t: string | RegExp, o?: { exact?: boolean }): Loc; getByRole(r: string, o: { name: string | RegExp }): Loc; mouse: { click(x: number, y: number): Promise<void> }; screenshot(o: { path: string }): Promise<void>; waitForTimeout(ms: number): Promise<void>; setViewportSize?(s: { width: number; height: number }): Promise<void> }
interface ElectronApp { firstWindow(): Promise<Page>; close(): Promise<void> }
interface PW { _electron: { launch(o: { executablePath: string; args: string[]; env: Record<string, string> }): Promise<ElectronApp> } }

const require = createRequire(import.meta.url);
const { _electron } = require('playwright') as PW;
const OUT = process.env.SMOKE_OUT ?? path.resolve('smoke-out');
mkdirSync(OUT, { recursive: true });

async function clickSquare(page: Page, sq: Square): Promise<void> {
  const box = await page.locator('.board:visible cg-board').boundingBox();
  if (!box) throw new Error('no board');
  const f = sq.charCodeAt(0) - 97;
  const r = Number(sq[1]) - 1;
  const size = box.width / 8;
  await page.mouse.click(box.x + (f + 0.5) * size, box.y + (7 - r + 0.5) * size);
}

async function move(page: Page, uci: string): Promise<void> {
  await clickSquare(page, uci.slice(0, 2) as Square);
  await page.waitForTimeout(120);
  await clickSquare(page, uci.slice(2, 4) as Square);
}

/** A piece move that drops the piece, if there is one. */
function queenBlunder(fen: string): string | null {
  const c = new Chess(fen);
  for (const m of c.moves({ verbose: true })) {
    if (m.piece === 'p' || m.piece === 'k' || m.captured) continue;
    const after = new Chess(fen);
    after.move(m);
    if (see(Board.fromFen(after.fen()), m.to, 'b') >= 3) return `${m.from}${m.to}`;
  }
  return null;
}

async function main(): Promise<void> {
  const app = await _electron.launch({
    executablePath: process.env.SMOKE_EXE ?? (require('electron') as unknown as string),
    args: process.env.SMOKE_EXE ? ['--no-sandbox'] : ['.', '--no-sandbox'],
    env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: '1' } as Record<string, string>,
  });
  const page = await app.firstWindow();
  await page.getByRole('button', { name: 'Start game' }).waitFor({ timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, '1-setup.png') });
  await page.getByRole('button', { name: 'Start game' }).click();

  const fenNow = async (): Promise<string> => (await page.locator('.board:visible').getAttribute('data-fen')) ?? '';
  const waitMyTurn = async (): Promise<void> => page.getByText('Your move', { exact: true }).waitFor({ timeout: 30000 });

  await waitMyTurn();
  await move(page, 'e2e4');
  await waitMyTurn();
  await move(page, 'd1h5');
  await page.waitForTimeout(300);

  const coachShown = async (): Promise<boolean> => {
    for (let t = 0; t < 300; t++) {
      if ((await page.locator('.coach-card').count()) > 0) return true;
      if ((await page.getByText('Your move', { exact: true }).count()) > 0) return false;
      await page.waitForTimeout(100);
    }
    throw new Error('neither coach card nor my turn');
  };
  let blundered = false;
  for (let i = 0; i < 8 && !blundered; i++) {
    if (await coachShown()) {
      blundered = true;
      break;
    }
    let fen = await fenNow();
    while (new Chess(fen).turn() !== 'w') {
      await page.waitForTimeout(100);
      fen = await fenNow();
    }
    const b = queenBlunder(fen);
    const c = new Chess(fen);
    const fallback = c.moves({ verbose: true }).find((m) => m.piece === 'p');
    const uci = b ?? (fallback ? `${fallback.from}${fallback.to}` : null);
    if (!uci) throw new Error('no move');
    console.log(`move ${i}: ${uci}${b ? ' (blunder)' : ''}`);
    await move(page, uci);
    await page.waitForTimeout(400);
  }
  if (!blundered) blundered = await coachShown();
  if (!blundered) throw new Error('could not find a blunder');

  await page.locator('.coach-card').waitFor({ timeout: 30000 });
  await page.screenshot({ path: path.join(OUT, '2-coach-hint.png') });
  await page.getByRole('button', { name: 'Show best move' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '3-coach-revealed.png') });
  const blunderFen = await fenNow();
  await page.getByRole('button', { name: 'Take back' }).click();
  await waitMyTurn();
  if ((await fenNow()) === blunderFen) throw new Error('take back did not undo the move');
  console.log('take back OK');
  // Play the same blunder again and keep it this time.
  const again = queenBlunder(await fenNow());
  if (!again) throw new Error('blunder not reproducible');
  await move(page, again);
  await page.locator('.coach-card').waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play on' }).click();
  await waitMyTurn();
  console.log('play on OK');
  await page.getByRole('button', { name: 'Resign' }).click();
  await page.getByRole('button', { name: 'Review game' }).click();
  await page.locator('.mistake-item').first().waitFor({ timeout: 60000 });
  await page.locator('.mistake-item').first().click();
  await page.waitForTimeout(800);
  const reviewFen = await fenNow();
  if (reviewFen === new Chess().fen()) throw new Error('review did not jump to the mistake');
  await page.locator('.review-card, .coach-card').first().waitFor({ timeout: 10000 });
  await page.screenshot({ path: path.join(OUT, '4-review.png') });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '5-settings.png') });
  await app.close();
  console.log(`SMOKE OK, screenshots in ${OUT}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
