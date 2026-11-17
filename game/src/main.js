// Palmera Bay — boot, game loop and the player.
// One job: own the game state, run the fixed-step loop, move the player on
// foot and behind the wheel, switch screens, and hand drawing to render/hud.

import { VIEW_W, VIEW_H, WORLD_W, WORLD_H, MISSIONS, SAVE_KEY, clamp, dist, mulberry32 } from './config.js';
import { buildCity, collideBuildings, onRoad, districtAt } from './city.js';
import { createTraffic, stepTraffic, spawnParkedCars } from './traffic.js';
import { createPolice, addWanted, stepPolice } from './police.js';
import { createMissionState, startMission, advanceMissions, applyUpgrade, unlockFeat } from './missions.js';
import { createCombat, spawnPickups, punch, shoot, stepCombat } from './combat.js';
import { createAudio } from './audio.js';
import { loadSave, storeSave, recordRun } from './save.js';
import { createInput } from './input.js';
import { drawWorld } from './render.js';
import { drawHUD, drawTitle, drawPause, drawResults } from './hud.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot');

function createState() {
  const save = loadSave();
  const state = {
    screen: 'title', // title | play | pause | results
    time: 0, seed,
    save,
    city: buildCity(seed),
    missionsList: MISSIONS,
    missions: createMissionState(),
    police: createPolice(),
    combat: createCombat(),
    audio: createAudio(),
    traffic: null,
    parked: [],
    enemies: [],
    particles: [],
    events: [],
    player: {
      x: 1500, y: 1300, angle: -Math.PI / 2, speed: 0,
      health: 100, maxHealth: 100, ammo: 60, inCar: false, car: null,
      engineBoost: 0, fireRate: 20,
    },
    cam: { x: 1500, y: 1300 },
    cash: 0, score: 0, wanted: 0,
    stats: { missions: 0, carsStolen: 0, escapes: 0, kos: 0, earned: 0, crimes: 0, feats: 0 },
    busted: false, allMissionsDone: false,
    results: null, shake: 0, playTime: 0, topSpeed: 0,
    muted: save.muted,
  };
  state.traffic = createTraffic(seed, state.city);
  state.parked = spawnParkedCars(seed);
  spawnPickups(state);
  return state;
}

let state = createState();
const input = createInput(canvas);

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

function announce(text) { statusEl.textContent = text; }

function stealNearestCar() {
  const p = state.player;
  let best = null; let bd = 70;
  for (const car of state.parked) {
    const d = dist(p.x, p.y, car.x, car.y);
    if (d < bd) { bd = d; best = car; }
  }
  if (!best) return false;
  state.parked = state.parked.filter((c) => c !== best);
  p.inCar = true;
  p.car = { ...best, speed: 0 };
  p.x = best.x; p.y = best.y; p.angle = best.angle; p.speed = 0;
  state.stats.carsStolen++;
  state.score += 50;
  addWanted(state, 1, 'car theft');
  state.audio.thud();
  state.events.push({ kind: 'pickup', text: `Stole the ${best.spec.name}!`, t: 0 });
  announce(`Stole a ${best.spec.name}`);
  return true;
}

function exitCar() {
  const p = state.player;
  p.inCar = false;
  p.x += Math.cos(p.angle + Math.PI / 2) * 34;
  p.y += Math.sin(p.angle + Math.PI / 2) * 34;
  p.speed = 0;
  state.parked.push({ ...p.car, x: p.x - Math.cos(p.angle + Math.PI / 2) * 34, y: p.y - Math.sin(p.angle + Math.PI / 2) * 34, parked: true });
  p.car = null;
}

