// Palmera Bay — HUD, minimap and every menu screen.
// One job: everything drawn in screen space — the HUD, the minimap, the
// title-screen game manual, the upgrade choice, pause and results.

import { VIEW_W, VIEW_H, WORLD_W, WORLD_H, CHARACTERS, FACTIONS, VEHICLES, FEATS, MISSIONS, UPGRADES } from './config.js';
import { WANTED_LABELS } from './police.js';
import { districtAt } from './city.js';
import { currentMission, missionObjectiveText } from './missions.js';

export function drawHUD(ctx, state) {
  const p = state.player;
  const save = state.save;
  // Top-left: cash, score, health, ammo, district.
  ctx.fillStyle = 'rgba(10,20,32,0.72)';
  roundRect(ctx, 12, 12, 250, 108, 10); ctx.fill();
  ctx.fillStyle = '#2fbf5a';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`$${state.cash.toLocaleString()}`, 24, 44);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score.toLocaleString()}`, 24, 68);
  ctx.fillStyle = '#ff5a4d';
  ctx.fillRect(24, 78, 200 * (p.health / p.maxHealth), 10);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.strokeRect(24, 78, 200, 10);
  ctx.fillStyle = '#fff';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`HP ${Math.ceil(p.health)}/${p.maxHealth}   AMMO ${p.ammo}   ${districtAt(p.x, p.y)}`, 24, 108);
  // Wanted stars, top centre.
  ctx.fillStyle = 'rgba(10,20,32,0.72)';
  roundRect(ctx, VIEW_W / 2 - 190, 12, 380, 62, 10); ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = state.wanted > 0 ? '#ffd94d' : 'rgba(255,255,255,0.35)';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < state.wanted ? '★' : '☆';
  ctx.fillText(stars, VIEW_W / 2, 40);
  if (state.wanted > 0) {
    ctx.fillStyle = '#ff5a4d';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(WANTED_LABELS[state.wanted], VIEW_W / 2, 62);
  }
  // Mission tracker, left under the stats box.
  const m = currentMission(state.missions);
  ctx.fillStyle = 'rgba(10,20,32,0.72)';
  roundRect(ctx, 12, 132, 300, 100, 10); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(m ? `MISSION ${m.id}/6 — ${m.name.toUpperCase()}` : 'ALL MISSIONS DONE', 24, 156);
  ctx.fillStyle = '#fff';
  ctx.font = '14px system-ui, sans-serif';
  wrapText(ctx, missionObjectiveText(state), 24, 178, 276, 18);
  if (m && m.target && state.missions.phase === 'active') {
    const d = Math.hypot(p.x - m.target.x, p.y - m.target.y);
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`◈ ${Math.round(d)}m to target`, 24, 222);
  }
  // Speed + car name, bottom right.
  if (p.inCar && p.car) {
    const mph = Math.round(Math.abs(p.speed) * 28);
    ctx.fillStyle = 'rgba(10,20,32,0.72)';
    roundRect(ctx, VIEW_W - 212, VIEW_H - 96, 200, 84, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${mph}`, VIEW_W - 40, VIEW_H - 52);
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('MPH', VIEW_W - 100, VIEW_H - 52);
    ctx.fillStyle = p.car.color;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(p.car.spec.name.toUpperCase(), VIEW_W - 24, VIEW_H - 26);
  }
  // Controls hint, bottom left.
  ctx.fillStyle = 'rgba(10,20,32,0.6)';
  roundRect(ctx, 12, VIEW_H - 44, 560, 32, 8); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD move / drive   •   E steal / exit car   •   F punch   •   CLICK shoot   •   M mission   •   P pause', 22, VIEW_H - 23);
  // Event feed, below the minimap label.
  ctx.textAlign = 'left';
  let ey = 218;
  for (const ev of state.events.slice(-4)) {
    ctx.fillStyle = 'rgba(10,20,32,0.6)';
    roundRect(ctx, VIEW_W - 268, ey, 256, 22, 6); ctx.fill();
    ctx.fillStyle = ev.kind === 'wanted' ? '#ff8a7a' : ev.kind === 'feat' ? '#ffd94d' : '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(ev.text.slice(0, 38), VIEW_W - 260, ey + 15);
    ey += 26;
  }
  // Mission banner.
  const b = state.missions.banner;
  if (b && b.t > 0) {
    ctx.fillStyle = 'rgba(10,20,32,0.82)';
    roundRect(ctx, VIEW_W / 2 - 340, 110, 680, 74, 12); ctx.fill();
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2;
    ctx.strokeRect(VIEW_W / 2 - 340, 110, 680, 74);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.title, VIEW_W / 2, 142);
    ctx.fillStyle = '#fff';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(b.sub, VIEW_W / 2, 168);
  }
  // Upgrade choice after a mission.
  if (state.missions.phase === 'upgrade') drawUpgradeChoice(ctx, state);
  // Busted / wasted flash.
  if (state.busted) {
    ctx.fillStyle = 'rgba(20,40,120,0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED!', VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('The Harbor Patrol got you. Press R to try again.', VIEW_W / 2, VIEW_H / 2 + 30);
  }
  drawMinimap(ctx, state);
}

