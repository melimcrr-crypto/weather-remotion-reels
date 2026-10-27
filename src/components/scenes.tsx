import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Abrak} from './Abrak';
import {WeatherIcon, type IconKind} from './icons';
import {C, FPS, ease, fa, rnd} from '../theme';
import {VAZIR} from '../fonts';
import type {Scene} from '../types';

const SW = 968;
const SH = 866;
const RTL: React.CSSProperties = {direction: 'rtl', fontFamily: VAZIR};

const Pill: React.FC<{
  text: string; left: number; top: number; w?: number;
  bg?: string; color?: string; size?: number; icon?: IconKind;
}> = ({text, left, top, w = 280, bg, color = C.ink, size = 34, icon}) => (
  <div style={{
    position: 'absolute', left, top, width: w, minHeight: 76,
    borderRadius: 38, background: bg ?? 'rgba(255,255,255,0.94)',
    border: `2px solid ${C.cardLine}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    fontSize: size, fontWeight: 700, color,
    boxShadow: '0 12px 26px rgba(11,42,74,0.12)', padding: '10px 14px',
    boxSizing: 'border-box', ...RTL,
  }}>
    {icon ? <WeatherIcon kind={icon} size={size + 6} color={color} strokeWidth={7} /> : null}
    <span>{text}</span>
  </div>
);

const Card: React.FC<{
  left: number; top: number; w: number; h: number; children: React.ReactNode;
  bg?: string;
}> = ({left, top, w, h, children, bg}) => (
  <div style={{
    position: 'absolute', left, top, width: w, height: h,
    borderRadius: 42, background: bg ?? 'rgba(255,255,255,0.96)',
    border: `2px solid ${C.cardLine}`, boxSizing: 'border-box',
    boxShadow: '0 18px 34px rgba(11,42,74,0.13)', overflow: 'hidden', ...RTL,
  }}>{children}</div>
);

/* ================================================================== */
/* 1 — Intro                                                          */
/* ================================================================== */
export const IntroScene: React.FC<{scene: Scene; speaking: boolean}> = ({scene, speaking}) => {
  const frame = useCurrentFrame();
  const orbit: IconKind[] = ['sun', 'cloud', 'rain', 'wind', 'snow', 'storm'];

  return (
    <div style={{position: 'absolute', inset: 0, width: SW, height: SH}}>
      {/* soft halo behind the character */}
      <div style={{
        position: 'absolute', left: 234, top: 120, width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.16) 0%, rgba(14,165,233,0) 70%)',
      }} />

      {orbit.map((kind, i) => {
        const a = frame * 0.014 + (i / orbit.length) * Math.PI * 2;
        const x = 484 + Math.cos(a) * 390;
        const y = 372 + Math.sin(a) * 300;
        const pop = interpolate(frame, [i * 5, i * 5 + 16], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        return (
          <div key={i} style={{
            position: 'absolute', left: x - 54, top: y - 54,
            width: 108, height: 108, borderRadius: 32,
            background: 'rgba(255,255,255,0.90)', border: `2px solid ${C.cardLine}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: pop, transform: `scale(${0.6 + pop * 0.4}) rotate(${Math.sin(a) * 8}deg)`,
            boxShadow: '0 12px 24px rgba(11,42,74,0.12)',
          }}>
            <WeatherIcon kind={kind} size={62} color={i % 2 ? C.accent : C.accent2} />
          </div>
        );
      })}

      <div style={{position: 'absolute', left: 284, top: 108}}>
        <Abrak size={400} speaking={speaking} mood="wave" />
      </div>

      <div style={{
        position: 'absolute', left: 0, top: 560, width: SW,
        ...RTL, textAlign: 'center', fontSize: 42, fontWeight: 700, color: C.ink,
      }}>
        {'همهچیز رو میشه پیشبینی کرد!'}
      </div>

      <div style={{
        position: 'absolute', left: 0, top: 640, width: SW,
        display: 'flex', justifyContent: 'center', gap: 20, ...RTL,
      }}>
        {(scene.chips ?? []).map((chip, i) => {
          const p = interpolate(frame, [18 + i * 7, 34 + i * 7], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <div key={i} style={{
              opacity: p, transform: `translateY(${(1 - p) * 30}px)`,
              background: i === 0 ? C.accent : i === 1 ? C.accent2 : C.green,
              color: '#FFFFFF', borderRadius: 34, padding: '18px 30px',
              fontSize: 30, fontWeight: 700,
              boxShadow: '0 12px 26px rgba(11,42,74,0.18)',
            }}>{chip}</div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute', left: 0, top: 760, width: SW,
        ...RTL, textAlign: 'center', fontSize: 28, color: C.inkSoft,
      }}>
        {'اسلایدر · بزن رو قلب ♥ · سیو کن'}
      </div>
    </div>
  );
};

