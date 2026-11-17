# Palmera Bay — an open-world crime game (gta6-01 entry)

A complete open-world crime game, built from scratch
for make.fun's open-world bounty. Everything is original: the city of Palmera
Bay, the characters, the vehicles, the story, the art and the sound. No
names, characters, maps, music or assets from any commercial game.

## Play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network request, no build step.

```
node serve.ts   # then open http://localhost:8080
```

## The game

- **A city on foot and by car** — Palmera Bay: six districts (Downtown,
  Marina, Old Town, The Hills, The Port, Palm Park), a beach, a park, and a
  road grid full of traffic and pedestrians.
- **Steal cars** — walk up to any parked car and press **E**. Seven vehicles,
  from the Sunset Taxi to the Comet GT.
- **Wanted level + police** — crimes raise 1–5 stars; Harbor Patrol
  interceptors chase, ram and try to bust you. Hide or outrun them to cool off.
- **Missions + story** — six story jobs from fixer Mara Voss and Big Tuna:
  First Wheels, Delivery Run, Debt Collector, Hot Pursuit, The Bank Job, and
  a race against rival driver Rico Sands for King of the Bay. Each pays cash
  and offers a 1-of-3 upgrade pick (vest, tuned engine, extended mag).
- **Combat** — punch (**F**) or shoot (mouse click) with ammo, health and
  pickups scattered around the city.
- **HUD + minimap** — cash, score, health, ammo, wanted stars, mission
  tracker with distance, live minimap, event feed and speedometer.
- **Start + save** — the title screen is a one-screen game manual (goal,
  controls, crew, vehicles, factions, best score, feats, last runs); progress
  persists in localStorage.
- **Polish** — synthesized WebAudio (engine hum, two-tone sirens, shots,
  pickups, a bassline loop), particles, screen shake, day-bright sun-soaked art.

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

Screenshots are real renders of the game's own code in headless Chromium
(`tools/shots.py`): a police chase, the title manual, a mission-complete
upgrade pick, and the S-grade results screen.

## License

MIT — see LICENSE.
