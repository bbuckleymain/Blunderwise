# Blunderwise

A desktop chess coach for Linux (built for CachyOS / Arch). You play a bot, and when you blunder the
coach stops the game, shows you what goes wrong, and explains **why** in plain English. You can take the
move back and find a better one, see the best move, or play on.

How it explains: Stockfish finds the mistake and the lines, pure-TypeScript detectors work out the
tactic (hanging piece, fork, pin, skewer, discovered attack, back rank, mate, trapped piece, overloaded
defender, missed promotion, king safety), and Gemini only puts those verified facts into words. A
validator rejects any Gemini answer that mentions a move, square or piece that isn't in the facts,
or claims a tactic the detectors didn't find, and falls back to a built-in template.

## Install (Flatpak)

Blunderwise is built as a Flatpak. Stockfish is bundled inside it, so there is nothing else to install.

One-time setup on CachyOS (needs Node.js 22+ to build):

```bash
sudo pacman -S --needed flatpak flatpak-builder nodejs npm
```

```bash
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

```bash
flatpak install --user -y flathub org.freedesktop.Platform//25.08 org.freedesktop.Sdk//25.08 org.electronjs.Electron2.BaseApp//25.08
```

Build and install (from the project folder):

```bash
npm install
```

```bash
npm run dist
```

```bash
flatpak install --user -y release/*.flatpak
```

Start **Blunderwise** from your app menu, or run:

```bash
flatpak run app.blunderwise.Blunderwise
```

Notes:
- `npm run dist` downloads the official Stockfish 17.1 build for CPUs with AVX2 (any CPU that runs CachyOS's
  optimised x86-64-v3 packages has it). For an older CPU: `STOCKFISH_BUILD=x86-64-sse41-popcnt npm run fetch:stockfish -- --force`, then `npm run dist` again.
- Your data lives in `~/.var/app/app.blunderwise.Blunderwise/config/Blunderwise/`.
- Sandbox permissions: network (AI coach, game import), display/GPU, your keyring (to encrypt API keys),
  read-only access to your home folder (Maia weights) and to the system's `/usr` plus permission to start host
  programs (to run lc0 for Maia, which isn't bundled).

## AI coach key (optional but recommended)

Pick a provider in **Settings → Coach (AI explanations)**:

- **Google Gemini**: free key at https://aistudio.google.com/apikey. Default model `gemini-3.8-flash`.
- **OpenRouter (free models)**: free key at https://openrouter.ai/keys. The default model `openrouter/free`
  sends each request to one of OpenRouter's currently free models, so you pay nothing. Free models are
  limited to 50 requests a day, or 1,000 a day once you've bought $10 of credits (one time). You can also
  enter one specific free model, e.g. a model ID ending in `:free`.

Paste the key → **Save key** → **Test key** (for OpenRouter it tells you which free model answered).

Keys are encrypted with your system keyring (KWallet on KDE, GNOME Keyring on GNOME) through
Electron's `safeStorage`. If no keyring is running, the app warns you and stores the key unencrypted.
Without a key, or when the provider is down or rate-limited, you still get the template explanations
instantly. Each explanation is cached, so a blunder is only ever sent once.

## Maia opponents (human-like bots, 1100–1900)

Maia plays like humans of a given rating, so its mistakes look like real games. It runs on lc0.

```bash
paru -S lc0
```

(The Flatpak runs your system's lc0 on the host, so install it normally.)

```bash
mkdir -p ~/maia && cd ~/maia && for r in 1100 1200 1300 1400 1500 1600 1700 1800 1900; do curl -LO https://raw.githubusercontent.com/CSSLab/maia-chess/master/maia_weights/maia-$r.pb.gz; done
```

In **Settings → Engines** set the Maia weights folder to `~/maia` (full path, e.g. `/home/you/maia`)
and click **Save & restart engines**. Maia then shows up as an opponent in **Play → New game**.

## Using it

- **Play**: choose colour, Stockfish level (0–20) or a Maia rating, and play. After each of your moves the
  coach checks it (~0.1–0.5 s at depth 16). On a blunder the game pauses:
  - **Take back**: undo and look for a better move yourself (the card only hints at the threat).
  - **Show best move**: full explanation, arrows (red = yours, green = best), highlighted squares.
  - **Play on**: keep the move and continue.
  Smaller mistakes don't interrupt you; they're marked in the move list (`?!`, `?`, `??`).
  Settings → Coaching can make it stop on mistakes too.
- **Drills**: every mistake and blunder becomes a puzzle: find a better move than the one you played. Get it
  right and it comes back in 1 day, then 3, then longer; miss it and it comes back in 10 minutes. Wrong answers
  get the coach's explanation. The Report's **Drill** buttons practise one theme (e.g. only forks).
- **Games → Import**: enter your Lichess and/or Chess.com username and import your recent games, then
  **Analyse all** (runs in the background on its own Stockfish, so you can keep playing). Imported games get
  reviews, drills and count towards the report, just like games against the bot.
- **Report**: blunders/mistakes per game, what kind of tactic they were (split into ones you allowed and ones
  you missed), which game phase they happen in, and your biggest leak, with a button to drill it.
- **Games → Review**: every saved game, analysed with a progress bar. ←/→ step through moves, ↑/↓ jump between
  mistakes, Home/End. Clicking a mistake shows the arrows and the coach card.

Analyses, explanations, games and drills are stored in `blunderwise.sqlite` in the app's data folder (see above).

## Development

```bash
npm install
```

```bash
npm run dev          # Vite + Electron with hot reload for the UI
```

```bash
npm test             # unit tests (detectors, validator, pipeline, engines, importers, drills)
```

```bash
npm run typecheck
```

```bash
npm run harness      # detector precision/recall on the fixtures + sample explanations
```

```bash
OPENROUTER_API_KEY=... npm run harness   # measures the validator's rejection rate on real LLM output (or GEMINI_API_KEY=...)
```

```bash
npm run fixtures:generate             # re-derive fixture evals/lines with Stockfish (WASM)
```

### Grading the detectors on real puzzles

The 33 fixtures are what the detectors were tuned on. For an honest accuracy number, grade them on the
Lichess puzzle database (millions of real positions, each tagged with its tactic):

```bash
curl -LO https://database.lichess.org/lichess_db_puzzle.csv.zst
```

```bash
npm run eval:puzzles -- lichess_db_puzzle.csv.zst --n 1000
```

It prints recall and precision per tactic and writes `puzzle-eval.json` with links to puzzles the detectors
got wrong, ready for fixing. Options: `--depth 12 --min-rating 600 --max-rating 2000 --seed 1`.
Lichess themes aren't exhaustive, so the precision column is a lower bound.

```bash
npm run build && xvfb-run -a npx tsx scripts/smoke.ts   # end-to-end: plays a game, blunders, reviews
```

### Layout

| Folder | What |
|---|---|
| `explain/` | The explanation pipeline. Pure TS + chess.js, no Node/Electron imports. Facts builder, 13 motif detectors + `positionalLoss` fallback, narrator (`LlmClient`, Gemini adapter, copy-prompt fallback), validator, template, cache. |
| `analysis/` | Win probability, move classification, game phase. |
| `engine/` | `Engine` interface and pure UCI parsing. |
| `main/` | Electron main: UCI engine processes, engine manager (Stockfish + lc0/Maia), SQLite (`node:sqlite`), settings + `safeStorage`, coach service, IPC. |
| `preload/` | Typed `contextBridge` API (`window.coachApi`). No `nodeIntegration`, sandboxed. |
| `shared/` | IPC types shared by main and renderer. |
| `renderer/` | React + chessground UI. |
| `fixtures/` | 33 hand-written test positions (`specs.ts`) and their Stockfish-derived contexts (`fixtures.json`). |

## Known limits

- The detectors score 100% precision/recall on the 33 fixtures, but those are the positions they were tuned on.
  Expect misses and odd tags in real games; when no tactic is found the coach says the move was simply weaker
  and names the better idea instead of guessing.
- Gemini's free tier has rate limits and occasional 503s; the app falls back to templates when that happens.
- `homepage` in `package.json` is a placeholder (`YOUR_GITHUB_USER`); change it to your repo.