function stepPlayer(dt) {
  const p = state.player;
  const ax = input.axis();
  if (p.inCar) {
    // Arcade driving: W/S throttle, A/D steer (steering scales with speed).
    const car = p.car;
    const top = car.spec.top * (1 + (p.engineBoost || 0));
    if (ax.y < 0) p.speed = Math.min(p.speed + car.spec.accel * dt, top);
    else if (ax.y > 0) p.speed = Math.max(p.speed - car.spec.accel * 0.8 * dt, -2.2);
    else p.speed *= Math.pow(0.985, dt);
    const steer = ax.x * 0.045 * dt * clamp(Math.abs(p.speed) / 2.5, 0, 1) * (p.speed < 0 ? -1 : 1);
    p.angle += steer;
    car.angle = p.angle;
    const nx = p.x + Math.cos(p.angle) * p.speed * dt;
    const ny = p.y + Math.sin(p.angle) * p.speed * dt;
    const hit = collideBuildings(state.city, nx, ny, 22);
    if (hit) {
      p.speed *= -0.35;
      state.shake = 6;
      state.audio.thud();
    } else {
      p.x = clamp(nx, 40, WORLD_W - 40);
      p.y = clamp(ny, 40, WORLD_H - 40);
    }
    car.x = p.x; car.y = p.y;
    state.topSpeed = Math.max(state.topSpeed, Math.round(Math.abs(p.speed) * 28));
    if (Math.abs(p.speed) * 28 > 140 && !state.save.feats.includes('speedster')) unlockFeat(state, 'speedster');
    // Hitting a pedestrian at speed is a crime.
    for (const ped of state.traffic.peds) {
      if (dist(p.x, p.y, ped.x, ped.y) < 26 && Math.abs(p.speed) > 2) {
        ped.panic = 80;
        ped.x += Math.cos(p.angle) * 40; ped.y += Math.sin(p.angle) * 40;
        if (!ped.counted) { ped.counted = true; addWanted(state, 1, 'hit and run'); }
      }
    }
    state.audio.setEngine(Math.abs(p.speed) / top, true);
  } else {
    const sprint = input.down('Shift') ? 1.7 : 1;
    const sp = 2.6 * sprint;
    let mx = ax.x, my = ax.y;
    const len = Math.hypot(mx, my);
    if (len > 0) { mx /= len; my /= len; p.angle = Math.atan2(my, mx); }
    const nx = p.x + mx * sp * dt;
    const ny = p.y + my * sp * dt;
    if (!collideBuildings(state.city, nx, p.y, 12)) p.x = clamp(nx, 40, WORLD_W - 40);
    if (!collideBuildings(state.city, p.x, ny, 12)) p.y = clamp(ny, 40, WORLD_H - 40);
    p.speed = len > 0 ? sp : 0;
    state.audio.setEngine(0, false);
  }
}

function step(dt) {
  state.time += dt;
  if (state.screen !== 'play') return;
  state.playTime += dt;
  // Particles.
  for (const pt of state.particles) {
    pt.life -= dt;
    pt.x += (pt.vx || 0) * dt;
    pt.y += (pt.vy || 0) * dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);
  for (const ev of state.events) ev.t += dt;
  state.events = state.events.filter((ev) => ev.t < 300);
  if (state.missions.banner) {
    state.missions.banner.t -= dt;
    if (state.missions.banner.t <= 0) state.missions.banner = null;
  }
  stepPlayer(dt);
  stepTraffic(state.traffic, dt, state.player, state.city);
  stepPolice(state.police, state, dt);
  stepCombat(state, dt);
  advanceMissions(state, dt);
  // Rival racer drives to the Marina.
  const rival = state.missions.raceRival;
  if (rival && state.missions.index === 5 && state.missions.phase === 'active') {
    const a = Math.atan2(rival.target.y - rival.y, rival.target.x - rival.x);
    let diff = a - rival.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    rival.angle += clamp(diff, -0.05 * dt, 0.05 * dt);
    rival.speed = Math.min(rival.speed + 0.1 * dt, 4.6);
    rival.x += Math.cos(rival.angle) * rival.speed * dt;
    rival.y += Math.sin(rival.angle) * rival.speed * dt;
  }
  // Camera follows the player with a little shake on impacts.
  state.shake = Math.max(0, state.shake - dt * 0.4);
  const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  state.cam.x = clamp(state.player.x + sx, VIEW_W / 2 - 200, WORLD_W - VIEW_W / 2 + 200);
  state.cam.y = clamp(state.player.y + sy, VIEW_H / 2 - 200, WORLD_H - VIEW_H / 2 + 200);
  state.audio.setSiren(state.wanted, state.time / 60);
  // Health regen slowly on foot when not wanted.
  if (!state.player.inCar && state.wanted === 0) state.player.health = Math.min(state.player.maxHealth, state.player.health + 0.02 * dt);
  if (state.player.health <= 0) endRun('WASTED', 'Leo is down. The bay keeps its secrets.');
  if (state.busted) {
    state.audio.busted();
    endRun('BUSTED', 'The Harbor Patrol got you. Bail is $500.');
  }
  if (state.allMissionsDone && state.screen === 'play') {
    endRun('KING OF THE BAY!', 'All 6 missions done — the city is yours, Leo.');
  }
}

