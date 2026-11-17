// Palmera Bay — all sound, synthesized live with WebAudio.
// One job: engine hum, sirens, shots, pickups and a sunny bassline loop.
// No audio files, no network: every sound is an oscillator or noise buffer.

export function createAudio() {
  let ctx = null;
  let master = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let musicTimer = null;
  let muted = false;
  const notes = [110, 0, 130.8, 0, 98, 0, 146.8, 0, 110, 0, 130.8, 0, 164.8, 0, 146.8, 0];
  let noteIdx = 0;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 50;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'triangle';
      sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.value = vol || 0.2;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + dur);
  }

  function noise(dur, vol, lowpass) {
    if (!ensure() || muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol || 0.3;
    if (lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = lowpass;
      src.connect(f); f.connect(g); g.connect(master);
    } else {
      src.connect(g); g.connect(master);
    }
    src.start();
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.35; return muted; },
    setEngine(speed01, on) {
      if (!ensure() || muted) return;
      engineGain.gain.value = on ? 0.05 + speed01 * 0.08 : 0;
      engineOsc.frequency.value = 45 + speed01 * 130;
    },
    setSiren(wanted, phase) {
      if (!ensure() || muted) return;
      if (wanted > 0) {
        sirenGain.gain.value = 0.05;
        sirenOsc.frequency.value = phase % 2 < 1 ? 720 : 960;
      } else {
        sirenGain.gain.value = 0;
      }
    },
    shot() { noise(0.14, 0.5, 1800); },
    swing() { noise(0.08, 0.18, 900); },
    thud() { blip(90, 0.18, 'sine', 0.4, 45); noise(0.1, 0.25, 500); },
    pickup() { blip(880, 0.12, 'sine', 0.25, 1320); },
    mission() { blip(523, 0.15, 'triangle', 0.3); setTimeout(() => blip(659, 0.15, 'triangle', 0.3), 140); setTimeout(() => blip(784, 0.25, 'triangle', 0.3), 280); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.3), i * 130)); },
    busted() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'sawtooth', 0.25), i * 160)); },
    startMusic() {
      if (!ensure() || musicTimer) return;
      musicTimer = setInterval(() => {
        if (muted) return;
        const f = notes[noteIdx % notes.length];
        noteIdx++;
        if (f) blip(f, 0.28, 'triangle', 0.12);
      }, 300);
    },
  };
}
