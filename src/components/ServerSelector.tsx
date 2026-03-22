import React, { useMemo } from 'react';
import { Server, Content } from '../types';
import { Globe, Zap, Users, Check, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ServerSelectorProps {
  content: Content;
  onSelect: (server: Server) => void | Promise<void>;
  onClose: () => void;
}

const MOCK_SERVERS: Server[] = [
  { id: 'us-east-1', name: 'Alpha Stream', region: 'US', quality: '4K', load: 45, users: 1240, latency: 24 },
  { id: 'eu-west-1', name: 'Nova Node', region: 'EU', quality: '1080p', load: 78, users: 3420, latency: 85 },
  { id: 'asia-east-1', name: 'Zenith Hub', region: 'ASIA', quality: '1080p', load: 30, users: 850, latency: 180 },
  { id: 'us-west-1', name: 'Titan Core', region: 'US', quality: '1080p', load: 92, users: 5600, latency: 42 },
  { id: 'latam-1', name: 'Solaris', region: 'LATAM', quality: '720p', load: 15, users: 230, latency: 120 },
  { id: 'eu-central-1', name: 'Vortex', region: 'EU', quality: '4K', load: 60, users: 2100, latency: 72 },
];

export default function ServerSelector({ content, onSelect, onClose }: ServerSelectorProps) {
  const sortedServers = useMemo(() => {
    return [...MOCK_SERVERS].sort((a, b) => {
      const qualityScore = { '4K': 3, '1080p': 2, '720p': 1 };
      const scoreA = qualityScore[a.quality] * 100 - a.latency;
      const scoreB = qualityScore[b.quality] * 100 - b.latency;
      return scoreB - scoreA;
    });
  }, []);

  const bestServerId = sortedServers[0].id;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/[0.08] w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-sky-500/10 to-transparent">
          <div className="flex items-center gap-6">
            <img 
              src={content.posterUrl} 
              alt={content.title} 
              className="w-16 h-24 rounded-xl object-cover shadow-xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-1">{content.title}</h2>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Select Streaming Server</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white"
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedServers.map((server) => (
              <button
                key={server.id}
                onClick={() => onSelect(server)}
                className={cn(
                  "relative group p-6 rounded-3xl border transition-all text-left flex flex-col gap-4",
                  server.id === bestServerId 
                    ? "bg-sky-500/5 border-sky-500/30 hover:border-sky-500" 
                    : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                {server.id === bestServerId && (
                  <div className="absolute top-4 right-4 bg-sky-500 text-black text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    BEST OPTION
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl",
                      server.id === bestServerId ? "bg-sky-500/20 text-sky-500" : "bg-white/5 text-gray-400"
                    )}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{server.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">{server.quality}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <Users className="w-3 h-3" />
                      Populated
                    </div>
                    <p className="text-sm font-bold text-white">
                      {server.users.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-black shadow-lg">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/5 text-center space-y-1">
          <p className="text-xs text-zinc-500 font-medium">
            Select a server to start playback. Install Torrentio (or another stream addon) under Plugins and keep it Active so streams resolve for each title.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
