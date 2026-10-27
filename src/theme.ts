import storyboardJson from './storyboard.json';
import type {Storyboard} from './types';

export const sb = storyboardJson as unknown as Storyboard;
export const C = sb.palette;
export const FPS = sb.fps;
export const W = sb.width;
export const H = sb.height;
export const DURATION = sb.duration;
export const TOTAL_FRAMES = Math.round(DURATION * FPS);

/** Latin digits -> Persian digits (for on-screen numbers). */
export const fa = (n: number | string): string =>
  String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

/** Deterministic pseudo-random in [0,1) — no Math.random(), CI-safe. */
export const rnd = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));

/** Scene-local frame -> 0..1 progress, with a soft ease at both ends. */
export const ease = (t: number): number => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
