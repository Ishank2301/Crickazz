import React from 'react';
import { Match } from '../types/cricket';
import { Flame, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LiveTickerProps {
  matches: Match[];
  selectedMatchId: string;
  onSelectMatch: (matchId: string) => void;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800/80 py-2.5 px-4 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pr-2 border-r border-slate-800">
          <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>Matches</span>
        </div>

        {matches.map((match) => {
          const isSelected = match.id === selectedMatchId;
          const isLive = match.status === 'live';

          return (
            <button
              key={match.id}
              onClick={() => {
                onSelectMatch(match.id);
                sounds.playClick();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition border ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500/60 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/60'
              }`}
            >
              {/* Status indicator */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {isLive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase ${
                    isLive ? 'text-red-400' : match.status === 'completed' ? 'text-slate-400' : 'text-blue-400'
                  }`}>
                    {match.status}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{match.format}</span>
              </div>

              {/* Teams & Scores */}
              <div className="flex flex-col border-l border-slate-700/50 pl-2.5 space-y-0.5">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-slate-200">
                    <span>{match.teamA.flag}</span>
                    <span>{match.teamA.shortName}</span>
                  </span>
                  <span className="font-mono-numbers text-slate-300">
                    {match.teamA.score || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-slate-200">
                    <span>{match.teamB.flag}</span>
                    <span>{match.teamB.shortName}</span>
                  </span>
                  <span className="font-mono-numbers text-slate-300">
                    {match.teamB.score || '-'}
                  </span>
                </div>
              </div>

              <ChevronRight className={`w-3.5 h-3.5 transition ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
