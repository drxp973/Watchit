import React, { useState, useEffect } from 'react';
import { Play, Info, Heart, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Content } from '../types';

interface HeroProps {
  featuredContent: Content[];
}

export default function Hero({ featuredContent }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredContent.length]);

  const current = featuredContent[currentIndex];

  return (
    <div className="relative h-[85vh] w-full overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-10" />
          <img 
            src={current.backdropUrl || current.posterUrl} 
            alt={current.title}
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 p-12 z-20 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-sky-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              New Release
            </span>
            <span className="text-gray-400 text-sm font-medium">
              {current.type.toUpperCase()} • {current.genre.join(', ')}
            </span>
          </div>
          <h1 className="text-7xl font-black mb-6 tracking-tighter leading-none">
            {current.title}
          </h1>
          <p className="text-lg text-gray-300 mb-8 line-clamp-3 leading-relaxed">
            {current.description}
          </p>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-sky-500 hover:text-black transition-all transform hover:scale-105">
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </button>
            <button className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all border border-white/10">
              <Info className="w-5 h-5" />
              More Info
            </button>
            <button className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/10">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 right-12 z-20 flex gap-2">
        {featuredContent.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === currentIndex ? "w-8 bg-sky-500" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      <button 
        onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredContent.length) % featuredContent.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredContent.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
