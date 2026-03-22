export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'show' | 'anime';
  genre: string[];
  posterUrl: string;
  backdropUrl?: string;
  releaseDate?: string;
  rating?: number;
  torrentUrl?: string; // Magnet link or torrent URL
  /** IMDb-style id for Stremio stream API, e.g. tt0816692 or tt3581920:1:1 for an episode */
  stremioStreamId?: string;
  /**
   * Languages officially associated with this title. The player only offers these,
   * and enables a choice when the stream exposes a matching track.
   */
  mediaLocales?: {
    audio: { code: string; label: string }[];
    subtitles: { code: string; label: string }[];
  };
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  createdAt: string;
}

export interface HistoryItem {
  userId: string;
  profileId: string;
  contentId: string;
  title: string;
  type: 'movie' | 'show' | 'anime';
  posterUrl: string;
  progress: number;
  duration: number;
  lastWatched: string;
  isFinished: boolean;
}

export interface FavoriteItem {
  userId: string;
  profileId: string;
  contentId: string;
  title: string;
  type: 'movie' | 'show' | 'anime';
  posterUrl: string;
  addedAt: string;
}

export interface Plugin {
  id: string;
  name: string;
  url: string;
  description: string;
  isActive: boolean;
  type: 'torrent' | 'other';
}

export interface Server {
  id: string;
  name: string;
  region: 'US' | 'EU' | 'ASIA' | 'LATAM';
  quality: '4K' | '1080p' | '720p';
  load: number; // 0 to 100
  users: number;
  latency: number; // ms
}
