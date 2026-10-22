import React from 'react';
import { 
  Activity, 
  Database, 
  BarChart3, 
  Terminal, 
  Layers, 
  ArrowRight, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  Globe2, 
  Flame, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border border-emerald-500/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Sports Analytics & Database Engineering Portfolio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Cricbuzz <span className="text-emerald-400">LiveStats</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Real-Time Cricket Insights & SQL-Based Analytics dashboard integrating live Cricbuzz match updates with a client-side SQLite database engine, featuring 25 interactive SQL practice queries and full CRUD administration.
          </p>

          {/* Key Skill Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono font-medium">
            <span className="text-slate-400 font-sans">Core Stack:</span>
            {['SQL (SQLite / PostgreSQL)', 'REST API (Cricbuzz)', 'JSON Parsing', 'Interactive Dashboard', 'Data Analytics', 'CRUD Operations'].map((skill) => (
              <span key={skill} className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">
                {skill}
              </span>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                onNavigate('analytics');
                sounds.playClick();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Terminal className="w-4 h-4" />
              <span>Explore 25 SQL Queries</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onNavigate('live');
                sounds.playClick();
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition"
            >
              <Activity className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Live Match Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Feature Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Core Application Modules</h2>
            <p className="text-xs sm:text-sm text-slate-400">Complete four-part sports analytics deliverables</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Module 1 */}
          <div
            onClick={() => {
              onNavigate('live');
              sounds.playClick();
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                1. Live Match Feed
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ongoing matches via Cricbuzz API with real-time scorecards, ball-by-ball commentary, and live simulator.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Match Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Module 2 */}
          <div
            onClick={() => {
              onNavigate('players');
              sounds.playClick();
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                2. Top Player Stats
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Leaderboards for top run scorers, strike rates, bowling averages, and head-to-head comparisons.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Leaderboards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Module 3 */}
          <div
            onClick={() => {
              onNavigate('analytics');
              sounds.playClick();
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-850/80 transition-all cursor-pointer flex flex-col justify-between shadow-lg shadow-emerald-950/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  3. SQL Analytics
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
                  25 QUERIES
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive in-browser SQLite execution for 25 questions: Beginner (1-8), Intermediate (9-16), Advanced (17-25).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Launch SQL Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Module 4 */}
          <div
            onClick={() => {
              onNavigate('crud');
              sounds.playClick();
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                4. CRUD Operations
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Form-based administrative tools to Create, Read, Update, and Delete players, matches, and scorecard records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Manage Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Use Cases Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Target Business Use Cases</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            How domain stakeholders leverage Cricbuzz LiveStats for commercial and educational workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">1. Sports Media & Broadcasting</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time match updates for commentary desks, pre-match statistical talking points, and historical head-to-head records.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">2. Fantasy Cricket Platforms</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Player form tracking over recent matches, stadium-specific batting averages, and point-multiplier recommendations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">3. Cricket Analytics Firms</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Weighted performance indexing, bowler economy rates in limited overs, and partnership success metrics.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">4. Educational Institutions</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-world SQL teaching environment demonstrating multi-table JOINs, GROUP BY HAVING, CTEs, and Window Functions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">5. Prediction & Strategy</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Toss decision win probability analytics, venue capacity trends, and quarterly trajectory modeling.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Database Agnostic</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Portable ANSI SQL schema compatible with PostgreSQL, MySQL, and SQLite with zero external lock-in.
            </p>
          </div>
        </div>
      </div>

      {/* Relational Database Architecture Diagram */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Relational Schema & Entity-Relationship Architecture</span>
          </h3>
          <span className="text-xs font-mono text-emerald-400">8 Normalized Tables</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{`┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   venues    │ 1───* │   matches    │ *───1 │   series    │
│  venue_id   │       │   match_id   │       │  series_id  │
└─────────────┘       └──────┬───────┘       └─────────────┘
                             │ 1
                 ┌───────────┴───────────┐
                 │ *                     │ *
          ┌──────▼───────┐        ┌──────▼───────┐
          │batting_scores│        │bowling_scores│
          │  score_id    │        │  bowling_id  │
          └──────┬───────┘        └──────┬───────┘
                 │ *                     │ *
                 └───────────┬───────────┘
                             │ *
                      ┌──────▼───────┐
                      │   players    │
                      │  player_id   │
                      └──────────────┘`}</pre>
        </div>
      </div>
    </div>
  );
};
