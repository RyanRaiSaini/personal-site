// ------------------------------------------------------------------
// The sound of the stadium, made from scratch in the browser. There
// are no audio files. It is meant to sit under the page like the hum of
// a big building, not to be listened to:
//
//   - a low murmur and the hollow air of the bowl, always there, slowly
//     rising and falling
//   - now and then, from one side or the other, something far off: a
//     section of the crowd going "ooh", a short round of clapping, a
//     drum
//   - a roar when a goal goes in, and the thump of the boot on the ball
//
// It is off until the visitor turns it on.
//
// To make everything louder or quieter, change MASTER. To make the
// far-off sounds come more or less often, change EVENT_GAP.
// ------------------------------------------------------------------

// Overall loudness, from 0 to 1. (It was 0.5, which was far too loud:
// this measures about 15 decibels quieter.)
const MASTER = 0.09;
// Seconds between the far-off sounds: [shortest, longest]
const EVENT_GAP: [number, number] = [8, 20];

// How loud each part is, before MASTER
const LEVEL = {
  murmur: 0.55,
  air: 0.4,
  chatter: 0.06,
  swell: 0.2,
  clap: 0.085,
  drum: 0.13,
  roar: 0.6,
  thump: 0.4,
  whistle: 0.05,
};

const between = (low: number, high: number) => low + Math.random() * (high - low);

