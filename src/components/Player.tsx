import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Volume2,
  Maximize,
  X,
  Loader2,
  AlertCircle,
  Languages,
} from 'lucide-react';
import { clsx } from 'clsx';

declare global {
  interface Window {
    WebTorrent: any;
  }
}

function normalizeLang(code: string): string {
  return code.trim().split('-')[0].toLowerCase();
}

function collectTextTrackLanguages(video: HTMLVideoElement): string[] {
  const list: string[] = [];
  for (let i = 0; i < video.textTracks.length; i++) {
    const t = video.textTracks[i];
    if (t.kind === 'subtitles' || t.kind === 'captions') {
      if (t.language) list.push(normalizeLang(t.language));
    }
  }
  return list;
}

function collectAudioTrackLanguages(video: HTMLVideoElement): string[] {
  const at = (video as HTMLVideoElement & { audioTracks?: AudioTrackList }).audioTracks;
  if (!at || at.length === 0) return [];
  const list: string[] = [];
  for (let i = 0; i < at.length; i++) {
    const lang = at[i].language;
    if (lang) list.push(normalizeLang(lang));
  }
  return list;
}

export interface PlayerMediaLocales {
  audio: { code: string; label: string }[];
  subtitles: { code: string; label: string }[];
}

interface PlayerProps {
  torrentId: string;
  onClose: () => void;
  pluginName?: string;
  /** Published languages for this title; only these appear in the language menu. */
  mediaLocales: PlayerMediaLocales;
  contentTitle?: string;
}

const IDLE_MS = 30_000;

