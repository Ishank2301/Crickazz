import React, { useState } from 'react';
import { Header } from './components/Header';
import { LiveTicker } from './components/LiveTicker';
import { HomePage } from './components/HomePage';
import { LiveMatchPage } from './components/LiveMatchPage';
import { PlayerStatsPage } from './components/PlayerStatsPage';
import { SqlAnalyticsPage } from './components/SqlAnalyticsPage';
import { CrudAdminPage } from './components/CrudAdminPage';
import { INITIAL_MATCHES } from './data/mockCricketData';
import { Match } from './types/cricket';
import { Database, Terminal, Shield, BookOpen } from 'lucide-react';
import { sounds } from './utils/audio';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(INITIAL_MATCHES[0].id);

  const handleUpdateMatch = (updated: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleResetMatch = () => {
    setMatches(INITIAL_MATCHES);
    setSelectedMatchId(INITIAL_MATCHES[0].id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header conforming to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Horizontal Live Matches Ticker */}
      <LiveTicker
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={(id) => {
          setSelectedMatchId(id);
          setActiveTab('live');
        }}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
        {activeTab === 'live' && (
          <LiveMatchPage
            matches={matches}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onUpdateMatch={handleUpdateMatch}
            onResetMatch={handleResetMatch}
          />
        )}
        {activeTab === 'players' && <PlayerStatsPage />}
        {activeTab === 'analytics' && <SqlAnalyticsPage />}
        {activeTab === 'crud' && <CrudAdminPage />}
      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Cricbuzz LiveStats</span>
            <span>·</span>
            <span>Real-Time Cricket Insights & SQL-Based Analytics</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => setActiveTab('analytics')} className="hover:text-emerald-400 transition-colors">
              25 SQL Questions
            </button>
            <button onClick={() => setActiveTab('live')} className="hover:text-emerald-400 transition-colors">
              Live Scores
            </button>
            <button onClick={() => setActiveTab('crud')} className="hover:text-emerald-400 transition-colors">
              Database CRUD
            </button>
            <button onClick={() => setActiveTab('home')} className="hover:text-emerald-400 transition-colors">
              Documentation
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
