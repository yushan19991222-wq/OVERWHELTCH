class SoundSynthEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Alarm / Jumpscare tone for Yawn Detection
   */
  public playYawnAlert() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Comedic slide whistle / yawn wah-wah
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.18);
      osc.frequency.linearRampToValueAtTime(550, now + 0.38);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Tactile camera shutter click + energetic chime for Peace Sign ✌️ Easter Egg Snapshot
   */
  public playCameraShutter() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Mechanical shutter click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);

      // Sweet two-tone chime (G5 -> C6)
      [783.99, 1046.5].forEach((freq, idx) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        const start = now + 0.07 + idx * 0.09;
        chime.frequency.setValueAtTime(freq, start);
        chimeGain.gain.setValueAtTime(0.18, start);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(start);
        chime.stop(start + 0.28);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Cheerful 8-bit / Arcade chime for Slacking Reward (+10pts)
   */
  public playRewardJingle() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Warning descending buzz for Frown / Eye-strain / Sedentary
   */
  public playWarningBuzz() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Sparkling magical eye-drop & moisture chime for blink / dry-eye fatigue feedback
   */
  public playBlinkChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // 1. Droplet splash sound (pitch drop)
      const dropOsc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(1200, now);
      dropOsc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
      dropGain.gain.setValueAtTime(0.18, now);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      dropOsc.connect(dropGain);
      dropGain.connect(ctx.destination);
      dropOsc.start(now);
      dropOsc.stop(now + 0.15);

      // 2. Sparkling moisture celesta arpeggio (A5, C#6, E6, A6)
      const freqs = [880, 1108.73, 1318.5, 1760];
      freqs.forEach((freq, idx) => {
        const time = now + 0.08 + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.14, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.45);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Mystical chime when opening the Book of Answers
   */
  public playMysticBookFlip() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Arpeggiated mystical harp/celesta: E5, G#5, B5, E6
      const freqs = [659.25, 830.61, 987.77, 1318.5];
      freqs.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.6);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Divine oracle reveal chord for the Book of Answers
   */
  public playOracleReveal() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Warm golden shimmer chord
      const chord = [392.0, 493.88, 587.33, 783.99, 987.77]; // G major 9th sparkle
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Uplifting completion chime/fanfare when eye rest is completed
   */
  public playEyeRestCompleteFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Shutter snap sound for downloading card
   */
  public playSnapSound() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Stage 1: Trigger / Snapshot sound for hydration alert
   */
  public playWaterTrigger() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Stage 2: Realistic liquid gulping and swallowing glugs during drinking progress
   */
  public playWaterGulp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const glugs = [
        { f1: 320, f2: 160, dur: 0.22, delay: 0 },
        { f1: 380, f2: 190, dur: 0.25, delay: 0.28 },
      ];
      glugs.forEach((g) => {
        const start = now + g.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(g.f1, start);
        osc.frequency.exponentialRampToValueAtTime(g.f2, start + g.dur);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + g.dur + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + g.dur + 0.08);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Stage 3: Refreshing finishing ice-water chime when hydration is completed
   */
  public playWaterComplete() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
        const start = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Coin shower sound for slacking reward
   */
  public playCoinShower() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const coins = [987.77, 1318.51, 1567.98, 2093.0];
      coins.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.setValueAtTime(freq * 1.5, start + 0.03);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Sci-Fi radar beep for distance tracking
   */
  public playRadarLockBeep(pitch: number = 880) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Target Acquired / Distance Calibration Complete Sci-Fi Success Chime
   */
  public playTargetAcquired() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const notes = [659.25, 880, 1174.66, 1760]; // E5, A5, D6, A6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Rapid cartoon escape footstep sound for overtime run-away
   */
  public playEscapeRun() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      for (let i = 0; i < 6; i++) {
        const start = ctx.currentTime + i * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(220 + (i % 2) * 80, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.04);
      }
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Mechanical receipt printer buzz/whir sound
   */
  public playPrintBuzz() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const start = now + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150 + Math.random() * 40, start);
        osc.frequency.linearRampToValueAtTime(100 + Math.random() * 30, start + 0.1);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.12);
      }
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Gloomy square glitch for Frown / Depressed mood
   */
  public playFrownPenalty() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Sad trombone fail jingle
      const freqs = [349.23, 329.63, 293.66, 261.63]; // F4, E4, D4, C4
      freqs.forEach((freq, idx) => {
        const start = now + idx * 0.13;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        if (idx === freqs.length - 1) {
          osc.frequency.linearRampToValueAtTime(freq * 0.75, start + 0.35);
        }
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === freqs.length - 1 ? 0.4 : 0.15));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + (idx === freqs.length - 1 ? 0.4 : 0.15));
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Urgent Tactical Warning Alarm Siren for Radar / Proximity Alert (雷達過近警報聲)
   */
  public playProximityAlert() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Alternating high-urgency alarm cycles (急促雙音警報聲: 嗶嗚嗶嗚)
      const pulses = [
        { f: 940, dur: 0.1, delay: 0 },
        { f: 720, dur: 0.1, delay: 0.11 },
        { f: 940, dur: 0.1, delay: 0.22 },
        { f: 720, dur: 0.1, delay: 0.33 },
        { f: 960, dur: 0.12, delay: 0.44 },
        { f: 740, dur: 0.12, delay: 0.57 },
      ];

      pulses.forEach((p) => {
        const start = now + p.delay;

        // Main alarm tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(p.f, start);
        osc.frequency.linearRampToValueAtTime(p.f * 0.94, start + p.dur);

        gain.gain.setValueAtTime(0.24, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + p.dur);

        // Sub-harmonic resonant horn tone (1 octave lower for alarm acoustic presence)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'square';
        subOsc.frequency.setValueAtTime(p.f * 0.5, start);

        subGain.gain.setValueAtTime(0.08, start);
        subGain.gain.exponentialRampToValueAtTime(0.001, start + p.dur);

        // Acoustic lowpass filter to produce realistic siren horn acoustics
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, start);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + p.dur);
        subOsc.start(start);
        subOsc.stop(start + p.dur);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Heavy industrial sawtooth buzzer for Sedentary Lock
   */
  public playSedentaryAlarm() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Mechanical twin-bell alarm clock ringing
      for (let i = 0; i < 6; i++) {
        const start = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1046.5, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.07);
      }
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Urgent triple downward pulse for Overtime warning
   */
  public playOvertimeAlarm() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Wailing panic siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.15);
      osc.frequency.linearRampToValueAtTime(500, now + 0.3);
      osc.frequency.linearRampToValueAtTime(900, now + 0.45);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }
}

export const soundSynth = new SoundSynthEngine();
