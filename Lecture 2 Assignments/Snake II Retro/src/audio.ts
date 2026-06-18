/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private volumeLevel: number = 3; // 0 to 5
  private isEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized lazily on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => console.log("Failed to resume audio context:", err));
    }
    return this.ctx;
  }

  setSettings(enabled: boolean, volume: number) {
    this.isEnabled = enabled;
    this.volumeLevel = volume;
  }

  private getGain(): number {
    // Map volume level 1-5 to a reasonable gentle gain (0.01 to 0.15 max)
    if (this.volumeLevel <= 0) return 0;
    return (this.volumeLevel / 5) * 0.08;
  }

  playTone(frequencies: number[], durations: number[], type: OscillatorType = "square") {
    if (!this.isEnabled || this.getGain() === 0) return;

    try {
      const ctx = this.initContext();
      if (!ctx || ctx.state === "suspended") return;

      let currentTime = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.getGain(), currentTime);
      masterGain.connect(ctx.destination);

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const duration = (durations[idx] || 100) / 1000; // convert to seconds

        osc.type = type;
        osc.frequency.setValueAtTime(freq, currentTime);

        // Gentle envelope to avoid harsh clicks
        noteGain.gain.setValueAtTime(0, currentTime);
        noteGain.gain.linearRampToValueAtTime(1.0, currentTime + 0.005);
        noteGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(currentTime);
        osc.stop(currentTime + duration);

        currentTime += duration;
      });
    } catch (e) {
      console.warn("Audio playback failed or blocked by browser policies:", e);
    }
  }

  playMenuClick() {
    // Fast high pitch blip
    this.playTone([600], [30], "sine");
  }

  playEat() {
    // Two rapid high-pitched notes
    this.playTone([880, 1320], [60, 80], "square");
  }

  playBonusEat() {
    // A quick ascending retro arpeggio
    this.playTone([523.25, 659.25, 783.99, 1046.50], [70, 70, 70, 120], "square");
  }

  playCrash() {
    // Harsh retro descending buzz
    this.playTone([330, 220, 110], [150, 150, 250], "sawtooth");
  }

  playLevelUp() {
    // Upbeat celebratory chiptune motif
    this.playTone(
      [587.33, 659.25, 698.46, 783.99, 880.00, 1046.50],
      [100, 100, 100, 100, 150, 250],
      "square"
    );
  }

  playBonusAppear() {
    // High-pitched notification chirp
    this.playTone([987.77, 1318.51, 1567.98], [80, 80, 120], "square");
  }
}

export const audio = new AudioEngine();
export default audio;
