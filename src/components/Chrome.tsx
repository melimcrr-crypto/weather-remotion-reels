import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import linesJson from '../../captions/lines.json';
import {C, DURATION, FPS, H, TOTAL_FRAMES, W, ease, fa} from '../theme';
import {VAZIR} from '../fonts';
import type {CaptionLine, Scene} from '../types';
import {WeatherIcon} from './icons';

const LINES = linesJson as unknown as CaptionLine[];

const RTL: React.CSSProperties = {direction: 'rtl', fontFamily: VAZIR};

/* ------------------------------------------------------------------ */
/* Top progress rail — 6 ticks, one per scene                          */
/* ------------------------------------------------------------------ */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = Math.min(1, frame / TOTAL_FRAMES);
  const segW = 152;
  const gap = 12;
  const startX = (W - (segW * 6 + gap * 5)) / 2;

  return (
    <div style={{position: 'absolute', top: 164, left: 0, width: W, height: 14}}>
      {Array.from({length: 6}, (_, i) => {
        const local = Math.min(1, Math.max(0, progress * 6 - i));
        return (
          <div key={i} style={{
            position: 'absolute', left: startX + i * (segW + gap), top: 0,
            width: segW, height: 14, borderRadius: 10,
            background: 'rgba(11,42,74,0.18)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${local * 100}%`, height: '100%', borderRadius: 10,
              background: `linear-gradient(90deg, ${C.accent2}, ${C.accent})`,
            }} />
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Burned-in RTL karaoke captions, driven by edge-tts WordBoundary     */
/* ------------------------------------------------------------------ */
export const CaptionBox: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame / FPS;
  const idx = LINES.findIndex((l) => f >= l.start && f <= l.end);
  if (idx < 0) return null;
  const line = LINES[idx];
  const fadeIn = interpolate(frame, [line.start * FPS - 4, line.start * FPS + 5], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [line.end * FPS - 6, line.end * FPS + 3], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div style={{
      position: 'absolute', left: 64, top: 1258, width: 952, minHeight: 178,
      borderRadius: 44, background: C.captionBg, padding: '24px 30px',
      boxSizing: 'border-box', display: 'flex', alignItems: 'center',
      justifyContent: 'center', opacity,
      boxShadow: '0 24px 50px rgba(9,32,56,0.28)',
    }}>
      <div style={{
        ...RTL, display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        alignItems: 'center', columnGap: 14, rowGap: 6, width: '100%',
      }}>
        {line.words.map((w, i) => {
          const active = frame >= w.s * FPS && frame <= w.e * FPS + 2;
          return (
            <span key={i} style={{
              display: 'inline-block', whiteSpace: 'nowrap',
              fontSize: 46, fontWeight: 700, lineHeight: 1.32,
              padding: '4px 12px', borderRadius: 20,
              color: active ? C.highlight : '#F2FAFF',
              background: active ? 'rgba(253,224,71,0.18)' : 'transparent',
              transform: active ? 'scale(1.07)' : 'scale(1)',
              textShadow: active ? '0 0 22px rgba(253,224,71,0.55)' : 'none',
              opacity: active ? 1 : 0.86,
            }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Footer / handle, kept above Instagram's bottom UI safe zone         */
/* ------------------------------------------------------------------ */
export const Footer: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 18) * 0.04;
  return (
    <div style={{
      position: 'absolute', top: 1452, left: 0, width: W,
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14,
      ...RTL, color: 'rgba(11,42,74,0.68)', fontSize: 28, fontWeight: 700,
      transform: `scale(${pulse})`,
    }}>
      <WeatherIcon kind="sun" size={38} color={C.accent} strokeWidth={7} />
      <span>{'ابرک · هواشناسی به زبان ساده'}</span>
      <span style={{color: C.accent2, direction: 'ltr'}}>{'@abrak.weather'}</span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Gentle fade from/to dark at the very start and end of the reel      */
/* ------------------------------------------------------------------ */
export const FadeOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [0, 14, TOTAL_FRAMES - 24, TOTAL_FRAMES - 1],
    [0.82, 0, 0, 0.82],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return <AbsoluteFill style={{background: '#071C31', opacity: o, pointerEvents: 'none'}} />;
};

/* ------------------------------------------------------------------ */
/* Shared scene chrome: kicker, title, glass stage, takeaway pill      */
/* ------------------------------------------------------------------ */
export const SceneFrame: React.FC<{
  scene: Scene;
  index: number;
  children: React.ReactNode;
}> = ({scene, index, children}) => {
  const frame = useCurrentFrame();
  const enter = spring({frame, fps: FPS, config: {damping: 200, mass: 0.9}});
  const t = ease(frame / 12);

  return (
    <AbsoluteFill style={{...RTL, opacity: t, transform: `translateY(${(1 - enter) * 46}px)`}}>
      {/* kicker pill — inside the 8% top safe zone */}
      <div style={{
        position: 'absolute', top: 192, left: 0, width: W,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.82)', border: `2px solid ${C.cardLine}`,
          borderRadius: 40, padding: '9px 28px',
          fontSize: 28, fontWeight: 700, color: C.inkSoft,
          boxShadow: '0 10px 24px rgba(11,42,74,0.10)',
        }}>
          {scene.kicker}
        </div>
      </div>

      {/* subtitle above the title so it never collides with the stage card */}
      <div style={{
        position: 'absolute', top: 248, left: 50, width: W - 100,
        textAlign: 'center', fontSize: 26, color: C.inkSoft,
      }}>
        {scene.subtitle}
      </div>

      {/* title */}
      <div style={{
        position: 'absolute', top: 282, left: 50, width: W - 100,
        textAlign: 'center', fontSize: 64, fontWeight: 700,
        color: C.ink, lineHeight: 1.22,
      }}>
        {scene.title}
      </div>

      {/* glass stage: 968x866 design space scaled into a 768 px tall card */}
      <div style={{
        position: 'absolute', left: 56, top: 374, width: 968, height: 768,
        borderRadius: 54, background: C.cardFill,
        border: `2px solid ${C.cardLine}`,
        boxShadow: '0 30px 64px rgba(11,42,74,0.18)',
        overflow: 'hidden', boxSizing: 'border-box',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 968, height: 866,
          transform: 'scale(0.8868)', transformOrigin: 'top center',
        }}>
          {children}
        </div>
      </div>

      {/* takeaway strip */}
      <div style={{
        position: 'absolute', left: 96, top: 1156, width: 888, height: 90,
        borderRadius: 46, background: 'rgba(11,42,74,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        color: '#FFFFFF', fontSize: 34, fontWeight: 700,
        boxShadow: '0 18px 36px rgba(11,42,74,0.22)',
      }}>
        <WeatherIcon kind="check" size={40} color="#6EE7B7" strokeWidth={7} />
        <span>{scene.takeaway}</span>
        <span style={{fontSize: 24, color: '#9CC7E8', direction: 'ltr'}}>
          {fa(index + 1)}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const STAGE_W = 968;
export const STAGE_H = 866;

export const REEL_INFO = {W, H, DURATION, FPS, TOTAL_FRAMES};
