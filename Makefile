.PHONY: setup studio typecheck voice music mix preview render qa clean

setup:
	bash scripts/setup_local.sh

studio:
	npx remotion studio src/index.ts

typecheck:
	npx tsc --noEmit

# Only needed when narration changes. Regenerates MP3s + all timing artifacts.
voice:
	python3 tools/build_voice.py

music:
	python3 tools/build_music.py

mix:
	python3 tools/mix_audio.py

# Fast 10 s / 40% scale visual check.
preview:
	python3 tools/render.py --preview

# Full 1080x1920 / 60 s render + FFmpeg edit + QA gate. CI runs this.
render:
	python3 tools/render.py

qa:
	python3 tools/qa.py

clean:
	rm -rf build out .remotion
