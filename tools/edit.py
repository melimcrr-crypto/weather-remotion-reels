"""Final edit / delivery layer.

Input  : build/remotion.mp4  (Remotion's 1080x1920 render, audio already baked in)
Outputs: rendered/weather-reels-1080x1920.mp4   <- Instagram Reels / Stories master
         rendered/weather-feed-1080x1350.mp4   <- 4:5 feed, blurred safe padding
         rendered/weather-feed-1080x1080.mp4   <- 1:1 feed, blurred safe padding
         rendered/weather-reels-720x1280.mp4   <- light-weight Reels copy
         rendered/preview.gif, contact-sheet.png, caption-check.png
         rendered/weather.srt, rendered/qa.json (written by qa.py)

Deterministic FFmpeg only: soft RTL subtitle track, exact 60 s trim, no GUI.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from src.config import (  # noqa: E402
    BUILD, REMOTION_OUT, RENDERED, SRT_FILE, ffmpeg_binaries, probe, storyboard,
)

FF, FP = ffmpeg_binaries()


def run(cmd):
    print("  $", " ".join(str(c) for c in cmd)[:420], flush=True)
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def make_master(src: Path, out: Path, dur: float):
    run([
        FF, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src), "-i", str(SRT_FILE),
        "-map", "0:v:0", "-map", "0:a:0", "-map", "1:0",
        "-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text",
        # Remotion tags the H.264 VUI as bt709/sRGB; rewrite it to plain BT.709
        # so platform compliance checkers see a canonical SDR colour space.
        "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1",
        "-metadata:s:s:0", "language=fas",
        "-movflags", "+faststart", "-t", str(dur), str(out),
    ])
    print("  master ->", out.name, out.stat().st_size, "bytes")


def make_padded(src: Path, out: Path, w: int, h: int, dur: float):
    """Fit the whole 9:16 frame inside a feed canvas; blurred copy behind."""
    # The letterbox background is the same frame shrunk to a thumbnail and
    # blurred back up: cheap, and unlike a plain boxblur it does not leave a
    # recognisable ghost of the caption bar behind the foreground.
    vf = (
        "[0:v]split=2[bg][fg];"
        f"[bg]scale={w}:{h}:force_original_aspect_ratio=increase,"
        f"crop={w}:{h},scale=64:80,boxblur=8:1,"
        f"scale={w}:{h}:flags=bicubic,eq=brightness=-0.06:saturation=0.55[bgb];"
        f"[fg]scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos[fgv];"
        "[bgb][fgv]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]"
    )
    run([
        FF, "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
        "-filter_complex", vf, "-map", "[v]", "-map", "0:a:0", "-map", "0:s?",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-c:a", "copy", "-c:s", "copy",
        "-t", str(dur), "-movflags", "+faststart", str(out),
    ])
    print(f"  {w}x{h} ->", out.name, out.stat().st_size, "bytes")


def make_small(src: Path, out: Path, dur: float):
    run([
        FF, "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
        "-vf", "scale=720:1280:flags=lanczos",
        "-map", "0:v:0", "-map", "0:a:0", "-map", "0:s?",
        "-c:v", "libx264", "-preset", "medium", "-crf", "21",
        "-pix_fmt", "yuv420p", "-c:a", "copy", "-c:s", "copy",
        "-t", str(dur), "-movflags", "+faststart", str(out),
    ])


def make_gif(src: Path, out: Path):
    vf = ("fps=10,scale=300:-1:flags=lanczos,split[s0][s1];"
          "[s0]palettegen=stats_mode=diff[p];"
          "[s1][p]paletteuse=dither=bayer:bayer_scale=3")
    run([
        FF, "-y", "-hide_banner", "-loglevel", "error",
        "-ss", "2", "-t", "6", "-i", str(src),
        "-vf", vf, "-loop", "0", str(out),
    ])


def make_contact_sheet(src: Path, out: Path):
    vf = ("fps=1/10,scale=270:480:flags=lanczos,"
          "tile=3x2:padding=10:margin=10:color=0x0B2A4A")
    run([
        FF, "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
        "-vf", vf, "-frames:v", "1", str(out),
    ])


def make_caption_check(src: Path, out: Path):
    run([
        FF, "-y", "-hide_banner", "-loglevel", "error", "-ss", "12.5",
        "-i", str(src), "-frames:v", "1", str(out),
    ])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(REMOTION_OUT))
    ap.add_argument("--lightweight", action="store_true",
                    help="skip feed variants + GIF (fast local preview)")
    args = ap.parse_args()

    sb = storyboard()
    dur = sb["duration"]
    RENDERED.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)
    src = Path(args.src)
    if not src.exists():
        raise SystemExit(f"missing {src} — run the Remotion render first")
    if not SRT_FILE.exists():
        raise SystemExit(f"missing {SRT_FILE} — run: python tools/build_voice.py --offline")

    master = RENDERED / "weather-reels-1080x1920.mp4"
    print("[1/6] master (soft RTL subtitle + exact trim)")
    make_master(src, master, dur)
    if not args.lightweight:
        print("[2/6] 4:5 feed")
        make_padded(master, RENDERED / "weather-feed-1080x1350.mp4", 1080, 1350, dur)
        print("[3/6] 1:1 feed")
        make_padded(master, RENDERED / "weather-feed-1080x1080.mp4", 1080, 1080, dur)
        print("[4/6] light Reels copy + GIF")
        make_small(master, RENDERED / "weather-reels-720x1280.mp4", dur)
        make_gif(master, RENDERED / "preview.gif")
    else:
        print("[2-4/6] skipped (--lightweight)")
    print("[5/6] contact sheet, caption check, SRT")
    make_contact_sheet(master, RENDERED / "contact-sheet.png")
    make_caption_check(master, RENDERED / "caption-check.png")
    shutil.copyfile(SRT_FILE, RENDERED / "weather.srt")
    print("[6/6] probe")
    info = probe(master)
    print(json.dumps({
        "file": master.name,
        "duration": float(info["format"]["duration"]),
        "size_bytes": int(info["format"]["size"]),
        "streams": [
            {k: s.get(k) for k in ("codec_type", "codec_name", "width", "height",
                                   "r_frame_rate", "pix_fmt", "sample_rate", "channels")}
            for s in info["streams"]
        ],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
