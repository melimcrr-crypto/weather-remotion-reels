import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';

export const VAZIR = 'Vazirmatn';

// Remotion renders every frame in a headless Chrome.  We explicitly block the
// render until both local Vazirmatn faces are attached to `document.fonts`, so
// Persian glyphs are never drawn with a fallback font.  The TTFs live in
// public/fonts and are committed -> CI needs zero network access.
const handle = delayRender('Loading Vazirmatn (RTL) fonts');

Promise.all([
  loadFont({
    family: VAZIR,
    url: staticFile('fonts/Vazirmatn-Regular.ttf'),
    weight: '400',
    format: 'truetype',
    display: 'block',
  }),
  loadFont({
    family: VAZIR,
    url: staticFile('fonts/Vazirmatn-Bold.ttf'),
    weight: '700',
    format: 'truetype',
    display: 'block',
  }),
])
  .then(() => continueRender(handle))
  .catch((err) => {
    // Do not hang the render forever if a font is missing; typing will still
    // work with a fallback, and QA will flag the visual difference.
    // eslint-disable-next-line no-console
    console.error('Vazirmatn font load failed', err);
    continueRender(handle);
  });
