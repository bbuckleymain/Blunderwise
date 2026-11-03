/** Small synthesized move sounds (no audio files needed). */
export type SoundKind = 'move' | 'capture' | 'check' | 'end' | 'warn';

let enabled = true;
let ctx: AudioContext | null = null;

export function setSoundsEnabled(on: boolean): void {
  enabled = on;
}

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(a: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType = 'sine'): void {
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** A short wooden "tock": filtered noise plus a low thump. */
function knock(a: AudioContext, start: number, gain: number, freq: number, dur: number): void {
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(start);
  tone(a, 150, start, dur, gain * 0.6);
}

export function playSound(kind: SoundKind): void {
  if (!enabled) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  switch (kind) {
    case 'move':
      knock(a, t, 0.9, 900, 0.06);
      break;
    case 'capture':
      knock(a, t, 1.3, 600, 0.11);
      knock(a, t + 0.05, 0.8, 1200, 0.05);
      break;
    case 'check':
      knock(a, t, 1.0, 900, 0.06);
      tone(a, 880, t + 0.05, 0.18, 0.12, 'triangle');
      break;
    case 'end':
      tone(a, 523, t, 0.25, 0.14, 'triangle');
      tone(a, 659, t + 0.12, 0.25, 0.14, 'triangle');
      tone(a, 784, t + 0.24, 0.4, 0.14, 'triangle');
      break;
    case 'warn':
      tone(a, 330, t, 0.15, 0.12, 'square');
      break;
  }
}

/** Which sound a just-played move should make. */
export function soundForMove(m: { captured?: string; san: string }): SoundKind {
  if (m.san.includes('#')) return 'end';
  if (m.san.includes('+')) return 'check';
  return m.captured ? 'capture' : 'move';
}
