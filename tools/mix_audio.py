"""Deterministic FFmpeg audio post for the Remotion reel.

voice.wav + music.wav -> public/audio/final-mix.wav

  * music is side-chain ducked under the Persian narration
  * EBU R128 loudness normalisation (-14 LUFS, extra true-peak headroom
    because Remotion re-encodes to AAC at render time)
  * fades + exact 60.00 s trim

The resulting WAV is committed, so GitHub Actions renders fully offline.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from src.config import (  # noqa: E402
    FINAL_MIX, MUSIC_TRACK, VOICE_TRACK, ffmpeg_binaries, storyboard,
)

FF, _ = ffmpeg_binaries()


def main():
    sb = storyboard()
    for p in (VOICE_TRACK, MUSIC_TRACK):
        if not p.exists():
            raise SystemExit(f"missing {p} — run: python tools/build_voice.py --offline && "
                             "python tools/build_music.py")

    dur = sb["duration"]
    fc = (
        "[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        "asplit=2[voice_main][voice_sc];"
        "[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        "volume=0.72[musicsrc];"
        "[musicsrc][voice_sc]sidechaincompress=threshold=0.025:ratio=9:"
        "attack=15:release=420[ducked];"
        "[voice_main][ducked]amix=inputs=2:duration=first:normalize=0[mix];"
        "[mix]loudnorm=I=-14:TP=-1.7:LRA=11,"
        f"afade=t=in:st=0:d=0.5,afade=t=out:st={dur - 0.9:.2f}:d=0.9,"
        f"atrim=0:{dur},asetpts=PTS-STARTPTS[a]"
    )
    cmd = [
        FF, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(VOICE_TRACK), "-i", str(MUSIC_TRACK),
        "-filter_complex", fc, "-map", "[a]",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(FINAL_MIX),
    ]
    subprocess.run(cmd, check=True)
    print("final mix:", FINAL_MIX, FINAL_MIX.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
