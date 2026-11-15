/**
 * Synthesized Web Audio Sound & Atmosphere System for Maze of Mazes
 * - Independent Master, SFX, and Ambience volume controls with local storage persistence.
 * - Procedural category-specific ambient soundscapes (Classic, Horror, Puzzle, Hazard, Impossible).
 * - Rate-limited audio triggers to prevent sound stacking/clipping.
 * - Zero external media dependencies; 100% synthesized hermetically via Web Audio API.
 */

import { CategoryId } from '../types/maze';

interface AudioPreferences {
  masterVolume: number; // 0.0 - 1.0
  sfxVolume: number; // 0.0 - 1.0
  ambientVolume: number; // 0.0 - 1.0
  isMuted: boolean;
}

const STORAGE_KEY = 'maze_of_mazes_audio_preferences';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Preferences
  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.8;
  private ambientVolume: number = 0.55;
  private isMuted: boolean = false;

  // Ambience loop state
  private currentAmbienceCategory: CategoryId | 'menu' | null = null;
  private ambientNodes: Array<{ osc?: OscillatorNode; noise?: AudioNode; gain: GainNode }> = [];
  private ambientTimer: number | null = null;

  // Sound event throttling (prevents stacking on rapid input)
  private lastSoundTimes: Map<string, number> = new Map();

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Partial<AudioPreferences> = JSON.parse(stored);
        if (typeof parsed.masterVolume === 'number') this.masterVolume = Math.max(0, Math.min(1, parsed.masterVolume));
        if (typeof parsed.sfxVolume === 'number') this.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
        if (typeof parsed.ambientVolume === 'number') this.ambientVolume = Math.max(0, Math.min(1, parsed.ambientVolume));
        if (typeof parsed.isMuted === 'boolean') this.isMuted = parsed.isMuted;
      }
    } catch {
      // Storage unavailable or corrupted
    }
  }

  private savePreferences(): void {
    try {
      const prefs: AudioPreferences = {
        masterVolume: this.masterVolume,
        sfxVolume: this.sfxVolume,
        ambientVolume: this.ambientVolume,
        isMuted: this.isMuted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Local storage unavailable
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Build Gain Hierarchy:
        // Source -> sfxGain / ambientGain -> masterGain -> destination
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.ambientGain = this.ctx.createGain();

        this.updateGainLevels();

        this.sfxGain.connect(this.masterGain);
        this.ambientGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch {
      // Web Audio unsupported
    }
    return this.ctx;
  }

  private updateGainLevels(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const targetMaster = this.isMuted ? 0 : this.masterVolume;
    const targetSfx = this.sfxVolume;
    const targetAmbient = this.ambientVolume;

    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(targetMaster, now + 0.05);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, now);
      this.sfxGain.gain.linearRampToValueAtTime(targetSfx, now + 0.05);
    }
    if (this.ambientGain) {
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.linearRampToValueAtTime(targetAmbient, now + 0.05);
    }
  }

  // --- Volume Getters & Setters ---

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateGainLevels();
    this.savePreferences();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.updateGainLevels();
    this.savePreferences();
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setAmbientVolume(vol: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    this.updateGainLevels();
    this.savePreferences();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateGainLevels();
    this.savePreferences();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Sound event rate limiting helper to prevent audio distortion/stacking.
   */
  private checkThrottle(id: string, minIntervalMs: number): boolean {
    const now = performance.now();
    const last = this.lastSoundTimes.get(id) || 0;
    if (now - last < minIntervalMs) {
      return false;
    }
    this.lastSoundTimes.set(id, now);
    return true;
  }

  // ==========================================
  // PROCEDURAL CATEGORY AMBIENT SOUNDSCAPES
  // ==========================================

  public setCategoryAmbience(category: CategoryId | 'menu' | null): void {
    if (this.currentAmbienceCategory === category) return;
    this.stopAmbience();

    this.currentAmbienceCategory = category;
    if (!category || this.isMuted) return;

    const ctx = this.initContext();
    if (!ctx || !this.ambientGain) return;

    if (category === 'menu' || category === 'classic') {
      // Warm, sunny, airy breeze drone (warm major pentatonic pad)
      this.createDronePads([130.81, 164.81, 196.00], 'sine', 0.05, 0.3);
    } else if (category === 'horror') {
      // Low sinister wind drone (sub-bass 48Hz + resonant hollow breath)
      this.createDronePads([48.0, 72.0], 'sawtooth', 0.035, 120);
    } else if (category === 'puzzle') {
      // Mystical ancient crystalline drone (ethereal 5th intervals)
      this.createDronePads([146.83, 220.00, 293.66], 'triangle', 0.045, 0.4);
    } else if (category === 'hazard') {
      // Subterranean cavern rumble & distant tide
      this.createDronePads([58.27, 87.31], 'sine', 0.06, 0.2);
    } else if (category === 'impossible') {
      // Cosmic astral harmonic shimmer (detuned dual frequencies)
      this.createDronePads([174.61, 261.63, 349.23], 'sine', 0.04, 0.5);
    }
  }

  private createDronePads(
    freqs: number[],
    type: OscillatorType,
    baseGain: number,
    filterFreqOrLfo: number
  ): void {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Gentle slow detune pulse for natural atmosphere
      const detune = (idx - 1) * 3;
      osc.detune.setValueAtTime(detune, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(baseGain, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ambientGain!);

      osc.start();
      this.ambientNodes.push({ osc, gain });
    });
  }

  public stopAmbience(): void {
    if (this.ctx && this.ambientNodes.length > 0) {
      const now = this.ctx.currentTime;
      this.ambientNodes.forEach((node) => {
        try {
          node.gain.gain.cancelScheduledValues(now);
          node.gain.gain.linearRampToValueAtTime(0.001, now + 0.6);
          if (node.osc) {
            node.osc.stop(now + 0.7);
          }
        } catch {}
      });
    }
    this.ambientNodes = [];
    this.currentAmbienceCategory = null;
  }

  // ==========================================
  // GAMEPLAY SOUND EFFECTS (SFX)
  // ==========================================

  /**
   * Footstep sound: warm, tactile stone tap
   */
  public playStep(): void {
    if (this.isMuted || !this.checkThrottle('step', 110)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const pitch = 220 + Math.random() * 40;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * Bump into wall / locked obstacle: soft tactile thud
   */
  public playBump(): void {
    if (this.isMuted || !this.checkThrottle('bump', 140)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * Chamber advance chime for Menu journey
   */
  public playChamberAdvance(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const notes = [329.63, 440, 554.37]; // E4, A4, C#5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
    });
  }

  /**
   * Chamber rewind chime for Menu journey
   */
  public playChamberRewind(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const notes = [554.37, 440, 329.63];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.25);
    });
  }

  /**
   * Entering Portal: ascending warm chord
   */
  public playPortalEnter(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const chord = [261.63, 329.63, 392.00, 523.25, 659.25];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + idx * 0.09 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(ctx.currentTime + idx * 0.09);
      osc.stop(ctx.currentTime + idx * 0.09 + 0.65);
    });
  }

  /**
   * Victory triumphant fanfare
   */
  public playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const notes = [
      { f: 392.00, t: 0.00, d: 0.18 }, // G4
      { f: 523.25, t: 0.16, d: 0.18 }, // C5
      { f: 659.25, t: 0.32, d: 0.20 }, // E5
      { f: 783.99, t: 0.48, d: 0.45 }, // G5
      { f: 1046.50, t: 0.70, d: 0.75 }, // C6
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);

      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d + 0.05);
    });
  }

  /**
   * Horror footstep: muffled, hollow reverberant stone tap
   */
  public playHorrorStep(): void {
    if (this.isMuted || !this.checkThrottle('horror_step', 110)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Heartbeat pulse: double thump (lub-dub) that scales with stalker proximity
   */
  public playHeartbeat(proximityFactor: number): void {
    if (this.isMuted || !this.checkThrottle('heartbeat', 300)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const vol = Math.min(0.24, 0.06 + proximityFactor * 0.18);

    // First beat (lub)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    gain1.gain.setValueAtTime(vol, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.11);

    // Second beat (dub) ~120ms later
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(65, ctx.currentTime + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.22);
    gain2.gain.setValueAtTime(vol * 0.85, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.23);
  }

  /**
   * Stalker Alert: tense dissonant tritone swell
   */
  public playStalkerAlert(): void {
    if (this.isMuted || !this.checkThrottle('stalker_alert', 600)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const freqs = [293.66, 415.30];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    });
  }

  /**
   * Stalker Lose Pursuit: descending sigh
   */
  public playStalkerLose(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.42);
  }

  /**
   * Defeat Sting: low resonant shadow gong
   */
  public playDefeatSound(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.9);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.95);
  }

  /**
   * Puzzle: Key Pickup (crystalline double-bell chime)
   */
  public playKeyPickup(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    [587.33, 880.00, 1174.66].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + i * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.32);
    });
  }

  /**
   * Puzzle: Locked Door Open (heavy stone portcullis slide)
   */
  public playDoorUnlock(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.38);
  }

  /**
   * Puzzle: Pressure plate depressed (solid mechanical brass click)
   */
  public playPlateClick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * Puzzle: Switch toggle (metallic latch)
   */
  public playSwitchToggle(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Puzzle: Sequence success chime
   */
  public playSequenceSuccess(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    [440, 554.37, 659.25, 880].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.42);
    });
  }

  /**
   * Puzzle: Sequence error reset buzzer
   */
  public playSequenceError(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.setValueAtTime(110, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.26);
  }

  /**
   * Hazard: Water splash & ripple
   */
  public playWaterSplash(): void {
    if (this.isMuted || !this.checkThrottle('splash', 140)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
  }

  /**
   * Hazard: Spikes warning rattle
   */
  public playSpikeWarning(): void {
    if (this.isMuted || !this.checkThrottle('spike_warn', 300)) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * Impossible Geometry: Quantum portal warp
   */
  public playPortalWarp(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.38);
  }
}

export const sounds = new SoundSystem();
