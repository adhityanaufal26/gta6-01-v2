// Palmera Bay — staged screenshot states.
// One job: put the real game into a deterministic, dense scene for each
// screenshot (?shot=chase|title|mission|results). These are real renders of
// the game's own code, never mocks: the world, traffic, police and HUD all
// run normally from the staged state.

import { MISSIONS } from './config.js';

export function applyShot(state, shot) {
  if (shot === 'title') {
    state.screen = 'title';
    return;
  }
  if (shot === 'results') {
    state.results = {
      title: 'KING OF THE BAY!', subtitle: 'All 6 missions done — the city is yours, Leo.',
      grade: 'S', score: 48250, newBest: true,
      missions: 6, carsStolen: 11, escapes: 4, kos: 9,
      earned: 6250, time: '18:42', topSpeed: 148, feats: 5,
      missionNames: MISSIONS.map((m) => m.name),
    };
    state.screen = 'results';
    return;
  }
  if (shot === 'mission') {
    state.screen = 'play';
    state.missions.index = 2;
    state.missions.phase = 'upgrade';
    state.missions.done = [1, 2];
    state.missions.banner = { title: 'MISSION COMPLETE — DELIVERY RUN', sub: '+$400  •  Pick an upgrade (press 1 / 2 / 3)', t: 9999 };
    state.cash = 1650;
    state.score = 12400;
    state.player.x = 550; state.player.y = 800;
    state.enemies = [
      { x: 520, y: 740, hp: 40, maxHp: 60, speed: 1.1, angle: 0, name: 'Deadbeat Lou', color: '#8a5a2f', kind: 'thug', attack: 0 },
      { x: 610, y: 850, hp: 60, maxHp: 60, speed: 1.1, angle: 0, name: 'Deadbeat Sal', color: '#5a6b8a', kind: 'thug', attack: 0 },
    ];
    state.wanted = 1;
    state.events.push({ kind: 'feat', text: 'MISSION 3: DEBT COLLECTOR — Old Town', t: 0 });
    return;
  }
  // Default cover: 'chase' — mid police chase in a stolen Comet GT.
  state.screen = 'play';
  state.missions.index = 1;
  state.missions.phase = 'active';
  state.missions.done = [1];
  state.missions.banner = { title: 'MISSION 2: DELIVERY RUN', sub: 'Drive the package to The Port — fast. No police.', t: 9999 };
  state.cash = 1250;
  state.score = 9850;
  state.wanted = 3;
  const spec = { name: 'Comet GT', color: '#e83a3a', top: 5.6, accel: 0.16 };
  state.player.x = 1500; state.player.y = 950;
  state.player.angle = 0;
  state.player.health = 100;
  state.player.inCar = true;
  state.player.speed = 4.8;
  state.player.car = { x: 1500, y: 950, angle: 0, speed: 4.8, spec, color: spec.color, w: 46, h: 22 };
  state.stats.carsStolen = 4;
  state.police.cars = [
    { x: 1290, y: 920, angle: 0.1, speed: 4.4, spec: { name: 'Patrol Interceptor', color: '#1d3fae', top: 6, accel: 0.18 }, color: '#1d3fae', w: 46, h: 22, ramCooldown: 0 },
    { x: 1340, y: 1030, angle: -0.2, speed: 4.4, spec: { name: 'Patrol Interceptor', color: '#1d3fae', top: 6, accel: 0.18 }, color: '#1d3fae', w: 46, h: 22, ramCooldown: 0 },
    { x: 1700, y: 880, angle: 2.9, speed: 4.2, spec: { name: 'Patrol Interceptor', color: '#1d3fae', top: 6, accel: 0.18 }, color: '#1d3fae', w: 46, h: 22, ramCooldown: 0 },
  ];
  state.events.push({ kind: 'wanted', text: 'WANTED ★★★ — stolen Comet GT', t: 0 });
  state.events.push({ kind: 'hit', text: 'PATROL RAMMED YOU!', t: 0 });
}
