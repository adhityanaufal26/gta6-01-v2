# Palmera Bay — an open-world crime game (gta6-01 entry)

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/adhityanaufal26/gta6-01-v2/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/adhityanaufal26/gta6-01-v2/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

A complete open-world crime game, written from scratch for [make.fun's "Make GTA 6" bounty](https://make.fun/bounty/gta6-01) ($1,666 in USDC). The city of Palmera Bay, its characters, vehicles, story, art and sound are all original — no names, characters, maps, music or assets from any commercial game.

## Play

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No network requests, no build step.

```
node serve.ts   # then open http://localhost:8080
```

## The game

- **A city on foot and by car** — Palmera Bay has six districts (Downtown, Marina, Old Town, The Hills, The Port, Palm Park), plus a beach, a park, and a road grid busy with traffic and pedestrians.
- **Steal cars** — walk up to any parked car and press **E**. Seven vehicles in total, from the Sunset Taxi to the Comet GT.
- **Wanted level + police** — committing crimes raises a 1–5 star wanted level; Harbor Patrol interceptors chase, ram and try to bust you. Hide or outrun them to cool off.
- **Missions + story** — six story jobs from fixer Mara Voss and Big Tuna: First Wheels, Delivery Run, Debt Collector, Hot Pursuit, The Bank Job, and a race against rival driver Rico Sands for King of the Bay. Each one pays cash and offers a 1-of-3 upgrade pick (vest, tuned engine, extended mag).
- **Combat** — punch (**F**) or shoot (mouse click), with ammo, health and pickups scattered around the city.
- **HUD + minimap** — cash, score, health, ammo, wanted stars, a mission tracker with distance, a live minimap, an event feed and a speedometer.
- **Start + save** — the title screen is a one-screen game manual (goal, controls, crew, vehicles, factions, best score, feats, last runs); progress persists in localStorage.
- **Polish** — synthesized WebAudio (engine hum, two-tone sirens, shots, pickups, a bassline loop), particles, screen shake, and day-bright sun-soaked art.

## Controls

WASD / arrows — move or drive · E — steal / exit car · F — punch ·
Click — shoot · M — start mission · 1/2/3 — pick upgrade · P — pause ·
0 — mute · Shift — sprint

## Source layout

```
game/
  index.html        page + canvas
  src/
    config.js       constants, districts, vehicles, characters, missions
    city.js         city generation + collision
    traffic.js      traffic cars + pedestrians + parked cars
    police.js       wanted level + Harbor Patrol chases
    missions.js     the six-job story arc + upgrades + feats
    combat.js       punching, shooting, enemies, pickups
    audio.js        synthesized WebAudio sounds + music
    save.js         localStorage save (best score, feats, last runs)
    input.js        keyboard + mouse
    render.js       the top-down city, cars, people, effects
    hud.js          HUD, minimap, title / pause / results screens
    shots.js        deterministic staged states for screenshots
    main.js         game state, loop, player movement, driving
```

The screenshots are real renders of the game's own code in headless Chromium (`tools/shots.py`): a police chase, the title manual, a mission-complete upgrade pick, and the S-grade results screen.

## License

MIT — see LICENSE.
