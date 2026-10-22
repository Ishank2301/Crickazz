import React, { useState, useEffect, useRef } from 'react';
import { SqlQuestion, SQL_QUESTIONS } from '../data/sqlQuestions';
import { executeSql, QueryResult, getDatabase } from '../services/db';
import { VoiceSearchTranscribe } from './VoiceSearchTranscribe';
import {
  auth,
  saveUserQuery,
  getUserSavedQueries,
  deleteUserSavedQuery,
  UserSavedQuery,
  subscribeToAuth,
} from '../services/firebase';
import {
  Play,
  Terminal,
  Code,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  Bookmark,
  Trash2,
  Loader2,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const SqlAnalyticsPage: React.FC = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'All' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Saved'
  >('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<SqlQuestion | null>(SQL_QUESTIONS[0]);
  const [expandedSqlId, setExpandedSqlId] = useState<number | null>(null);
  const [inlineResults, setInlineResults] = useState<Record<number, QueryResult>>({});
  const [runningQuestionId, setRunningQuestionId] = useState<number | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [customSql, setCustomSql] = useState<string>(SQL_QUESTIONS[0].sql);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [userSavedQueriesList, setUserSavedQueriesList] = useState<UserSavedQuery[]>([]);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    getDatabase()
      .then(() => {
        if (mounted) {
          setIsDbReady(true);
          try {
            const res = executeSql(SQL_QUESTIONS[0].sql);
            setQueryResult(res);
            setInlineResults({ [SQL_QUESTIONS[0].id]: res });
          } catch (e) {
            console.warn('Initial query execution note:', e);
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setQueryError(`Database initialization error: ${err.message}`);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        loadSavedQueries(user.uid);
      } else {
        setUserSavedQueriesList([]);
      }
    });
    return () => unsub();
  }, []);

  const loadSavedQueries = async (uid: string) => {
    try {
      const list = await getUserSavedQueries(uid);
      setUserSavedQueriesList(list);
    } catch (e) {
      console.warn('Could not load saved queries:', e);
    }
  };

  const handleSaveToCloud = async () => {
    if (!currentUser) {
      setSaveSuccessMsg('Sign in via the top navigation bar to save queries.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      return;
    }
    try {
      await saveUserQuery({
        userId: currentUser.uid,
        title: activeQuestion ? activeQuestion.title : 'Custom Cricket Query',
        sql: customSql,
        difficulty: activeQuestion ? activeQuestion.difficulty : 'Custom',
        description: activeQuestion ? activeQuestion.question : 'Custom saved query',
      });
      setSaveSuccessMsg('Query bookmarked to your account.');
      await loadSavedQueries(currentUser.uid);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setQueryError(`Failed to save query: ${err.message}`);
    }
  };

  const handleDeleteSavedQuery = async (queryId?: string) => {
    if (!currentUser || !queryId) return;
    try {
      await deleteUserSavedQuery(currentUser.uid, queryId);
      await loadSavedQueries(currentUser.uid);
    } catch (err: any) {
      setQueryError(`Failed to delete query: ${err.message}`);
    }
  };

  const runQuery = async (sql: string, question?: SqlQuestion) => {
    setIsExecuting(true);
    if (question) {
      setRunningQuestionId(question.id);
    }
    setQueryError(null);

    try {
      await getDatabase();
      setIsDbReady(true);

      const res = executeSql(sql);
      setQueryResult(res);

      if (question) {
        setActiveQuestion(question);
        setCustomSql(question.sql);
        setInlineResults((prev) => ({ ...prev, [question.id]: res }));
      }

      sounds.playClick();
    } catch (err: any) {
      console.error('SQL Execution error:', err);
      setQueryError(err.message || 'Error executing SQL query');
    } finally {
      setIsExecuting(false);
      setRunningQuestionId(null);
    }
  };

  const handleCopySql = (id: number, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToConsole = () => {
    if (consoleRef.current) {
      consoleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleVoiceTranscribed = (text: string) => {
    setSearchQuery(text);
    const lower = text.toLowerCase();
    const matched = SQL_QUESTIONS.find(
      (q) =>
        lower.includes(q.title.toLowerCase()) ||
        lower.includes(q.difficulty.toLowerCase()) ||
        q.conceptTags.some((tag) => lower.includes(tag.toLowerCase()))
    );

    if (matched) {
      runQuery(matched.sql, matched);
    } else {
      const defaultSql = `SELECT * FROM players WHERE full_name LIKE '%${text.replace(/'/g, "''")}%' OR country LIKE '%${text.replace(/'/g, "''")}%' LIMIT 15;`;
      setCustomSql(defaultSql);
      runQuery(defaultSql);
    }
  };

  const handleExportCsv = (customResult?: QueryResult) => {
    const target = customResult || queryResult;
    if (!target || target.values.length === 0) return;
    const headers = target.columns.join(',');
    const rows = target.values.map((row) =>
      row
        .map((val) =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        )
        .join(',')
    );
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cricket_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredQuestions = SQL_QUESTIONS.filter((q) => {
    if (selectedDifficulty !== 'All' && selectedDifficulty !== 'Saved' && q.difficulty !== selectedDifficulty) {
      return false;
    }
    if (searchQuery.trim()) {
      const text = `${q.title} ${q.question} ${q.conceptTags.join(' ')} ${q.sql}`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Header Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 mb-1.5">
              <Terminal className="w-4 h-4" />
              <span>In-Browser SQLite WASM Engine</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-400">25 Complete Practice Queries</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Cricket SQL Analytics Workbench
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Execute structured analytical queries directly in your browser. Spans beginner filtering, intermediate multi-table JOINs, to advanced window functions and statistical models.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-400">Database:</span>
              <span className={`font-semibold tabular-nums ${isDbReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isDbReady ? 'Connected' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Search & Speech-to-Text Bar */}
      <VoiceSearchTranscribe
        onTranscribeComplete={handleVoiceTranscribed}
        placeholder="Speak a cricket query (e.g. 'Show total wins per team' or 'List players by role')..."
      />

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 25 SQL Questions Catalog (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Controls & Segmented Difficulty Selector */}
          <div className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter questions by topic, table, or syntax..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2 rounded-md border border-slate-800 focus:outline-none focus:border-slate-700"
              />
            </div>

            {/* Segmented Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-md text-xs font-medium overflow-x-auto">
              {(['All', 'Beginner', 'Intermediate', 'Advanced', 'Saved'] as const).map(
                (diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      setSelectedDifficulty(diff);
                      sounds.playClick();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded transition-colors text-center whitespace-nowrap ${
                      selectedDifficulty === diff
                        ? 'bg-slate-800 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {diff === 'All'
                      ? 'All (25)'
                      : diff === 'Beginner'
                      ? 'Beginner (8)'
                      : diff === 'Intermediate'
                      ? 'Intermediate (8)'
                      : diff === 'Advanced'
                      ? 'Advanced (9)'
                      : `Saved (${userSavedQueriesList.length})`}
                  </button>
                )
              )}
            </div>
          </div>

          {/* User Saved Queries View */}
          {selectedDifficulty === 'Saved' ? (
            <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
              {userSavedQueriesList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 rounded-lg bg-[#111827] border border-slate-800 text-xs">
                  <Bookmark className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="font-medium text-slate-400">No saved queries yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Execute any query and click "Save to Cloud" to keep it here.
                  </p>
                </div>
              ) : (
                userSavedQueriesList.map((sq) => (
                  <div
                    key={sq.id}
                    className="p-4 rounded-lg border border-slate-800 bg-[#111827] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-200">{sq.title}</h4>
                      <button
                        onClick={() => handleDeleteSavedQuery(sq.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete query"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed border border-slate-900">
                      {sq.sql}
                    </pre>
                    <button
                      onClick={() => {
                        setCustomSql(sq.sql);
                        runQuery(sq.sql);
                      }}
                      className="w-full py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Execute Query</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Questions List with Zero-Pill Human Metadata and Instant Inline Drawer */
            <div className="space-y-3.5 max-h-[850px] overflow-y-auto pr-1">
              {filteredQuestions.map((q) => {
                const isSelected = activeQuestion?.id === q.id;
                const isExpanded = expandedSqlId === q.id;
                const isRunning = runningQuestionId === q.id;
                const cardResult = inlineResults[q.id];

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[#131d2e] border-slate-700 shadow-sm'
                        : 'bg-[#111827] border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Unboxed Header Metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-medium">
                      <span className={
                        q.difficulty === 'Beginner' ? 'text-sky-400' :
                        q.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-purple-400'
                      }>
                        {q.difficulty}
                      </span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span>Level {q.id}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-slate-500">{q.conceptTags.join(' / ')}</span>
                    </div>

                    {/* Question Title & Description */}
                    <h3 className="text-sm font-semibold text-slate-100">
                      {q.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Expanded SQL Code view */}
                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-md bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed relative">
                        <pre>{q.sql}</pre>
                        <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] font-sans text-slate-400">
                          <span className="font-semibold text-slate-300">
                            Analytical Purpose:{' '}
                          </span>
                          {q.explanation}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopySql(q.id, q.sql)}
                          className="absolute top-2 right-2 p-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 border border-slate-800 transition-colors"
                          title="Copy SQL"
                        >
                          {copiedId === q.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() =>
                          setExpandedSqlId(isExpanded ? null : q.id)
                        }
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                      >
                        <span>{isExpanded ? 'Hide SQL' : 'View SQL Code'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {cardResult && (
                          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline tabular-nums">
                            {cardResult.rowCount} rows · {cardResult.executionTimeMs}ms
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => runQuery(q.sql, q)}
                          disabled={isRunning}
                          className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Running...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Run Query</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Direct Inline Results Table */}
                    {cardResult && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Results ({cardResult.rowCount} rows in {cardResult.executionTimeMs}ms)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExportCsv(cardResult)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>CSV</span>
                            </button>
                            <button
                              type="button"
                              onClick={scrollToConsole}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                            >
                              <span>Open in Console</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* High-density compact table */}
                        <div className="overflow-x-auto max-h-48 rounded-md border border-slate-800 bg-slate-950">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-[#0f172a] text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800 sticky top-0">
                              <tr>
                                <th className="py-1.5 px-2.5 text-center text-slate-500 w-8">#</th>
                                {cardResult.columns.map((col, idx) => (
                                  <th key={idx} className="py-1.5 px-3 font-medium text-slate-200 whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {cardResult.values.length === 0 ? (
                                <tr>
                                  <td colSpan={cardResult.columns.length + 1} className="py-3 text-center text-slate-500 text-xs">
                                    Zero rows returned.
                                  </td>
                                </tr>
                              ) : (
                                cardResult.values.slice(0, 10).map((row, rowIdx) => (
                                  <tr key={rowIdx} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-500 font-mono tabular-nums">
                                      {rowIdx + 1}
                                    </td>
                                    {row.map((cell, cellIdx) => (
                                      <td
                                        key={cellIdx}
                                        className={`py-1.5 px-3 whitespace-nowrap text-slate-200 text-xs ${
                                          typeof cell === 'number' ? 'text-right font-mono tabular-nums' : 'text-left'
                                        }`}
                                      >
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
                          {cardResult.values.length > 10 && (
                            <div className="p-1.5 text-center text-[10px] text-slate-500 bg-slate-900/60 border-t border-slate-800">
                              Showing 10 of {cardResult.rowCount} rows · Open in right console for full table
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Execution Console & Full Results Table (6 cols) */}
        <div ref={consoleRef} className="lg:col-span-6 space-y-6">
          {/* Active Query Console */}
          <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-[#162032] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Code className="w-4 h-4 text-emerald-500" />
                <span>SQL Console & Scratchpad</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToCloud}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-800"
                  title="Bookmark to Firebase Firestore"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  <span>Save Query</span>
                </button>
                <button
                  type="button"
                  onClick={() => runQuery(customSql)}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isExecuting && runningQuestionId === null ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className="p-3 bg-slate-950">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={6}
                placeholder="Enter any SQL query (e.g. SELECT * FROM players WHERE country = 'India';)"
                className="w-full bg-transparent font-mono text-xs text-emerald-400 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Quick Schema Reference Chips */}
            <div className="p-2.5 bg-[#0f172a] border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Tables:</span>
              {[
                'players',
                'matches',
                'venues',
                'series',
                'batting_scores',
                'bowling_scores',
                'partnerships',
              ].map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => {
                    const sampleQuery = `SELECT * FROM ${tbl} LIMIT 10;`;
                    setCustomSql(sampleQuery);
                    runQuery(sampleQuery);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-800 transition-colors"
                >
                  {tbl}
                </button>
              ))}
            </div>
          </div>

          {/* Full Results Area */}
          <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden">
            {/* Results Header */}
            <div className="px-4 py-3 bg-[#162032] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-100 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Output {activeQuestion ? `· ${activeQuestion.title}` : ''}
                  </span>
                </h3>
                {queryResult && (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
                    <span className="text-emerald-400 font-semibold">
                      {queryResult.rowCount} rows
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {queryResult.executionTimeMs} ms
                    </span>
                  </div>
                )}
              </div>

              {queryResult && queryResult.rowCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleExportCsv()}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {/* Error Display */}
            {queryError && (
              <div className="p-3.5 bg-red-950/40 border-b border-red-900/50 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="font-mono">{queryError}</div>
              </div>
            )}

            {/* Results Table */}
            {queryResult && (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 text-center text-slate-500 w-10 font-normal">#</th>
                      {queryResult.columns.map((col, idx) => (
                        <th
                          key={idx}
                          className="py-2 px-3.5 font-medium text-slate-200 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {queryResult.values.length === 0 ? (
                      <tr>
                        <td
                          colSpan={queryResult.columns.length + 1}
                          className="py-8 text-center text-slate-500"
                        >
                          Query returned zero rows.
                        </td>
                      </tr>
                    ) : (
                      queryResult.values.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-slate-850/50 transition-colors"
                        >
                          <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-mono tabular-nums">
                            {rowIdx + 1}
                          </td>
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className={`py-2 px-3.5 whitespace-nowrap text-slate-200 text-xs ${
                                typeof cell === 'number'
                                  ? 'text-right font-mono tabular-nums'
                                  : 'text-left'
                              }`}
                            >
                              {cell === null || cell === undefined ? (
                                <span className="text-slate-600 italic">
                                  NULL
                                </span>
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
