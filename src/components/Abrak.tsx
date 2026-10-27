import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';

type Props = {
  size?: number;
  speaking?: boolean;
  mood?: 'wave' | 'point' | 'happy';
};

/** "ابرک" — a tiny cloud presenter.  One self-contained SVG, no external assets. */
export const Abrak: React.FC<Props> = ({size = 400, speaking = false, mood = 'wave'}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 20) * 7;
  const phase = frame % 150;
  const blink = interpolate(phase, [0, 4, 8, 12], [1, 0.12, 0.12, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const gaze = Math.sin(frame / 45) * 4.5;
  const wave = mood === 'wave' ? Math.sin(frame / 9) * 15 : mood === 'point' ? -8 : 0;
  const mouthRy = speaking ? 12 + Math.abs(Math.sin(frame / 3.2)) * 8 : 4.5;
  const dropT = (frame % 48) / 48;

  return (
    <div style={{
      width: size, height: size * 0.85,
      transform: `translateY(${bob}px)`,
      filter: 'drop-shadow(0 22px 26px rgba(11,42,74,0.18))',
    }}>
      <svg viewBox="0 0 400 340" width="100%" height="100%">
        {/* arms */}
        <g stroke="#FFFFFF" strokeWidth={20} strokeLinecap="round" fill="none">
          <path d="M 92 196 Q 48 190 32 160" />
          <g transform={`rotate(${wave} 308 196)`}>
            <path d="M 308 196 Q 352 190 368 160" />
          </g>
        </g>
        <circle cx="30" cy="158" r="15" fill="#FFFFFF" />
        <circle cx="370" cy="158" r="15" fill="#FFFFFF" />

        {/* body */}
        <g fill="#FFFFFF" stroke="#C9E7FB" strokeWidth={6} strokeLinejoin="round">
          <ellipse cx="112" cy="190" rx="86" ry="58" />
          <circle cx="166" cy="140" r="74" />
          <circle cx="238" cy="146" r="65" />
          <ellipse cx="292" cy="192" rx="78" ry="54" />
          <rect x="86" y="160" width="232" height="80" rx="40" stroke="none" />
          <path d="M 86 200 Q 86 240 126 240 L 278 240 Q 318 240 318 200 Z" stroke="none" />
        </g>

        {/* little sun pin */}
        <g transform="translate(112 68)">
          <circle r="24" fill="#FDE047" stroke="#F59E0B" strokeWidth={5} />
          {Array.from({length: 8}, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30}
              x2={Math.cos(a) * 39} y2={Math.sin(a) * 39}
              stroke="#F59E0B" strokeWidth={5} strokeLinecap="round" />;
          })}
        </g>

        {/* blush */}
        <ellipse cx="140" cy="196" rx="25" ry="13" fill="#FBB6CE" opacity={0.62} />
        <ellipse cx="264" cy="196" rx="25" ry="13" fill="#FBB6CE" opacity={0.62} />

        {/* eyes */}
        <g>
          <ellipse cx="166" cy="166" rx="26" ry={28 * blink} fill="#FFFFFF"
            stroke="#BBDDF4" strokeWidth={4} />
          <ellipse cx="238" cy="166" rx="26" ry={28 * blink} fill="#FFFFFF"
            stroke="#BBDDF4" strokeWidth={4} />
          <g opacity={blink}>
            <circle cx={166 + gaze} cy="170" r="12" fill={C.ink} />
            <circle cx={238 + gaze} cy="170" r="12" fill={C.ink} />
            <circle cx={170 + gaze} cy="165" r="4" fill="#FFFFFF" />
            <circle cx={242 + gaze} cy="165" r="4" fill="#FFFFFF" />
          </g>
        </g>

        {/* mouth: lipsync driven by WordBoundary timings */}
        <ellipse cx="202" cy="212" rx="19" ry={mouthRy} fill={C.ink} />
        {speaking ? <ellipse cx="202" cy={216 + mouthRy * 0.3} rx="10" ry={mouthRy * 0.35}
          fill="#FB7185" opacity={0.8} /> : null}

        {/* dangling rain drops */}
        {[0, 1, 2].map((i) => {
          const x = 150 + i * 52;
          const y = 262 + ((dropT + i * 0.27) % 1) * 52;
          const o = 1 - ((dropT + i * 0.27) % 1);
          return (
            <path key={i} transform={`translate(${x} ${y})`}
              d="M 0 -14 C 8 -2 12 4 12 10 A 12 12 0 0 1 -12 10 C -12 4 -8 -2 0 -14 Z"
              fill={C.rain} opacity={0.35 + o * 0.5} />
          );
        })}
      </svg>
    </div>
  );
};
