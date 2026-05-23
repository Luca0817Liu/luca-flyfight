/**
 * Web Audio API synthesizer for retro space-shooter sound effects.
 * Handles audio context states and provides user mute/volume control.
 */

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;
let globalVolume: number = 0.5;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard and vendor prefixed support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = (): boolean => {
  return isMuted;
};

export const setVolume = (vol: number) => {
  globalVolume = Math.max(0, Math.min(1, vol));
};

export const getVolume = (): number => {
  return globalVolume;
};

/**
 * Play a specific sound effect synthesized in real time.
 */
export const playSound = (type: 'laser' | 'enemyLaser' | 'hit' | 'explosion' | 'powerup' | 'levelUp' | 'achievement') => {
  if (isMuted || globalVolume === 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (common protocol on browser auto-play policies)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
    return;
  }

  try {
    const mainVolumeNode = ctx.createGain();
    mainVolumeNode.gain.setValueAtTime(globalVolume, ctx.currentTime);
    mainVolumeNode.connect(ctx.destination);

    switch (type) {
      case 'laser': {
        // High pitch descending laser
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(mainVolumeNode);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        break;
      }
      case 'enemyLaser': {
        // Lower pitch laser for enemy firing
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(mainVolumeNode);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        break;
      }
      case 'hit': {
        // Quick white noise-like impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(mainVolumeNode);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.setValueAtTime(30, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        break;
      }
      case 'explosion': {
        // Low rumbly explosion (using multiple oscillators or noise)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.connect(gain1);
        gain1.connect(mainVolumeNode);
        osc2.connect(gain2);
        gain2.connect(mainVolumeNode);

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(180, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(20, ctx.currentTime + 0.5);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(90, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(10, ctx.currentTime + 0.4);

        gain1.gain.setValueAtTime(0.4, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.4);
        break;
      }
      case 'powerup': {
        // Arpeggio rising sound effect
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(mainVolumeNode);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.setValueAtTime(329, now + 0.08);
        osc.frequency.setValueAtTime(392, now + 0.16);
        osc.frequency.setValueAtTime(523, now + 0.24);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 0.24);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start();
        osc.stop(now + 0.35);
        break;
      }
      case 'levelUp': {
        // Dramatic triumph sound chord
        const now = ctx.currentTime;
        [0, 4, 7, 12, 16].forEach((semitones, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(mainVolumeNode);

          osc.type = 'triangle';
          const baseFreq = 220;
          const freq = baseFreq * Math.pow(2, semitones / 12);
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.5);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

          osc.start();
          osc.stop(now + 0.6);
        });
        break;
      }
      case 'achievement': {
        // Glorious fanfare chime sound
        const now = ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(mainVolumeNode);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          
          gain.gain.setValueAtTime(0.15, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.4);

          osc.start();
          osc.stop(now + idx * 0.08 + 0.4);
        });
        break;
      }
    }
  } catch (error) {
    console.error('Audio synthesis failed:', error);
  }
};
