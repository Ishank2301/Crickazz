import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Terminal, LogIn, LogOut } from 'lucide-react';
import { sounds } from '../utils/audio';
import { auth, signInWithGoogle, logOut, subscribeToAuth } from '../services/firebase';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  setIsMuted,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthAction = async () => {
    if (currentUser) {
      try {
        await logOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
    } else {
      setIsSigningIn(true);
      try {
        await signInWithGoogle();
      } catch (err) {
        console.error('Login error:', err);
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
    if (!nextMuted) {
      sounds.playClick();
    }
  };

  const navLinks = [
    { id: 'home', label: 'Overview' },
    { id: 'live', label: 'Live Matches' },
    { id: '3d', label: '3D Hawkeye' },
    { id: 'players', label: 'Player Stats' },
    { id: 'analytics', label: 'SQL Analytics' },
    { id: 'crud', label: 'Data Admin' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => {
              setActiveTab('home');
              sounds.playClick();
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none"
          >
            <span className="font-sports text-2xl tracking-wide uppercase text-slate-100">Cricbuzz</span>
            <span className="font-sports text-2xl tracking-wide uppercase text-emerald-500">LiveStats</span>
          </button>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-400">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    sounds.playClick();
                  }}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    isActive
                      ? 'text-white font-semibold border-b-2 border-emerald-500'
                      : 'hover:text-slate-200'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action & User account */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute match audio' : 'Mute match audio'}
              className="p-2 rounded-md bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 transition text-xs"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              )}
            </button>

            {/* Auth Profile / Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[90px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleAuthAction}
                  title="Sign Out"
                  className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthAction}
                disabled={isSigningIn}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* 25 SQL Queries CTA */}
            <button
              onClick={() => {
                setActiveTab('analytics');
                sounds.playClick();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-500 active:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>25 SQL Queries</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar for smaller screens */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-2 text-xs font-medium">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                sounds.playClick();
              }}
              className={`px-3 py-1 rounded whitespace-nowrap ${
                activeTab === link.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
