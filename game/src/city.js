// Palmera Bay — city generation and collision.
// One job: build the static city (blocks, buildings, palms, beach, park)
// and answer "is this point on a road / inside a building".

import { ROADS_X, ROADS_Y, ROAD_W, WORLD_W, WORLD_H, PALETTE, ROOF_COLORS, DISTRICTS, mulberry32 } from './config.js';

export function buildCity(seed) {
  const rnd = mulberry32(seed);
  const buildings = [];
  const palms = [];
  const props = []; // benches, crates, hydrants — small decorative colliders
  const roofColors = ROOF_COLORS;
  // City blocks are the cells between roads. Fill each with 1-4 buildings.
  for (let ix = 0; ix < ROADS_X.length - 1; ix++) {
    for (let iy = 0; iy < ROADS_Y.length - 1; iy++) {
      const x0 = ROADS_X[ix] + ROAD_W / 2 + 14;
      const x1 = ROADS_X[ix + 1] - ROAD_W / 2 - 14;
      const y0 = ROADS_Y[iy] + ROAD_W / 2 + 14;
      const y1 = ROADS_Y[iy + 1] - ROAD_W / 2 - 14;
      if (x1 - x0 < 90 || y1 - y0 < 90) continue;
      // The park block stays green; the beach strip stays sand.
      if (x0 > 1150 && x0 < 2050 && y0 > 1500 && y0 < 1920) continue;
      if (y0 > 2280) continue;
      const cols = (x1 - x0) > 260 ? 2 : 1;
      const rows = (y1 - y0) > 260 ? 2 : 1;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bw = (x1 - x0) / cols - 18;
          const bh = (y1 - y0) / rows - 18;
          const bx = x0 + c * ((x1 - x0) / cols) + 9;
          const by = y0 + r * ((y1 - y0) / rows) + 9;
          const tall = rnd() < 0.22;
          buildings.push({
            x: bx, y: by, w: bw, h: bh,
            color: roofColors[Math.floor(rnd() * roofColors.length)],
            tall, floors: tall ? 6 + Math.floor(rnd() * 8) : 1 + Math.floor(rnd() * 3),
            bank: false,
          });
        }
      }
      // Palms along the block edges.
      for (let p = 0; p < 3; p++) {
        palms.push({ x: x0 + rnd() * (x1 - x0), y: y0 + rnd() * (y1 - y0) });
      }
    }
  }
  // Landmarks: the Downtown bank (mission 5), the garage (mission 1), the pier.
  const bank = buildings.reduce((best, b) => {
    const d = Math.hypot(b.x + b.w / 2 - 1700, b.y + b.h / 2 - 1050);
    return !best || d < best.d ? { b, d } : best;
  }, null).b;
  bank.bank = true; bank.color = '#ffd94d';
  // Beach palms + umbrellas along the Marina strip.
  for (let i = 0; i < 26; i++) {
    palms.push({ x: 420 + rnd() * 2500, y: 2320 + rnd() * 180 });
  }
  for (let i = 0; i < 14; i++) {
    props.push({ x: 500 + rnd() * 2300, y: 1560 + rnd() * 300, kind: 'bench' });
  }
  for (let i = 0; i < 10; i++) {
    props.push({ x: 2650 + rnd() * 550, y: 1150 + rnd() * 800, kind: 'crate' });
  }
  return { buildings, palms, props, bank };
}

export function onRoad(x, y) {
  for (const rx of ROADS_X) if (Math.abs(x - rx) < ROAD_W / 2) return true;
  for (const ry of ROADS_Y) if (Math.abs(y - ry) < ROAD_W / 2) return true;
  return false;
}

export function nearestRoadPoint(x, y) {
  let best = null; let bd = Infinity;
  for (const rx of ROADS_X) {
    const d = Math.abs(x - rx);
    if (d < bd) { bd = d; best = { x: rx, y, vertical: true }; }
  }
  for (const ry of ROADS_Y) {
    const d = Math.abs(y - ry);
    if (d < bd) { bd = d; best = { x, y: ry, vertical: false }; }
  }
  return best;
}

export function collideBuildings(city, x, y, r) {
  for (const b of city.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) return d.name;
  }
  return y > 2280 ? 'MARINA BEACH' : 'PALMERA BAY';
}
