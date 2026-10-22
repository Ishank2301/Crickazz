import React, { useState } from 'react';
import { Match, MatchCategory, MatchStatus } from '../types/cricket';
import { MapPin, Clock, Trophy, ChevronRight, PlayCircle, BarChart2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
  searchQuery: string;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  onSelectMatch,
  searchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MatchCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MatchStatus | 'all'>('all');

  const filteredMatches = matches.filter((m) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.title} ${m.subtitle} ${m.series} ${m.venue} ${m.teamA.name} ${m.teamB.name}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    // Status filter
    if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;

    return true;
  });

  const liveCount = matches.filter((m) => m.status === 'live').length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 p-6 sm:p-8 border border-emerald-500/20 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-Time Cricket Intelligence & Ball Simulation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Follow Every Ball, Boundary & Wicket on <span className="text-emerald-400">Crickazz</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Interactive live ball commentary, instant scorecard simulator, ICC rankings, series points tables, and fantasy team builder.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: 'All Matches' },
            { id: 'live', label: `Live (${liveCount})`, isLive: true },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Recent / Result' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => {
                setSelectedStatus(status.id as MatchStatus | 'all');
                sounds.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedStatus === status.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status.isLive && (
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <span>{status.label}</span>
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Formats' },
            { id: 'international', label: 'International' },
            { id: 'league', label: 'T20 Leagues (IPL)' },
            { id: 'women', label: "Women's" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id as MatchCategory | 'all');
                sounds.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards Grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No matches found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMatches.map((match) => {
            const isLive = match.status === 'live';
            const isCompleted = match.status === 'completed';

            return (
              <div
                key={match.id}
                onClick={() => {
                  onSelectMatch(match.id);
                  sounds.playClick();
                }}
                className={`group relative rounded-2xl bg-slate-900 border transition-all duration-200 hover:shadow-xl cursor-pointer p-5 flex flex-col justify-between ${
                  isLive
                    ? 'border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/90 shadow-md shadow-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Series & Status */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-400 font-medium truncate max-w-[200px] sm:max-w-[250px]">
                      {match.series}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {match.format}
                      </span>
                      {isLive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          LIVE
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800/90 text-slate-400">
                          Result
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subtitle */}
                  <h3 className="text-sm font-semibold text-slate-300 group-hover:text-emerald-300 transition-colors">
                    {match.subtitle}
                  </h3>

                  {/* Team Scores Section */}
                  <div className="mt-4 space-y-3 bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
                    {/* Team A */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{match.teamA.flag}</span>
                        <div>
                          <span className="font-bold text-slate-100 text-sm sm:text-base">
                            {match.teamA.name}
                          </span>
                          <span className="ml-1.5 text-xs text-slate-400 font-mono">({match.teamA.shortName})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-numbers font-bold text-base sm:text-lg text-slate-100">
                          {match.teamA.score || 'Yet to bat'}
                        </div>
                        {match.teamA.overs && (
                          <div className="text-[11px] text-slate-400 font-mono-numbers">
                            ({match.teamA.overs} ov)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{match.teamB.flag}</span>
                        <div>
                          <span className="font-bold text-slate-100 text-sm sm:text-base">
                            {match.teamB.name}
                          </span>
                          <span className="ml-1.5 text-xs text-slate-400 font-mono">({match.teamB.shortName})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-numbers font-bold text-base sm:text-lg text-slate-100">
                          {match.teamB.score || (match.status === 'upcoming' ? 'Scheduled' : 'Yet to bat')}
                        </div>
                        {match.teamB.overs && (
                          <div className="text-[11px] text-slate-400 font-mono-numbers">
                            ({match.teamB.overs} ov)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match summary / requirement */}
                  <div className="mt-3 flex items-start gap-2 text-xs">
                    <span className="inline-block mt-0.5 text-emerald-400">⚡</span>
                    <span className="text-emerald-300 font-medium">
                      {match.summaryStatus}
                    </span>
                  </div>
                </div>

                {/* Footer details & Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300 font-semibold group-hover:translate-x-1 transition-transform"
                    >
                      <span>{isLive ? 'Match Center' : 'View Details'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