/* ================================================================== */
/* 2 — Atmosphere layers                                              */
/* ================================================================== */
export const AtmosphereScene: React.FC<{scene: Scene; speaking: boolean}> = ({scene, speaking}) => {
  const frame = useCurrentFrame();
  const layers = scene.layers ?? [];

  return (
    <div style={{position: 'absolute', inset: 0, width: SW, height: SH}}>
      <div style={{position: 'absolute', left: 24, top: 8}}>
        <WeatherIcon kind="sun" size={96} color={C.accent} />
      </div>

      {/* altitude scale */}
      <div style={{
        position: 'absolute', left: 8, top: 74, width: 70, height: 640,
        borderRight: `3px solid ${C.cardLine}`, ...RTL,
      }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            position: 'absolute', right: 10, top: i * 150,
            fontSize: 20, color: C.inkSoft, fontWeight: 700, direction: 'ltr',
          }}>{fa((4 - i) * 25) + ' km'}</div>
        ))}
      </div>

      {layers.map((layer, i) => {
        const p = interpolate(frame, [i * 9, i * 9 + 20], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        return (
          <div key={i} style={{
            position: 'absolute', left: 96 + (1 - p) * 90, top: 78 + i * 196,
            width: 660, height: 172, borderRadius: 36,
            background: `${layer.color}22`, border: `3px solid ${layer.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 30px', boxSizing: 'border-box', opacity: p, ...RTL,
          }}>
            <div>
              <div style={{fontSize: 46, fontWeight: 700, color: C.ink}}>{layer.name}</div>
              <div style={{fontSize: 26, color: C.inkSoft, marginTop: 4}}>{layer.sub}</div>
            </div>
            <div style={{
              width: 74, height: 74, borderRadius: 24,
              background: layer.color, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontSize: 30, fontWeight: 700,
            }}>{fa(i + 1)}</div>
          </div>
        );
      })}

      {/* rising air bubbles */}
      <svg viewBox="0 0 968 866" width={SW} height={SH}
        style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {Array.from({length: 9}, (_, i) => {
          const x = 800 + rnd(i * 5 + 2) * 130;
          const y = 720 - ((frame * (1.2 + rnd(i) * 1.4) + i * 90) % 660);
          return <circle key={i} cx={x} cy={y} r={7 + rnd(i * 3) * 6}
            fill={C.accent2} opacity={0.28} />;
        })}
      </svg>

      <div style={{position: 'absolute', left: 720, top: 600}}>
        <Abrak size={210} speaking={speaking} mood="point" />
      </div>

      <div style={{
        position: 'absolute', left: 96, top: 686, width: 660,
        ...RTL, fontSize: 28, color: C.inkSoft, textAlign: 'center',
      }}>
        {'هرچی بالاتر بری، هوا رقیقتر و سردتر میشه'}
      </div>
    </div>
  );
};

/* ================================================================== */
/* 3 — Temperature & pressure                                         */
/* ================================================================== */
export const TempScene: React.FC<{scene: Scene; speaking: boolean}> = ({scene, speaking}) => {
  const frame = useCurrentFrame();
  const g = scene.gauges!;
  const temp = interpolate(frame, [20, 200], [g.tempFrom, g.tempTo], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const pres = interpolate(frame, [20, 200], [g.pressureFrom, g.pressureTo], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const mercury = interpolate(frame, [10, 210], [26, 300], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const needle = interpolate(frame, [10, 210], [-118, 118], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, width: SW, height: SH}}>
      {/* temperature card (right, RTL first) */}
      <Card left={492} top={40} w={430} h={470}>
        <div style={{position: 'absolute', left: 0, top: 22, width: 430, textAlign: 'center',
          fontSize: 38, fontWeight: 700, color: C.ink}}>{'دما'}</div>
        <div style={{
          position: 'absolute', left: 176, top: 92, width: 78, height: 320,
          borderRadius: 40, background: 'rgba(11,42,74,0.08)',
          border: `3px solid ${C.cardLine}`,
        }}>
          <div style={{
            position: 'absolute', left: 12, bottom: 10, width: 48, height: mercury,
            borderRadius: 26, background: `linear-gradient(0deg, ${C.warm}, ${C.accent})`,
          }} />
        </div>
        <div style={{
          position: 'absolute', left: 268, top: 120, width: 150, textAlign: 'center',
          fontSize: 64, fontWeight: 700, color: C.warm,
        }}>{fa(Math.round(temp)) + '°'}</div>
        <div style={{
          position: 'absolute', left: 0, top: 410, width: 430, textAlign: 'center',
          fontSize: 26, color: C.inkSoft,
        }}>{'گرمتر ← هوا بالا میره'}</div>
      </Card>

      {/* pressure card (left) */}
      <Card left={46} top={40} w={430} h={470}>
        <div style={{position: 'absolute', left: 0, top: 22, width: 430, textAlign: 'center',
          fontSize: 38, fontWeight: 700, color: C.ink}}>{'فشار هوا'}</div>
        <svg viewBox="0 0 300 300" width={300} height={300}
          style={{position: 'absolute', left: 65, top: 82}}>
          <circle cx="150" cy="150" r="118" fill="rgba(11,42,74,0.06)"
            stroke={C.cardLine} strokeWidth={6} />
          {Array.from({length: 9}, (_, i) => {
            const a = (-120 + (i / 8) * 240) * (Math.PI / 180);
            const x1 = 150 + Math.sin(a) * 96;
            const y1 = 150 - Math.cos(a) * 96;
            const x2 = 150 + Math.sin(a) * 110;
            const y2 = 150 - Math.cos(a) * 110;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={C.inkSoft} strokeWidth={5} strokeLinecap="round" />;
          })}
          <g transform={`rotate(${needle} 150 150)`}>
            <line x1="150" y1="150" x2="150" y2="58" stroke={C.cool} strokeWidth={10}
              strokeLinecap="round" />
          </g>
          <circle cx="150" cy="150" r="14" fill={C.cool} />
        </svg>
        <div style={{
          position: 'absolute', left: 0, top: 372, width: 430, textAlign: 'center',
          fontSize: 54, fontWeight: 700, color: C.cool,
        }}>{fa(Math.round(pres))}</div>
        <div style={{
          position: 'absolute', left: 0, top: 424, width: 430, textAlign: 'center',
          fontSize: 24, color: C.inkSoft,
        }}>{'هکتوپاسکال · hPa'}</div>
      </Card>

      {/* air movement arrow */}
      <div style={{
        position: 'absolute', left: 400, top: 540, width: 168, height: 88,
        borderRadius: 44, background: C.ink, color: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 46, fontWeight: 700, direction: 'ltr',
      }}>{'⇄'}</div>

      <Pill text={'گرم ← صعود ← فشار کم'} left={40} top={664} w={420}
        bg={'rgba(249,115,22,0.16)'} color={C.warm} size={30} icon="thermo" />
      <Pill text={'سرد ← نزول ← فشار زیاد'} left={508} top={664} w={420}
        bg={'rgba(37,99,235,0.14)'} color={C.cool} size={30} icon="pressure" />
      <div style={{
        position: 'absolute', left: 0, top: 776, width: SW, ...RTL,
        textAlign: 'center', fontSize: 28, color: C.inkSoft,
      }}>{'همین اختلاف، موتورِ باده'}</div>
    </div>
  );
};

/* ================================================================== */
/* 4 — Humidity & cloud formation                                     */
/* ================================================================== */
const BigCloud: React.FC<{fill: string; opacity: number}> = ({fill, opacity}) => (
  <svg viewBox="0 0 460 240" width="100%" height="100%" style={{opacity}}>
    <g fill={fill} stroke="#7DC4F0" strokeWidth={8} strokeLinejoin="round">
      <ellipse cx="130" cy="160" rx="104" ry="58" />
      <circle cx="196" cy="104" r="86" />
      <circle cx="292" cy="116" r="72" />
      <ellipse cx="356" cy="162" rx="92" ry="54" />
      <rect x="96" y="140" width="300" height="72" rx="36" stroke="none" />
    </g>
  </svg>
);

export const HumidityScene: React.FC<{scene: Scene; speaking: boolean}> = ({scene, speaking}) => {
  const frame = useCurrentFrame();
  const steps = scene.steps ?? [];

  return (
    <div style={{position: 'absolute', inset: 0, width: SW, height: SH}}>
      <div style={{position: 'absolute', left: 254, top: 4, width: 460, height: 240}}>
        <BigCloud fill="#E4F3FF" opacity={1} />
      </div>
      <div style={{
        position: 'absolute', left: 0, top: 236, width: SW,
        ...RTL, textAlign: 'center', fontSize: 30, color: C.inkSoft, fontWeight: 700,
      }}>{'تراکم · قطرههای ریز آب'}</div>

      {/* rising vapour */}
      <svg viewBox="0 0 968 866" width={SW} height={SH}
        style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {Array.from({length: 22}, (_, i) => {
          const x = 120 + rnd(i * 7 + 4) * 720;
          const base = 700 - ((frame * (1.4 + rnd(i * 3 + 1) * 1.8) + i * 46) % 440);
          return <circle key={i} cx={x} cy={base} r={5 + rnd(i * 11 + 2) * 8}
            fill={C.accent2} opacity={0.18 + rnd(i * 13) * 0.25} />;
        })}
      </svg>

      {/* sea */}
      <div style={{
        position: 'absolute', left: 0, top: 690, width: SW, height: 176,
        background: 'linear-gradient(180deg, rgba(14,165,233,0.28), rgba(37,99,235,0.38))',
        borderTop: `4px solid ${C.accent2}`,
      }} />
      <svg viewBox="0 0 968 90" width={SW} height={90}
        style={{position: 'absolute', left: 0, top: 700}}>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M -40 ${18 + i * 28} Q 120 ${-6 + i * 28} 280 ${18 + i * 28}
            T 600 ${18 + i * 28} T 920 ${18 + i * 28} T 1240 ${18 + i * 28}`}
            fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.5 - i * 0.12}
            strokeLinecap="round" />
        ))}
      </svg>

      <div style={{
        position: 'absolute', left: 0, top: 790, width: SW, ...RTL,
        textAlign: 'center', fontSize: 28, color: '#FFFFFF', fontWeight: 700,
      }}>{'دریا · منبعِ بخار آب'}</div>

      {/* 4 step chips */}
      <div style={{
        position: 'absolute', left: 24, top: 558, width: 920,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...RTL,
      }}>
        {steps.map((s, i) => {
          const p = interpolate(frame, [10 + i * 12, 28 + i * 12], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <React.Fragment key={i}>
              <div style={{
                opacity: p, transform: `scale(${0.8 + p * 0.2})`,
                background: i === 3 ? C.accent : '#FFFFFF',
                color: i === 3 ? '#FFFFFF' : C.ink,
                border: `3px solid ${i === 3 ? C.accent : C.cardLine}`,
                borderRadius: 34, padding: '16px 22px', fontSize: 28, fontWeight: 700,
                boxShadow: '0 12px 24px rgba(11,42,74,0.12)',
              }}>{fa(i + 1) + ' · ' + s}</div>
              {i < steps.length - 1 ? (
                <span style={{fontSize: 34, color: C.inkSoft, direction: 'ltr'}}>{'←'}</span>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================== */
/* 5 — Wind & fronts                                                  */
/* ================================================================== */
export const FrontsScene: React.FC<{scene: Scene; speaking: boolean}> = ({scene, speaking}) => {
  const frame = useCurrentFrame();
  const coldX = interpolate(frame, [10, 170], [900, 560], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const warmX = interpolate(frame, [10, 170], [60, 400], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, width: SW, height: SH}}>
      {/* isobars */}
      <svg viewBox="0 0 968 866" width={SW} height={SH} style={{position: 'absolute', inset: 0}}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i}
            d={`M -40 ${130 + i * 150} C 220 ${40 + i * 150} 420 ${240 + i * 150} 620 ${130 + i * 150} S 900 ${60 + i * 150} 1020 ${140 + i * 150}`}
            fill="none" stroke={C.inkSoft} strokeWidth={3} opacity={0.18} />
        ))}
      </svg>

      {/* moving wind streaks */}
      {Array.from({length: 7}, (_, i) => {
        const x = ((frame * (2.4 + rnd(i) * 2) + i * 150) % 1100) - 80;
        const y = 90 + rnd(i * 9 + 3) * 640;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: 90, height: 8,
            borderRadius: 8, background: C.accent2, opacity: 0.22,
          }} />
        );
      })}

      {/* warm front (left, semicircles) */}
      <svg viewBox="0 0 968 866" width={SW} height={SH}
        style={{position: 'absolute', inset: 0}}>
        <path d={`M ${warmX} 120 Q ${warmX - 60} 430 ${warmX} 740`}
          fill="none" stroke={C.warm} strokeWidth={12} strokeLinecap="round" />
        {Array.from({length: 6}, (_, i) => (
          <circle key={i} cx={warmX - 4} cy={170 + i * 108} r={20}
            fill={C.warm} opacity={0.9} />
        ))}
        {/* cold front (right, triangles) */}
        <path d={`M ${coldX} 120 Q ${coldX + 60} 430 ${coldX} 740`}
          fill="none" stroke={C.cool} strokeWidth={12} strokeLinecap="round" />
        {Array.from({length: 6}, (_, i) => (
          <polygon key={i} points={`${coldX + 4},${150 + i * 108} ${coldX + 42},${176 + i * 108} ${coldX + 4},${202 + i * 108}`}
            fill={C.cool} opacity={0.9} />
        ))}
        {/* rain in the collision zone */}
        {Array.from({length: 12}, (_, i) => {
          const x = 470 + rnd(i * 7 + 2) * 80;
          const y = 200 + ((frame * 3 + i * 57) % 440);
          return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 22}
            stroke={C.rain} strokeWidth={6} strokeLinecap="round" opacity={0.75} />;
        })}
      </svg>

      <Pill text={'جبههٔ سرد'} left={636} top={34} w={290}
        bg={'rgba(37,99,235,0.16)'} color={C.cool} size={34} icon="snow" />
      <Pill text={'جبههٔ گرم'} left={40} top={34} w={290}
        bg={'rgba(249,115,22,0.16)'} color={C.warm} size={34} icon="sun" />

      <div style={{
        position: 'absolute', left: 0, top: 748, width: SW, ...RTL,
        textAlign: 'center', fontSize: 30, fontWeight: 700, color: C.ink,
      }}>{'فشار زیاد  →  باد  →  فشار کم'}</div>
      <div style={{
        position: 'absolute', left: 0, top: 796, width: SW, ...RTL,
        textAlign: 'center', fontSize: 26, color: C.inkSoft,
      }}>{'برخوردِ دو توده، هوا رو عوض میکنه'}</div>
    </div>
  );
};

