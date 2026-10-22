import React, { useState } from 'react';
import { Standing } from '../types/cricket';
import { STANDINGS_WTC, STANDINGS_IPL } from '../data/mockCricketData';
import { Trophy, Shield, Info } from 'lucide-react';
import { sounds } from '../utils/audio';

export const PointsTable: React.FC = () => {
  const [activeTournament, setActiveTournament] = useState<'wtc' | 'ipl'>('wtc');

  const standings: Standing[] = activeTournament === 'wtc' ? STANDINGS_WTC : STANDINGS_IPL;

  return (
    <div className="space-y-6">
      {/* Header & Tournament Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Series & Tournament Standings</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official ICC World Test Championship 2023-2025/2026 & T20 League Points Tables
          </p>
        </div>

        {/* Toggle Tournament */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTournament('wtc');
              sounds.playClick();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              activeTournament === 'wtc'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ICC World Test Championship
          </button>
          <button
            onClick={() => {
              setActiveTournament('ipl');
              sounds.playClick();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              activeTournament === 'ipl'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Indian Premier League (IPL)
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-850/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>{activeTournament === 'wtc' ? 'ICC WTC Standings' : 'IPL 2026 Table'}</span>
          </div>
          <span className="text-xs text-slate-400">
            Top 2 qualify for the Final at Lord’s / Playoffs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-12">#</th>
                <th className="py-3 px-4 font-semibold">Team</th>
                <th className="py-3 px-3 text-center font-semibold">P</th>
                <th className="py-3 px-3 text-center font-semibold">W</th>
                <th className="py-3 px-3 text-center font-semibold">L</th>
                <th className="py-3 px-3 text-center font-semibold">T/NR</th>
                <th className="py-3 px-4 text-center font-bold text-emerald-400">PTS</th>
                <th className="py-3 px-4 text-right font-semibold">NRR / PCT</th>
                <th className="py-3 px-4 text-center font-semibold">Last 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {standings.map((team, idx) => (
                <tr
                  key={team.teamShort}
                  className={`hover:bg-slate-850/50 transition-colors ${
                    idx < 2 ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950 font-extrabold'
                        : 'text-slate-400'
                    }`}>
                      {team.rank}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-100 flex items-center gap-3">
                    <span className="text-xl">{team.flag}</span>
                    <div>
                      <span className="text-sm">{team.teamName}</span>
                      <span className="ml-1.5 text-xs text-slate-500">({team.teamShort})</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center text-slate-300">{team.played}</td>
                  <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">{team.won}</td>
                  <td className="py-3.5 px-3 text-center text-red-400">{team.lost}</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">{team.tied + team.nr}</td>
                  <td className="py-3.5 px-4 text-center text-base font-extrabold text-emerald-400">{team.points}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-300">{team.nrr}</td>

                  {/* Form guide badges */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 font-sans font-bold">
                      {team.form.map((res, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                            res === 'W'
                              ? 'bg-emerald-600 text-white'
                              : res === 'L'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Green highlight indicates teams positioned in the qualification zone for the Grand Final.</span>
        </div>
      </div>
    </div>
  );
};
