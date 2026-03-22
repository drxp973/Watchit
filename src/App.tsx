import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User, signInWithPopup, googleProvider, auth, db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import Layout from './components/Layout';
import Hero from './components/Hero';
import MovieCard from './components/MovieCard';
import ProfileSelector from './components/ProfileSelector';
import CategoryGrid from './components/CategoryGrid';
import Player from './components/Player';
import ServerSelector from './components/ServerSelector';
import { Content, Profile, HistoryItem, Plugin, Server } from './types';
import {
  fetchStreamsViaProxy,
  pickFirstPlayableMagnet,
  contentTypeToStremioType,
} from './stremioAddon';
import { resolveMediaLocales } from './contentLocales';
import { Film, Tv, Grid, Heart, History, Download, Monitor, LogIn, Flame, Zap, Smile, Heart as HeartIcon, Ghost, Sword, Plus, Puzzle, Check, X as XIcon, Skull, Rocket, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_PLUGINS: Plugin[] = [
  {
    id: 'torrentio',
    name: 'Torrentio',
    url: 'https://torrentio.strem.fun/manifest.json',
    description:
      'Stremio-compatible stream addon. Paste its manifest URL on the Plugins page, keep it Active, then pick a title: Watchit loads streams from this addon (e.g. magnet links) after you choose a server.',
    isActive: true,
    type: 'torrent'
  }
];

const DEFAULT_DEMO_MAGNET =
  'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.openwebtorrent.com';

const MOCK_FEATURED: Content[] = [
  {
    id: '1',
    title: 'Interstellar',
    description: 'When Earth becomes uninhabitable, a team of ex-pilots and scientists travel through a wormhole in search of a new home for humanity.',
    type: 'movie',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    posterUrl: 'https://image.tmdb.org/t/p/original/gEU2QvY6fg7SLoO7v4fsupRbiST.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xJH0Y5969vY069vS49vY069vS49.jpg',
    rating: 8.7,
    releaseDate: '2014-11-07',
    stremioStreamId: 'tt0816692',
  },
  {
    id: '2',
    title: 'The Last of Us',
    description: 'Twenty years after a fungal outbreak, Joel and Ellie must navigate a brutal post-apocalyptic world to find a cure.',
    type: 'show',
    genre: ['Drama', 'Action', 'Thriller'],
    posterUrl: 'https://image.tmdb.org/t/p/original/uKvH69pYH9vY069vS49vY069vS49.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/uKvH69pYH9vY069vS49vY069vS49.jpg',
    rating: 8.8,
    releaseDate: '2023-01-15',
    stremioStreamId: 'tt3581920:1:1',
  }
];

// Curated Real Movie Data with reliable image seeds
const ACTION_MOVIES: Content[] = [
  { id: 'a1', title: 'The Dark Knight', description: 'Batman faces the Joker.', type: 'movie', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/dark-knight/400/600', stremioStreamId: 'tt0468569' },
  { id: 'a2', title: 'Inception', description: 'Dreams within dreams.', type: 'movie', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/inception/400/600', stremioStreamId: 'tt1375666' },
  { id: 'a3', title: 'John Wick', description: 'Don\'t touch his dog.', type: 'movie', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/john-wick/400/600', stremioStreamId: 'tt2911666' },
  { id: 'a4', title: 'Mad Max: Fury Road', description: 'Post-apocalyptic car chase.', type: 'movie', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/mad-max/400/600', stremioStreamId: 'tt1392190' },
  { id: 'a5', title: 'The Matrix', description: 'Red pill or blue pill?', type: 'movie', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/matrix/400/600', stremioStreamId: 'tt0133093' },
  { id: 'a6', title: 'Gladiator', description: 'Are you not entertained?', type: 'movie', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/gladiator/400/600', stremioStreamId: 'tt0172495' },
];

const COMEDY_MOVIES: Content[] = [
  { id: 'c1', title: 'The Hangover', description: 'What happened last night?', type: 'movie', genre: ['Comedy'], posterUrl: 'https://picsum.photos/seed/hangover/400/600', stremioStreamId: 'tt1119646' },
  { id: 'c2', title: 'Superbad', description: 'High school hijinks.', type: 'movie', genre: ['Comedy'], posterUrl: 'https://picsum.photos/seed/superbad/400/600', stremioStreamId: 'tt0829482' },
  { id: 'c3', title: 'Step Brothers', description: 'Did we just become best friends?', type: 'movie', genre: ['Comedy'], posterUrl: 'https://picsum.photos/seed/step-brothers/400/600', stremioStreamId: 'tt0838283' },
  { id: 'c4', title: 'Deadpool', description: 'The merc with a mouth.', type: 'movie', genre: ['Comedy'], posterUrl: 'https://picsum.photos/seed/deadpool/400/600', stremioStreamId: 'tt1431045' },
  { id: 'c5', title: '21 Jump Street', description: 'Undercover cops.', type: 'movie', genre: ['Comedy'], posterUrl: 'https://picsum.photos/seed/21-jump-street/400/600', stremioStreamId: 'tt1231589' },
  { id: 'c6', title: 'Mean Girls', description: 'On Wednesdays we wear pink.', type: 'movie', genre: ['Comedy'], posterUrl: 'https://picsum.photos/seed/mean-girls/400/600', stremioStreamId: 'tt0377092' },
];

const ROMANCE_MOVIES: Content[] = [
  { id: 'r1', title: 'The Notebook', description: 'A timeless love story.', type: 'movie', genre: ['Romance'], posterUrl: 'https://picsum.photos/seed/notebook/400/600', stremioStreamId: 'tt0332280' },
  { id: 'r2', title: 'Titanic', description: 'I\'ll never let go.', type: 'movie', genre: ['Romance'], posterUrl: 'https://picsum.photos/seed/titanic/400/600', stremioStreamId: 'tt0120338' },
  { id: 'r3', title: 'La La Land', description: 'City of stars.', type: 'movie', genre: ['Romance'], posterUrl: 'https://picsum.photos/seed/la-la-land/400/600', stremioStreamId: 'tt3783958' },
  { id: 'r4', title: 'About Time', description: 'Time travel for love.', type: 'movie', genre: ['Romance'], posterUrl: 'https://picsum.photos/seed/about-time/400/600', stremioStreamId: 'tt2194499' },
  { id: 'r5', title: 'Pride & Prejudice', description: 'A classic romance.', type: 'movie', genre: ['Romance'], posterUrl: 'https://picsum.photos/seed/pride-prejudice/400/600', stremioStreamId: 'tt0414387' },
  { id: 'r6', title: 'A Star Is Born', description: 'Music and love.', type: 'movie', genre: ['Romance'], posterUrl: 'https://picsum.photos/seed/star-is-born/400/600', stremioStreamId: 'tt1517451' },
];

const HORROR_MOVIES: Content[] = [
  { id: 'h1', title: 'Hereditary', description: 'A family unravels after tragedy.', type: 'movie', genre: ['Horror'], posterUrl: 'https://picsum.photos/seed/hereditary/400/600', stremioStreamId: 'tt7784604' },
  { id: 'h2', title: 'Get Out', description: 'The sunken place.', type: 'movie', genre: ['Horror'], posterUrl: 'https://picsum.photos/seed/get-out/400/600', stremioStreamId: 'tt5052448' },
  { id: 'h3', title: 'A Quiet Place', description: 'Silence is survival.', type: 'movie', genre: ['Horror'], posterUrl: 'https://picsum.photos/seed/quiet-place/400/600', stremioStreamId: 'tt6644200' },
  { id: 'h4', title: 'The Conjuring', description: 'Based on true events.', type: 'movie', genre: ['Horror'], posterUrl: 'https://picsum.photos/seed/conjuring/400/600', stremioStreamId: 'tt1457767' },
  { id: 'h5', title: 'It', description: 'You\'ll float too.', type: 'movie', genre: ['Horror'], posterUrl: 'https://picsum.photos/seed/it-pennywise/400/600', stremioStreamId: 'tt1396484' },
  { id: 'h6', title: 'Barbarian', description: 'Don\'t open the basement door.', type: 'movie', genre: ['Horror'], posterUrl: 'https://picsum.photos/seed/barbarian/400/600', stremioStreamId: 'tt15791034' },
];

const SCIFI_MOVIES: Content[] = [
  { id: 's1', title: 'Blade Runner 2049', description: 'More human than human.', type: 'movie', genre: ['Sci-Fi'], posterUrl: 'https://picsum.photos/seed/blade-runner-2049/400/600', stremioStreamId: 'tt1856101' },
  { id: 's2', title: 'Arrival', description: 'First contact changes everything.', type: 'movie', genre: ['Sci-Fi'], posterUrl: 'https://picsum.photos/seed/arrival/400/600', stremioStreamId: 'tt2543164' },
  { id: 's3', title: 'Dune', description: 'The spice must flow.', type: 'movie', genre: ['Sci-Fi'], posterUrl: 'https://picsum.photos/seed/dune-2021/400/600', stremioStreamId: 'tt1160419' },
  { id: 's4', title: 'Ex Machina', description: 'AI and obsession.', type: 'movie', genre: ['Sci-Fi'], posterUrl: 'https://picsum.photos/seed/ex-machina/400/600', stremioStreamId: 'tt0470752' },
  { id: 's5', title: 'Edge of Tomorrow', description: 'Live. Die. Repeat.', type: 'movie', genre: ['Sci-Fi'], posterUrl: 'https://picsum.photos/seed/edge-tomorrow/400/600', stremioStreamId: 'tt1631867' },
  { id: 's6', title: 'The Martian', description: 'Science the heck out of it.', type: 'movie', genre: ['Sci-Fi'], posterUrl: 'https://picsum.photos/seed/martian/400/600', stremioStreamId: 'tt3659388' },
];

const THRILLER_MOVIES: Content[] = [
  { id: 't1', title: 'Gone Girl', description: 'Marriage and media.', type: 'movie', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/gone-girl/400/600', stremioStreamId: 'tt2267998' },
  { id: 't2', title: 'Se7en', description: 'What\'s in the box?', type: 'movie', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/se7en/400/600', stremioStreamId: 'tt0114369' },
  { id: 't3', title: 'Shutter Island', description: 'Nothing is as it seems.', type: 'movie', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/shutter-island/400/600', stremioStreamId: 'tt1130884' },
  { id: 't4', title: 'Zodiac', description: 'The hunt for a killer.', type: 'movie', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/zodiac/400/600', stremioStreamId: 'tt0443706' },
  { id: 't5', title: 'Prisoners', description: 'How far would you go?', type: 'movie', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/prisoners/400/600', stremioStreamId: 'tt1675434' },
  { id: 't6', title: 'Nightcrawler', description: 'If it bleeds, it leads.', type: 'movie', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/nightcrawler/400/600', stremioStreamId: 'tt2872718' },
];

const ANIME_LIST: Content[] = [
  { id: 'an1', title: 'Demon Slayer', description: 'Tanjiro fights demons.', type: 'anime', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/demon-slayer/400/600', stremioStreamId: 'tt9335498:1:1' },
  { id: 'an2', title: 'Jujutsu Kaisen', description: 'Sorcerers and curses.', type: 'anime', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/jujutsu-kaisen/400/600', stremioStreamId: 'tt14396264:1:1' },
  { id: 'an3', title: 'One Piece', description: 'King of the pirates.', type: 'anime', genre: ['Adventure'], posterUrl: 'https://picsum.photos/seed/one-piece/400/600', stremioStreamId: 'tt0388629:1:1' },
  { id: 'an4', title: 'Naruto', description: 'Believe it!', type: 'anime', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/naruto/400/600', stremioStreamId: 'tt0409591:1:1' },
  { id: 'an5', title: 'Death Note', description: 'A notebook of death.', type: 'anime', genre: ['Thriller'], posterUrl: 'https://picsum.photos/seed/death-note/400/600', stremioStreamId: 'tt0877057:1:1' },
  { id: 'an6', title: 'My Hero Academia', description: 'Plus Ultra!', type: 'anime', genre: ['Action'], posterUrl: 'https://picsum.photos/seed/mha/400/600', stremioStreamId: 'tt5626028:1:1' },
];

// Fallback for missing images
const getPosterUrl = (url: string, title: string) => {
  if (url.includes('tmdb.org')) return url;
  return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
};

function HomePage({ history, onPlay }: { history: HistoryItem[], onPlay: (content: Content) => void }) {
  // Simple recommendation logic: for each history item, show some movies from the same genre or just random ones
  const recommendations = history.slice(0, 3).map(item => {
    const allContent = [
      ...ACTION_MOVIES,
      ...COMEDY_MOVIES,
      ...ROMANCE_MOVIES,
      ...HORROR_MOVIES,
      ...SCIFI_MOVIES,
      ...THRILLER_MOVIES,
      ...ANIME_LIST,
    ];
    // Filter out the item itself and try to find similar content (this is a mock recommendation)
    const suggested = allContent
      .filter(c => c.id !== item.contentId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    
    return {
      watchedTitle: item.title,
      items: suggested
    };
  });

  return (
    <div className="pb-20">
      <Hero featuredContent={MOCK_FEATURED} />
      
      <div className="px-12 mt-8 relative z-30 space-y-24">
        {/* Continue Watching */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                <History className="text-sky-400 w-6 h-6" />
                Continue Watching
              </h2>
              <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {history.map((item) => (
                <div key={item.contentId} onClick={() => onPlay({ id: item.contentId, title: item.title, type: item.type, posterUrl: item.posterUrl, description: '', genre: [] })}>
                  <MovieCard 
                    content={{ 
                      id: item.contentId, 
                      title: item.title, 
                      type: item.type, 
                      posterUrl: item.posterUrl,
                      description: '',
                      genre: []
                    }} 
                    progress={item.progress}
                    duration={item.duration}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Recommendations */}
        {recommendations.map((rec, idx) => (
          <section key={idx}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                <Flame className="text-sky-400 w-6 h-6" />
                Because you watched {rec.watchedTitle}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {rec.items.map((movie) => (
                <div key={movie.id} onClick={() => onPlay(movie)}>
                  <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Action Movies */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <Sword className="text-sky-400 w-6 h-6" />
              Action Packed
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {ACTION_MOVIES.map((movie) => (
              <div key={movie.id} onClick={() => onPlay(movie)}>
                <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
              </div>
            ))}
          </div>
        </section>

        {/* Comedy */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <Smile className="text-sky-400 w-6 h-6" />
              Non-Stop Laughs
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {COMEDY_MOVIES.map((movie) => (
              <div key={movie.id} onClick={() => onPlay(movie)}>
                <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
              </div>
            ))}
          </div>
        </section>

        {/* Romance */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <HeartIcon className="text-sky-400 w-6 h-6" />
              Romantic Escapes
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {ROMANCE_MOVIES.map((movie) => (
              <div key={movie.id} onClick={() => onPlay(movie)}>
                <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
              </div>
            ))}
          </div>
        </section>

        {/* Horror */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <Skull className="text-sky-400 w-6 h-6" />
              Horror Nights
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {HORROR_MOVIES.map((movie) => (
              <div key={movie.id} onClick={() => onPlay(movie)}>
                <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
              </div>
            ))}
          </div>
        </section>

        {/* Sci-Fi */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <Rocket className="text-sky-400 w-6 h-6" />
              Sci-Fi Frontiers
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {SCIFI_MOVIES.map((movie) => (
              <div key={movie.id} onClick={() => onPlay(movie)}>
                <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
              </div>
            ))}
          </div>
        </section>

        {/* Thriller */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <Ghost className="text-sky-400 w-6 h-6" />
              Edge of Your Seat
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {THRILLER_MOVIES.map((movie) => (
              <div key={movie.id} onClick={() => onPlay(movie)}>
                <MovieCard content={{ ...movie, posterUrl: getPosterUrl(movie.posterUrl, movie.title) }} />
              </div>
            ))}
          </div>
        </section>

        {/* Anime */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <Zap className="text-sky-400 w-6 h-6" />
              Top Anime
            </h2>
            <button className="text-sky-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {ANIME_LIST.map((anime) => (
              <div key={anime.id} onClick={() => onPlay(anime)}>
                <MovieCard content={{ ...anime, posterUrl: getPosterUrl(anime.posterUrl, anime.title) }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [playingContent, setPlayingContent] = useState<Content | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [contentForServerSelection, setContentForServerSelection] = useState<Content | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>(MOCK_PLUGINS);
  const [isAddingPlugin, setIsAddingPlugin] = useState(false);
  const [newPluginUrl, setNewPluginUrl] = useState('');
  const [streamResolving, setStreamResolving] = useState(false);

  const handleAddPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginUrl.trim()) return;

    const isTorrentio = newPluginUrl.toLowerCase().includes('torrentio');
    const newPlugin: Plugin = {
      id: Math.random().toString(36).substr(2, 9),
      name: isTorrentio ? 'Torrentio' : 'Custom Plugin',
      url: newPluginUrl,
      description: isTorrentio 
        ? 'Search and stream content directly from magnet links and torrent providers.' 
        : 'Custom content provider plugin.',
      isActive: true,
      type: 'torrent'
    };

    setPlugins([...plugins, newPlugin]);
    setNewPluginUrl('');
    setIsAddingPlugin(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        setActiveProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeProfile || !user) return;

    const q = query(
      collection(db, 'history'), 
      where('userId', '==', user.uid),
      where('profileId', '==', activeProfile.id),
      where('isFinished', '==', false),
      orderBy('lastWatched', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => doc.data() as HistoryItem);
      setHistory(historyData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'history');
    });

    return () => unsubscribe();
  }, [activeProfile, user]);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/8 via-transparent to-indigo-950/40 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 max-w-lg"
        >
          <div className="w-20 h-20 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-sky-900/30 border border-white/10">
            <Film className="text-zinc-950 w-10 h-10" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight text-white">Watchit</h1>
          <p className="text-zinc-400 max-w-md mx-auto mb-10 text-base leading-relaxed">
            Movies, series, and anime—with addon-powered playback when you install Torrentio or another compatible plugin.
          </p>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="flex items-center gap-3 bg-white text-zinc-900 px-10 py-4 rounded-full font-semibold text-lg hover:bg-zinc-100 transition-colors shadow-lg border border-white/20"
          >
            <LogIn className="w-6 h-6" />
            Get Started
          </button>
        </motion.div>
      </div>
    );
  }

  if (!activeProfile) {
    return <ProfileSelector onSelect={setActiveProfile} />;
  }

  return (
    <Router>
      <Layout activeProfile={activeProfile} onSwitchProfile={() => setActiveProfile(null)}>
        <Routes>
          <Route path="/" element={<HomePage history={history} onPlay={setContentForServerSelection} />} />
          <Route path="/movies" element={<div className="p-12"><h1 className="text-4xl font-black mb-8">Movies</h1><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">{ACTION_MOVIES.map(m => <div key={m.id} onClick={() => setContentForServerSelection(m)}><MovieCard content={m} /></div>)}</div></div>} />
          <Route path="/shows" element={<div className="p-12"><h1 className="text-4xl font-black mb-8">Shows</h1><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">{COMEDY_MOVIES.map(s => <div key={s.id} onClick={() => setContentForServerSelection(s)}><MovieCard content={s} /></div>)}</div></div>} />
          <Route path="/categories" element={<CategoryGrid />} />
          <Route path="/plugins" element={
            <div className="p-12">
              <div className="flex items-center justify-between mb-12">
                <h1 className="text-4xl font-black tracking-tight">Plugins</h1>
                <button 
                  onClick={() => setIsAddingPlugin(true)}
                  className="bg-sky-500 text-black px-6 py-2 rounded-full font-bold hover:bg-sky-600 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Plugin
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plugins.map(plugin => (
                  <div key={plugin.id} className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/10 transition-all group">
                    <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                      <Puzzle className="w-8 h-8 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{plugin.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">{plugin.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                        plugin.isActive ? "text-sky-400 bg-sky-500/10" : "text-gray-500 bg-white/5"
                      )}>
                        {plugin.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <button 
                        onClick={() => setPlugins(plugins.filter(p => p.id !== plugin.id))}
                        className="text-gray-500 hover:text-red-500 transition-all"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Plugin Placeholder */}
                <div 
                  onClick={() => setIsAddingPlugin(true)}
                  className="bg-white/5 border border-white/10 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                    <Plus className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-500 font-bold">Install New Plugin</p>
                </div>
              </div>

              {/* Add Plugin Modal */}
              <AnimatePresence>
                {isAddingPlugin && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-[#111] border border-white/10 p-10 rounded-[40px] max-w-md w-full shadow-2xl"
                    >
                      <h2 className="text-3xl font-black mb-4 tracking-tight">Add Torrent Plugin</h2>
                      <p className="text-gray-400 text-sm mb-8">Paste your Torrentio or custom plugin manifest URL below to enable streaming.</p>
                      
                      <form onSubmit={handleAddPlugin} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Manifest URL</label>
                          <input 
                            type="text" 
                            value={newPluginUrl}
                            onChange={(e) => setNewPluginUrl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-sky-500 transition-all"
                            placeholder="https://torrentio.strem.fun/manifest.json"
                            autoFocus
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button 
                            type="submit"
                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Install Plugin
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsAddingPlugin(false)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          } />
          <Route path="/downloads" element={<div className="p-12 flex flex-col items-center justify-center h-[60vh] text-center"><Download className="w-20 h-20 text-gray-700 mb-6" /><h2 className="text-2xl font-bold mb-2">No Downloads Yet</h2><p className="text-gray-500">Your downloaded content will appear here for offline viewing.</p></div>} />
          <Route path="/favorites" element={<div className="p-12 flex flex-col items-center justify-center h-[60vh] text-center"><Heart className="w-20 h-20 text-gray-700 mb-6" /><h2 className="text-2xl font-bold mb-2">Your Favorites are Empty</h2><p className="text-gray-500">Save movies and shows to find them easily later.</p></div>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>

      <AnimatePresence>
        {contentForServerSelection && (
          <ServerSelector 
            content={contentForServerSelection}
            onClose={() => setContentForServerSelection(null)}
            onSelect={async (server) => {
              const content = contentForServerSelection;
              if (!content) return;
              setSelectedServer(server);
              setContentForServerSelection(null);
              setStreamResolving(true);
              let torrentUrl = content.torrentUrl;
              const plugin = plugins.find((p) => p.isActive && p.type === 'torrent');
              if (plugin && content.stremioStreamId) {
                try {
                  const stremioType = contentTypeToStremioType(content.type);
                  const rows = await fetchStreamsViaProxy(plugin.url, stremioType, content.stremioStreamId);
                  const picked = pickFirstPlayableMagnet(rows);
                  if (picked) torrentUrl = picked;
                } catch {
                  /* fall through to preset or demo magnet */
                }
              }
              setStreamResolving(false);
              setPlayingContent({ ...content, torrentUrl });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {streamResolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[160] flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-14 h-14 text-sky-400 animate-spin" />
            <p className="text-base font-medium text-zinc-200">Resolving streams from your addon…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playingContent && (
          <Player 
            torrentId={playingContent.torrentUrl ?? DEFAULT_DEMO_MAGNET}
            onClose={() => {
              setPlayingContent(null);
              setSelectedServer(null);
            }} 
            pluginName={`${plugins.find(p => p.isActive && p.type === 'torrent')?.name || 'WebTorrent'} · ${selectedServer?.name || 'Auto'}`}
            mediaLocales={resolveMediaLocales(playingContent)}
            contentTitle={playingContent.title}
          />
        )}
      </AnimatePresence>
    </Router>
  );
}
