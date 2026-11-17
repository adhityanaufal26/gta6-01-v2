// Palmera Bay — world renderer: the city itself, cars, people, effects.
// One job: paint the top-down city from the camera. No game logic here.

import { VIEW_W, VIEW_H, WORLD_W, WORLD_H, PALETTE, ROADS_X, ROADS_Y, ROAD_W, DISTRICTS } from './config.js';
import { districtAt } from './city.js';

export function drawWorld(ctx, state, cam) {
  const { city } = state;
  const x0 = cam.x - VIEW_W / 2, y0 = cam.y - VIEW_H / 2;
  ctx.save();
  ctx.translate(-x0, -y0);
  // Ground: grass, then the beach strip and the sea at the south edge.
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(x0 - 40, y0 - 40, VIEW_W + 80, VIEW_H + 80);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(x0 - 40, 2280, VIEW_W + 80, 320);
  ctx.fillStyle = PALETTE.water;
  ctx.fillRect(x0 - 40, 2480, VIEW_W + 80, 160);
  ctx.fillStyle = PALETTE.waterDeep;
  for (let i = 0; i < 8; i++) {
    const wx = ((i * 430 + 120) % (WORLD_W + 200)) - 100;
    ctx.fillRect(wx, 2520 + (i % 3) * 22, 180, 5);
  }
  // Park block.
  ctx.fillStyle = PALETTE.park;
  ctx.fillRect(1150, 1500, 900, 420);
  ctx.fillStyle = '#e8e0cc';
  ctx.fillRect(1150, 1690, 900, 40);
  // District tint labels on the ground.
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px system-ui, sans-serif';
  for (const d of DISTRICTS) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(d.name, d.x + d.w / 2, d.y + d.h / 2);
  }
  // Roads: asphalt, sidewalk border, dashed centre lines.
  for (const rx of ROADS_X) {
    ctx.fillStyle = PALETTE.sidewalk;
    ctx.fillRect(rx - ROAD_W / 2 - 8, y0 - 40, ROAD_W + 16, VIEW_H + 80);
    ctx.fillStyle = PALETTE.road;
    ctx.fillRect(rx - ROAD_W / 2, y0 - 40, ROAD_W, VIEW_H + 80);
    ctx.fillStyle = PALETTE.roadLine;
    for (let y = Math.floor((y0 - 40) / 60) * 60; y < y0 + VIEW_H + 40; y += 60) {
      ctx.fillRect(rx - 2, y, 4, 30);
    }
  }
  for (const ry of ROADS_Y) {
    ctx.fillStyle = PALETTE.sidewalk;
    ctx.fillRect(x0 - 40, ry - ROAD_W / 2 - 8, VIEW_W + 80, ROAD_W + 16);
    ctx.fillStyle = PALETTE.road;
    ctx.fillRect(x0 - 40, ry - ROAD_W / 2, VIEW_W + 80, ROAD_W);
    ctx.fillStyle = PALETTE.roadLine;
    for (let x = Math.floor((x0 - 40) / 60) * 60; x < x0 + VIEW_W + 40; x += 60) {
      ctx.fillRect(x, ry - 2, 30, 4);
    }
  }
  // Crosswalks at every junction.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const rx of ROADS_X) for (const ry of ROADS_Y) {
    for (let i = -2; i <= 2; i++) ctx.fillRect(rx - 34 + i * 14, ry - 52, 8, 104);
  }
  // Buildings with roofs, windows and height shadow.
  for (const b of city.buildings) {
    if (b.x > x0 + VIEW_W + 80 || b.x + b.w < x0 - 80 || b.y > y0 + VIEW_H + 80 || b.y + b.h < y0 - 80) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(b.x + 7, b.y + 9, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(b.x + 5, b.y + 5, b.w - 10, b.h - 10);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    const cols = Math.max(1, Math.floor(b.w / 34));
    const rows = Math.max(1, Math.floor(b.h / 34));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      ctx.fillRect(b.x + 10 + c * 34, b.y + 10 + r * 34, 18, 14);
    }
    if (b.bank) {
      ctx.fillStyle = '#1d3fae';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$ BANK $', b.x + b.w / 2, b.y + b.h / 2 + 8);
    }
    if (b.tall) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x + b.w * 0.2, b.y + b.h * 0.2, b.w * 0.6, b.h * 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${b.floors} FLOORS`, b.x + b.w / 2, b.y + 20);
    }
  }
  // Palms.
  for (const p of city.palms) {
    if (p.x < x0 - 40 || p.x > x0 + VIEW_W + 40 || p.y < y0 - 40 || p.y > y0 + VIEW_H + 40) continue;
    drawPalm(ctx, p.x, p.y);
  }
  // Props: benches and crates.
  for (const pr of city.props) {
    ctx.fillStyle = pr.kind === 'bench' ? '#8a6a3f' : '#c98a4b';
    ctx.fillRect(pr.x - 12, pr.y - 6, 24, 12);
  }
  // Mission target beacon.
  const m = state.missions && state.missions.index < 6 ? state.missions : null;
  if (state.screen === 'play' && m && state.missions.phase === 'active') {
    const mission = state.missionsList[state.missions.index];
    if (mission && mission.target) {
      const pulse = 1 + Math.sin(state.time * 0.1) * 0.15;
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mission.target.x, mission.target.y, 34 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼', mission.target.x, mission.target.y - 44);
    }
  }
  // Pickups.
  for (const pk of state.combat.pickups) {
    if (pk.taken) continue;
    const bob = Math.sin(pk.bob) * 3;
    ctx.fillStyle = pk.kind === 'cash' ? '#2fbf5a' : pk.kind === 'health' ? '#ff5a4d' : '#ffd94d';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pk.kind === 'cash' ? '$' : pk.kind === 'health' ? '+' : 'A', pk.x, pk.y + bob + 5);
  }
  // Traffic, parked cars, police, rival, enemies, pedestrians, player.
  for (const car of state.traffic.cars) drawCar(ctx, car, false);
  for (const car of state.parked) drawCar(ctx, car, false);
  if (state.missions.raceRival) drawCar(ctx, state.missions.raceRival, true);
  for (const pc of state.police.cars) drawPoliceCar(ctx, pc, state.time);
  for (const e of state.enemies) drawEnemy(ctx, e);
  for (const p of state.traffic.peds) drawPed(ctx, p);
  drawPlayer(ctx, state);
  // Bullets and particles.
  for (const b of state.combat.bullets) {
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  for (const pt of state.particles) {
    if (pt.kind === 'text') {
      ctx.fillStyle = pt.color;
      ctx.font = `bold ${pt.size}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(pt.text, pt.x, pt.y);
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * (pt.life / 20), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawCar(ctx, car, isRival) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-22, -12, 48, 28);
  ctx.fillStyle = car.color;
  roundRect(ctx, -24, -13, 48, 26, 7);
  ctx.fill();
  ctx.fillStyle = '#bfe8ff';
  ctx.fillRect(-6, -11, 14, 22);
  ctx.fillStyle = '#222';
  ctx.fillRect(-24, -13, 6, 5); ctx.fillRect(-24, 8, 6, 5);
  ctx.fillRect(18, -13, 6, 5); ctx.fillRect(18, 8, 6, 5);
  ctx.fillStyle = '#fff8c0';
  ctx.fillRect(22, -10, 3, 5); ctx.fillRect(22, 5, 3, 5);
  ctx.restore();
  if (isRival) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RICO SANDS', car.x, car.y - 26);
  }
}

