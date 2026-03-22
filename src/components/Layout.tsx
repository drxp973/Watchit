import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Film, 
  Tv, 
  Grid, 
  Heart, 
  History, 
  Search, 
  Bell, 
  Download, 
  Monitor, 
  User, 
  Menu, 
  X,
  Edit2,
  Check,
  Camera,
  Puzzle,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Profile } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeProfile: Profile | null;
  onSwitchProfile: () => void;
}

export default function Layout({ children, activeProfile, onSwitchProfile }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [editName, setEditName] = useState(activeProfile?.name || '');
  const [editAvatar, setEditAvatar] = useState(activeProfile?.avatar || '');
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Film, label: 'Movies', path: '/movies' },
    { icon: Tv, label: 'Shows', path: '/shows' },
    { icon: Grid, label: 'Categories', path: '/categories' },
    { icon: Puzzle, label: 'Plugins', path: '/plugins' },
    { icon: Heart, label: 'Favorites', path: '/favorites' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !editName.trim()) return;

    try {
      const profileRef = doc(db, 'profiles', activeProfile.id);
      await updateDoc(profileRef, {
        name: editName,
        avatar: editAvatar
      });
      setIsEditingProfile(false);
      // The parent component will receive the update via onSnapshot
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'profiles');
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-zinc-900/80 border-r border-white/[0.06] transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <Film className="text-black w-5 h-5" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Watchit</span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/5 group",
                location.pathname === item.path ? "bg-sky-500/10 text-sky-500" : "text-gray-400"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path && "text-sky-500")} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={onSwitchProfile}
              className="flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
            >
              <img 
                src={activeProfile?.avatar || "https://picsum.photos/seed/user/100/100"} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
              {isSidebarOpen && (
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{activeProfile?.name || "Guest"}</p>
                  <p className="text-[10px] text-gray-500">Switch Profile</p>
                </div>
              )}
            </button>
            {isSidebarOpen && (
              <button 
                onClick={() => {
                  setEditName(activeProfile?.name || '');
                  setEditAvatar(activeProfile?.avatar || '');
                  setIsEditingProfile(true);
                }}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-sky-500 transition-all"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-all"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="relative max-w-md w-full ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search movies, shows, animes..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-sky-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="p-2 hover:bg-white/5 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-all" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full border-2 border-[#0a0a0a]"></span>
              </button>
              
              {/* Notifications Dropdown */}
              <div className="absolute right-0 mt-2 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] p-4">
                <h3 className="font-bold mb-4 px-2">New Releases</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Dune: Part Two', type: 'Movie', time: '2h ago' },
                    { title: 'Shogun', type: 'Show', time: '5h ago' },
                    { title: 'Solo Leveling', type: 'Anime', time: '1d ago' }
                  ].map((n, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
                        <Film className="w-5 h-5 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{n.title}</p>
                        <p className="text-[10px] text-gray-500">{n.type} • {n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-xs font-bold text-sky-500 hover:bg-sky-500/10 rounded-lg transition-all">
                  View All Notifications
                </button>
              </div>
            </div>
            
            <button className="p-2 hover:bg-white/5 rounded-lg group">
              <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-all" />
            </button>
            
            <button className="p-2 hover:bg-white/5 rounded-lg group">
              <Monitor className="w-5 h-5 text-gray-400 group-hover:text-white transition-all" />
            </button>
          </div>
        </header>

        {/* Profile Edit Modal */}
        <AnimatePresence>
          {isEditingProfile && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#111] border border-white/10 p-10 rounded-[40px] max-w-md w-full shadow-2xl"
              >
                <h2 className="text-3xl font-black mb-8 tracking-tight">Edit Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => setEditAvatar(`https://picsum.photos/seed/${Math.random()}/200/200`)}>
                      <img 
                        src={editAvatar} 
                        alt="Avatar Preview" 
                        className="w-32 h-32 rounded-3xl object-cover border-4 border-sky-500/20 group-hover:border-sky-500 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => document.getElementById('avatar-file')?.click()}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
                        title="Upload File"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input 
                        id="avatar-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button 
                        type="button"
                        onClick={() => setIsUrlInputVisible(!isUrlInputVisible)}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          isUrlInputVisible ? "bg-sky-500 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                        title="Paste URL"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isUrlInputVisible && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="w-full overflow-hidden"
                        >
                          <div className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
                            <input 
                              type="text"
                              value={avatarUrlInput}
                              onChange={(e) => setAvatarUrlInput(e.target.value)}
                              placeholder="Paste image URL here..."
                              className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (avatarUrlInput.trim()) {
                                  setEditAvatar(avatarUrlInput);
                                  setIsUrlInputVisible(false);
                                  setAvatarUrlInput('');
                                }
                              }}
                              className="p-2 bg-sky-500 text-black rounded-xl hover:bg-sky-600 transition-all"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Click image to shuffle or use icons to upload/link</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Profile Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-lg focus:outline-none focus:border-sky-500 transition-all"
                      placeholder="Enter profile name"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit"
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
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

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
