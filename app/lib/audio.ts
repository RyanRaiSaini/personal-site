// ------------------------------------------------------------------
// The sound of the stadium, made from scratch in the browser. There
// are no audio files: the crowd is filtered noise that swells and
// settles, a goal is the same noise let loose, and the referee's
// whistle is two sine waves. It is off until the visitor turns it on.
//
// To make the crowd louder or quieter, change MASTER below.
// ------------------------------------------------------------------

const MASTER = 0.5;

export class StadiumSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wall: BiquadFilterNode | null = null; // muffles the crowd indoors
  private roar: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private running = false;

  private build() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    // Four seconds of soft noise, looped. Each sample leans on the one
    // before it, which takes the hiss out and leaves a rumble.
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.045 * white) / 1.045;
        data[i] = last * 5.5;
      }
    }
    this.noise = buffer;

    const master = ctx.createGain();
    master.gain.value = 0;
    const wall = ctx.createBiquadFilter();
    wall.type = "lowpass";
    wall.frequency.value = 9000;
    wall.connect(master);
    master.connect(ctx.destination);
    this.master = master;
    this.wall = wall;

    // The murmur: tens of thousands of people talking at once
    const murmur = this.loop();
    const body = ctx.createBiquadFilter();
    body.type = "bandpass";
    body.frequency.value = 520;
    body.Q.value = 0.55;
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.85;
    murmur.connect(body).connect(murmurGain).connect(wall);

    // It rises and falls a little, slowly, like a real crowd
    const tide = ctx.createOscillator();
    tide.frequency.value = 0.07;
    const tideDepth = ctx.createGain();
    tideDepth.gain.value = 0.22;
    tide.connect(tideDepth).connect(murmurGain.gain);
    tide.start();

    // Higher voices and whistles, quieter
    const chatter = this.loop(1.37);
    const bright = ctx.createBiquadFilter();
    bright.type = "bandpass";
    bright.frequency.value = 1900;
    bright.Q.value = 0.8;
    const chatterGain = ctx.createGain();
    chatterGain.gain.value = 0.16;
    chatter.connect(bright).connect(chatterGain).connect(wall);

    // The roar, silent until someone scores
    const roarSource = this.loop(0.83);
    const roarTone = ctx.createBiquadFilter();
    roarTone.type = "bandpass";
    roarTone.frequency.value = 1150;
    roarTone.Q.value = 0.45;
    const roar = ctx.createGain();
    roar.gain.value = 0;
    roarSource.connect(roarTone).connect(roar).connect(wall);
    this.roar = roar;
  }

  private loop(rate = 1): AudioBufferSourceNode {
    const ctx = this.ctx as AudioContext;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    source.playbackRate.value = rate;
    source.start(0, Math.random() * 3);
    return source;
  }

  // Must be called from a click or key press: browsers only allow
  // sound to start in answer to the visitor doing something
  start() {
    this.build();
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    this.running = true;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(MASTER, now, 0.6);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    this.running = false;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.25);
    window.setTimeout(() => {
      if (!this.running) void this.ctx?.suspend();
    }, 1200);
  }

  // Inside a room the crowd is heard through the walls
  setIndoors(indoors: boolean) {
    if (!this.ctx || !this.wall) return;
    this.wall.frequency.setTargetAtTime(indoors ? 420 : 9000, this.ctx.currentTime, 0.35);
  }

  // The crowd erupts, then settles over a few seconds
  cheer(strength = 1) {
    if (!this.running || !this.ctx || !this.roar) return;
    const now = this.ctx.currentTime;
    const gain = this.roar.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(1.5 * strength, now + 0.28);
    gain.setTargetAtTime(0.75 * strength, now + 0.6, 0.9);
    gain.setTargetAtTime(0, now + 2.6, 1.4);
  }

  // Boot on ball
  thump() {
    if (!this.running || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // The referee's whistle
  whistle(length = 0.5) {
    if (!this.running || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
    gain.gain.setValueAtTime(0.16, now + length - 0.05);
    gain.gain.linearRampToValueAtTime(0, now + length);
    // the pea rattling inside
    const trill = ctx.createOscillator();
    trill.frequency.value = 42;
    const trillDepth = ctx.createGain();
    trillDepth.gain.value = 0.07;
    trill.connect(trillDepth).connect(gain.gain);
    for (const frequency of [2850, 3020]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + length);
    }
    trill.start(now);
    trill.stop(now + length);
    gain.connect(this.master);
  }
}
