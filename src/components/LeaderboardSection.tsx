import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Shield, 
  Target, 
  Search, 
  RotateCw, 
  Terminal, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  BarChart2, 
  Award,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  fetchBattingLeaders, 
  fetchBowlingLeaders, 
  fetchStrikeRateLeaders, 
  fetchAllRounderLeaders, 
  fetchBoundaryLeaders, 
  fetchLeaderboardSummary,
  BattingLeader,
  BowlingLeader,
  StrikeRateLeader,
  AllRounderLeader,
  BoundaryLeader,
  LeaderboardSummaryStats,
  LEADERBOARD_QUERIES
} from '../services/leaderboardService';
import { sounds } from '../utils/audio';

interface LeaderboardSectionProps {
  onNavigate?: (tab: string, query?: string) => void;
}

type CategoryTab = 'batting' | 'bowling' | 'strikeRate' | 'allRounder' | 'boundary';

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('batting');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [queryLatency, setQueryLatency] = useState<number>(0);

  // Aggregated data states
  const [summary, setSummary] = useState<LeaderboardSummaryStats | null>(null);
  const [battingData, setBattingData] = useState<BattingLeader[]>([]);
  const [bowlingData, setBowlingData] = useState<BowlingLeader[]>([]);
  const [strikeRateData, setStrikeRateData] = useState<StrikeRateLeader[]>([]);
  const [allRounderData, setAllRounderData] = useState<AllRounderLeader[]>([]);
  const [boundaryData, setBoundaryData] = useState<BoundaryLeader[]>([]);

  const loadAllLeaderboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [sum, bat, bowl, sr, ar, bnd] = await Promise.all([
        fetchLeaderboardSummary(),
        fetchBattingLeaders(),
        fetchBowlingLeaders(),
        fetchStrikeRateLeaders(),
        fetchAllRounderLeaders(),
        fetchBoundaryLeaders(),
      ]);

      setSummary(sum);
      setBattingData(bat.data);
      setBowlingData(bowl.data);
      setStrikeRateData(sr.data);
      setAllRounderData(ar.data);
      setBoundaryData(bnd.data);

      // Latency of active category
      if (activeTab === 'batting') setQueryLatency(bat.latencyMs);
      else if (activeTab === 'bowling') setQueryLatency(bowl.latencyMs);
      else if (activeTab === 'strikeRate') setQueryLatency(sr.latencyMs);
      else if (activeTab === 'allRounder') setQueryLatency(ar.latencyMs);
      else if (activeTab === 'boundary') setQueryLatency(bnd.latencyMs);

      if (isManualRefresh) {
        sounds.playBoundary();
      }
    } catch (err) {
      console.error('Error querying SQLite leaderboards:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllLeaderboardData();
  }, []);

  const handleTabChange = (tab: CategoryTab) => {
    setActiveTab(tab);
    sounds.playClick();
    if (tab === 'batting') setQueryLatency(battingData.length ? 0.05 : 0);
    else if (tab === 'bowling') setQueryLatency(bowlingData.length ? 0.05 : 0);
    else if (tab === 'strikeRate') setQueryLatency(strikeRateData.length ? 0.05 : 0);
    else if (tab === 'allRounder') setQueryLatency(allRounderData.length ? 0.05 : 0);
    else if (tab === 'boundary') setQueryLatency(boundaryData.length ? 0.05 : 0);
  };

  // Distinct countries for filter
  const countries = useMemo(() => {
    const list = new Set<string>();
    battingData.forEach((p) => list.add(p.country));
    bowlingData.forEach((p) => list.add(p.country));
    return ['All', ...Array.from(list).sort()];
  }, [battingData, bowlingData]);

  // Filtered views based on search & country
  const filteredBatting = useMemo(() => {
    return battingData.filter((p) => {
      const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const matchesCountry = selectedCountry === 'All' ? true : p.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [battingData, searchQuery, selectedCountry]);

  const filteredBowling = useMemo(() => {
    return bowlingData.filter((p) => {
      const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const matchesCountry = selectedCountry === 'All' ? true : p.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [bowlingData, searchQuery, selectedCountry]);

  const filteredStrikeRate = useMemo(() => {
    return strikeRateData.filter((p) => {
      const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const matchesCountry = selectedCountry === 'All' ? true : p.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [strikeRateData, searchQuery, selectedCountry]);

  const filteredAllRounder = useMemo(() => {
    return allRounderData.filter((p) => {
      const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const matchesCountry = selectedCountry === 'All' ? true : p.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [allRounderData, searchQuery, selectedCountry]);

  const filteredBoundary = useMemo(() => {
    return boundaryData.filter((p) => {
      const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const matchesCountry = selectedCountry === 'All' ? true : p.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [boundaryData, searchQuery, selectedCountry]);

  const activeSqlQuery = LEADERBOARD_QUERIES[activeTab];

  const handleCopySql = () => {
    navigator.clipboard.writeText(activeSqlQuery);
    setCopiedSql(true);
    sounds.playClick();
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold text-xs shadow-sm shadow-amber-500/20">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/30 font-mono font-bold text-xs">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 text-amber-500 border border-amber-700/30 font-mono font-bold text-xs">
          🥉 3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-mono font-medium text-xs">
        {rank}
      </span>
    );
  };

  const getCountryBadge = (country: string) => {
    const colors: Record<string, string> = {
      India: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      Australia: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      England: 'text-red-400 bg-red-500/10 border-red-500/20',
      Pakistan: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      'South Africa': 'text-green-400 bg-green-500/10 border-green-500/20',
      'New Zealand': 'text-slate-300 bg-slate-700/20 border-slate-600/30',
      Afghanistan: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    const style = colors[country] || 'text-slate-400 bg-slate-800 border-slate-700';
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${style}`}>
        {country}
      </span>
    );
  };

  return (
    <section className="space-y-6 pt-2" id="sqlite-leaderboard-section">
      {/* Leaderboard Section Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5" />
                <span>SQLite Database Engine</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{queryLatency > 0 ? `${queryLatency}ms execution` : 'Sub-millisecond Cached'}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Player Performance Leaderboards</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-medium hidden sm:inline-block">
                ANSI SQL AGGREGATES
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time batting, bowling, strike rates, and all-round impact metrics computed dynamically from normalized relational tables using multi-table JOINs, GROUP BY HAVING, and aggregation functions.
            </p>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowSqlModal(true);
                sounds.playClick();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
              title="Inspect underlying SQL query for this leaderboard category"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspect SQL</span>
            </button>

            <button
              onClick={() => loadAllLeaderboardData(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              title="Re-query SQLite database"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Executing...' : 'Re-Query DB'}</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate('analytics');
                  sounds.playClick();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              >
                <span>Run in SQL Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Micro-Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Total Runs Logged</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {summary.totalRuns.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                Top: <span className="text-amber-400 font-semibold">{summary.highestScorerName}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Total Wickets Taken</span>
                <Target className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {summary.totalWickets}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                Leader: <span className="text-sky-400 font-semibold">{summary.topWicketTakerName}</span> ({summary.topWickets} wkts)
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Boundary Fireworks</span>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {summary.totalSixes} <span className="text-xs font-sans text-slate-400 font-normal">sixes</span> / {summary.totalFours} <span className="text-xs font-sans text-slate-400 font-normal">fours</span>
              </div>
              <div className="text-[11px] text-emerald-400 truncate mt-0.5">
                {Math.round(((summary.totalSixes * 6 + summary.totalFours * 4) / summary.totalRuns) * 100)}% runs via boundaries
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Active Database Roster</span>
                <Layers className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {summary.totalPlayers} <span className="text-xs font-sans text-slate-400 font-normal">athletes</span>
              </div>
              <div className="text-[11px] text-purple-400 truncate mt-0.5">
                Highest Innings: {summary.highestScore}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Leaderboard Card with Tabs and Search */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => handleTabChange('batting')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'batting'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Orange Cap (Runs)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono">
                {battingData.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('bowling')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'bowling'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Purple Cap (Wickets)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono">
                {bowlingData.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('strikeRate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'strikeRate'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Strike Rate (20+ balls)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-200 font-mono">
                {strikeRateData.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('allRounder')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'allRounder'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>MVP All-Rounders</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 font-mono">
                {allRounderData.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('boundary')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'boundary'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Boundary Kings (6s & 4s)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 font-mono">
                {boundaryData.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search player by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
              <span>Country:</span>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Tables Based on Active Category */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          {activeTab === 'batting' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-3 text-right">Innings</th>
                  <th className="py-3 px-3 text-right font-bold text-amber-400">Runs</th>
                  <th className="py-3 px-3 text-right">High Score</th>
                  <th className="py-3 px-3 text-right">Average</th>
                  <th className="py-3 px-3 text-right">Strike Rate</th>
                  <th className="py-3 px-3 text-right">100s / 50s</th>
                  <th className="py-3 px-3 text-right">4s / 6s</th>
                  <th className="py-3 px-4 text-center">Relative Pace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredBatting.map((player) => {
                  const maxRuns = battingData[0]?.runs || 1;
                  const percentOfTop = Math.round((player.runs / maxRuns) * 100);
                  return (
                    <tr
                      key={player.playerId}
                      className="hover:bg-slate-850/60 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center">
                        {getRankBadge(player.rank)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold font-mono text-emerald-400 border border-slate-700 text-xs">
                            {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                              {player.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {getCountryBadge(player.country)}
                              <span className="text-[10px] text-slate-400">{player.battingStyle}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{player.innings}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                        {player.runs}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{player.highestScore}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{player.battingAvg}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                        {player.strikeRate}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        <span className="text-amber-300 font-semibold">{player.centuries}</span> / <span>{player.fifties}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {player.fours} / <span className="text-rose-400 font-semibold">{player.sixes}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 mx-auto bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentOfTop}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 text-center mt-0.5 font-mono">
                          {percentOfTop}% of peak
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'bowling' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Bowler</th>
                  <th className="py-3 px-3 text-right">Innings</th>
                  <th className="py-3 px-3 text-right font-bold text-purple-400">Wickets</th>
                  <th className="py-3 px-3 text-right">Overs</th>
                  <th className="py-3 px-3 text-right">Maidens</th>
                  <th className="py-3 px-3 text-right">Runs</th>
                  <th className="py-3 px-3 text-right">Average</th>
                  <th className="py-3 px-3 text-right font-semibold text-emerald-400">Economy</th>
                  <th className="py-3 px-4 text-center">Best Match Figures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredBowling.map((bowler) => (
                  <tr
                    key={bowler.playerId}
                    className="hover:bg-slate-850/60 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center">
                      {getRankBadge(bowler.rank)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold font-mono text-purple-400 border border-slate-700 text-xs">
                          {bowler.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">
                            {bowler.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getCountryBadge(bowler.country)}
                            <span className="text-[10px] text-slate-400">{bowler.bowlingStyle}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{bowler.innings}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-400 text-sm">
                      {bowler.wickets}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{bowler.overs}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{bowler.maidens}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{bowler.runsConceded}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{bowler.bowlingAvg}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {bowler.economyRate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[11px] border border-purple-500/20">
                        {bowler.bestWickets} Wickets
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'strikeRate' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-3 text-right">Runs</th>
                  <th className="py-3 px-3 text-right">Balls</th>
                  <th className="py-3 px-3 text-right font-bold text-sky-400">Strike Rate</th>
                  <th className="py-3 px-3 text-right">4s</th>
                  <th className="py-3 px-3 text-right text-rose-400">6s</th>
                  <th className="py-3 px-4 text-center">Boundary %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStrikeRate.map((player) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-slate-850/60 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center">
                      {getRankBadge(player.rank)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold font-mono text-sky-400 border border-slate-700 text-xs">
                          {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
                            {player.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getCountryBadge(player.country)}
                            <span className="text-[10px] text-slate-400">{player.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">{player.runs}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{player.balls}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-sky-400 text-sm">
                      {player.strikeRate}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{player.fours}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400 font-bold">{player.sixes}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sky-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, player.boundaryPercent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 text-[11px]">{player.boundaryPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'allRounder' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-3 text-right">Runs</th>
                  <th className="py-3 px-3 text-right">Batting SR</th>
                  <th className="py-3 px-3 text-right">Wickets</th>
                  <th className="py-3 px-3 text-right">Economy</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">All-Round Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredAllRounder.map((player) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-slate-850/60 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center">
                      {getRankBadge(player.rank)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold font-mono text-emerald-400 border border-slate-700 text-xs">
                          {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                            {player.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getCountryBadge(player.country)}
                            <span className="text-[10px] text-slate-400">{player.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">{player.runs}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{player.strikeRate}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-400">{player.wickets}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{player.economyRate}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono font-bold text-emerald-300 text-xs">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{player.impactScore} pts</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'boundary' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Power Hitter</th>
                  <th className="py-3 px-3 text-right font-bold text-rose-400">Total 6s</th>
                  <th className="py-3 px-3 text-right">Total 4s</th>
                  <th className="py-3 px-3 text-right">Total Runs</th>
                  <th className="py-3 px-3 text-right text-amber-300 font-semibold">Boundary Runs</th>
                  <th className="py-3 px-4 text-center">Boundary % of Runs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredBoundary.map((player) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-slate-850/60 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center">
                      {getRankBadge(player.rank)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold font-mono text-rose-400 border border-slate-700 text-xs">
                          {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-rose-300 transition-colors">
                            {player.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getCountryBadge(player.country)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-400 text-sm">
                      {player.sixes}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{player.fours}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{player.runs}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                      {player.boundaryRuns}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, player.boundaryPercent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-200 text-[11px] font-semibold">
                          {player.boundaryPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info note */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aggregate data is dynamically retrieved from local WebAssembly SQLite memory tables.</span>
          </div>
          <div className="font-mono text-slate-400">
            Source tables: <span className="text-slate-300">players</span>, <span className="text-slate-300">batting_scores</span>, <span className="text-slate-300">bowling_scores</span>
          </div>
        </div>
      </div>

      {/* SQL Modal for inspecting the underlying query */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Underlying SQL Query ({activeTab.toUpperCase()})
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              This ANSI SQL query runs directly against the in-browser SQLite WASM virtual machine without remote server dependencies.
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-72">
                {activeSqlQuery}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>

              {onNavigate && (
                <button
                  onClick={() => {
                    setShowSqlModal(false);
                    onNavigate('analytics');
                    sounds.playClick();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Execute in SQL Analytics Tab</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
