"""Shared paths + helpers for the Python side of the pipeline.

The React side reads ``src/storyboard.json``; the Python side reads the same
file.  One storyboard, two renderers, zero drift.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STORYBOARD = ROOT / "src" / "storyboard.json"
PUBLIC = ROOT / "public"
AUDIO = PUBLIC / "audio"
FONTS = PUBLIC / "fonts"
CAPTIONS = ROOT / "captions"
BUILD = ROOT / "build"
RENDERED = ROOT / "rendered"
OUT = ROOT / "out"

WORDS_JSON = CAPTIONS / "words.json"
LINES_JSON = CAPTIONS / "lines.json"
VISEMES_JSON = CAPTIONS / "visemes.json"
MIX_JSON = CAPTIONS / "mix.json"
SRT_FILE = CAPTIONS / "fa.srt"
FINAL_MIX = AUDIO / "final-mix.wav"
VOICE_TRACK = BUILD / "voice.wav"
MUSIC_TRACK = BUILD / "music.wav"
REMOTION_OUT = BUILD / "remotion.mp4"


def storyboard() -> dict:
    return json.loads(STORYBOARD.read_text(encoding="utf-8"))


def ffmpeg_binaries() -> tuple[str, str]:
    ff = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg")
    fp = os.environ.get("FFPROBE_BIN") or shutil.which("ffprobe")
    if not ff or not fp:
        raise SystemExit(
            "FFmpeg/FFprobe not found. Install ffmpeg, or set FFMPEG_BIN / FFPROBE_BIN."
        )
    # make both visible on PATH for child tools (ffmpeg-skill check.py)
    bins = os.pathsep.join(sorted({str(Path(ff).parent), str(Path(fp).parent)}))
    os.environ["PATH"] = bins + os.pathsep + os.environ.get("PATH", "")
    return ff, fp


def probe(path: str | Path) -> dict:
    _, fp = ffmpeg_binaries()
    out = subprocess.run(
        [fp, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def probe_duration(path: str | Path) -> float:
    return float(probe(path)["format"]["duration"])
