// Palmera Bay — shared constants, city layout data and named rosters.
// One job: every tunable number and every name the rest of the game uses.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WORLD_W = 3400;
export const WORLD_H = 2600;
export const SAVE_KEY = 'palmera-bay-save-v1';

// Sun-soaked palette: bright sand, turquoise water, coral roofs.
export const PALETTE = {
  grass: '#7ec850', grassDark: '#6db544', sand: '#f2d492', water: '#2fb3d8',
  waterDeep: '#1d8fb8', road: '#3d4450', roadLine: '#ffd94d', sidewalk: '#c9c2b4',
  park: '#58b368', plaza: '#e8e0cc',
};

export const ROOF_COLORS = ['#e86a5a', '#f2a541', '#5ab8e6', '#9b7ede', '#e85d8a', '#4fc08d'];

export const DISTRICTS = [
  { name: 'DOWNTOWN', x: 1200, y: 700, w: 1000, h: 800, color: '#5ab8e6' },
  { name: 'MARINA', x: 400, y: 1900, w: 2600, h: 600, color: '#2fb3d8' },
  { name: 'OLD TOWN', x: 200, y: 300, w: 800, h: 1100, color: '#f2a541' },
  { name: 'THE HILLS', x: 2100, y: 150, w: 1100, h: 700, color: '#9b7ede' },
  { name: 'THE PORT', x: 2600, y: 1100, w: 650, h: 900, color: '#e86a5a' },
  { name: 'PALM PARK', x: 1150, y: 1500, w: 900, h: 420, color: '#58b368' },
];

// Roads: vertical and horizontal avenues across the whole city.
export const ROADS_X = [300, 700, 1100, 1500, 1900, 2300, 2700, 3100];
export const ROADS_Y = [250, 600, 950, 1300, 1650, 2000, 2350];
export const ROAD_W = 86;

export const VEHICLES = [
  { name: 'Comet GT', color: '#e83a3a', top: 5.6, accel: 0.16, kind: 'sports' },
  { name: 'Bay Runner', color: '#2f7fe0', top: 4.6, accel: 0.13, kind: 'sedan' },
  { name: 'Tide Pickup', color: '#e8912f', top: 4.2, accel: 0.12, kind: 'truck' },
  { name: 'Sunset Taxi', color: '#ffd94d', top: 4.4, accel: 0.12, kind: 'taxi' },
  { name: 'Coral Coupe', color: '#e85d8a', top: 5.0, accel: 0.14, kind: 'sports' },
  { name: 'Harbor Van', color: '#8a94a6', top: 3.8, accel: 0.10, kind: 'van' },
  { name: 'Patrol Interceptor', color: '#1d3fae', top: 6.0, accel: 0.18, kind: 'police' },
];

export const CHARACTERS = [
  { name: 'Leo Marin', role: 'Wheelman — you', color: '#ffd94d', blurb: 'Just out. Owes the Bay Kings.' },
  { name: 'Mara Voss', role: 'Fixer', color: '#e85d8a', blurb: 'Hands out the jobs. Never forgets.' },
  { name: 'Big Tuna', role: 'Dockside Crew boss', color: '#4fc08d', blurb: 'Owns the port. Wants it back.' },
  { name: 'Chief Aldana', role: 'Harbor Patrol', color: '#1d3fae', blurb: 'Runs the wanted board.' },
  { name: 'Rico Sands', role: 'Rival driver', color: '#e83a3a', blurb: 'Fastest wheels in Palmera Bay.' },
];

export const FACTIONS = [
  { name: 'Bay Kings', color: '#ffd94d', rep: 'The crew you owe' },
  { name: 'Dockside Crew', color: '#4fc08d', rep: 'Smugglers of the port' },
  { name: 'Harbor Patrol', color: '#1d3fae', rep: 'The law — and the heat' },
  { name: 'Street Racers', color: '#e83a3a', rep: 'Midnight races, big stakes' },
];

export const MISSIONS = [
  { id: 1, name: 'First Wheels', giver: 'Mara Voss', pay: 250,
    brief: 'Steal any car on the street and bring it to the garage.',
    objective: 'Steal a car (press E near one)', target: { x: 1500, y: 950 } },
  { id: 2, name: 'Delivery Run', giver: 'Mara Voss', pay: 400,
    brief: 'A package for Big Tuna at the port. Fast. No police.',
    objective: 'Drive the package to The Port', target: { x: 2900, y: 1500 } },
  { id: 3, name: 'Debt Collector', giver: 'Big Tuna', pay: 600,
    brief: 'Two deadbeats in Old Town owe the crew. Collect — fists or fire.',
    objective: 'Deal with the deadbeats in Old Town', target: { x: 550, y: 800 } },
  { id: 4, name: 'Hot Pursuit', giver: 'Mara Voss', pay: 800,
    brief: 'The Patrol is on you. Lose a 2-star wanted level.',
    objective: 'Escape the Harbor Patrol', target: null },
  { id: 5, name: 'The Bank Job', giver: 'Big Tuna', pay: 1500,
    brief: 'Hit the Downtown bank, grab the cash, vanish before 4 stars.',
    objective: 'Rob the Downtown bank, then escape', target: { x: 1700, y: 1050 } },
  { id: 6, name: 'King of the Bay', giver: 'Mara Voss', pay: 3000,
    brief: 'Rico Sands wants a race for the whole city. Beat him to the Marina.',
    objective: 'Outrun Rico Sands to the Marina', target: { x: 1700, y: 2150 } },
];

export const UPGRADES = [
  { id: 'armor', name: 'BULLETPROOF VEST', desc: '+50 max health, full heal', key: '1' },
  { id: 'engine', name: 'TUNED ENGINE', desc: '+25% top speed in any car', key: '2' },
  { id: 'ammo', name: 'EXTENDED MAG', desc: '+60 ammo and faster shots', key: '3' },
];

export const FEATS = [
  { id: 'first-car', name: 'First Wheels', desc: 'Steal your first car' },
  { id: 'ghost', name: 'Ghost', desc: 'Lose a 3-star wanted level' },
  { id: 'brawler', name: 'Brawler', desc: 'Knock out 5 enemies' },
  { id: 'rich', name: 'Bay Rich', desc: 'Hold $5,000 cash' },
  { id: 'king', name: 'King of the Bay', desc: 'Finish all 6 missions' },
  { id: 'speedster', name: 'Speedster', desc: 'Drive over 140 mph' },
];

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
// Deterministic PRNG so staged screenshots are identical every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
