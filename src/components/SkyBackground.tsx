import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, rnd} from '../theme';

const CloudShape: React.FC<{fill: string; opacity: number}> = ({fill, opacity}) => (
  <svg viewBox="0 0 320 150" width="100%" height="100%" style={{opacity}}>
    <g fill={fill}>
      <ellipse cx="82" cy="104" rx="72" ry="40" />
      <circle cx="132" cy="68" r="58" />
      <circle cx="196" cy="76" r="50" />
      <ellipse cx="252" cy="106" rx="64" ry="38" />
      <rect x="60" y="88" width="212" height="50" rx="25" />
    </g>
  </svg>
);

type CloudDef = {x: number; y: number; w: number; speed: number; opacity: number};

const CLOUDS: CloudDef[] = [
  {x: -180, y: 190, w: 330, speed: 0.42, opacity: 0.38},
  {x: 520, y: 100, w: 250, speed: 0.28, opacity: 0.3},
  {x: 210, y: 420, w: 400, speed: 0.6, opacity: 0.22},
  {x: 760, y: 300, w: 300, speed: 0.35, opacity: 0.26},
  {x: -60, y: 620, w: 300, speed: 0.5, opacity: 0.18},
];

const DOTS = Array.from({length: 22}, (_, i) => ({
  x: 40 + rnd(i * 7 + 1) * 1000,
  y: 300 + rnd(i * 11 + 3) * 1350,
  r: 3 + rnd(i * 13 + 5) * 6,
  speed: 0.25 + rnd(i * 17 + 9) * 0.55,
  o: 0.1 + rnd(i * 19 + 2) * 0.16,
}));

export const SkyBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${C.skyTop} 0%, ${C.skyMid} 46%, ${C.skyBottom} 100%)`,
        }}
      />

      {/* sun + slowly rotating rays */}
      <div
        style={{
          position: 'absolute', left: 790, top: 70, width: 300, height: 300,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,252,220,0.98) 0%, rgba(253,224,138,0.92) 38%, rgba(253,224,138,0) 72%)',
        }}
      />
      <svg
        viewBox="0 0 300 300" width={300} height={300}
        style={{position: 'absolute', left: 790, top: 70,
          transform: `rotate(${frame * 0.12}deg)`, opacity: 0.35}}
      >
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x1 = 150 + Math.cos(a) * 96;
          const y1 = 150 + Math.sin(a) * 96;
          const x2 = 150 + Math.cos(a) * 128;
          const y2 = 150 + Math.sin(a) * 128;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#FBBF24" strokeWidth={7} strokeLinecap="round" />
          );
        })}
      </svg>

      {/* drifting clouds */}
      {CLOUDS.map((c, i) => {
        const drift = ((frame * c.speed + c.x + 400) % 1500) - 400;
        return (
          <div key={i} style={{
            position: 'absolute', left: drift, top: c.y,
            width: c.w, height: c.w * 0.47,
          }}>
            <CloudShape fill="#FFFFFF" opacity={c.opacity} />
          </div>
        );
      })}

      {/* rising haze particles */}
      <svg viewBox={`0 0 1080 1920`} width={1080} height={1920}
        style={{position: 'absolute', inset: 0}}>
        {DOTS.map((d, i) => {
          const y = ((d.y - frame * d.speed * 1.6) % 1920 + 1920) % 1920;
          return <circle key={i} cx={d.x} cy={y} r={d.r} fill="#FFFFFF" opacity={d.o} />;
        })}
      </svg>

      {/* warm foreground haze, keeps the bottom calm under the captions */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 500,
        background: 'linear-gradient(0deg, rgba(255,243,214,0.92) 0%, rgba(255,243,214,0) 100%)',
      }} />
    </AbsoluteFill>
  );
};
