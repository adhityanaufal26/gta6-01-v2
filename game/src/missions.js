// Palmera Bay — story missions, objectives and progression.
// One job: the six-job story arc. Each mission knows its giver, pay, target
// and win condition; advance() checks it every step and pays out.

import { MISSIONS, UPGRADES, dist } from './config.js';

export function createMissionState() {
  return {
    index: 0, // current mission in MISSIONS
    done: [], // completed mission ids
    phase: 'brief', // brief | active | complete | upgrade
    progress: 0, // mission-specific counter (deadbeats dealt with, etc.)
    banner: null, // { title, sub, t } big on-screen callout
    choice: null, // upgrade pick after a mission
    enemiesSpawned: false,
    raceRival: null,
  };
}

export function currentMission(ms) {
  return MISSIONS[ms.index] ?? null;
}

export function startMission(state) {
  const m = currentMission(state.missions);
  if (!m) return;
  state.missions.phase = 'active';
  state.missions.banner = { title: `MISSION ${m.id}: ${m.name.toUpperCase()}`, sub: `${m.giver} — ${m.brief}`, t: 240 };
  state.audio?.mission();
  if (m.id === 3) spawnDeadbeats(state);
  if (m.id === 6) spawnRival(state);
}

export function spawnDeadbeats(state) {
  state.enemies = [
    { x: 520, y: 780, hp: 60, maxHp: 60, speed: 1.1, angle: 0, name: 'Deadbeat Lou', color: '#8a5a2f', kind: 'thug', attack: 0 },
    { x: 600, y: 850, hp: 60, maxHp: 60, speed: 1.1, angle: 0, name: 'Deadbeat Sal', color: '#5a6b8a', kind: 'thug', attack: 0 },
  ];
  state.missions.enemiesSpawned = true;
}

export function spawnRival(state) {
  state.missions.raceRival = {
    x: state.player.x + 60, y: state.player.y, angle: 0, speed: 0,
    spec: { name: 'Comet GT', color: '#e83a3a', top: 5.4, accel: 0.15 },
    color: '#e83a3a', w: 46, h: 22, name: 'Rico Sands', target: { x: 1700, y: 2150 },
  };
}

export function advanceMissions(state, dt) {
  const ms = state.missions;
  const m = currentMission(ms);
  if (!m || ms.phase !== 'active') return;
  const p = state.player;
  if (m.id === 1) {
    if (p.inCar) completeMission(state, m);
  } else if (m.id === 2 || m.id === 5 || m.id === 6) {
    if (m.target && dist(p.x, p.y, m.target.x, m.target.y) < 90) {
      if (m.id === 5 && ms.progress === 0) {
        ms.progress = 1;
        ms.banner = { title: 'BANK ROBBED — $1,500 GRABBED', sub: 'Now lose the heat! Get 700m from every patrol car.', t: 200 };
        state.cash += 0; // pay comes on escape
        addWantedToState(state, 3, 'bank robbery');
      } else if (m.id === 5) {
        if (state.wanted === 0) completeMission(state, m);
      } else if (m.id === 6) {
        const rival = ms.raceRival;
        const rivalThere = rival && dist(rival.x, rival.y, m.target.x, m.target.y) < 90;
        if (!rivalThere) completeMission(state, m);
        else { ms.banner = { title: 'RICO BEAT YOU TO THE MARINA', sub: 'Race again — mission restarted', t: 200 }; ms.phase = 'brief'; }
      } else {
        completeMission(state, m);
      }
    }
  } else if (m.id === 3) {
    if (ms.progress >= 2) completeMission(state, m);
  } else if (m.id === 4) {
    if (state.wanted >= 2 && ms.progress === 0) {
      ms.progress = 1;
      ms.banner = { title: 'HEAT IS ON — 2 STARS', sub: 'Now lose them. Hide far from the patrol.', t: 200 };
    }
    if (ms.progress === 1 && state.wanted === 0) completeMission(state, m);
  }
}

function addWantedToState(state, amount, reason) {
  // Local import-free helper: police module owns addWanted; mirror its effect here.
  state.wanted = Math.min(5, state.wanted + amount);
  state.events.push({ kind: 'wanted', text: `WANTED ${'★'.repeat(state.wanted)} — ${reason}`, t: 0 });
  state.stats.crimes++;
}

export function completeMission(state, m) {
  const ms = state.missions;
  ms.done.push(m.id);
  state.cash += m.pay;
  state.score += m.pay * 10 + 500;
  state.stats.missions++;
  state.stats.earned += m.pay;
  ms.phase = 'upgrade';
  ms.banner = { title: `MISSION COMPLETE — ${m.name.toUpperCase()}`, sub: `+$${m.pay}  •  Pick an upgrade (press 1 / 2 / 3)`, t: 300 };
  state.audio?.win();
  state.save.feats = state.save.feats || [];
  if (m.id === 1) unlockFeat(state, 'first-car');
  if (ms.done.length === 6) unlockFeat(state, 'king');
  if (state.cash >= 5000) unlockFeat(state, 'rich');
  ms.index++;
  if (ms.index >= MISSIONS.length) {
    state.allMissionsDone = true;
  }
}

export function applyUpgrade(state, key) {
  const up = UPGRADES.find((u) => u.key === key);
  if (!up || state.missions.phase !== 'upgrade') return false;
  if (up.id === 'armor') {
    state.player.maxHealth += 50; state.player.health = state.player.maxHealth;
  } else if (up.id === 'engine') {
    state.player.engineBoost = (state.player.engineBoost || 0) + 0.25;
  } else if (up.id === 'ammo') {
    state.player.ammo += 60; state.player.fireRate = 14;
  }
  state.missions.phase = 'brief';
  state.missions.progress = 0;
  state.missions.enemiesSpawned = false;
  state.missions.banner = { title: `${up.name} INSTALLED`, sub: 'Next mission ready — press M for the brief', t: 180 };
  return true;
}

export function unlockFeat(state, id) {
  if (!state.save.feats.includes(id)) {
    state.save.feats.push(id);
    state.events.push({ kind: 'feat', text: `FEAT UNLOCKED: ${id.toUpperCase()}`, t: 0 });
    state.stats.feats = state.save.feats.length;
  }
}

export function missionObjectiveText(state) {
  const m = currentMission(state.missions);
  if (!m) return 'All missions done — free roam!';
  if (state.missions.phase === 'upgrade') return 'Pick an upgrade — press 1, 2 or 3';
  if (state.missions.phase === 'brief') return `Next: ${m.name} — press M to start`;
  return m.objective;
}
