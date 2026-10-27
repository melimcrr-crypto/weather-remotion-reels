import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import visemesJson from '../captions/visemes.json';
import {CaptionBox, FadeOverlay, Footer, ProgressBar, SceneFrame} from './components/Chrome';
import {SkyBackground} from './components/SkyBackground';
import {
  AtmosphereScene, ForecastScene, FrontsScene, HumidityScene, IntroScene, TempScene,
} from './components/scenes';
import {C, FPS, sb} from './theme';
import {VAZIR} from './fonts';
import type {Scene, VisemeSpan} from './types';

const VISEMES = visemesJson as unknown as VisemeSpan[];

type SceneComp = React.FC<{scene: Scene; speaking: boolean}>;
const MAP: Record<Scene['kind'], SceneComp> = {
  intro: IntroScene,
  atmosphere: AtmosphereScene,
  temp: TempScene,
  humidity: HumidityScene,
  fronts: FrontsScene,
  forecast: ForecastScene,
};

export const WeatherReels: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const speaking = VISEMES.some((v) => t >= v.s - 0.02 && t <= v.e + 0.07);

  return (
    <AbsoluteFill style={{backgroundColor: C.skyTop, fontFamily: VAZIR}}>
      <SkyBackground />
      <Html5Audio src={staticFile('audio/final-mix.wav')} />

      {sb.scenes.map((scene, i) => {
        const Comp = MAP[scene.kind];
        return (
          <Sequence
            key={scene.id}
            from={Math.round(scene.start * FPS)}
            durationInFrames={Math.round(scene.duration * FPS)}
          >
            <SceneFrame scene={scene} index={i}>
              <Comp scene={scene} speaking={speaking} />
            </SceneFrame>
          </Sequence>
        );
      })}

      <ProgressBar />
      <CaptionBox />
      <Footer />
      <FadeOverlay />
    </AbsoluteFill>
  );
};
