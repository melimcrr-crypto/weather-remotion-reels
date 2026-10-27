"""Procedural, licence-free background music (deterministic numpy synthesis).

Gmaj7 – Em7 – Cmaj7 – D6, a soft low pulse and a sparse bell arpeggio.
No samples, no network, no randomness: CI renders are reproducible.
Output: build/music.wav (stereo, 32 kHz, exactly ``duration`` seconds).
"""
from __future__ import annotations

import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from src.config import BUILD, MUSIC_TRACK, storyboard  # noqa: E402

SR = 32000

CHORDS = [
    (196.00, 246.94, 293.66, 369.99),  # Gmaj7
    (164.81, 196.00, 246.94, 293.66),  # Em7
    (130.81, 164.81, 196.00, 246.94),  # Cmaj7
    (146.83, 185.00, 220.00, 246.94),  # D6
]


def smooth(x):
    x = np.clip(x, 0.0, 1.0)
    return np.sin(x * np.pi / 2.0) ** 2


def build(duration: float, out_path: Path):
    n = int(round(duration * SR))
    t = np.arange(n, dtype=np.float64) / SR
    buf = np.zeros(n, dtype=np.float64)
    seg = duration / len(CHORDS)
    fade = 2.4

    for ci, chord in enumerate(CHORDS):
        start, end = ci * seg, (ci + 1) * seg
        w = smooth(np.minimum((t - start) / fade, (end - t) / fade))
        for k, f in enumerate(chord):
            vib = 0.5 * np.sin(2 * np.pi * (0.10 + 0.015 * k) * t)
            ph = 2 * np.pi * f * t + vib
            tone = (np.sin(ph) + 0.30 * np.sin(2 * ph + 0.4)
                    + 0.10 * np.sin(3 * ph + 1.1))
            buf += w * tone * (0.050 / len(chord))

    # soft "breeze" pulse every 2 seconds
    phase = np.mod(t, 2.0)
    buf += np.exp(-8.0 * phase) * np.sin(2 * np.pi * 62.0 * t) * 0.075

    # sparse bell arpeggio (sun glints)
    step = 0.7
    for j in range(int(duration / step)):
        at = j * step + 0.15
        idx = int(at / seg) % len(CHORDS)
        f = CHORDS[idx][(j * 3 + 1) % 4] * 2.0
        i0 = int(at * SR)
        i1 = min(n, i0 + int(0.40 * SR))
        if i0 >= n:
            break
        tt = t[i0:i1] - at
        bell = (np.sin(2 * np.pi * f * tt)
                + 0.28 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-8.0 * tt)
        buf[i0:i1] += bell * 0.026

    env = smooth(t / 2.4) * smooth((duration - t) / 3.2)
    buf *= env * 0.80
    peak = float(np.max(np.abs(buf))) or 1.0
    buf *= min(1.0, 0.92 / peak)

    right = np.concatenate([np.zeros(int(0.009 * SR)), buf])[:n]
    stereo = np.stack([buf, right], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return out_path


def main():
    sb = storyboard()
    out = build(sb["duration"], MUSIC_TRACK)
    print("music:", out, out.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
