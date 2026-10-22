import React, { useState } from 'react';
import { Player } from '../types/cricket';
import { MOCK_PLAYERS } from '../data/mockCricketData';
import { 
  Users, 
  Search, 
  Trophy, 
  Award, 
  TrendingUp, 
  Flame, 
  ChevronRight, 
  ArrowUpDown,
  Filter,
  Check
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const PlayerStatsPage: React.FC = () => {
  const [players] = useState<Player[]>(MOCK_PLAYERS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparePlayer1, setComparePlayer1] = useState<Player | null>(MOCK_PLAYERS[0]);
  const [comparePlayer2, setComparePlayer2] = useState<Player | null>(MOCK_PLAYERS[1]);

  const filteredPlayers = players.filter((p) => {
    if (selectedRole !== 'All' && p.role !== selectedRole) return false;
    if (selectedCountry !== 'All' && p.country !== selectedCountry) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
    }
    return true;
  });

  // Top Batting & Bowling Leaderboard metrics
  const topRunScorers = [...players].sort((a, b) => b.runs - a.runs).slice(0, 4);
  const topWicketTakers = [...players].filter((p) => p.wickets && p.wickets > 0).sort((a, b) => (b.wickets || 0) - (a.wickets || 0)).slice(0, 4);
  const topStrikeRates = [...players].sort((a, b) => b.strikeRate - a.strikeRate).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Cricbuzz LiveStats Database</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Top Player Statistics & Leaderboards
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Career batting aggregates, bowling records, strike rate benchmarks, and head-to-head player performance comparison.
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Metric Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Leaderboard 1: Most Runs */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Career Run Leaders</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">ALL FORMATS</span>
          </div>

          <div className="space-y-2.5">
            {topRunScorers.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlayer(p);
                  sounds.playClick();
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    <span className="text-[11px] text-slate-500 block">{p.country}</span>
                  </div>
                </div>
                <div className="text-right font-mono-numbers">
                  <span className="font-bold text-emerald-400">{p.runs.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">Avg {p.battingAvg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard 2: Top Wickets */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              <span>Wicket Masters</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">ALL FORMATS</span>
          </div>

          <div className="space-y-2.5">
            {topWicketTakers.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlayer(p);
                  sounds.playClick();
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    idx === 0 ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    <span className="text-[11px] text-slate-500 block">{p.country}</span>
                  </div>
                </div>
                <div className="text-right font-mono-numbers">
                  <span className="font-bold text-sky-400">{p.wickets} Wkts</span>
                  <span className="text-[10px] text-slate-400 block">Econ {p.economy || '4.5'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard 3: Highest Strike Rates */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Power Hitters (Strike Rate)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">T20 & WHITE BALL</span>
          </div>

          <div className="space-y-2.5">
            {topStrikeRates.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlayer(p);
                  sounds.playClick();
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    idx === 0 ? 'bg-orange-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    <span className="text-[11px] text-slate-500 block">{p.country}</span>
                  </div>
                </div>
                <div className="text-right font-mono-numbers">
                  <span className="font-bold text-orange-400">{p.strikeRate} SR</span>
                  <span className="text-[10px] text-slate-400 block">{p.runs} Runs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparison Tool */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-emerald-400" />
              <span>Head-to-Head Player Comparison</span>
            </h2>
            <p className="text-xs text-slate-400">Select any two players to compare key career metrics</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={comparePlayer1?.id || ''}
              onChange={(e) => setComparePlayer1(players.find((p) => p.id === e.target.value) || null)}
              className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
              ))}
            </select>
            <span className="text-slate-500 font-bold">VS</span>
            <select
              value={comparePlayer2?.id || ''}
              onChange={(e) => setComparePlayer2(players.find((p) => p.id === e.target.value) || null)}
              className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
              ))}
            </select>
          </div>
        </div>

        {comparePlayer1 && comparePlayer2 && (
          <div className="grid grid-cols-3 gap-4 text-center items-center font-mono-numbers text-xs">
            <div className="space-y-1">
              <div className="font-bold font-sans text-sm sm:text-base text-sky-400">{comparePlayer1.name}</div>
              <div className="text-[11px] font-sans text-slate-400">{comparePlayer1.role} · {comparePlayer1.country}</div>
            </div>

            <div className="font-sans font-bold text-xs text-slate-500 uppercase tracking-wider">
              Comparison Metric
            </div>

            <div className="space-y-1">
              <div className="font-bold font-sans text-sm sm:text-base text-amber-400">{comparePlayer2.name}</div>
              <div className="text-[11px] font-sans text-slate-400">{comparePlayer2.role} · {comparePlayer2.country}</div>
            </div>

            {/* Metric Rows */}
            {[
              { label: 'Total Matches', val1: comparePlayer1.matches, val2: comparePlayer2.matches },
              { label: 'Career Runs', val1: comparePlayer1.runs, val2: comparePlayer2.runs },
              { label: 'Highest Score', val1: comparePlayer1.highestScore, val2: comparePlayer2.highestScore },
              { label: 'Batting Average', val1: comparePlayer1.battingAvg, val2: comparePlayer2.battingAvg },
              { label: 'Strike Rate', val1: comparePlayer1.strikeRate, val2: comparePlayer2.strikeRate },
              { label: 'Centuries (100s)', val1: comparePlayer1.centuries, val2: comparePlayer2.centuries },
              { label: 'Total Wickets', val1: comparePlayer1.wickets || 0, val2: comparePlayer2.wickets || 0 },
            ].map((m) => (
              <React.Fragment key={m.label}>
                <div className={`p-2 rounded bg-slate-950/60 font-bold ${
                  m.val1 > m.val2 ? 'text-emerald-400 border border-emerald-500/20' : 'text-slate-300'
                }`}>
                  {m.val1}
                </div>
                <div className="font-sans text-[11px] text-slate-400">{m.label}</div>
                <div className={`p-2 rounded bg-slate-950/60 font-bold ${
                  m.val2 > m.val1 ? 'text-emerald-400 border border-emerald-500/20' : 'text-slate-300'
                }`}>
                  {m.val2}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filterable Player Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            All Players Directory ({filteredPlayers.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <option value="All">All Roles</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicket-keeper">Wicket-keeper</option>
            </select>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <option value="All">All Countries</option>
              <option value="India">India</option>
              <option value="Australia">Australia</option>
              <option value="England">England</option>
              <option value="South Africa">South Africa</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Afghanistan">Afghanistan</option>
            </select>
          </div>
        </div>

        {/* Player Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedPlayer(p);
                sounds.playClick();
              }}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm hover:text-emerald-400 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.country} · {p.role}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Age {p.age}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center font-mono-numbers text-xs">
                  <div>
                    <span className="text-[10px] font-sans text-slate-500 block">Runs</span>
                    <span className="font-bold text-slate-200">{p.runs}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-slate-500 block">Avg</span>
                    <span className="font-bold text-emerald-400">{p.battingAvg}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-slate-500 block">{p.wickets ? 'Wkts' : 'SR'}</span>
                    <span className="font-bold text-sky-400">{p.wickets ? p.wickets : p.strikeRate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{p.battingStyle}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Player Details */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedPlayer.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPlayer.role} · {selectedPlayer.country}</p>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono-numbers text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-sans text-slate-500 block">Matches</span>
                <span className="text-base font-bold text-slate-100">{selectedPlayer.matches}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-sans text-slate-500 block">Total Runs</span>
                <span className="text-base font-bold text-emerald-400">{selectedPlayer.runs}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-sans text-slate-500 block">Batting Avg</span>
                <span className="text-base font-bold text-slate-100">{selectedPlayer.battingAvg}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-sans text-slate-500 block">Strike Rate</span>
                <span className="text-base font-bold text-amber-400">{selectedPlayer.strikeRate}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Highest Score:</span>
                <span className="font-mono-numbers font-bold text-slate-200">{selectedPlayer.highestScore}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Centuries / Fifties:</span>
                <span className="font-mono-numbers font-bold text-slate-200">{selectedPlayer.centuries} / {selectedPlayer.fifties}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Batting Style:</span>
                <span className="text-slate-200">{selectedPlayer.battingStyle}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Bowling Style:</span>
                <span className="text-slate-200">{selectedPlayer.bowlingStyle || 'None'}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
