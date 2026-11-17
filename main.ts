// Palmera Bay — the make.fun entry program (Node 22, standard library only).
// The game lives in this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and no
// network request) — a top-down open-world crime game: a sun-soaked city to
// explore on foot and by car, traffic and pedestrians, cars to steal, a wanted
// level with Harbor Patrol chases, six story missions, combat, a HUD with a
// minimap, a title-screen manual, upgrades, feats and a localStorage save.
// This program hands it in: it copies game/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Palmera Bay's own pre-flight: refuse to hand in a broken entry instead of
// letting the gate do it — every screenshot must be a JPEG at most 256 KiB.
const shotsDir = join(here, 'screenshots');
for (const name of readdirSync(shotsDir)) {
  const p = join(shotsDir, name);
  const st = statSync(p);
  if (!st.isFile() || !/\.jpe?g$/i.test(name)) throw new Error(`bad screenshot (not a JPEG file): ${name}`);
  if (st.size > 262144) throw new Error(`screenshot over 256 KiB: ${name} (${st.size} bytes)`);
}

mkdirSync(out, { recursive: true });
// Clear the out dir's previous children (never the dir itself) so a stale
// dossier or screenshot from an earlier run cannot ride along.
for (const name of readdirSync(out)) rmSync(join(out, name), { recursive: true, force: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