function endRun(title, subtitle) {
  const mins = Math.floor(state.playTime / 3600);
  const secs = Math.floor((state.playTime / 60) % 60);
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const grade = state.missions.done.length >= 6 ? 'S' : state.missions.done.length >= 4 ? 'A' : state.missions.done.length >= 2 ? 'B' : 'C';
  const run = {
    score: state.score, cash: state.cash, missions: state.missions.done.length,
    time: timeStr, result: title.includes('KING') ? 'WON' : 'LOST',
  };
  const wasBest = state.score > state.save.bestScore;
  recordRun(state.save, run);
  if (state.busted) state.cash = Math.max(0, state.cash - 500);
  state.results = {
    title, subtitle, grade, score: state.score, newBest: wasBest && state.score > 0,
    missions: state.missions.done.length, carsStolen: state.stats.carsStolen,
    escapes: state.stats.escapes, kos: state.stats.kos, earned: state.stats.earned,
    time: timeStr, topSpeed: state.topSpeed, feats: state.save.feats.length,
    missionNames: MISSIONS.filter((m) => state.missions.done.includes(m.id)).map((m) => m.name),
  };
  state.screen = 'results';
  state.busted = false;
}

function handleKeys() {
  if (input.wasPressed('Enter')) {
    state.audio.unlock();
    state.audio.startMusic();
    if (state.screen === 'title') {
      state.screen = 'play';
      announce('Palmera Bay. Press M for your first mission.');
    } else if (state.screen === 'results') {
      state = createState();
      state.screen = 'play';
    }
  }
  if (input.wasPressed('p') || input.wasPressed('P')) {
    if (state.screen === 'play') state.screen = 'pause';
    else if (state.screen === 'pause') state.screen = 'play';
  }
  if (input.wasPressed('0')) {
    state.audio.toggleMute();
    state.save.muted = !state.save.muted;
    storeSave(state.save);
  }
  if (state.screen === 'play') {
    if (input.wasPressed('e') || input.wasPressed('E')) {
      if (state.player.inCar) exitCar();
      else stealNearestCar();
    }
    if (input.wasPressed('f') || input.wasPressed('F')) punch(state);
    // M starts the current mission when it is only briefed.
    if (input.wasPressed('m') || input.wasPressed('M')) {
      if (state.missions.phase === 'brief') startMission(state);
    }
    if (state.missions.phase === 'upgrade') {
      if (input.wasPressed('1')) applyUpgrade(state, '1');
      if (input.wasPressed('2')) applyUpgrade(state, '2');
      if (input.wasPressed('3')) applyUpgrade(state, '3');
    }
    const mouse = input.mouse();
    if (mouse.clicked && !state.player.inCar) {
      const cam = state.cam;
      const wx = mouse.x + cam.x - VIEW_W / 2;
      const wy = mouse.y + cam.y - VIEW_H / 2;
      shoot(state, wx, wy);
    }
  }
  if (state.screen === 'pause' && input.wasPressed('r')) {
    state = createState();
    state.screen = 'play';
  }
  if (state.screen === 'results' && input.wasPressed('r')) {
    state = createState();
    state.screen = 'play';
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = 1; // fixed 1/60 s step, matching step() units
  handleKeys();
  step(dt);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === 'title') {
    drawTitle(ctx, state);
  } else if (state.screen === 'results') {
    drawResults(ctx, state);
  } else {
    drawWorld(ctx, state, state.cam);
    drawHUD(ctx, state);
    if (state.screen === 'pause') drawPause(ctx, state);
  }
  input.endFrame();
}

// Staged screenshot states render from the real game, then freeze on a
// deterministic frame so the capture is identical every run.
if (shot) {
  applyShot(state, shot);
  // Advance the world a few frames so traffic/police settle into the scene.
  // The chase stays mid-pursuit: few steps, so the patrol is closing in
  // rather than already piled onto the player's car.
  const settleSteps = shot === 'chase' ? 8 : shot === 'mission' ? 30 : 0;
  for (let i = 0; i < settleSteps; i++) step(1);
  if (shot === 'title' || shot === 'results') {
    // Title/results are pure screens; draw once immediately.
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (shot === 'title') drawTitle(ctx, state);
    else drawResults(ctx, state);
  } else {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawWorld(ctx, state, state.cam);
    drawHUD(ctx, state);
  }
  window.__palmeraReady = true;
} else {
  requestAnimationFrame(frame);
}
