// Palmera Bay — combat on foot: fists, pistol, enemies and pickups.
// One job: punches, shots, enemy AI, health/ammo pickups and the particles
// and floating text that make a hit feel like a hit.

import { dist, clamp } from './config.js';

export function createCombat() {
  return { bullets: [], pickups: [], swing: 0, muzzle: 0 };
}

export function spawnPickups(state) {
  // Cash, health and ammo scattered at fixed spots around the city.
  const spots = [
    { x: 700, y: 600, kind: 'cash' }, { x: 1900, y: 1300, kind: 'cash' },
    { x: 1100, y: 1650, kind: 'cash' }, { x: 2700, y: 950, kind: 'cash' },
    { x: 1500, y: 2000, kind: 'cash' }, { x: 300, y: 1650, kind: 'health' },
    { x: 2300, y: 600, kind: 'health' }, { x: 900, y: 1300, kind: 'ammo' },
    { x: 2700, y: 2000, kind: 'ammo' }, { x: 1700, y: 250, kind: 'ammo' },
  ];
  state.combat.pickups = spots.map((s) => ({ ...s, taken: false, bob: Math.random() * 6 }));
}

export function punch(state) {
  const p = state.player;
  if (p.inCar || state.combat.swing > 0) return;
  state.combat.swing = 14;
  state.audio?.swing();
  const reach = 46;
  const px = p.x + Math.cos(p.angle) * reach;
  const py = p.y + Math.sin(p.angle) * reach;
  for (const e of state.enemies) {
    if (dist(px, py, e.x, e.y) < 30) {
      damageEnemy(state, e, 25, 'PUNCH!');
    }
  }
  // Punching a pedestrian is a crime, obviously.
  for (const ped of state.traffic.peds) {
    if (dist(px, py, ped.x, ped.y) < 26) {
      ped.panic = 60;
      state.wanted = Math.min(5, state.wanted + 1);
      state.events.push({ kind: 'wanted', text: 'WANTED ★ — assault', t: 0 });
    }
  }
}

export function shoot(state, tx, ty) {
  const p = state.player;
  if (p.inCar || p.ammo <= 0 || state.combat.muzzle > 0) return;
  p.ammo--;
  state.combat.muzzle = 6;
  state.audio?.shot();
  const a = Math.atan2(ty - p.y, tx - p.x);
  p.angle = a;
  state.combat.bullets.push({
    x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22,
    vx: Math.cos(a) * 14, vy: Math.sin(a) * 14, life: 40,
  });
  state.wanted = Math.min(5, state.wanted + 1);
  state.events.push({ kind: 'wanted', text: 'WANTED ★ — shots fired', t: 0 });
}

export function damageEnemy(state, e, dmg, label) {
  e.hp -= dmg;
  state.particles.push({ x: e.x, y: e.y - 10, vx: 0, vy: -0.8, life: 30, color: '#ffffff', size: 13, kind: 'text', text: label });
  state.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: 14, color: '#ff5a4d', size: 10, kind: 'burst' });
  if (e.hp <= 0) {
    e.dead = true;
    state.stats.kos++;
    state.score += 100;
    state.cash += 50;
    state.particles.push({ x: e.x, y: e.y - 10, vx: 0, vy: -0.8, life: 40, color: '#ffd94d', size: 15, kind: 'text', text: '+$50' });
    if (state.stats.kos >= 5) {
      if (!state.save.feats.includes('brawler')) {
        state.save.feats.push('brawler');
        state.events.push({ kind: 'feat', text: 'FEAT UNLOCKED: BRAWLER', t: 0 });
      }
    }
    if (state.missions.index === 2 && state.missions.phase === 'active') {
      state.missions.progress++;
    }
  }
}

export function stepCombat(state, dt) {
  const c = state.combat;
  c.swing = Math.max(0, c.swing - dt);
  c.muzzle = Math.max(0, c.muzzle - dt);
  // Bullets fly, hit enemies, walls and police cars.
  for (const b of c.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of state.enemies) {
      if (!e.dead && dist(b.x, b.y, e.x, e.y) < 22) {
        damageEnemy(state, e, 34, 'HIT!');
        b.life = 0;
      }
    }
    for (const pc of state.police.cars) {
      if (dist(b.x, b.y, pc.x, pc.y) < 26) {
        b.life = 0;
        state.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 12, color: '#ffd94d', size: 9, kind: 'burst' });
      }
    }
  }
  c.bullets = c.bullets.filter((b) => b.life > 0);
  state.enemies = state.enemies.filter((e) => !e.dead);
  // Enemy AI: walk at the player, swing when close.
  const p = state.player;
  for (const e of state.enemies) {
    const d = dist(e.x, e.y, p.x, p.y);
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    e.angle = a;
    if (d > 30) { e.x += Math.cos(a) * e.speed * dt; e.y += Math.sin(a) * e.speed * dt; }
    e.attack -= dt;
    if (d < 34 && e.attack <= 0) {
      e.attack = 55;
      p.health -= 8;
      state.shake = 5;
      state.audio?.thud();
      state.particles.push({ x: p.x, y: p.y - 14, vx: 0, vy: -0.8, life: 26, color: '#ff5a4d', size: 13, kind: 'text', text: '-8' });
    }
  }
  // Pickups.
  for (const pk of c.pickups) {
    if (pk.taken) continue;
    pk.bob += dt * 0.1;
    if (dist(p.x, p.y, pk.x, pk.y) < 30) {
      pk.taken = true;
      if (pk.kind === 'cash') { state.cash += 100; state.score += 100; state.events.push({ kind: 'pickup', text: '+$100 street cash', t: 0 }); }
      if (pk.kind === 'health') { p.health = Math.min(p.maxHealth, p.health + 40); state.events.push({ kind: 'pickup', text: '+40 health', t: 0 }); }
      if (pk.kind === 'ammo') { p.ammo += 30; state.events.push({ kind: 'pickup', text: '+30 ammo', t: 0 }); }
      state.audio?.pickup();
    }
  }
}
