import React, { useState, useEffect } from 'react';
import { SqlQuestion, SQL_QUESTIONS } from '../data/sqlQuestions';
import { executeSql, QueryResult, getDatabase } from '../services/db';
import { 
  Play, 
  Terminal, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Download, 
  RefreshCw, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Layers
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const SqlAnalyticsPage: React.FC = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<SqlQuestion | null>(SQL_QUESTIONS[0]);
  const [expandedSqlId, setExpandedSqlId] = useState<number | null>(SQL_QUESTIONS[0].id);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [customSql, setCustomSql] = useState<string>(SQL_QUESTIONS[0].sql);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Initialize DB on mount and run the first query
  useEffect(() => {
    let mounted = true;
    getDatabase().then(() => {
      if (mounted) {
        setIsDbReady(true);
        runQuery(SQL_QUESTIONS[0].sql, SQL_QUESTIONS[0]);
      }
    }).catch((err) => {
      if (mounted) {
        setQueryError(`Database initialization error: ${err.message}`);
      }
    });
    return () => { mounted = false; };
  }, []);

  const runQuery = (sql: string, question?: SqlQuestion) => {
    setIsExecuting(true);
    setQueryError(null);
    try {
      const res = executeSql(sql);
      setQueryResult(res);
      if (question) {
        setActiveQuestion(question);
        setCustomSql(question.sql);
      }
      sounds.playClick();
    } catch (err: any) {
      setQueryError(err.message || 'Error executing SQL query');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportCsv = () => {
    if (!queryResult || queryResult.values.length === 0) return;
    const headers = queryResult.columns.join(',');
    const rows = queryResult.values.map((row) => 
      row.map((val) => typeof val === 'string' && val.includes(',') ? `"${val}"` : val).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cricket_analytics_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredQuestions = SQL_QUESTIONS.filter((q) => {
    if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const text = `${q.title} ${q.question} ${q.conceptTags.join(' ')} ${q.sql}`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Title Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Interactive In-Browser SQLite Engine (WASM)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              SQL Queries & Analytics Laboratory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              25 complete analytical queries spanning beginner filtering, intermediate JOINs and aggregations, to advanced statistical modeling, CTEs, and window functions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">SQLite Status:</span>
              <span className={`font-bold ${isDbReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isDbReady ? 'Ready (Connected)' : 'Initializing...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Questions Catalog on Left, Live Execution & Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 25 SQL Questions Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls & Filters */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search questions or SQL concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-xs text-slate-200 placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Difficulty Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg text-xs font-semibold">
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulty(diff);
                    sounds.playClick();
                  }}
                  className={`flex-1 py-1.5 rounded-md transition text-center ${
                    selectedDifficulty === diff
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff} {diff === 'All' ? '(25)' : diff === 'Beginner' ? '(8)' : diff === 'Intermediate' ? '(8)' : '(9)'}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Scrollable List */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredQuestions.map((q) => {
              const isSelected = activeQuestion?.id === q.id;
              const isExpanded = expandedSqlId === q.id;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-850 border-emerald-500/60 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          q.difficulty === 'Beginner'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : q.difficulty === 'Intermediate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {q.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  {/* Concept Tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {q.conceptTags.map((tag) => (
                      <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Expanded SQL Code view */}
                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                      <pre>{q.sql}</pre>
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-sans text-slate-400">
                        <span className="font-semibold text-slate-300">Concept: </span>
                        {q.explanation}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setExpandedSqlId(isExpanded ? null : q.id)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide SQL' : 'View SQL Code'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => runQuery(q.sql, q)}
                      disabled={!isDbReady || isExecuting}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run Query</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Console & Results Table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Custom SQL Editor / Scratchpad */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>SQL Query Console / Scratchpad</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runQuery(customSql)}
                  disabled={!isDbReady || isExecuting}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute SQL</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={6}
                placeholder="Enter any SQL query (e.g. SELECT * FROM players WHERE country = 'India';)"
                className="w-full bg-transparent font-mono text-xs text-emerald-300 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Quick Schema Reference Chips */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Quick Tables:</span>
              {['players', 'matches', 'venues', 'series', 'batting_scores', 'bowling_scores', 'partnerships'].map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => {
                    const sampleQuery = `SELECT * FROM ${tbl} LIMIT 10;`;
                    setCustomSql(sampleQuery);
                    runQuery(sampleQuery);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
                >
                  {tbl}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            {/* Results Header */}
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Execution Output</span>
                </h3>
                {queryResult && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {queryResult.rowCount} rows
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {queryResult.executionTimeMs} ms
                    </span>
                  </div>
                )}
              </div>

              {queryResult && queryResult.rowCount > 0 && (
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {/* Error Display */}
            {queryError && (
              <div className="p-4 bg-red-950/40 border-b border-red-500/40 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="font-mono">{queryError}</div>
              </div>
            )}

            {/* Results Table */}
            {queryResult && (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-2.5 px-3 text-center text-slate-500 w-10">#</th>
                      {queryResult.columns.map((col, idx) => (
                        <th key={idx} className="py-2.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                    {queryResult.values.length === 0 ? (
                      <tr>
                        <td colSpan={queryResult.columns.length + 1} className="py-8 text-center text-slate-500">
                          Query returned zero rows matching criteria.
                        </td>
                      </tr>
                    ) : (
                      queryResult.values.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-[10px] text-slate-500 font-mono">
                            {rowIdx + 1}
                          </td>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className={`py-2.5 px-4 whitespace-nowrap text-slate-200 ${
                              typeof cell === 'number' ? 'text-right font-mono' : 'text-left'
                            }`}>
                              {cell === null || cell === undefined ? (
                                <span className="text-slate-600 italic">NULL</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