export function drawMinimap(ctx, state) {
  const mw = 220, mh = 168;
  const mx = VIEW_W - mw - 12, my = 12;
  const sx = mw / WORLD_W, sy = mh / WORLD_H;
  ctx.fillStyle = 'rgba(10,20,32,0.78)';
  roundRect(ctx, mx - 6, my - 6, mw + 12, mh + 12, 10); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
  ctx.fillStyle = '#7ec850';
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#2fb3d8';
  ctx.fillRect(mx, my + mh * 0.88, mw, mh * 0.12);
  ctx.fillStyle = '#3d4450';
  for (const rx of [300, 700, 1100, 1500, 1900, 2300, 2700, 3100]) ctx.fillRect(mx + rx * sx - 2, my, 4, mh);
  for (const ry of [250, 600, 950, 1300, 1650, 2000, 2350]) ctx.fillRect(mx, my + ry * sy - 2, mw, 4);
  const m = currentMission(state.missions);
  if (m && m.target && state.missions.phase === 'active') {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.arc(mx + m.target.x * sx, my + m.target.y * sy, 6, 0, Math.PI * 2); ctx.fill();
  }
  for (const pc of state.police.cars) {
    ctx.fillStyle = '#2f7fff';
    ctx.beginPath(); ctx.arc(mx + pc.x * sx, my + pc.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  }
  const p = state.player;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PALMERA BAY', mx, my + mh + 22);
}

export function drawUpgradeChoice(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PICK YOUR UPGRADE', VIEW_W / 2, 220);
  UPGRADES.forEach((u, i) => {
    const x = 240 + i * 280, y = 260;
    ctx.fillStyle = 'rgba(20,40,60,0.95)';
    roundRect(ctx, x, y, 250, 150, 12); ctx.fill();
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 250, 150);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`[${u.key}]`, x + 125, y + 34);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(u.name, x + 125, y + 66);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(u.desc, x + 125, y + 94);
  });
  ctx.fillStyle = '#fff';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press 1, 2 or 3 — or click a card', VIEW_W / 2, 460);
}

