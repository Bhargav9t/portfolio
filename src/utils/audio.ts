// Web Audio API Synthesizer for futuristic sci-fi sound effects
// Completely dependency-free and synthesized on-the-fly

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundFx = {
  isMuted: () => isAudioMuted,
  setMuted: (muted: boolean) => {
    isAudioMuted = muted;
  },
  toggleMute: () => {
    isAudioMuted = !isAudioMuted;
    return isAudioMuted;
  },

  // Soft futuristic UI click/hover sound
  hover: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore audio autoplay restrictions
    }
  },

  // Monolith select / warp sound
  select: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  },

  // Close / return to overview whoosh
  close: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Ignore
    }
  },

  // Transmission sent / success chime
  success: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.06, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.25);
      });
    } catch {
      // Ignore
    }
  },

  // Monolith subtle Tron deflection blip (subtle high-tech digitized ping)
  collision: (() => {
    let lastPlayed = 0;
    return () => {
      if (isAudioMuted) return;
      const now = Date.now();
      if (now - lastPlayed < 220) return; // rate limit 220ms
      lastPlayed = now;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(680, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.09);

        gain.gain.setValueAtTime(0.025, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } catch {
        // Ignore
      }
    };
  })(),

  // Water splash sound effect (synthesized fluid plop + bubbly spray)
  splash: (() => {
    let lastPlayed = 0;
    return (intensity: number = 1.0) => {
      if (isAudioMuted) return;
      const now = Date.now();
      if (now - lastPlayed < 140) return; // rate limit 140ms
      lastPlayed = now;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        // 1. Fluid water plop (downward resonant sine drop)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        const startFreq = 420 + Math.random() * 120;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

        const vol = Math.min(0.05, 0.03 * intensity);
        oscGain.gain.setValueAtTime(vol, t);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);

        // 2. High bubbly spray shimmer
        const bubbleOsc = ctx.createOscillator();
        const bubbleGain = ctx.createGain();
        bubbleOsc.type = "triangle";
        bubbleOsc.frequency.setValueAtTime(1300 + Math.random() * 400, t + 0.02);
        bubbleOsc.frequency.exponentialRampToValueAtTime(550, t + 0.15);

        bubbleGain.gain.setValueAtTime(vol * 0.4, t + 0.02);
        bubbleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);

        bubbleOsc.connect(bubbleGain);
        bubbleGain.connect(ctx.destination);
        bubbleOsc.start(t + 0.02);
        bubbleOsc.stop(t + 0.18);
      } catch {
        // Ignore audio autoplay restrictions
      }
    };
  })(),

  // Rushing whirlpool water surge when Easter Egg activates
  whirlpoolSurge: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Low rushing resonant water whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 1.6);

      // Lowpass filter for watery whoosh
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, t);
      filter.frequency.exponentialRampToValueAtTime(850, t + 1.6);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1.85);
    } catch {
      // Ignore
    }
  },

  // Deep seismic sub-bass boom when Gargantua breaches into existence
  singularityBoom: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.8);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1.25);
    } catch {
      // Ignore
    }
  },

  // Dedicated Realistic Glass Breaking Sound Effect: High-velocity iron impact, fracturing crystal shards, micro-tinkles, and resonant decay
  glassBreak: (intensity: number = 1.0) => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // 1. Initial High-Velocity Crack & Snap Transient
      const crackOsc = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crackOsc.type = "sawtooth";
      crackOsc.frequency.setValueAtTime(3400, t);
      crackOsc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
      crackGain.gain.setValueAtTime(0.24 * intensity, t);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      crackOsc.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackOsc.start(t);
      crackOsc.stop(t + 0.06);

      // 2. Multi-Frequency Glass Fracturing Cluster (Sawtooth & Square Micro-bursts)
      const shatterFreqs = [2180, 3120, 4260, 5840, 7200, 8900];
      shatterFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? "sawtooth" : "square";
        const delay = t + idx * 0.008;
        const jitter = (Math.random() - 0.5) * 240;
        osc.frequency.setValueAtTime(freq + jitter, delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.35, delay + 0.12);

        gain.gain.setValueAtTime(0.09 * intensity, delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, delay + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(delay);
        osc.stop(delay + 0.15);
      });

      // 3. Crystal Tinkle / Shards Raining Pings (Fine Glass Chimes)
      const tinkleFreqs = [1960, 2640, 3520, 4780, 5870];
      tinkleFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const delay = t + 0.03 + idx * 0.024;
        osc.frequency.setValueAtTime(freq, delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.92, delay + 0.28);

        gain.gain.setValueAtTime(0.06 * intensity, delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, delay + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(delay);
        osc.stop(delay + 0.35);
      });

      // 4. Low Hollow Glass Pop & Ocean Plop Resonance
      const hollowOsc = ctx.createOscillator();
      const hollowGain = ctx.createGain();
      hollowOsc.type = "sine";
      hollowOsc.frequency.setValueAtTime(320, t + 0.01);
      hollowOsc.frequency.exponentialRampToValueAtTime(65, t + 0.22);
      hollowGain.gain.setValueAtTime(0.18 * intensity, t + 0.01);
      hollowGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      hollowOsc.connect(hollowGain);
      hollowGain.connect(ctx.destination);
      hollowOsc.start(t + 0.01);
      hollowOsc.stop(t + 0.26);
    } catch {
      // Ignore audio restrictions
    }
  },

  // Hammer smash sound: Heavy metallic strike + glass bottle shattering fracture + splash
  hammerSmash: () => {
    soundFx.glassBreak(1.2);
  },

  // Kinetic hammer swing whoosh in air
  hammerSwing: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    } catch {
      // Ignore
    }
  },

  // Hand tool: Robotic servo grab / graviton pulse
  handGrab: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(740, t + 0.12);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // Ignore
    }
  },

  // Time Skip: Chrono gear dial rapid spin chime
  chronoSpin: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      [440, 660, 880, 1320].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        const delay = t + idx * 0.025;
        osc.frequency.setValueAtTime(freq, delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, delay + 0.15);
        gain.gain.setValueAtTime(0.06, delay);
        gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(delay);
        osc.stop(delay + 0.2);
      });
    } catch {
      // Ignore
    }
  },

  // 360° Turn: Panoramic Gyroscope dual-axis spin & shutter click
  gyroSpin: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(1480, t + 0.18);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Ignore
    }
  },

  // Randomize: Quantum Dice roll tumble & crystal spark
  quantumRoll: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      [520, 780, 1040, 1560].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const delay = t + idx * 0.03;
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 80, delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, delay + 0.16);
        gain.gain.setValueAtTime(0.065, delay);
        gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(delay);
        osc.stop(delay + 0.22);
      });
    } catch {
      // Ignore
    }
  },

  // Hand tool: Pick up bottle or ship (upward liquid lift)
  pickUp: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.16);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    } catch {
      // Ignore
    }
  },

  // Hand tool: Place down / drop object into ocean water
  placeDown: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.18);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    } catch {
      // Ignore
    }
  },

  // Long click circle closing-in charging tick
  toolkitCharge: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.32);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch {
      // Ignore
    }
  },

  // Video game radial wheel opening chime
  toolkitOpen: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        gain.gain.setValueAtTime(0.07, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.24);
      });
    } catch {
      // Ignore
    }
  },

  // GTA5 / DOOM radial wheel sector change mechanical tick
  wheelTick: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.025);

      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } catch {
      // Ignore
    }
  },

  // Tactical weapon wheel equip confirmation sound
  wheelEquip: () => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      [360, 720, 1440].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + i * 0.02 + 0.06);

        gain.gain.setValueAtTime(0.06, t + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.02 + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.02);
        osc.stop(t + i * 0.02 + 0.08);
      });
    } catch {
      // Ignore
    }
  },
};
