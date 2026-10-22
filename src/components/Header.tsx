import React from 'react';
import { Volume2, VolumeX, Terminal } from 'lucide-react';
import { sounds } from '../utils/audio';

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
  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
    if (!nextMuted) {
      sounds.playClick();
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'live', label: 'Live Matches' },
    { id: 'players', label: 'Player Stats' },
    { id: 'analytics', label: 'SQL Analytics' },
    { id: 'crud', label: 'CRUD Admin' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark (no secondary badges) */}
          <button
            onClick={() => {
              setActiveTab('home');
              sounds.playClick();
            }}
            className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Cricbuzz</span>
            <span className="text-emerald-400">LiveStats</span>
          </button>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
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
                      ? 'text-emerald-400 font-bold border-b-2 border-emerald-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute match audio' : 'Mute match audio'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1 text-xs font-semibold"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline text-slate-400">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Audio On</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                sounds.playClick();
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>SQL Queries (25)</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar for smaller screens */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-2 text-xs font-semibold">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                sounds.playClick();
              }}
              className={`px-3 py-1 rounded-md whitespace-nowrap ${
                activeTab === link.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
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
