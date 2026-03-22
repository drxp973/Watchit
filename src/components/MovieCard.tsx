import React from 'react';
import { Play, Plus, Heart, Info, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Content } from '../types';

interface MovieCardProps {
  content: Content;
  progress?: number;
  duration?: number;
}

export default function MovieCard({ content, progress, duration }: MovieCardProps) {
  const progressPercent = progress && duration ? (progress / duration) * 100 : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group cursor-pointer"
    >
      <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/5 shadow-2xl">
        <img 
          src={content.posterUrl} 
          alt={content.title}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-50"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <button className="p-2 bg-sky-500 rounded-full text-black hover:scale-110 transition-all">
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
              <Heart className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="font-bold text-sm mb-1 truncate">{content.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1 text-sky-500">
              <Star className="w-3 h-3 fill-current" />
              {content.rating || '8.5'}
            </span>
            <span>•</span>
            <span>{content.type.toUpperCase()}</span>
            <span>•</span>
            <span>{content.releaseDate?.split('-')[0] || '2024'}</span>
          </div>
        </div>

        {/* Progress Bar (Continue Watching) */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div 
              className="h-full bg-sky-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
