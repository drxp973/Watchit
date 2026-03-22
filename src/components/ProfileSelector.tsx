import React, { useState, useEffect } from 'react';
import { Plus, User, Edit2, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Profile } from '../types';

interface ProfileSelectorProps {
  onSelect: (profile: Profile) => void;
}

export default function ProfileSelector({ onSelect }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'profiles'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profileData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
      setProfiles(profileData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    });

    return () => unsubscribe();
  }, []);

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'profiles'), {
        userId: auth.currentUser.uid,
        name: newName,
        avatar: `https://picsum.photos/seed/${newName}/200/200`,
        createdAt: new Date().toISOString()
      });
      setNewName('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'profiles');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black mb-16 tracking-tighter"
      >
        Who's watching?
      </motion.h1>

      <div className="flex flex-wrap justify-center gap-12 max-w-4xl">
        {profiles.map((profile) => (
          <motion.button
            key={profile.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(profile)}
            className="group flex flex-col items-center gap-4"
          >
            <div className="relative w-40 h-40 rounded-3xl overflow-hidden border-4 border-transparent group-hover:border-sky-500 transition-all duration-300 shadow-2xl">
              <img 
                src={profile.avatar} 
                alt={profile.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
            </div>
            <span className="text-xl font-bold text-gray-400 group-hover:text-white transition-all">
              {profile.name}
            </span>
          </motion.button>
        ))}

        {profiles.length < 5 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="group flex flex-col items-center gap-4"
          >
            <div className="w-40 h-40 rounded-3xl bg-white/5 border-4 border-dashed border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-sky-500/50 transition-all duration-300">
              <Plus className="w-12 h-12 text-gray-500 group-hover:text-sky-500 transition-all" />
            </div>
            <span className="text-xl font-bold text-gray-500 group-hover:text-white transition-all">
              Add Profile
            </span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] p-12 rounded-[40px] border border-white/10 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-3xl font-black mb-8 tracking-tight">Create Profile</h2>
              <form onSubmit={handleAddProfile} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Profile Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter name..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-lg focus:outline-none focus:border-sky-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-black font-bold py-4 rounded-2xl transition-all"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
