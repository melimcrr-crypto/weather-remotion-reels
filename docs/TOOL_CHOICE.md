# Tool choice: Remotion (as requested)

The user explicitly linked
[`remotion-dev/remotion`](https://github.com/remotion-dev/remotion) and asked
for an Instagram-sized meteorology explainer. So **Remotion 4.0.539** is the
animation engine, with **FFmpeg** as the finishing/QA layer.

## Why Remotion fits this job

| Requirement | How Remotion delivers |
| --- | --- |
| Deterministic CI render | Frame number drives every component; no real-time clock. `npx remotion render` produces the same pixels on any machine. |
| Instagram 9:16 | `<Composition width={1080} height={1920} fps={30}>` from `storyboard.json` — one number, no manual resizing. |
| RTL Persian text | Chrome's HarfBuzz shapes Persian natively; local Vazirmatn TTF loaded with `@remotion/fonts` + `delayRender()`. No `arabic_reshaper` double-shaping bugs. |
| Character animation | Plain React/SVG: eyes blink, pupils track, rain drops fall, arms wave, mouth opens on `WordBoundary` spans. |
| Karaoke captions | Word-level spans rendered as React components with `direction: rtl`. Avoids FFmpeg `ass` + `shaping=complex` portability issues entirely. |
| Audio | `Html5Audio` (formerly `<Audio>`) plays a committed, pre-mixed WAV; Remotion muxes AAC. |
| Agent-friendly | TypeScript + JSON storyboard; `AGENTS.md`/`SKILL.md` describe the contract; official `remotion skills` exist. |
| CI | `npx remotion browser ensure` downloads a pinned Chrome Headless Shell; no GPU, no display server, no API key. |

## Alternatives considered

- **Manim Community 0.22 (MIT)** — used in the two earlier repos
  (`agent-2d-explainer`, `water-cycle-2d-explainer`). Excellent for math/2D
  explainers and fully headless, but the user asked specifically for Remotion
  here. Its ASS caption path also needs a HarfBuzz-enabled FFmpeg build.
- **HyperFrames (heygen-com/hyperframes, Apache-2.0)** — HTML/CSS/GSAP paused
  timeline, deterministic seek + FFmpeg. Closest competitor, but needs Node
  22+, headless Chrome setup and a different skill ecosystem.
- **Revideo / Motion Canvas (MIT, TypeScript)** — great programmatic
  animation, but more ceremony for a 60 s vertical social video.
- **Rive / Lottie** — superb for a single character, weaker for a
  data-driven 6-scene timeline with captions and audio.
- **Generative video (Wan2.2, LTX, AnimateDiff…)** — GPU-hungry,
  non-deterministic, and wrong for crisp educational diagrams.

## The FFmpeg layer (why not pure Remotion output?)

Remotion already muxes audio and video. We keep a thin FFmpeg pass because it
adds things Remotion does not do declaratively:

1. a **soft `mov_text` subtitle track** with `language=fas` (accessibility +
   platform compliance) on top of the burned-in karaoke;
2. **exact 60.00 s trim** and `+faststart`;
3. **`h264_metadata`** VUI rewrite — Remotion tags bt709/sRGB, which
   `ffmpeg-skill check.py --platform reels` flags as a colour WARNING.
   Rewriting to plain BT.709 gives **0 failed / 0 warnings**;
4. **three delivery variants** (4:5, 1:1, 720×1280) with blurred letterbox
   so no text is cropped;
5. **QA**: ffprobe + EBU R128 loudness + `ffmpeg-skill` reels spec.

## License note (important)

Remotion is **source-available, not classic OSS**. Per
[remotion.dev/docs/license/faq](https://www.remotion.dev/docs/license/faq)
(checked 2026-10-27):

- **Free License** — individuals, for-profit organisations with ≤ 3
  employees, non-profits, and evaluation. Includes commercial use and
  automation, all features, no signup.
- **Company License** — organisations with 4+ people: "Remotion for Creators"
  ($25/seat/month) and/or "Remotion for Automators" ($0.01/render, $100/mo
  minimum). Enterprise from $500/mo.

This repo belongs to an individual GitHub account, so the Free License
applies. `remotion.config.ts` states it explicitly:

```ts
Config.setPublicLicenseKey('free-license');
```

If you fork this inside a company with 4+ employees, obtain a license key at
<https://remotion.pro/license> and replace `free-license`.

The rest of the stack is permissive: Vazirmatn (SIL OFL), FFmpeg (LGPL/GPL
build from Ubuntu), `ffmpeg-skill` (MIT, used only as an optional QA gate),
`edge-tts` (GPL-3.0 library — used offline only; generated audio is yours).
Project code is MIT.