export class StadiumSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wall: BiquadFilterNode | null = null; // muffles everything indoors
  private roar: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private running = false;
  private nextEvent = 0;

  private build() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    // Six seconds of soft noise, looped. Each sample leans on the one
    // before it, which takes the hiss out and leaves a rumble.
    const length = ctx.sampleRate * 6;
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
    wall.frequency.value = 7000;
    wall.connect(master);
    master.connect(ctx.destination);
    this.master = master;
    this.wall = wall;

    // The murmur: a great many people talking at once, a long way off
    const murmur = this.loop();
    const body = ctx.createBiquadFilter();
    body.type = "bandpass";
    body.frequency.value = 470;
    body.Q.value = 0.5;
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = LEVEL.murmur;
    murmur.connect(body).connect(murmurGain).connect(wall);
    // It never sits still: two slow tides of different lengths move its
    // loudness, and a third moves its tone, so no two minutes are alike
    this.drift(murmurGain.gain, 0.05, LEVEL.murmur * 0.3);
    this.drift(murmurGain.gain, 0.021, LEVEL.murmur * 0.22);
    this.drift(body.frequency, 0.013, 110);

    // The air of a big hollow building
    const air = this.loop(0.5);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 170;
    const airGain = ctx.createGain();
    airGain.gain.value = LEVEL.air;
    air.connect(low).connect(airGain).connect(wall);
    this.drift(airGain.gain, 0.017, LEVEL.air * 0.3);

    // A little brightness on top: nearer voices
    const chatter = this.loop(1.37);
    const bright = ctx.createBiquadFilter();
    bright.type = "bandpass";
    bright.frequency.value = 1700;
    bright.Q.value = 0.9;
    const chatterGain = ctx.createGain();
    chatterGain.gain.value = LEVEL.chatter;
    chatter.connect(bright).connect(chatterGain).connect(wall);
    this.drift(chatterGain.gain, 0.11, LEVEL.chatter * 0.6);

    // The roar, silent until someone scores
    const roarSource = this.loop(0.83);
    const roarTone = ctx.createBiquadFilter();
    roarTone.type = "bandpass";
    roarTone.frequency.value = 1050;
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
    source.start(0, Math.random() * 5);
    return source;
  }

  // Moves a setting slowly up and down for ever
  private drift(target: AudioParam, hertz: number, depth: number) {
    const ctx = this.ctx as AudioContext;
    const wave = ctx.createOscillator();
    wave.frequency.value = hertz;
    const amount = ctx.createGain();
    amount.gain.value = depth;
    wave.connect(amount).connect(target);
    wave.start(0);
  }

  // Somewhere to the left or right, for the far-off sounds
  private placed(): AudioNode {
    const ctx = this.ctx as AudioContext;
    if (typeof ctx.createStereoPanner !== "function") return this.wall as AudioNode;
    const pan = ctx.createStereoPanner();
    pan.pan.value = between(-0.75, 0.75);
    pan.connect(this.wall as AudioNode);
    return pan;
  }

  // A section of the crowd, far away, going "ooh"
  private swell() {
    const ctx = this.ctx as AudioContext;
    const now = ctx.currentTime;
    const rise = between(0.9, 1.8);
    const fall = between(2.2, 3.6);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(LEVEL.swell * between(0.6, 1), now + rise);
    out.gain.setTargetAtTime(0, now + rise + 0.3, fall / 3);
    out.connect(this.placed());
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    source.playbackRate.value = between(0.9, 1.15);
    // two narrow bands, like the shape of a mouth saying "oh"
    for (const [frequency, q] of [
      [between(280, 340), 5],
      [between(820, 920), 6],
    ]) {
      const voice = ctx.createBiquadFilter();
      voice.type = "bandpass";
      voice.frequency.value = frequency;
      voice.Q.value = q;
      source.connect(voice).connect(out);
    }
    source.start(now, Math.random() * 5);
    source.stop(now + rise + fall + 1);
  }

  // A short round of clapping, starting together and falling apart
  private claps() {
    const ctx = this.ctx as AudioContext;
    const place = this.placed();
    const tone = ctx.createBiquadFilter();
    tone.type = "bandpass";
    tone.frequency.value = between(1900, 2600);
    tone.Q.value = 0.7;
    tone.connect(place);
    const count = Math.round(between(7, 14));
    let at = ctx.currentTime + 0.05;
    let gap = between(0.27, 0.34);
    for (let i = 0; i < count; i++) {
      const fade = 1 - i / (count + 2);
      const hit = ctx.createGain();
      hit.gain.setValueAtTime(LEVEL.clap * fade * between(0.7, 1), at);
      hit.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      source.playbackRate.value = 2.4;
      source.connect(hit).connect(tone);
      source.start(at, Math.random() * 5, 0.08);
      at += gap + between(-0.012, 0.012);
      gap *= 0.985;
    }
  }

  // A drum in the far stand: two or three slow beats
  private drum() {
    const ctx = this.ctx as AudioContext;
    const place = this.placed();
    const beats = Math.random() < 0.5 ? 2 : 3;
    const gap = between(0.42, 0.56);
    for (let i = 0; i < beats; i++) {
      const at = ctx.currentTime + 0.05 + i * gap;
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(96, at);
      osc.frequency.exponentialRampToValueAtTime(52, at + 0.16);
      const hit = ctx.createGain();
      hit.gain.setValueAtTime(LEVEL.drum, at);
      hit.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      osc.connect(hit).connect(place);
      osc.start(at);
      osc.stop(at + 0.34);
    }
  }

  // Every so often, one of the far-off sounds
  private schedule() {
    window.clearTimeout(this.nextEvent);
    this.nextEvent = window.setTimeout(
      () => {
        if (!this.running || !this.ctx) return;
        const pick = Math.random();
        if (pick < 0.45) this.swell();
        else if (pick < 0.8) this.claps();
        else this.drum();
        this.schedule();
      },
      between(EVENT_GAP[0], EVENT_GAP[1]) * 1000,
    );
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
    // fades in over a couple of seconds, so switching it on never startles
    this.master.gain.setTargetAtTime(MASTER, now, 0.9);
    this.schedule();
  }

  stop() {
    window.clearTimeout(this.nextEvent);
    if (!this.ctx || !this.master) return;
    this.running = false;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.25);
    window.setTimeout(() => {
      if (!this.running) void this.ctx?.suspend();
    }, 1200);
  }

  // Inside a room everything is heard through the walls
  setIndoors(indoors: boolean) {
    if (!this.ctx || !this.wall) return;
    this.wall.frequency.setTargetAtTime(indoors ? 380 : 7000, this.ctx.currentTime, 0.35);
  }

  // The crowd erupts, then settles over a few seconds
  cheer(strength = 1) {
    if (!this.running || !this.ctx || !this.roar) return;
    const now = this.ctx.currentTime;
    const gain = this.roar.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(LEVEL.roar * strength, now + 0.35);
    gain.setTargetAtTime(LEVEL.roar * 0.5 * strength, now + 0.7, 0.9);
    gain.setTargetAtTime(0, now + 2.6, 1.4);
  }

  // Boot on ball
  thump() {
    if (!this.running || !this.ctx || !this.wall) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(LEVEL.thump, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain).connect(this.wall);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // The referee's whistle, heard from the far end of the ground
  whistle(length = 0.5) {
    if (!this.running || !this.ctx || !this.wall) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(LEVEL.whistle, now + 0.03);
    gain.gain.setValueAtTime(LEVEL.whistle, now + length - 0.08);
    gain.gain.linearRampToValueAtTime(0, now + length);
    // the pea rattling inside
    const trill = ctx.createOscillator();
    trill.frequency.value = 42;
    const trillDepth = ctx.createGain();
    trillDepth.gain.value = LEVEL.whistle * 0.4;
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
    gain.connect(this.wall);
  }
}
