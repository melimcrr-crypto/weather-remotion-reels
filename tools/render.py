"""One-command orchestrator: audio -> Remotion -> FFmpeg edit -> QA.

    python tools/render.py                     # full 1080x1920, 60 s, QA gate
    python tools/render.py --preview          # 10 s, 40% scale, no QA (fast look)
    python tools/render.py --concurrency 8    # faster on big machines

CI runs the same command through ``make render``.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from src.config import BUILD, FINAL_MIX, REMOTION_OUT, RENDERED, storyboard  # noqa: E402


def ensure_audio():
    if FINAL_MIX.exists():
        print(f"[audio] using committed {FINAL_MIX.relative_to(ROOT)}")
        return
    print("[audio] generating voice timings + music + final mix ...")
    subprocess.run([sys.executable, "tools/build_voice.py", "--offline"],
                   cwd=ROOT, check=True)
    subprocess.run([sys.executable, "tools/build_music.py"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "tools/mix_audio.py"], cwd=ROOT, check=True)


def remotion_render(out: Path, scale: float, frames: str | None, concurrency: int):
    BUILD.mkdir(parents=True, exist_ok=True)
    cmd = [
        "npx", "remotion", "render", "src/index.ts", "WeatherReels", str(out),
        "--codec=h264", "--audio-codec=aac", "--jpeg-quality=92",
        f"--concurrency={concurrency}", "--overwrite", "--log=info",
    ]
    if scale != 1.0:
        cmd.append(f"--scale={scale}")
    if frames:
        cmd.append(f"--frames={frames}")
    print("[remotion]", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)
    print("[remotion] ->", out, out.stat().st_size, "bytes")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true",
                    help="10 s at 40%% scale, no edit/QA (fast visual check)")
    ap.add_argument("--scale", type=float, default=None)
    ap.add_argument("--frames", default=None, help="Remotion frame range, e.g. 0-299")
    ap.add_argument("--concurrency", type=int,
                    default=min(4, max(1, os.cpu_count() or 2)),
                    help="Chrome tabs; automatically capped at available cores")
    ap.add_argument("--skip-remotion", action="store_true",
                    help="reuse build/remotion.mp4 and only redo edit + QA")
    args = ap.parse_args()

    sb = storyboard()
    ensure_audio()
    scale = args.scale if args.scale is not None else (0.4 if args.preview else 1.0)
    frames = args.frames if args.frames is not None else ("0-299" if args.preview else None)

    if args.preview:
        out = BUILD / "preview.mp4"
        if not args.skip_remotion:
            remotion_render(out, scale, frames, args.concurrency)
        sheet = BUILD / "preview-sheet.png"
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(out),
            "-vf", "fps=1/2,scale=216:-1,tile=3x2:padding=8:margin=8:color=0x0B2A4A",
            "-frames:v", "1", str(sheet),
        ], check=True)
        print("[preview] video:", out)
        print("[preview] sheet:", sheet)
        return

    if not args.skip_remotion:
        remotion_render(REMOTION_OUT, scale, frames, args.concurrency)
    subprocess.run([sys.executable, "tools/edit.py", "--src", str(REMOTION_OUT)],
                   cwd=ROOT, check=True)
    subprocess.run([sys.executable, "tools/qa.py"], cwd=ROOT, check=True)
    print("\n[done] master:", RENDERED / "weather-reels-1080x1920.mp4")
    print("[done] duration:", sb["duration"], "s |", sb["width"], "x", sb["height"])


if __name__ == "__main__":
    main()
