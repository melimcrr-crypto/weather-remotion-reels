---
name: weather-remotion-reels
description: Build, edit and QA a Persian 60-second Instagram Reels explainer with Remotion, edge-tts and FFmpeg. Use when the user asks for a vertical/Instagram educational animation, RTL karaoke captions, a Remotion video, or a deterministic CI-rendered MP4.
---

# Skill: weather-remotion-reels

## What this produces

A 1080×1920 (9:16), 30 fps, 60.00 s Persian educational MP4 with:

- a React/Remotion character animation (cloud mascot «ابرک»),
- Persian neural voice-over with word-level karaoke captions,
- procedural music, ducked under speech and loudness-normalised,
- a soft `mov_text` subtitle track tagged `fas`,
- 4:5 and 1:1 feed variants, GIF preview, contact sheet and `qa.json`,
- a GitHub Actions workflow that renders and publishes the MP4s.

## Quick start

```bash
bash scripts/setup_local.sh   # ffmpeg, Chrome libs, npm ci, pip, browser ensure
make preview                  # 10 s / 40% scale smoke test
make render                   # full 1080x1920 + edit + QA
```

CI command (already in `.github/workflows/render.yml`): `python3 tools/render.py`.

## Workflow for the agent

1. **Read `src/storyboard.json`.** All content, timing, palette and dimensions
   live there. Do not edit React components to change copy.
2. **If narration changed**, run `python3 tools/build_voice.py` (online),
   then `python3 tools/build_music.py`, then `python3 tools/mix_audio.py`.
   If only visuals changed, skip straight to step 3 — the committed audio
   already matches the storyboard.
3. **Render** with `python3 tools/render.py`. It orchestrates:
   Remotion → `tools/edit.py` (FFmpeg master + variants) → `tools/qa.py`.
4. **Inspect** `rendered/contact-sheet.png` and
   `rendered/caption-check.png` visually. Numbers in `rendered/qa.json` are
   necessary but not sufficient.
5. **Fix failures at the source.** Never relax `tools/qa.py`.

## Key facts to remember

- Remotion Free License applies to individuals / teams ≤ 3 people; larger
  organisations need a paid key. `remotion.config.ts` declares
  `free-license` explicitly.
- `Html5Audio` (from `remotion`, formerly `<Audio>`) plays the committed
  `public/audio/final-mix.wav`; the newest `<Audio>` lives in
  `@remotion/media`, but `Html5Audio` is the stable SSR-friendly choice.
- Fonts load through `@remotion/fonts` + `delayRender()`; without that,
  Persian glyphs fall back and RTL shaping breaks.
- Captions are **burned in by React**, not by FFmpeg `ass`. That avoids all
  HarfBuzz/`shaping=complex` problems in distro FFmpeg builds.
- `--platform reels` in `ffmpeg-skill check.py` enforces 1080×1920, 30 fps,
  ≤ 90 s, −14 LUFS, −1 dBTP and the 8/20/5/12 % safe zones.
- Colour: Remotion tags H.264 as bt709/sRGB. `tools/edit.py` rewrites VUI
  with `h264_metadata` to plain BT.709 to get 0 warnings.
- `npx remotion render` downloads a pinned Chrome Headless Shell; run
  `npx remotion browser ensure` first in CI.

## References

- `AGENTS.md` — full agent contract and hard rules.
- `docs/ARCHITECTURE.md` — data flow and timing model.
- `docs/TOOL_CHOICE.md` — why Remotion, license notes, alternatives.
- `README.md` — deliverables and QA numbers.