/* ================================================================== */
/* 6 — Forecast                                                       */
/* ================================================================== */
export const ForecastScene: React.FC<{scene: Scene; speaking: boolean}> = ({scene, speaking}) => {
  const frame = useCurrentFrame();
  const days = scene.forecast ?? [];
  const cardW = 170;
  const gap = 18;
  const rowW = days.length * cardW + (days.length - 1) * gap;
  const startX = (SW - rowW) / 2;

  return (
    <div style={{position: 'absolute', inset: 0, width: SW, height: SH}}>
      {days.map((d, i) => {
        const p = interpolate(frame, [8 + i * 8, 26 + i * 8], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const left = startX + (days.length - 1 - i) * (cardW + gap);
        return (
          <div key={i} style={{
            position: 'absolute', left, top: 28 + (1 - p) * 40,
            width: cardW, height: 316, borderRadius: 34,
            background: 'rgba(255,255,255,0.96)', border: `2px solid ${C.cardLine}`,
            boxShadow: '0 16px 30px rgba(11,42,74,0.13)',
            opacity: p, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 8px', boxSizing: 'border-box', ...RTL,
          }}>
            <div style={{fontSize: 27, fontWeight: 700, color: C.ink}}>{d.day}</div>
            <WeatherIcon kind={d.icon} size={78} color={d.icon === 'sun' ? C.accent : C.accent2} />
            <div style={{fontSize: 48, fontWeight: 700, color: C.warm}}>{fa(d.hi) + '°'}</div>
            <div style={{fontSize: 26, color: C.inkSoft}}>{fa(d.lo) + '°'}</div>
          </div>
        );
      })}

      {/* pipeline */}
      <div style={{
        position: 'absolute', left: 60, top: 384, width: 848,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, ...RTL,
      }}>
        {(scene.summary ?? []).map((s, i) => {
          const p = interpolate(frame, [40 + i * 12, 58 + i * 12], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <React.Fragment key={i}>
              <div style={{
                opacity: p, transform: `scale(${0.85 + p * 0.15})`,
                background: i === 2 ? C.green : C.ink, color: '#FFFFFF',
                borderRadius: 36, padding: '18px 26px', fontSize: 32, fontWeight: 700,
                boxShadow: '0 12px 26px rgba(11,42,74,0.18)',
              }}>{s}</div>
              {i < (scene.summary ?? []).length - 1 ? (
                <span style={{fontSize: 38, color: C.inkSoft, direction: 'ltr'}}>{'←'}</span>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute', left: 92, top: 494, width: 784, minHeight: 96,
        borderRadius: 48, background: `linear-gradient(90deg, ${C.accent}, ${C.warm})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFFFFF', fontSize: 34, fontWeight: 700, textAlign: 'center',
        boxShadow: '0 18px 36px rgba(249,115,22,0.28)', padding: '18px 24px',
        boxSizing: 'border-box', ...RTL,
      }}>{scene.cta}</div>

      <div style={{position: 'absolute', left: 374, top: 606}}>
        <Abrak size={220} speaking={speaking} mood="happy" />
      </div>
      <div style={{
        position: 'absolute', left: 0, top: 806, width: SW, ...RTL,
        textAlign: 'center', fontSize: 26, color: C.inkSoft,
      }}>{'سیو کن تا یادت بمونه ☀'}</div>
    </div>
  );
};
