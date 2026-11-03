# Blunderwise

A desktop chess coach for Linux (built for CachyOS / Arch). You play a bot, and when you blunder the
coach stops the game, shows you what goes wrong, and explains **why** in plain English. You can take the
move back and find a better one, see the best move, or play on.

How it explains: Stockfish finds the mistake and the lines, pure-TypeScript detectors work out the
tactic (hanging piece, fork, pin, skewer, discovered attack, back rank, mate, trapped piece, overloaded
defender, missed promotion, king safety), and Gemini only puts those verified facts into words. A
validator rejects any Gemini answer that mentions a move, square or piece that isn't in the facts,
or claims a tactic the detectors didn't find, and falls back to a built-in template.

## Install on CachyOS

Stockfish is in the AUR (not the official repos). CachyOS ships the `paru` AUR helper:

```bash
paru -S stockfish
```

```bash
sudo pacman -U release/blunderwise-0.1.0.pacman
```

Then start **Blunderwise** from your app menu (or run `blunderwise`).

If you'd rather use the official prebuilt Stockfish (stockfishchess.org → Linux → AVX2), copy it to
`/usr/local/bin/stockfish` and install with
`sudo pacman -U --assume-installed stockfish release/blunderwise-0.1.0.pacman`.

### Build the package yourself

Needs Node.js 22+ (`sudo pacman -S nodejs npm`).

```bash
npm install
```

```bash
npm run dist
```

The package lands in `release/`.

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
- **Games → Review**: every saved game, analysed with a progress bar. ←/→ step through moves, ↑/↓ jump between
  mistakes, Home/End. Clicking a mistake shows the arrows and the coach card.

Analyses and Gemini explanations are cached in `~/.config/Blunderwise/blunderwise.sqlite`.

## Development

```bash
npm install
```

```bash
npm run dev          # Vite + Electron with hot reload for the UI
```

```bash
npm test             # 211 unit tests (detectors, validator, pipeline, engines)
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
