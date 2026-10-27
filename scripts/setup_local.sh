#!/usr/bin/env bash
# Local, reproducible setup. CI does the same in .github/workflows/render.yml.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> system packages (ffmpeg + Chrome Headless Shell shared libs)"
if command -v apt-get >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ] || sudo -n true 2>/dev/null; then
  SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo -n"
  $SUDO apt-get update -qq
  $SUDO apt-get install -y --no-install-recommends \
    ffmpeg libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libxext6 libxshmfence1
  # ALSA binary package was renamed to libasound2t64 on newer Debian/Ubuntu.
  $SUDO apt-get install -y --no-install-recommends libasound2t64 2>/dev/null \
    || $SUDO apt-get install -y --no-install-recommends libasound2 2>/dev/null \
    || true
else
  echo "    (no apt/sudo here — assuming ffmpeg + browser libs already exist)"
fi

echo "==> Node dependencies"
npm ci

echo "==> Python dependencies"
python3 -m pip install --quiet -r requirements.txt

echo "==> Chrome Headless Shell (Remotion downloads its own pinned browser)"
npx remotion browser ensure

echo "==> verify"
node -v
npx remotion --version 2>/dev/null | head -2 || true
ffmpeg -version | head -1
ffprobe -version | head -1
echo "ready.  make preview  |  make render"
