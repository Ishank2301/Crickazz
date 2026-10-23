import React, { useState } from 'react';
import { Header } from './components/Header';
import { LiveTicker } from './components/LiveTicker';
import { HomePage } from './components/HomePage';
import { LiveMatchPage } from './components/LiveMatchPage';
import { PlayerStatsPage } from './components/PlayerStatsPage';
import { SqlAnalyticsPage } from './components/SqlAnalyticsPage';
import { CrudAdminPage } from './components/CrudAdminPage';
import { DiagnosticsPage } from './components/DiagnosticsPage';
import { CricketPitch3D } from './components/CricketPitch3D';
import { INITIAL_MATCHES } from './data/mockCricketData';
import { Match } from './types/cricket';
import { Sparkles, Eye, Target, Compass, Layers, Activity } from 'lucide-react';
import { sounds } from './utils/audio';
import { warmupDatabase } from './services/db';

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

  // Eager pre-warm of SQLite WASM and analytical engine
  React.useEffect(() => {
    warmupDatabase().catch((err) => {
      console.warn('Eager warmup note:', err);
    });
  }, []);

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
        {activeTab === '3d' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-[#111827] border border-slate-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 mb-1.5">
                    <span>3D WebGL Cricket Physics</span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-400">PBR Stadium & Ball Trajectory</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                    3D Stadium, Pitch & Hawkeye Analytics
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Interactive 3D cricket stadium environment. Inspect 22-yard pitch dimensions, simulate real-time ball trajectories with pitch bounce markers and stump impact, and analyze 360-degree wagon wheels.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Drag to rotate · Scroll to zoom</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Three.js 3D Pitch Component */}
            <CricketPitch3D />

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>Hawkeye Ball Tracking</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Computes ball release angles, pitch impact points, and stump collision mechanics with real-time speedometers.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>360° Wagon Wheel</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traces shot arcs, boundary clearance heights, and spray charts across cover drives, pulls, cuts, and sweeps.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Pitch & Crease Dimensions</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  22-yard (20.12m) pitch geometry with official popping, bowling, and return crease line markings, wooden stumps, and sight screens.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'players' && <PlayerStatsPage />}
        {activeTab === 'analytics' && <SqlAnalyticsPage />}
        {activeTab === 'crud' && <CrudAdminPage />}
        {activeTab === 'diagnostics' && <DiagnosticsPage />}
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
            <button onClick={() => setActiveTab('3d')} className="hover:text-emerald-400 transition-colors">
              3D Stadium & Hawkeye
            </button>
            <button onClick={() => setActiveTab('analytics')} className="hover:text-emerald-400 transition-colors">
              25 SQL Questions
            </button>
            <button onClick={() => setActiveTab('live')} className="hover:text-emerald-400 transition-colors">
              Live Scores
            </button>
            <button onClick={() => setActiveTab('crud')} className="hover:text-emerald-400 transition-colors">
              Database CRUD
            </button>
            <button onClick={() => setActiveTab('diagnostics')} className="hover:text-emerald-400 transition-colors">
              Diagnostics
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
