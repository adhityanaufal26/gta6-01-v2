// Palmera Bay — save game in localStorage.
// One job: load and store best score, cash, feats, last runs and settings.
// Never throws: a blocked storage just means a fresh session.

import { SAVE_KEY } from './config.js';

export function defaultSave() {
  return {
    bestScore: 0, bestCash: 0, missionsBest: 0,
    feats: [], lastRuns: [], // { score, missions, time, result }
    muted: false, gamesPlayed: 0,
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return { ...defaultSave(), ...parsed, feats: parsed.feats || [], lastRuns: parsed.lastRuns || [] };
  } catch {
    return defaultSave();
  }
}

export function storeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch { /* storage unavailable — play on without saving */ }
}

export function recordRun(save, run) {
  save.gamesPlayed++;
  save.lastRuns.unshift(run);
  save.lastRuns = save.lastRuns.slice(0, 3);
  if (run.score > save.bestScore) save.bestScore = run.score;
  if (run.cash > save.bestCash) save.bestCash = run.cash;
  if (run.missions > save.missionsBest) save.missionsBest = run.missions;
  storeSave(save);
  return run.score >= save.bestScore && run.score > 0;
}
