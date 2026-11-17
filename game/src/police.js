// Palmera Bay — wanted level and the Harbor Patrol.
// One job: turn crimes into heat, spawn police cars that chase and ram the
// player, and let the heat cool off when the player hides or outruns it.

import { VEHICLES, clamp, dist } from './config.js';

export const WANTED_LABELS = ['', 'SUSPECT', 'WANTED', 'DANGEROUS', 'ARMED & DANGEROUS', 'CITYWIDE MANHUNT'];

export function createPolice() {
  return { cars: [], coolTimer: 0, bustTimer: 0, sirenPhase: 0 };
}

export function addWanted(state, amount, reason) {
  const before = state.wanted;
  state.wanted = clamp(state.wanted + amount, 0, 5);
  if (state.wanted > before) {
    state.events.push({ kind: 'wanted', text: `WANTED ${'★'.repeat(state.wanted)} — ${reason}`, t: 0 });
    state.stats.crimes++;
  }
  return state.wanted;
}

export function wantedCarCount(wanted) {
  return [0, 1, 2, 3, 4, 6][wanted];
}

export function stepPolice(police, state, dt) {
  const player = state.player;
  police.sirenPhase += dt * 0.12;
  // Spawn up to the wanted level's quota, from the city edge nearest the player.
  const want = wantedCarCount(state.wanted);
  while (police.cars.length < want) {
    const a = Math.random() * Math.PI * 2;
    police.cars.push({
      x: player.x + Math.cos(a) * 620, y: player.y + Math.sin(a) * 620,
      angle: a + Math.PI, speed: 0, spec: VEHICLES[6], color: '#1d3fae',
      w: 46, h: 22, ramCooldown: 0,
    });
  }
  while (police.cars.length > want) police.cars.pop();
  // Chase: steer toward the player, faster than traffic, ramming on contact.
  for (const c of police.cars) {
    const target = Math.atan2(player.y - c.y, player.x - c.x);
    let diff = target - c.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.angle += clamp(diff, -0.06 * dt, 0.06 * dt);
    const top = 4.4 + state.wanted * 0.35;
    c.speed = Math.min(c.speed + 0.09 * dt, top);
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    c.ramCooldown -= dt;
    const d = dist(c.x, c.y, player.x, player.y);
    if (d < 42 && c.ramCooldown <= 0) {
      c.ramCooldown = 45;
      state.player.health -= state.player.inCar ? 4 : 14;
      state.particles.push({ x: player.x, y: player.y, vx: 0, vy: 0, life: 20, color: '#ffd94d', size: 14, kind: 'burst' });
      state.shake = 8;
      state.audio?.thud();
      if (state.player.inCar) {
        player.speed *= 0.4;
        // One feed line per ram, not one per frame of contact.
        const recent = state.events.some((ev) => ev.text === 'PATROL RAMMED YOU!' && ev.t < 150);
        if (!recent) state.events.push({ kind: 'hit', text: 'PATROL RAMMED YOU!', t: 0 });
      }
    }
  }
  // Heat cools when the player is far from every police car and out of sight.
  if (state.wanted > 0) {
    let nearest = Infinity;
    for (const c of police.cars) nearest = Math.min(nearest, dist(c.x, c.y, player.x, player.y));
    if (nearest > 700) {
      police.coolTimer += dt;
      if (police.coolTimer > 420) { // ~7 s hidden
        police.coolTimer = 0;
        state.wanted--;
        state.events.push({ kind: 'cool', text: `Heat cooling… wanted now ${state.wanted}★`, t: 0 });
        if (state.wanted === 0) state.events.push({ kind: 'cool', text: 'YOU LOST THE PATROL!', t: 0 });
      }
    } else {
      police.coolTimer = 0;
    }
  }
  // Busted: on foot and a police car sits on top of you.
  if (!player.inCar && state.wanted > 0) {
    let touching = false;
    for (const c of police.cars) if (dist(c.x, c.y, player.x, player.y) < 34) touching = true;
    if (touching) {
      police.bustTimer += dt;
      if (police.bustTimer > 50) { state.busted = true; police.bustTimer = 0; }
    } else police.bustTimer = 0;
  }
}
