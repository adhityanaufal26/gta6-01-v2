// Palmera Bay — traffic cars and pedestrians.
// One job: keep the streets alive. Traffic follows the road grid; pedestrians
// stroll the sidewalks and scatter when the player drives at them.

import { ROADS_X, ROADS_Y, VEHICLES, WORLD_W, WORLD_H, clamp, mulberry32 } from './config.js';
import { nearestRoadPoint } from './city.js';

export function spawnTrafficCar(rnd, city) {
  const vertical = rnd() < 0.5;
  const spec = VEHICLES[Math.floor(rnd() * (VEHICLES.length - 1))]; // never police
  const car = {
    x: 0, y: 0, angle: 0, speed: 1.6 + rnd() * 1.2, spec,
    vertical, dir: rnd() < 0.5 ? 1 : -1, w: 46, h: 22,
    color: spec.color, isTraffic: true, honk: 0,
  };
  if (vertical) {
    car.x = ROADS_X[Math.floor(rnd() * ROADS_X.length)] + (car.dir > 0 ? 20 : -20);
    car.y = 100 + rnd() * (WORLD_H - 200);
    car.angle = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  } else {
    car.y = ROADS_Y[Math.floor(rnd() * ROADS_Y.length)] + (car.dir > 0 ? 20 : -20);
    car.x = 100 + rnd() * (WORLD_W - 200);
    car.angle = car.dir > 0 ? 0 : Math.PI;
  }
  return car;
}

export function createTraffic(seed, city) {
  const rnd = mulberry32(seed + 7);
  const cars = [];
  for (let i = 0; i < 16; i++) cars.push(spawnTrafficCar(rnd, city));
  const peds = [];
  const pedColors = ['#ff8a5c', '#7ed3ff', '#c9f27a', '#ffb3d9', '#d9c2ff', '#fff3b0'];
  for (let i = 0; i < 26; i++) {
    const rp = nearestRoadPoint(200 + rnd() * (WORLD_W - 400), 200 + rnd() * (WORLD_H - 400));
    peds.push({
      x: rp.x + (rnd() - 0.5) * 70, y: rp.y + (rnd() - 0.5) * 70,
      angle: rnd() * Math.PI * 2, speed: 0.5 + rnd() * 0.5,
      color: pedColors[Math.floor(rnd() * pedColors.length)],
      panic: 0, walkPhase: rnd() * 6.28, name: 'Citizen',
    });
  }
  return { cars, peds };
}

export function stepTraffic(traffic, dt, player, city) {
  // Cars cruise their avenue; at the city edge they turn around.
  for (const c of traffic.cars) {
    const nx = c.x + Math.cos(c.angle) * c.speed * dt;
    const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    if (nx < 60 || nx > WORLD_W - 60 || ny < 60 || ny > WORLD_H - 60) {
      c.angle += Math.PI; c.dir *= -1;
    } else {
      c.x = nx; c.y = ny;
    }
    // Slow down for a car right ahead (simple bumper logic).
    for (const o of traffic.cars) {
      if (o === c) continue;
      const dx = o.x - c.x, dy = o.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 70 && d > 1 && Math.cos(c.angle) * dx + Math.sin(c.angle) * dy > 0) {
        c.x -= Math.cos(c.angle) * 0.6 * dt; c.y -= Math.sin(c.angle) * 0.6 * dt;
      }
    }
  }
  // Pedestrians wander the sidewalks; they flee from a speeding player car.
  for (const p of traffic.peds) {
    p.walkPhase += dt * 0.08;
    const pd = Math.hypot(player.x - p.x, player.y - p.y);
    if (pd < 130 && player.speed > 2) p.panic = 40;
    if (p.panic > 0) {
      p.panic -= dt;
      const a = Math.atan2(p.y - player.y, p.x - player.x);
      p.x += Math.cos(a) * 1.8 * dt; p.y += Math.sin(a) * 1.8 * dt;
      p.angle = a;
    } else {
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (Math.random() < 0.004) p.angle += (Math.random() - 0.5) * 2.4;
      if (p.x < 80 || p.x > WORLD_W - 80 || p.y < 80 || p.y > WORLD_H - 80) p.angle += Math.PI;
      if (!onSidewalk(p.x, p.y) && Math.random() < 0.02) {
        const rp = nearestRoadPoint(p.x, p.y);
        p.angle = Math.atan2(rp.y - p.y, rp.x - p.x);
      }
    }
    p.x = clamp(p.x, 60, WORLD_W - 60);
    p.y = clamp(p.y, 60, WORLD_H - 60);
  }
}

function onSidewalk(x, y) {
  for (const rx of ROADS_X) {
    const d = Math.abs(x - rx);
    if (d > 43 && d < 80) return true;
  }
  for (const ry of ROADS_Y) {
    const d = Math.abs(y - ry);
    if (d > 43 && d < 80) return true;
  }
  return false;
}

// Parked, stealable cars placed along the avenues.
export function spawnParkedCars(seed) {
  const rnd = mulberry32(seed + 21);
  const parked = [];
  for (let i = 0; i < 12; i++) {
    const spec = VEHICLES[Math.floor(rnd() * (VEHICLES.length - 1))];
    const vertical = rnd() < 0.5;
    let x, y, angle;
    if (vertical) {
      x = ROADS_X[Math.floor(rnd() * ROADS_X.length)] + 34;
      y = 200 + rnd() * (WORLD_H - 400);
      angle = Math.PI / 2;
    } else {
      y = ROADS_Y[Math.floor(rnd() * ROADS_Y.length)] + 34;
      x = 200 + rnd() * (WORLD_W - 400);
      angle = 0;
    }
    parked.push({ x, y, angle, speed: 0, spec, color: spec.color, w: 46, h: 22, parked: true });
  }
  return parked;
}
