import type { Content } from './types';

export type StremioStreamRow = Record<string, unknown>;

export function streamRowToMagnet(row: StremioStreamRow): string | null {
  const url = row.url;
  if (typeof url === 'string') {
    if (url.startsWith('magnet:')) return url;
  }
  const infoHash = row.infoHash;
  if (typeof infoHash === 'string' && /^[a-fA-F0-9]{40}$/i.test(infoHash)) {
    const dn =
      typeof row.name === 'string'
        ? row.name
        : typeof row.title === 'string'
          ? row.title
          : 'video';
    return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(dn)}`;
  }
  return null;
}

export function contentTypeToStremioType(type: Content['type']): 'movie' | 'series' {
  return type === 'movie' ? 'movie' : 'series';
}

export async function fetchStreamsViaProxy(
  manifestUrl: string,
  stremioType: 'movie' | 'series',
  streamId: string
): Promise<StremioStreamRow[]> {
  const params = new URLSearchParams({
    manifestUrl,
    type: stremioType,
    id: streamId,
  });
  const res = await fetch(`/api/addon-streams?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { streams?: StremioStreamRow[] };
  return Array.isArray(data.streams) ? data.streams : [];
}

export function pickFirstPlayableMagnet(streams: StremioStreamRow[]): string | null {
  for (const s of streams) {
    const m = streamRowToMagnet(s);
    if (m) return m;
  }
  return null;
}
