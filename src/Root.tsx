import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {WeatherReels} from './WeatherReels';
import {FPS, H, TOTAL_FRAMES, W} from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WeatherReels"
        component={WeatherReels}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
