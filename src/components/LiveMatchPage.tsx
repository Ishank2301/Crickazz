import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { INITIAL_MATCHES } from '../data/mockCricketData';
import { MatchCenter } from './MatchCenter';
import { MatchList } from './MatchList';
import { getCricbuzzKey, saveCricbuzzKey, fetchLiveMatchesFromCricbuzz } from '../services/cricbuzzApi';
import { 
  Activity, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Globe2, 
  Sliders, 
  ExternalLink 
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface LiveMatchPageProps {
  matches: Match[];
  selectedMatchId: string;
  onSelectMatch: (id: string) => void;
  onUpdateMatch: (m: Match) => void;
  onResetMatch: () => void;
}

export const LiveMatchPage: React.FC<LiveMatchPageProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onUpdateMatch,
  onResetMatch,
}) => {
  const [viewMode, setViewMode] = useState<'match-center' | 'all-matches'>('match-center');
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(getCricbuzzKey());
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  const handleSaveApiKey = () => {
    saveCricbuzzKey(apiKeyInput);
    setApiStatus('API Key saved successfully!');
    sounds.playClick();
    setTimeout(() => {
      setApiStatus(null);
      setIsApiModalOpen(false);
    }, 1500);
  };

  const handleTestApiConnection = async () => {
    setIsRefreshing(true);
    setApiStatus('Connecting to RapidAPI Cricbuzz endpoint...');
    const res = await fetchLiveMatchesFromCricbuzz();
    setIsRefreshing(false);
    if (res.success) {
      setApiStatus('✅ Successfully connected to live Cricbuzz API stream!');
    } else {
      setApiStatus(`Notice: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Cricbuzz API Control Bar */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Cricbuzz REST API</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live tournament feeds synced with local SQLite relational database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => {
                setViewMode('match-center');
                sounds.playClick();
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                viewMode === 'match-center' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Match Center
            </button>
            <button
              onClick={() => {
                setViewMode('all-matches');
                sounds.playClick();
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                viewMode === 'all-matches' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Matches ({matches.length})
            </button>
          </div>

          {/* RapidAPI Key Settings */}
          <button
            onClick={() => setIsApiModalOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Configure RapidAPI Cricbuzz Key"
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">API Config</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'match-center' ? (
        <MatchCenter
          match={activeMatch}
          onUpdateMatch={onUpdateMatch}
          onResetMatch={onResetMatch}
        />
      ) : (
        <MatchList
          matches={matches}
          onSelectMatch={(id) => {
            onSelectMatch(id);
            setViewMode('match-center');
          }}
          searchQuery=""
        />
      )}

      {/* Modal: Cricbuzz API Configuration */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>RapidAPI Cricbuzz Integration</span>
              </h3>
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cricbuzz LiveStats comes pre-seeded with authentic, complete match streams. To fetch directly from RapidAPI's live endpoints, enter your API key below:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  x-rapidapi-key
                </label>
                <input
                  type="password"
                  placeholder="Enter RapidAPI Key (optional)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-800 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {apiStatus && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono">
                  {apiStatus}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestApiConnection}
                disabled={isRefreshing}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
