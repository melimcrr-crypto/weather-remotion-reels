"""Persian voice-over + word-level timing for the Remotion reel.

Online (default) uses edge-tts neural voices (no API key) and captures real
``WordBoundary`` events.  Those timestamps drive:

  * the burned-in RTL karaoke captions rendered by React (captions/lines.json)
  * Abrak's lip-sync (captions/visemes.json)
  * the soft SRT delivery track (captions/fa.srt)

Offline / CI mode (``--offline``) re-derives every timing artifact from the
committed MP3s + captions/mix.json + captions/words.json.  GitHub Actions
needs **no network and no TTS service**.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from src.config import (  # noqa: E402
    AUDIO, BUILD, CAPTIONS, LINES_JSON, MIX_JSON, SRT_FILE, VISEMES_JSON,
    VOICE_TRACK, WORDS_JSON, ffmpeg_binaries, probe_duration, storyboard,
)

FF, FP = ffmpeg_binaries()
SR = 48000
LEAD = 0.42
RATE_LADDER = ["+6%", "+14%", "+22%", "+32%", "+44%", "+55%"]
BREAKERS = set(".!?؟؛،,:؛")


async def synth(text: str, voice: str, rate: str, pitch: str, out_path: Path):
    import edge_tts

    comm = edge_tts.Communicate(
        text, voice, rate=rate, pitch=pitch, boundary="WordBoundary"
    )
    words = []
    with open(out_path, "wb") as fh:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                fh.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "s": chunk["offset"] / 1e7,
                    "e": (chunk["offset"] + chunk["duration"]) / 1e7,
                    "w": chunk["text"],
                })
    return words


def online_build(sb):
    AUDIO.mkdir(parents=True, exist_ok=True)
    mix, all_words = [], []
    print(f"voice: {sb['voice']}  pitch={sb['voice_pitch']}  rate>={sb['voice_rate']}")

    for i, scene in enumerate(sb["scenes"]):
        clip = AUDIO / f"voice_{i:02d}_{scene['id']}.mp3"
        rel = clip.relative_to(ROOT).as_posix()
        budget = scene["duration"] - LEAD - 0.30
        chosen = None
        words = []
        for rate in RATE_LADDER:
            words = asyncio.run(synth(scene["narration"], sb["voice"], rate,
                                      sb["voice_pitch"], clip))
            d = probe_duration(clip)
            print(f"  {scene['id']:<14} rate={rate:<5} dur={d:5.2f}s  budget={budget:5.2f}s")
            if d <= budget:
                chosen = (rate, d)
                break
        if chosen is None:
            rate, d = RATE_LADDER[-1], probe_duration(clip)
            print(f"  WARNING: {scene['id']} is {d:.2f}s > {budget:.2f}s; shorten narration")
            chosen = (rate, d)
        rate, d = chosen
        at = scene["start"] + LEAD
        mix.append({
            "file": rel, "at": at, "duration": d,
            "scene": scene["id"], "rate": rate,
        })
        for w in words:
            all_words.append({
                "s": round(at + w["s"], 4),
                "e": round(at + w["e"], 4),
                "w": w["w"],
                "scene": i,
            })
    all_words.sort(key=lambda w: w["s"])
    MIX_JSON.write_text(json.dumps(mix, ensure_ascii=False, indent=2), encoding="utf-8")
    WORDS_JSON.write_text(json.dumps(all_words, ensure_ascii=False, indent=2), encoding="utf-8")
    return mix, all_words


def offline_load():
    mix = json.loads(MIX_JSON.read_text(encoding="utf-8"))
    words = json.loads(WORDS_JSON.read_text(encoding="utf-8"))
    return mix, words


def decode_pcm(path: Path) -> np.ndarray:
    raw = subprocess.run(
        [FF, "-v", "error", "-i", str(path), "-f", "f32le", "-acodec", "pcm_f32le",
         "-ac", "2", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).copy()


def mix_voice_track(sb, mix):
    BUILD.mkdir(parents=True, exist_ok=True)
    total = int(round(sb["duration"] * SR))
    buf = np.zeros((total, 2), dtype=np.float64)
    for item in mix:
        pcm = decode_pcm(ROOT / item["file"])
        start = int(round(item["at"] * SR))
        end = min(total, start + len(pcm))
        if start >= total:
            continue
        buf[start:end] += pcm[: end - start]
    peak = float(np.max(np.abs(buf))) or 1.0
    if peak > 0.97:
        buf *= 0.97 / peak
    pcm16 = (np.clip(buf, -1, 1) * 32767).astype("<i2")
    with wave.open(str(VOICE_TRACK), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm16.tobytes())


def group_lines(words, sb):
    """Short, readable karaoke lines for a 952 px vertical caption box."""
    lines, cur = [], []
    scene_ends = [s["start"] + s["duration"] for s in sb["scenes"]]

    def flush():
        if cur:
            lines.append({
                "start": round(cur[0]["s"] - 0.12, 3),
                "end": round(cur[-1]["e"] + 0.48, 3),
                "words": list(cur),
            })
            cur.clear()

    for w in words:
        too_long = cur and (w["e"] - cur[0]["s"] > 4.2 or len(cur) >= 6)
        cross_scene = cur and w["scene"] != cur[-1]["scene"]
        if too_long or cross_scene:
            flush()
        cur.append(w)
        if any(ch in BREAKERS for ch in w["w"]) and len(cur) >= 3:
            flush()
    flush()
    for i, line in enumerate(lines):
        line["start"] = max(0.0, line["start"])
        if i + 1 < len(lines):
            line["end"] = min(line["end"], lines[i + 1]["start"] - 0.02)
        line["end"] = max(line["end"], line["start"] + 0.45)
    return lines


def ts_srt(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        s, ms = s + 1, 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_captions(lines, words, sb):
    CAPTIONS.mkdir(parents=True, exist_ok=True)
    LINES_JSON.write_text(json.dumps(lines, ensure_ascii=False, indent=2), encoding="utf-8")
    # visemes = exactly the spoken word spans (mouth opens on each word)
    vis = [{"s": w["s"], "e": w["e"]} for w in words]
    VISEMES_JSON.write_text(json.dumps(vis, ensure_ascii=False, indent=2), encoding="utf-8")

    out = []
    for i, line in enumerate(lines, 1):
        text = " ".join(w["w"] for w in line["words"])
        out.append(f"{i}\n{ts_srt(line['start'])} --> {ts_srt(line['end'])}\n{text}\n")
    SRT_FILE.write_text("\n".join(out), encoding="utf-8")
    return len(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true",
                    help="rebuild timings from committed MP3s (no network)")
    args = ap.parse_args()
    sb = storyboard()
    mix, words = offline_load() if args.offline else online_build(sb)
    mix_voice_track(sb, mix)
    lines = group_lines(words, sb)
    n = write_captions(lines, words, sb)
    spans = (words[-1]["e"] - words[0]["s"]) if words else 0
    print(f"clips={len(mix)} words={len(words)} lines={n} "
          f"speech_span={spans:.1f}s voice_track={VOICE_TRACK}")


if __name__ == "__main__":
    main()