export function drawPoliceCar(ctx, car, time) {
  drawCar(ctx, car, false);
  const on = Math.floor(time / 12) % 2 === 0;
  ctx.fillStyle = on ? '#ff2f2f' : '#2f7fff';
  ctx.beginPath(); ctx.arc(car.x, car.y - 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = on ? '#2f7fff' : '#ff2f2f';
  ctx.beginPath(); ctx.arc(car.x, car.y + 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PATROL', car.x, car.y - 22);
}

export function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(2, 3, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(8, -4, 10, 3);
  ctx.fillRect(8, 1, 10, 3);
  ctx.restore();
  ctx.fillStyle = '#222';
  ctx.fillRect(e.x - 16, e.y - 26, 32, 5);
  ctx.fillStyle = '#ff5a4d';
  ctx.fillRect(e.x - 16, e.y - 26, 32 * Math.max(0, e.hp / e.maxHp), 5);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(e.name, e.x, e.y - 32);
}

export function drawPed(ctx, p) {
  const wob = Math.sin(p.walkPhase) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.arc(p.x + 1, p.y + 2, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y + wob * 0.3, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(p.x, p.y - 2, 4, 0, Math.PI * 2); ctx.fill();
  if (p.panic > 0) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', p.x, p.y - 16);
  }
}

export function drawPlayer(ctx, state) {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.inCar && p.car) {
    drawCar(ctx, { ...p.car, x: 0, y: 0 }, false);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', p.x, p.y - 26);
    return;
  }
  ctx.rotate(p.angle);
  // Facing arrow + body.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(2, 3, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d3fae';
  ctx.fillRect(4, -9, 12, 18);
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(2, 0, 5, 0, Math.PI * 2); ctx.fill();
  if (state.combat.swing > 0) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 26, -0.6, 0.6); ctx.stroke();
  }
  if (state.combat.muzzle > 0) {
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(24, 0, 8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Direction indicator so the player can see where they face.
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * 26, p.y + Math.sin(p.angle) * 26);
  ctx.stroke();
}

export function drawPalm(ctx, x, y) {
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 18); ctx.stroke();
  ctx.fillStyle = '#2f9e44';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(x + 3 + Math.cos(a) * 9, y - 18 + Math.sin(a) * 6, 12, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
