"""Post-render QA gate.  Checks pixels, audio and delivery files, not intentions.

Writes rendered/qa.json and exits 1 on any hard FAIL.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from src.config import RENDERED, ffmpeg_binaries, probe, storyboard  # noqa: E402

FF, FP = ffmpeg_binaries()
MASTER = RENDERED / "weather-reels-1080x1920.mp4"


def measure_loudness(path: Path):
    r = subprocess.run(
        [FF, "-hide_banner", "-nostats", "-i", str(path),
         "-map", "0:a:0", "-af",
         "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    hit = re.findall(r"\{\s*\"input_i\".*?\}", r.stderr, re.S)
    if not hit:
        return None
    try:
        return json.loads(hit[-1])
    except Exception:
        return None


def skill_check(master: Path):
    candidates = [
        ROOT / "build" / "ffmpeg-skill" / "scripts" / "check.py",
        Path("/tmp/ffmpeg-skill/scripts/check.py"),
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            env = dict(os.environ)
            bins = {str(Path(FF).parent), str(Path(FP).parent)}
            env["PATH"] = os.pathsep.join(sorted(bins)) + os.pathsep + env.get("PATH", "")
            r = subprocess.run(
                [sys.executable, str(path), str(master), "--platform", "reels",
                 "--json-brief"],
                capture_output=True, text=True, cwd=str(path.parent.parent),
                timeout=180, env=env,
            )
            raw = r.stdout
            brace = raw.find("{")
            parsed = None
            if brace >= 0:
                try:
                    parsed = json.loads(raw[brace:])
                except Exception:
                    parsed = None
            return {
                "tool": "kajisho5/ffmpeg-skill check.py",
                "exit": r.returncode,
                "report": parsed,
                "human": raw[:brace].strip() if brace > 0 else "",
                "stderr": r.stderr[-500:],
            }
        except Exception as exc:
            return {"error": str(exc)}
    return {"skipped": "ffmpeg-skill not checked out"}


def main():
    sb = storyboard()
    if not MASTER.exists():
        raise SystemExit(f"missing {MASTER}")

    info = probe(MASTER)
    fmt = info["format"]
    vids = [s for s in info["streams"] if s["codec_type"] == "video"]
    auds = [s for s in info["streams"] if s["codec_type"] == "audio"]
    subs = [s for s in info["streams"] if s["codec_type"] == "subtitle"]
    v = vids[0] if vids else {}
    dur = float(fmt["duration"])

    loud = measure_loudness(MASTER)
    li = float(loud["input_i"]) if loud and loud.get("input_i") not in (None, "-inf") else None
    tp = float(loud["input_tp"]) if loud and loud.get("input_tp") not in (None, "-inf") else None

    rows = []

    def row(name, ok, value, expected, hard=True):
        rows.append({"check": name,
                     "status": "PASS" if ok else ("FAIL" if hard else "WARN"),
                     "value": value, "expected": expected})

    row("duration", abs(dur - sb["duration"]) <= 0.20, round(dur, 3),
        f"{sb['duration']} +/- 0.20 s")
    row("resolution", (v.get("width"), v.get("height")) == (1080, 1920),
        f"{v.get('width')}x{v.get('height')}", "1080x1920 (9:16 Reels)")
    row("fps", str(sb["fps"]) in (v.get("r_frame_rate") or ""),
        v.get("r_frame_rate"), str(sb["fps"]))
    row("frame count", int(v.get("nb_frames") or 0) == sb["duration"] * sb["fps"],
        int(v.get("nb_frames") or 0), sb["duration"] * sb["fps"])
    row("video codec", v.get("codec_name") == "h264", v.get("codec_name"), "h264")
    row("pixel format", v.get("pix_fmt") == "yuv420p", v.get("pix_fmt"), "yuv420p")
    row("audio stream", len(auds) >= 1, len(auds), ">= 1")
    if auds:
        row("audio codec", auds[0].get("codec_name") == "aac",
            auds[0].get("codec_name"), "aac")
    row("soft RTL subtitle", len(subs) >= 1 and
        (subs[0].get("tags", {}).get("language") == "fas"),
        [s.get("tags", {}).get("language") for s in subs], "mov_text / fas")
    if li is not None:
        row("integrated loudness", -15.5 <= li <= -12.5, li, "-14 LUFS +/- 1.5")
    if tp is not None:
        row("true peak", tp <= -0.8, tp, "<= -0.8 dBTP")

    expected_variants = {
        "weather-feed-1080x1350.mp4": (1080, 1350),
        "weather-feed-1080x1080.mp4": (1080, 1080),
        "weather-reels-720x1280.mp4": (720, 1280),
    }
    variant_info = {}
    for name, (w, h) in expected_variants.items():
        p = RENDERED / name
        ok = p.exists()
        got = None
        if ok:
            pv = [s for s in probe(p)["streams"] if s["codec_type"] == "video"][0]
            got = f"{pv.get('width')}x{pv.get('height')}"
            ok = (pv.get("width"), pv.get("height")) == (w, h)
        variant_info[name] = got
        row(f"variant {name}", ok, got, f"{w}x{h}", hard=False)

    for name in ("preview.gif", "contact-sheet.png", "caption-check.png", "weather.srt"):
        row(f"deliverable {name}", (RENDERED / name).exists(), name, "exists")

    srt = (RENDERED / "weather.srt").read_text(encoding="utf-8") \
        if (RENDERED / "weather.srt").exists() else ""
    row("SRT has Persian text", bool(re.search(r"[\u0600-\u06FF]", srt)),
        len(srt), "contains Arabic-block glyphs")

    skill = skill_check(MASTER)
    report = {
        "file": MASTER.name,
        "duration": dur,
        "size_bytes": int(fmt["size"]),
        "video": {k: v.get(k) for k in ("codec_name", "width", "height",
                                        "r_frame_rate", "pix_fmt", "nb_frames")},
        "audio": [{k: a.get(k) for k in ("codec_name", "sample_rate", "channels")}
                  for a in auds],
        "subtitles": [{k: s.get(k) for k in ("codec_name", "tags")} for s in subs],
        "loudness": {"input_i": li, "input_tp": tp,
                     "input_lra": loud.get("input_lra") if loud else None,
                     "input_thresh": loud.get("input_thresh") if loud else None},
        "instagram_variants": variant_info,
        "checks": rows,
        "ffmpeg_skill": skill,
        "deliverables": sorted(f.name for f in RENDERED.iterdir() if not f.name.startswith(".")),
    }
    (RENDERED / "qa.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n=== QA ===")
    for r in rows:
        print(f"  {r['status']:<4} {r['check']:<34} {r['value']}")
    if skill.get("report"):
        print("  ffmpeg-skill:", {k: skill["report"].get(k)
                                 for k in ("ok", "failed", "warnings")})
    bad = [r for r in rows if r["status"] == "FAIL"]
    if bad:
        print(f"\n{len(bad)} hard FAIL(s)")
        sys.exit(1)
    print("\nall hard checks passed")


if __name__ == "__main__":
    main()
