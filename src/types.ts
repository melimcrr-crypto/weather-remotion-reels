export type ForecastDay = {
  day: string;
  icon: 'sun' | 'cloud' | 'rain' | 'storm';
  hi: number;
  lo: number;
};

export type Layer = {name: string; sub: string; color: string};

export type Scene = {
  id: string;
  start: number;
  duration: number;
  kind: 'intro' | 'atmosphere' | 'temp' | 'humidity' | 'fronts' | 'forecast';
  kicker: string;
  title: string;
  subtitle: string;
  narration: string;
  takeaway: string;
  chips?: string[];
  layers?: Layer[];
  gauges?: {tempFrom: number; tempTo: number; pressureFrom: number; pressureTo: number};
  steps?: string[];
  fronts?: string[];
  forecast?: ForecastDay[];
  summary?: string[];
  cta?: string;
};

export type Palette = Record<string, string>;

export type Storyboard = {
  schema: string;
  title_fa: string;
  title_en: string;
  language: string;
  voice: string;
  voice_pitch: string;
  voice_rate: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  character: {name: string; name_en: string};
  handle: string;
  palette: Palette;
  scenes: Scene[];
};

export type CaptionWord = {s: number; e: number; w: string};
export type CaptionLine = {start: number; end: number; words: CaptionWord[]};
export type VisemeSpan = {s: number; e: number};
