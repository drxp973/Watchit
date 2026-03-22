import type { Content } from './types';

/** Official-style language options for titles (what was "published" for the release). */
export const LOCALE_PRESETS = {
  blockbuster: {
    audio: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'fr', label: 'French' },
      { code: 'de', label: 'German' },
    ],
    subtitles: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'fr', label: 'French' },
    ],
  },
  anime: {
    audio: [
      { code: 'ja', label: 'Japanese' },
      { code: 'en', label: 'English' },
    ],
    subtitles: [
      { code: 'en', label: 'English' },
      { code: 'ja', label: 'Japanese' },
    ],
  },
  series: {
    audio: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'fr', label: 'French' },
    ],
    subtitles: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
    ],
  },
} as const satisfies Record<string, NonNullable<Content['mediaLocales']>>;

export function resolveMediaLocales(c: Content): NonNullable<Content['mediaLocales']> {
  if (c.mediaLocales) return c.mediaLocales;
  if (c.type === 'anime') return { ...LOCALE_PRESETS.anime };
  if (c.type === 'show') return { ...LOCALE_PRESETS.series };
  return { ...LOCALE_PRESETS.blockbuster };
}
