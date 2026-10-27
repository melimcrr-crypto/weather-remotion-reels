import React from 'react';
import {C} from '../theme';

export type IconKind =
  | 'sun' | 'cloud' | 'rain' | 'storm' | 'wind' | 'snow'
  | 'thermo' | 'pressure' | 'drop' | 'layers' | 'check' | 'arrow';

export const WeatherIcon: React.FC<{
  kind: IconKind;
  size?: number;
  color?: string;
  strokeWidth?: number;
}> = ({kind, size = 64, color = C.accent2, strokeWidth = 6}) => {
  const common = {
    width: size, height: size, viewBox: '0 0 100 100', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (kind === 'sun') {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="18" fill={color} stroke="none" />
        {Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={50 + Math.cos(a) * 28} y1={50 + Math.sin(a) * 28}
            x2={50 + Math.cos(a) * 40} y2={50 + Math.sin(a) * 40} />;
        })}
      </svg>
    );
  }
  if (kind === 'cloud') {
    return (
      <svg {...common}>
        <path d="M 26 70 A 17 17 0 0 1 28 37 A 23 23 0 0 1 68 31 A 19 19 0 0 1 74 70 Z"
          fill={color} fillOpacity={0.18} />
      </svg>
    );
  }
  if (kind === 'rain') {
    return (
      <svg {...common}>
        <path d="M 26 60 A 17 17 0 0 1 28 27 A 23 23 0 0 1 68 21 A 19 19 0 0 1 74 60 Z"
          fill={color} fillOpacity={0.18} />
        <line x1="32" y1="72" x2="27" y2="86" />
        <line x1="50" y1="72" x2="45" y2="90" />
        <line x1="68" y1="72" x2="63" y2="86" />
      </svg>
    );
  }
  if (kind === 'storm') {
    return (
      <svg {...common}>
        <path d="M 26 58 A 17 17 0 0 1 28 25 A 23 23 0 0 1 68 19 A 19 19 0 0 1 74 58 Z"
          fill={color} fillOpacity={0.18} />
        <path d="M 52 62 L 38 84 L 50 84 L 44 98 L 66 72 L 53 72 L 60 62 Z"
          fill={C.accent} stroke="none" />
      </svg>
    );
  }
  if (kind === 'wind') {
    return (
      <svg {...common}>
        <path d="M 14 36 H 60 A 11 11 0 1 0 49 25" />
        <path d="M 14 52 H 78 A 11 11 0 1 1 67 63" />
        <path d="M 14 68 H 52 A 10 10 0 1 1 42 78" />
      </svg>
    );
  }
  if (kind === 'snow') {
    return (
      <svg {...common}>
        {Array.from({length: 6}, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <line key={i} x1={50} y1={50}
            x2={50 + Math.cos(a) * 32} y2={50 + Math.sin(a) * 32} />;
        })}
      </svg>
    );
  }
  if (kind === 'thermo') {
    return (
      <svg {...common}>
        <path d="M 42 20 A 10 10 0 0 1 58 20 V 62 A 18 18 0 1 1 42 62 Z" />
        <line x1="50" y1="36" x2="50" y2="70" stroke={C.warm} strokeWidth={8} />
        <circle cx="50" cy="78" r="9" fill={C.warm} stroke="none" />
      </svg>
    );
  }
  if (kind === 'pressure') {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="34" />
        <line x1="50" y1="50" x2="68" y2="34" stroke={C.warm} strokeWidth={7} />
        <circle cx="50" cy="50" r="5" fill={color} stroke="none" />
      </svg>
    );
  }
  if (kind === 'drop') {
    return (
      <svg {...common}>
        <path d="M 50 14 C 66 38 76 50 76 62 A 26 26 0 0 1 24 62 C 24 50 34 38 50 14 Z"
          fill={color} fillOpacity={0.25} />
      </svg>
    );
  }
  if (kind === 'layers') {
    return (
      <svg {...common}>
        <path d="M 50 16 L 88 34 L 50 52 L 12 34 Z" />
        <path d="M 12 50 L 50 68 L 88 50" />
        <path d="M 12 66 L 50 84 L 88 66" />
      </svg>
    );
  }
  if (kind === 'check') {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="34" fill={C.green} fillOpacity={0.15} />
        <path d="M 32 51 L 45 64 L 70 38" stroke={C.green} strokeWidth={8} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M 20 50 H 78" />
      <path d="M 62 34 L 78 50 L 62 66" />
    </svg>
  );
};
