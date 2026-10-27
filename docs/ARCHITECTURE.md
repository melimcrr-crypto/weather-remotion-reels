# Architecture

## One storyboard, two consumers

```
                     src/storyboard.json
                    /                   \
        (webpack resolveJsonModule)   (config.storyboard())
                  /                       \
        React / Remotion                 Python tools
        ---------------                 -------------
        Root.tsx  -> 1080x1920/30fps   build_voice.py -> MP3 + WordBoundary
        WeatherReels.tsx              build_music.py -> procedural WAV
        SceneFrame + 6 scenes         mix_audio.py   -> final-mix.wav
        CaptionBox + Abrak            edit.py        -> master + variants
                  \                       /
                   \                     /
                    build/remotion.mp4  ->  rendered/*.mp4
                                             rendered/qa.json
```

Both sides read the **same** `src/storyboard.json`. Changing a scene duration
there changes the `<Sequence>` length and the voice budget at the same time.

## Timing model

| Layer | Unit | Source |
| --- | --- | --- |
| Composition | frames | `duration * fps` = 1800 |
| Scene | seconds → frames | `start * fps`, `duration * fps` |
| Voice clip | seconds | `start + 0.42 s` lead; rate ladder keeps it inside `duration - 0.72 s` |
| Word boundary | seconds | `edge-tts` `WordBoundary.offset / 1e7` |
| Karaoke line | seconds | `group_lines()` — max 6 words or 4.2 s, never crosses a scene |
| Lip sync | seconds | same word spans → `visemes.json` → `Abrak` mouth |
| SRT | seconds | same lines, `+0.48 s` tail |

Inside a `<Sequence>`, `useCurrentFrame()` is **scene-relative**. Absolute
frame values (progress bar, captions, fade, speaking flag) are computed in
`WeatherReels.tsx` before the Sequences and passed down as props, or computed
by components rendered outside the Sequences.

## Rendering

`npx remotion render src/index.ts WeatherReels build/remotion.mp4`:

- Chrome Headless Shell (pinned by `npx remotion browser ensure`) captures
  1800 JPEG frames at 1080×1920.
- `Html5Audio` from `remotion` plays `public/audio/final-mix.wav` (48 kHz
  stereo, already normalised). Remotion muxes H.264 + AAC into an MP4.
- No network requests occur during rendering — fonts, audio and icons are
  all local `staticFile()` assets or inline SVG.

`--concurrency` is auto-capped at `os.cpu_count()`; a 2-core sandbox uses 2
Chrome tabs, a 4-core CI runner uses 4.

## Editing (`tools/edit.py`)

```
build/remotion.mp4 ─┬─ map 0:v (copy) ──┐
captions/fa.srt ────┴─ map 1:0 (mov_text, language=fas) ─┤
                                                          ├─► weather-reels-1080x1920.mp4
h264_metadata BSF: primaries/trc/matrix = BT.709 ─────────┘
```

Then four more deterministic FFmpeg passes:

- 4:5 and 1:1: `split` → blurred thumbnail background → `overlay` of the
  full 9:16 frame scaled to fit. Nothing is cropped.
- 720×1280: simple Lanczos downscale.
- GIF, contact sheet (1 frame per 10 s), caption-check frame at 12.5 s.

## QA (`tools/qa.py`)

`ffprobe` for streams, `ffmpeg loudnorm` measurement for EBU R128, plus
`kajisho5/ffmpeg-skill check.py --platform reels` for platform compliance.
Hard failures: duration, resolution, fps, frame count, codecs, pix_fmt,
subtitle language, loudness, true peak and Persian SRT content. Variant
dimensions and deliverable existence are also verified.

## Offline CI

Committed to git: `public/audio/voice_*.mp3`, `public/audio/final-mix.wav`,
`captions/{mix,words,lines,visemes}.json`, `captions/fa.srt`, both TTFs.
Therefore GitHub Actions needs no TTS service and no API key. It does rebuild
the mix from the committed MP3s with `build_voice.py --offline` +
`build_music.py` + `mix_audio.py` as a determinism check, then renders.

The workflow uses the built-in `GITHUB_TOKEN` (`permissions: contents: write`)
to push `rendered/` back with `[skip ci]`. No personal token is stored
anywhere.
