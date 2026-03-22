import React from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Zap, 
  Ghost, 
  Heart, 
  Sword, 
  Rocket, 
  Smile, 
  Skull, 
  Compass, 
  Music, 
  Theater, 
  Shield 
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Action', icon: Flame, color: 'bg-orange-500' },
  { name: 'Adventure', icon: Compass, color: 'bg-blue-500' },
  { name: 'Animation', icon: Zap, color: 'bg-yellow-500' },
  { name: 'Comedy', icon: Smile, color: 'bg-pink-500' },
  { name: 'Crime', icon: Shield, color: 'bg-red-500' },
  { name: 'Drama', icon: Theater, color: 'bg-purple-500' },
  { name: 'Fantasy', icon: Sword, color: 'bg-indigo-500' },
  { name: 'Horror', icon: Skull, color: 'bg-gray-700' },
  { name: 'Sci-Fi', icon: Rocket, color: 'bg-cyan-500' },
  { name: 'Romance', icon: Heart, color: 'bg-rose-500' },
  { name: 'Thriller', icon: Ghost, color: 'bg-sky-600' },
  { name: 'Musical', icon: Music, color: 'bg-violet-500' },
];

export default function CategoryGrid() {
  return (
    <div className="p-12">
      <h1 className="text-4xl font-black mb-12 tracking-tight">Browse Categories</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.name}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="group relative h-40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"
          >
            <div className={`absolute inset-0 ${cat.color} opacity-20 group-hover:opacity-40 transition-all duration-500`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <cat.icon className="w-10 h-10 mb-4 text-white group-hover:scale-110 transition-all duration-500" />
              <span className="text-lg font-bold tracking-tight">{cat.name}</span>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 group-hover:bg-white/30 transition-all" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