export default function Player({
  torrentId,
  onClose,
  pluginName = 'WebTorrent',
  mediaLocales,
  contentTitle,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [streamSubLangs, setStreamSubLangs] = useState<string[]>([]);
  const [streamAudioLangs, setStreamAudioLangs] = useState<string[]>([]);
  const [activeSubCode, setActiveSubCode] = useState<string | null>(null);
  const langPanelRef = useRef<HTMLDivElement>(null);
  const subsInitialized = useRef(false);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleHideChrome = useCallback(() => {
    clearIdleTimer();
    if (isLoading || error || langOpen) return;
    idleTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
      setLangOpen(false);
    }, IDLE_MS);
  }, [clearIdleTimer, isLoading, error, langOpen]);

  const wakeChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleHideChrome();
  }, [scheduleHideChrome]);

  useEffect(() => {
    wakeChrome();
    return clearIdleTimer;
  }, [wakeChrome, clearIdleTimer]);

  useEffect(() => {
    if (!chromeVisible || isLoading || error) return;
    scheduleHideChrome();
    return clearIdleTimer;
  }, [chromeVisible, isLoading, error, scheduleHideChrome, clearIdleTimer]);

  useEffect(() => {
    if (langOpen) clearIdleTimer();
    else if (chromeVisible && !isLoading && !error) scheduleHideChrome();
  }, [langOpen, chromeVisible, isLoading, error, clearIdleTimer, scheduleHideChrome]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const onActivity = () => wakeChrome();
    shell.addEventListener('mousemove', onActivity);
    shell.addEventListener('touchstart', onActivity, { passive: true });
    shell.addEventListener('click', onActivity);
    return () => {
      shell.removeEventListener('mousemove', onActivity);
      shell.removeEventListener('touchstart', onActivity);
      shell.removeEventListener('click', onActivity);
    };
  }, [wakeChrome]);

  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = langPanelRef.current;
      if (el && !el.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [langOpen]);

  const syncTracksFromVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setStreamSubLangs(collectTextTrackLanguages(v));
    setStreamAudioLangs(collectAudioTrackLanguages(v));
  }, []);

  const applySubtitlePreference = useCallback(
    (code: string | null) => {
      const v = videoRef.current;
      if (!v) return;
      setActiveSubCode(code);
      for (let i = 0; i < v.textTracks.length; i++) {
        const t = v.textTracks[i];
        if (t.kind !== 'subtitles' && t.kind !== 'captions') continue;
        const match = code && t.language && normalizeLang(t.language) === normalizeLang(code);
        t.mode = match ? 'showing' : 'hidden';
      }
    },
    []
  );

  const applyAudioPreference = useCallback((code: string) => {
    const v = videoRef.current as HTMLVideoElement & { audioTracks?: AudioTrackList };
    const at = v.audioTracks;
    if (!at || at.length === 0) return;
    const target = normalizeLang(code);
    if (at.length === 1) {
      at[0].enabled = true;
      return;
    }
    let matched = false;
    for (let i = 0; i < at.length; i++) {
      const lang = at[i].language ? normalizeLang(at[i].language) : '';
      if (lang === target) {
        for (let j = 0; j < at.length; j++) at[j].enabled = j === i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (let j = 0; j < at.length; j++) at[j].enabled = j === 0;
    }
  }, []);

  useEffect(() => {
    if (!window.WebTorrent) {
      setError('WebTorrent library failed to load.');
      setIsLoading(false);
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) {
      setError('Player failed to initialize.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const onVideoReady = () => {
      if (cancelled) return;
      setIsLoading(false);
      videoEl.removeEventListener('loadeddata', onVideoReady);
      videoEl.removeEventListener('playing', onVideoReady);
    };

    const onLoadedMeta = () => {
      if (cancelled) return;
      syncTracksFromVideo();
      if (!subsInitialized.current && videoRef.current) {
        subsInitialized.current = true;
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          const t = videoRef.current.textTracks[i];
          if (t.kind === 'subtitles' || t.kind === 'captions') t.mode = 'hidden';
        }
      }
    };

    videoEl.addEventListener('loadeddata', onVideoReady);
    videoEl.addEventListener('playing', onVideoReady);
    videoEl.addEventListener('loadedmetadata', onLoadedMeta);

    const client = new window.WebTorrent();

    client.add(torrentId, (torrent: any) => {
      if (cancelled) return;

      const fail = (msg: string) => {
        if (cancelled) return;
        setError(msg);
        setIsLoading(false);
        videoEl.removeEventListener('loadeddata', onVideoReady);
        videoEl.removeEventListener('playing', onVideoReady);
        videoEl.removeEventListener('loadedmetadata', onLoadedMeta);
      };

      torrent.on('error', (err: unknown) => {
        fail(err instanceof Error ? err.message : 'Torrent error');
      });

      torrent.on('warning', (err: unknown) => {
        console.warn('torrent warning', err);
      });

      const file = torrent.files.find(
        (f: { name: string }) =>
          f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm')
      );

      if (!file) {
        fail('No playable video file found in torrent.');
        return;
      }

      const el = videoRef.current;
      if (!el) {
        fail('Player failed to initialize.');
        return;
      }

      try {
        file.renderTo(el, {
          autoplay: true,
          controls: false,
        });
      } catch (e) {
        fail(e instanceof Error ? e.message : 'Failed to start playback');
        return;
      }

      torrent.on('download', () => {
        if (cancelled) return;
        setProgress(torrent.progress * 100);
      });
    });

    client.on('error', (err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : 'Torrent client error');
      setIsLoading(false);
      videoEl.removeEventListener('loadeddata', onVideoReady);
      videoEl.removeEventListener('playing', onVideoReady);
      videoEl.removeEventListener('loadedmetadata', onLoadedMeta);
    });

    return () => {
      cancelled = true;
      subsInitialized.current = false;
      videoEl.removeEventListener('loadeddata', onVideoReady);
      videoEl.removeEventListener('playing', onVideoReady);
      videoEl.removeEventListener('loadedmetadata', onLoadedMeta);
      client.destroy();
    };
  }, [torrentId, syncTracksFromVideo]);

  const publishedSubtitles = mediaLocales.subtitles;
  const publishedAudio = mediaLocales.audio;

  const subInStream = (code: string) =>
    streamSubLangs.length === 0
      ? false
      : streamSubLangs.some((l) => l === normalizeLang(code));

  const audioInStream = (code: string) =>
    streamAudioLangs.length === 0
      ? false
      : streamAudioLangs.some((l) => l === normalizeLang(code));

  const headerChrome = chromeVisible && !error;

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 bg-black z-[100] flex flex-col cursor-default"
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-5 left-5 z-[110] p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white/90 transition-colors border border-white/10 backdrop-blur-sm"
        aria-label="Close player"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className={clsx(
          'absolute top-0 left-0 right-0 z-50 px-6 pt-5 pb-16 pl-20 flex items-start justify-between transition-opacity duration-300',
          'bg-gradient-to-b from-black/90 via-black/40 to-transparent',
          headerChrome && !isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none',
          isLoading && 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex-1 text-center px-4 min-w-0 pt-1">
          {contentTitle && (
            <p className="text-sm font-semibold text-white/95 truncate tracking-tight">{contentTitle}</p>
          )}
          <p className="text-[11px] text-white/45 mt-0.5 font-medium tracking-wide uppercase">
            {pluginName}
          </p>
        </div>
        <div className="relative" ref={langPanelRef}>
          <button
            type="button"
            onClick={() => {
              wakeChrome();
              setLangOpen((o) => !o);
            }}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 transition-colors border border-white/10"
            aria-label="Audio and subtitles"
            aria-expanded={langOpen}
          >
            <Languages className="w-5 h-5" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-2xl text-left custom-scrollbar z-[60]">
              <div className="p-3 border-b border-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  Published languages
                </p>
                <p className="text-xs text-white/50 mt-1 leading-snug">
                  Only release languages are listed. A track must exist in this stream to switch.
                </p>
              </div>
              <div className="p-3 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-2">Audio</p>
                  <ul className="space-y-1">
                    {publishedAudio.map((a) => {
                      const ok = audioInStream(a.code);
                      return (
                        <li key={a.code}>
                          <button
                            type="button"
                            disabled={!ok}
                            onClick={() => ok && applyAudioPreference(a.code)}
                            className={clsx(
                              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                              ok
                                ? 'bg-white/10 hover:bg-white/15 text-white'
                                : 'bg-transparent text-white/35 cursor-not-allowed'
                            )}
                          >
                            {a.label}
                            {!ok && (
                              <span className="block text-[10px] text-white/30 mt-0.5">
                                Not in this stream
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {streamAudioLangs.length === 0 && (
                    <p className="text-[10px] text-amber-200/60 mt-2 leading-relaxed">
                      This file does not expose multiple audio tracks in the browser. You may only get the default track.
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-2">Subtitles</p>
                  <ul className="space-y-1">
                    <li>
                      <button
                        type="button"
                        onClick={() => applySubtitlePreference(null)}
                        className={clsx(
                          'w-full text-left px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white',
                          activeSubCode === null && 'ring-1 ring-white/25'
                        )}
                      >
                        Off
                      </button>
                    </li>
                    {publishedSubtitles.map((s) => {
                      const ok = subInStream(s.code);
                      return (
                        <li key={s.code}>
                          <button
                            type="button"
                            disabled={!ok}
                            onClick={() => ok && applySubtitlePreference(s.code)}
                            className={clsx(
                              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                              ok
                                ? 'bg-white/10 hover:bg-white/15 text-white'
                                : 'bg-transparent text-white/35 cursor-not-allowed',
                              ok && activeSubCode === normalizeLang(s.code) && 'ring-1 ring-white/25'
                            )}
                          >
                            {s.label}
                            {!ok && (
                              <span className="block text-[10px] text-white/30 mt-0.5">
                                Not in this stream
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {isLoading && !error && (
          <div className="text-center z-50 pointer-events-none px-6">
            <Loader2 className="w-14 h-14 text-sky-400/90 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-white/90">Connecting…</p>
            <p className="text-sm text-white/45 mt-2 max-w-sm mx-auto leading-relaxed">
              Buffering can take a moment depending on peers and your network.
            </p>
          </div>
        )}

        {error && (
          <div className="text-center z-50 max-w-md p-8 bg-red-950/40 border border-red-500/20 rounded-2xl mx-4">
            <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">Playback error</h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-full text-sm font-semibold transition-colors"
            >
              Go back
            </button>
          </div>
        )}

        <video ref={videoRef} className="w-full h-full object-contain" playsInline />
      </div>

      {!isLoading && !error && (
        <div
          className={clsx(
            'absolute bottom-0 left-0 right-0 z-50 px-8 pt-12 pb-8 transition-opacity duration-300',
            'bg-gradient-to-t from-black/90 via-black/50 to-transparent',
            chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          style={{ pointerEvents: chromeVisible ? 'auto' : 'none' }}
        >
          <div className="h-1 w-full bg-white/10 rounded-full mb-5 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-sky-500/90 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="p-2 text-white/85 hover:text-white transition-colors"
                aria-label="Play"
              >
                <Play className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                className="p-2 text-white/85 hover:text-white transition-colors"
                aria-label="Volume"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
            <button
              type="button"
              className="p-2 text-white/85 hover:text-white transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
