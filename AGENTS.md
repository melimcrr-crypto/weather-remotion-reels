# AGENTS.md — contract for coding agents

You are modifying a **deterministic Remotion video pipeline**. Read this before
touching anything.

## Single source of truth

`src/storyboard.json`. Everything else is derived from it:

- `fps`, `width`, `height`, `duration` → `src/Root.tsx` composition size.
- `scenes[].start/duration` → `<Sequence from/durationInFrames>`.
- `scenes[].narration` → `edge-tts` MP3s → `captions/words.json` →
  `captions/lines.json` (karaoke) + `captions/visemes.json` (lip sync) +
  `captions/fa.srt` (soft subtitles).
- `scenes[].*` (titles, layers, gauges, steps, fronts, forecast, chips) →
  the React scene components.

The React side imports this JSON directly (`resolveJsonModule`); the Python
side reads the same file via `src/config.py:storyboard()`. **Never duplicate a
value in code.**

## Hard rules

1. **No randomness at render time.** No `Math.random()`, no `Date.now()`, no
   network calls inside components. Use `src/theme.ts:rnd(seed)` (sin-based,
   deterministic) for pseudo-random positions. CI must be byte-reproducible.
2. **All animation is frame-driven.** Use `useCurrentFrame()` + `interpolate()`
   / `spring()` with `fps` from `sb.fps`. No CSS transitions, no `setTimeout`,
   no `requestAnimationFrame`.
3. **Inside `<Sequence>` the frame is scene-relative.** Absolute-frame needs
   (lip-sync, progress bar, captions, fade) are computed in `WeatherReels.tsx`
   and passed down, or computed by components rendered outside the Sequences.
4. **RTL is non-negotiable.** Every Persian text node needs `direction: 'rtl'`
   and `fontFamily: VAZIR`. Word-level caption spans flow right-to-left; do
   not reverse arrays manually — Chrome shapes them. Numbers on screen go
   through `fa()` so they render with Persian digits.
5. **Instagram safe zones.** 1080×1920 frame: keep critical content within
   x = 54…950, y = 154…1536 (reels spec: top 8%, bottom 20%, left 5%, right
   12%). The stage uses a scaled 968×866 design space — see
   `SceneFrame` in `src/components/Chrome.tsx`.
6. **High contrast.** Background is a bright sky; all text is dark navy
   (`C.ink`). Dark cards (takeaway, captions) must use explicitly light text.
   No theme-inherited color that could turn dark-on-dark.
7. **Fonts are local.** `public/fonts/Vazirmatn-*.ttf` is committed and loaded
   via `@remotion/fonts` inside `src/fonts.ts` with `delayRender()`. Never
   switch to a Google Fonts URL — CI renders offline.
8. **CI is offline.** `public/audio/final-mix.wav`, the six voice MP3s and
   all `captions/*.json` are committed. GitHub Actions must not need edge-tts
   or any API key. `tools/build_voice.py --offline` rebuilds timings from
   committed data.
9. **No secrets, ever.** No PAT, token, API key or credential in any file,
   workflow YAML, git history, `.git/config`, or commit message. The workflow
   uses the built-in `GITHUB_TOKEN` only.
10. **QA is a gate.** `python3 tools/qa.py` exits 1 on hard failures. Do not
    weaken checks to make a broken render pass — fix the render.

## Changing narration

```bash
python3 tools/build_voice.py     # online: needs edge-tts + network
python3 tools/build_music.py     # only if you changed the music generator
python3 tools/mix_audio.py
python3 tools/render.py
```

`build_voice.py` uses a rate ladder (`+6%` → `+55%`) so each clip fits inside
its scene budget (`duration - 0.42s lead - 0.30s tail`). If a clip still does
not fit, **shorten the narration in `storyboard.json`**, do not extend the
scene without updating every downstream timing.

## Adding a scene

1. Add an entry to `scenes[]` with a unique `id`, correct `start`/`duration`,
   and `kind` (add the new kind to `Scene['kind']` in `src/types.ts`).
2. Add a component in `src/components/scenes.tsx` and register it in
   `MAP` in `src/WeatherReels.tsx`.
3. Update `ProgressBar` segment count if the number of scenes changes.
4. Re-run the full pipeline. `captions/lines.json` and `visemes.json` are
   regenerated automatically.

## File map

| Path | Role |
| --- | --- |
| `src/storyboard.json` | single source of truth |
| `src/Root.tsx`, `src/index.ts` | Remotion entry + composition |
| `src/WeatherReels.tsx` | timeline, audio, scene map, global chrome |
| `src/components/Chrome.tsx` | progress, karaoke captions, footer, fade, stage |
| `src/components/SkyBackground.tsx` | deterministic animated sky |
| `src/components/Abrak.tsx` | cloud mascot + lip sync |
| `src/components/scenes.tsx` | the six illustrations |
| `tools/*.py` | voice, music, mix, render, edit, QA |
| `.github/workflows/render.yml` | CI render + artifact + auto-commit |