export function drawTitle(ctx, state) {
  const save = state.save;
  // Sunny gradient sky + skyline silhouette.
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#ffcf5e'); g.addColorStop(0.45, '#ff9a5c'); g.addColorStop(1, '#2fb3d8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(1080, 120, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(20,40,70,0.85)';
  const skyline = [120, 200, 160, 260, 190, 300, 230, 170, 280, 210, 150, 240, 180];
  let sx = 0;
  for (const h of skyline) { ctx.fillRect(sx, 560 - h, 100, h + 160); sx += 100; }
  ctx.fillStyle = '#2fb3d8';
  ctx.fillRect(0, 560, VIEW_W, 160);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 10; i++) ctx.fillRect((i * 137) % VIEW_W, 590 + (i % 3) * 30, 90, 4);
  // Title block.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18;
  ctx.fillText('PALMERA BAY', VIEW_W / 2, 130);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillStyle = '#ffd94d';
  ctx.fillText('AN OPEN-WORLD CRIME GAME  •  STEAL IT. DRIVE IT. SURVIVE IT.', VIEW_W / 2, 168);
  // GOAL strip.
  ctx.fillStyle = 'rgba(10,20,32,0.8)';
  roundRect(ctx, 60, 196, 1160, 92, 12); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GOAL', 80, 224);
  ctx.fillStyle = '#fff';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Leo Marin owes the Bay Kings $5,000. Run 6 story missions across the city, steal cars, dodge the Harbor Patrol,', 80, 248);
  ctx.fillText('and pay the debt — or become King of the Bay yourself. Every mission pays. Every crime raises the heat.', 80, 270);
  // Controls chips.
  const chips = ['WASD — move / drive', 'E — steal car', 'F — punch', 'CLICK — shoot', 'M — mission', 'P — pause', 'SHIFT — sprint'];
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('CONTROLS', 80, 316);
  let cx = 180;
  ctx.font = '13px system-ui, sans-serif';
  for (const c of chips) {
    const w = ctx.measureText(c).width + 18;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(ctx, cx, 300, w, 26, 13); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(c, cx + 9, 318);
    cx += w + 8;
  }
  // Roster: characters + vehicles + factions.
  ctx.fillStyle = 'rgba(10,20,32,0.8)';
  roundRect(ctx, 60, 344, 560, 210, 12); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE CREW', 80, 372);
  CHARACTERS.forEach((ch, i) => {
    const y = 396 + i * 30;
    ctx.fillStyle = ch.color;
    ctx.beginPath(); ctx.arc(92, y - 5, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(ch.name, 112, y);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${ch.role} — ${ch.blurb}`, 240, y);
  });
  ctx.fillStyle = 'rgba(10,20,32,0.8)';
  roundRect(ctx, 640, 344, 580, 210, 12); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('WHEELS & FACTIONS', 660, 372);
  VEHICLES.slice(0, 6).forEach((v, i) => {
    const y = 396 + i * 24;
    ctx.fillStyle = v.color;
    roundRect(ctx, 660, y - 12, 34, 16, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`${v.name} — ${v.kind}`, 704, y);
  });
  FACTIONS.forEach((f, i) => {
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(660 + i * 145 + 8, 528, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(f.name, 660 + i * 145 + 20, 532);
  });
  // Persistence: best score, feats, last runs.
  ctx.fillStyle = 'rgba(10,20,32,0.8)';
  roundRect(ctx, 60, 570, 1160, 96, 12); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('BEST SCORE', 80, 598);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(save.bestScore.toLocaleString(), 80, 630);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Best cash $${save.bestCash.toLocaleString()}  •  Missions best ${save.missionsBest}/6  •  Games played ${save.gamesPlayed}`, 80, 652);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`FEATS ${save.feats.length}/${FEATS.length}`, 420, 598);
  ctx.fillStyle = '#fff';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(FEATS.map((f) => (save.feats.includes(f.id) ? `✓ ${f.name}` : `· ${f.name}`)).join('   '), 420, 624);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('LAST RUNS', 420, 652);
  ctx.fillStyle = '#fff';
  ctx.font = '13px system-ui, sans-serif';
  const runs = save.lastRuns.length ? save.lastRuns.map((r) => `${r.result} ${r.score.toLocaleString()} pts · ${r.missions}/6 missions`).join('   ') : 'No runs yet — this is your first job.';
  ctx.fillText(runs, 560, 652);
  // Play button.
  ctx.fillStyle = '#ffd94d';
  roundRect(ctx, VIEW_W / 2 - 160, 678, 320, 34, 17); ctx.fill();
  ctx.fillStyle = '#1d2a3a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▶  PLAY  —  press ENTER', VIEW_W / 2, 701);
}

export function drawPause(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, 300);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('P resume   •   R restart   •   0 mute sound   •   ENTER back to title', VIEW_W / 2, 350);
  ctx.fillText(`Score ${state.score.toLocaleString()}  •  Cash $${state.cash.toLocaleString()}  •  Missions ${state.missions.done.length}/6`, VIEW_W / 2, 390);
}

export function drawResults(ctx, state) {
  const r = state.results;
  ctx.fillStyle = 'rgba(8,16,28,0.92)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillText(r.title, VIEW_W / 2, 110);
  ctx.fillStyle = '#fff';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(r.subtitle, VIEW_W / 2, 148);
  // Grade.
  ctx.fillStyle = r.grade === 'S' ? '#ffd94d' : r.grade === 'A' ? '#2fbf5a' : '#5ab8e6';
  ctx.font = 'bold 110px system-ui, sans-serif';
  ctx.fillText(r.grade, VIEW_W / 2, 280);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`SCORE  ${r.score.toLocaleString()}`, VIEW_W / 2, 320);
  if (r.newBest) {
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('★ NEW BEST ★', VIEW_W / 2, 356);
  }
  // Stat tiles.
  const tiles = [
    ['MISSIONS DONE', `${r.missions}/6`], ['CARS STOLEN', `${r.carsStolen}`],
    ['ARRESTS ESCAPED', `${r.escapes}`], ['KNOCKOUTS', `${r.kos}`],
    ['CASH EARNED', `$${r.earned.toLocaleString()}`], ['TIME', r.time],
    ['TOP SPEED', `${r.topSpeed} mph`], ['FEATS', `${r.feats}/${FEATS.length}`],
  ];
  tiles.forEach((t, i) => {
    const x = 190 + (i % 4) * 230, y = 400 + Math.floor(i / 4) * 90;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, x, y, 210, 74, 10); ctx.fill();
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 210, 74);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(t[0], x + 105, y + 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(t[1], x + 105, y + 58);
  });
  ctx.fillStyle = '#fff';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Missions completed: ' + (r.missionNames.join(', ') || 'none yet'), VIEW_W / 2, 600);
  ctx.fillStyle = '#ffd94d';
  roundRect(ctx, VIEW_W / 2 - 160, 630, 320, 44, 22); ctx.fill();
  ctx.fillStyle = '#1d2a3a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('▶  PLAY AGAIN  —  press R', VIEW_W / 2, 659);
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
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
