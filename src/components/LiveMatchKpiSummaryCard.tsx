import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Match } from '../types/cricket';
import { 
  getLiveMatchKpiSummary, 
  LiveMatchKpiSummary, 
  PartnershipStats, 
  ProjectedScoreHorizon 
} from '../utils/cricketKpi';
import { 
  Activity, 
  Zap, 
  Users, 
  TrendingUp, 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Clock, 
  Target, 
  Flame,
  Gauge
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { 
  containerStaggerVariants, 
  cardEntryVariants, 
  accordionVariants, 
  scoreUpdateVariants,
  cardHoverProps 
} from '../utils/animationVariants';

interface LiveMatchKpiSummaryCardProps {
  match: Match;
  onSimulateScore?: (rpo: number) => void;
}

export const LiveMatchKpiSummaryCard: React.FC<LiveMatchKpiSummaryCardProps> = ({ match }) => {
  // Customization state
  const [customRpo, setCustomRpo] = useState<number>(() => {
    return match.requiredRunRate ? Number(match.requiredRunRate.toFixed(1)) : 10.0;
  });
  const [customMilestone, setCustomMilestone] = useState<number>(50);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [visibleWidgets, setVisibleWidgets] = useState<{
    runRate: boolean;
    partnership: boolean;
    projections: boolean;
    simulator: boolean;
  }>({
    runRate: true,
    partnership: true,
    projections: true,
    simulator: true,
  });

  // Calculate live KPI summary data
  const summary: LiveMatchKpiSummary = useMemo(() => {
    return getLiveMatchKpiSummary(match, {
      customRpo,
      customMilestoneTarget: customMilestone,
    });
  }, [match, customRpo, customMilestone]);

  const { runRate, partnership, projections, customProjection } = summary;

  // Presets for quick simulation
  const handleApplyPresetRpo = (rpo: number) => {
    setCustomRpo(rpo);
    sounds.playClick();
  };

  const handleToggleWidget = (widgetKey: keyof typeof visibleWidgets) => {
    setVisibleWidgets((prev) => ({ ...prev, [widgetKey]: !prev[widgetKey] }));
    sounds.playClick();
  };

  return (
    <motion.section 
      variants={containerStaggerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6"
    >
      {/* Subtle animated background glow accents */}
      <motion.div 
        animate={{ 
          scale: [1, 1.08, 1],
          opacity: [0.12, 0.2, 0.12]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.08, 0.16, 0.08]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Top Banner: Match Telemetry & Phase Header */}
      <motion.div 
        variants={cardEntryVariants}
        className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Broadcast Live Telemetry</span>
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${runRate.phaseColor}`}>
              {runRate.matchPhase}
            </span>

            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              Overs: {summary.oversDisplay} / {summary.maxOvers}.0
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>{summary.battingTeamName}</span>
            <motion.span 
              key={summary.currentScore}
              variants={scoreUpdateVariants}
              initial="initial"
              animate="animate"
              className="text-emerald-400 font-mono text-2xl sm:text-3xl font-extrabold inline-block"
            >
              {summary.currentScore}
            </motion.span>
            <span className="text-xs font-normal text-slate-400 hidden sm:inline">
              vs {summary.bowlingTeamName}
            </span>
          </h3>
        </div>

        {/* Customizer trigger & Quick Presets */}
        <div className="flex flex-wrap items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsCustomizerOpen(!isCustomizerOpen);
              sounds.playClick();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
              isCustomizerOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customize KPIs</span>
            {isCustomizerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </motion.button>
        </div>
      </motion.div>

      {/* Customizable Controls Tray (Animated with AnimatePresence) */}
      <AnimatePresence>
        {isCustomizerOpen && (
          <motion.div 
            variants={accordionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-4 shadow-inner"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Interactive KPI Scenario Modeler & Display Customization</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Real-time dynamic recalculation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {/* Custom Target RPO Slider */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Custom Target RPO Slider</span>
                  <motion.span 
                    key={customRpo}
                    variants={scoreUpdateVariants}
                    initial="initial"
                    animate="animate"
                    className="font-mono font-bold text-emerald-400 text-sm"
                  >
                    {customRpo.toFixed(1)} RPO
                  </motion.span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="18.0"
                  step="0.5"
                  value={customRpo}
                  onChange={(e) => {
                    setCustomRpo(parseFloat(e.target.value));
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>4.0 (Defensive)</span>
                  <span>11.0 (Par)</span>
                  <span>18.0 (Maximum Blitz)</span>
                </div>
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {[8.0, 10.0, 12.0, 14.5].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleApplyPresetRpo(val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border transition ${
                        customRpo === val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {val.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partnership Milestone Target */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Partnership Milestone Goal</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">{customMilestone} Runs</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Track how many balls are required to reach the next partnership milestone.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  {[25, 50, 75, 100].map((runs) => (
                    <button
                      key={runs}
                      onClick={() => {
                        setCustomMilestone(runs);
                        sounds.playClick();
                      }}
                      className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold border transition ${
                        customMilestone === runs
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Visibility Toggles */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-semibold text-slate-300 block">Display Widget Toggles</span>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={visibleWidgets.runRate}
                      onChange={() => handleToggleWidget('runRate')}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Run Rate Gauge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={visibleWidgets.partnership}
                      onChange={() => handleToggleWidget('partnership')}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Partnership Bar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={visibleWidgets.projections}
                      onChange={() => handleToggleWidget('projections')}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Score Horizons</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={visibleWidgets.simulator}
                      onChange={() => handleToggleWidget('simulator')}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Scenario Card</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 Main KPI Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* KPI 1: Run Rate Dynamics */}
        <AnimatePresence>
          {visibleWidgets.runRate && (
            <motion.div 
              variants={cardEntryVariants}
              {...cardHoverProps}
              className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span>Run Rate Dynamics</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    LIVE PACE
                  </span>
                </div>

                {/* Big metric comparison with key animated counters */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">CURRENT RUN RATE (CRR)</span>
                    <motion.span 
                      key={runRate.crr}
                      variants={scoreUpdateVariants}
                      initial="initial"
                      animate="animate"
                      className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 inline-block"
                    >
                      {runRate.crr}
                    </motion.span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">rpo</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">REQUIRED RUN RATE (RRR)</span>
                    <motion.span 
                      key={runRate.rrr}
                      variants={scoreUpdateVariants}
                      initial="initial"
                      animate="animate"
                      className="text-2xl sm:text-3xl font-black font-mono text-amber-400 inline-block"
                    >
                      {runRate.rrr !== null ? runRate.rrr : 'N/A'}
                    </motion.span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">rpo</span>
                  </div>
                </div>

                {/* Status callout */}
                <motion.div 
                  layout
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    runRate.isAheadOfRequired
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : runRate.isAheadOfRequired === false
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {runRate.isAheadOfRequired ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="leading-tight">{runRate.statusText}</span>
                </motion.div>
              </div>

              {/* Over Ball Progression Bar */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Innings Completion</span>
                  <span className="text-slate-200">{runRate.ballsCompleted} / {runRate.ballsCompleted + runRate.ballsRemaining} Balls</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, Math.round((runRate.ballsCompleted / (runRate.ballsCompleted + runRate.ballsRemaining)) * 100))}%`
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI 2: Current Partnership Stand */}
        <AnimatePresence>
          {visibleWidgets.partnership && (
            <motion.div 
              variants={cardEntryVariants}
              {...cardHoverProps}
              className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Current Partnership</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {partnership.wicketNumber}TH WICKET
                  </span>
                </div>

                {/* Partnership Total Callout */}
                <div className="flex items-baseline justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                      <motion.span
                        key={partnership.totalRuns}
                        variants={scoreUpdateVariants}
                        initial="initial"
                        animate="animate"
                        className="inline-block"
                      >
                        {partnership.totalRuns}
                      </motion.span>
                      <span className="text-xs font-normal text-slate-400">runs</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      off <span className="text-slate-200 font-mono">{partnership.totalBalls}</span> deliveries
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {partnership.runRate} RPO
                    </div>
                    <div className="text-[10px] text-slate-400">Stand tempo</div>
                  </div>
                </div>

                {/* Dual-Color Batsmen Contribution Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <span className="font-semibold text-slate-200 truncate max-w-[110px]">
                        {partnership.batsman1.name} {partnership.batsman1.isStriker ? '🏏' : ''}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {partnership.batsman1.runs} ({partnership.batsman1.balls})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {partnership.batsman2.runs} ({partnership.batsman2.balls})
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[110px]">
                        {partnership.batsman2.name} {!partnership.batsman1.isStriker ? '🏏' : ''}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  {/* Progress bar split with fluid spring */}
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <motion.div
                      className="bg-sky-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${partnership.batsman1.percentage}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      title={`${partnership.batsman1.name}: ${partnership.batsman1.percentage}%`}
                    />
                    <motion.div
                      className="bg-emerald-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${partnership.batsman2.percentage}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      title={`${partnership.batsman2.name}: ${partnership.batsman2.percentage}%`}
                    />
                  </div>
                </div>
              </div>

              {/* Milestone Goal Progress */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{partnership.milestoneTarget}-Run Stand Goal</span>
                  <span className="text-sky-300 font-bold">{partnership.milestoneProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-sky-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${partnership.milestoneProgressPercent}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  {partnership.ballsToMilestoneAtCrr > 0
                    ? `~${partnership.ballsToMilestoneAtCrr} balls needed at current run rate`
                    : 'Milestone achieved! 🎯'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI 3: Projected Score Horizons */}
        <AnimatePresence>
          {visibleWidgets.projections && (
            <motion.div 
              variants={cardEntryVariants}
              {...cardHoverProps}
              className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Projected Horizons</span>
                  </span>
                  {summary.targetRuns && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      TARGET: {summary.targetRuns}
                    </span>
                  )}
                </div>

                {/* 4 Pacing Horizons */}
                <div className="space-y-2 pt-1">
                  {projections.map((horizon, idx) => (
                    <motion.div
                      key={horizon.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.3 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-200">{horizon.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${horizon.tagColor}`}>
                            {horizon.rpo} RPO
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{horizon.description}</div>
                      </div>
                      <div className="text-right font-mono">
                        <motion.span 
                          key={horizon.projectedTotal}
                          variants={scoreUpdateVariants}
                          initial="initial"
                          animate="animate"
                          className="text-base font-bold text-white inline-block"
                        >
                          {horizon.projectedTotal}
                        </motion.span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* WinViz Bar */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-sky-400">{match.teamA.shortName}: {summary.winProbability.teamA}%</span>
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Win Probability</span>
                  <span className="text-amber-400">{match.teamB.shortName}: {summary.winProbability.teamB}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <motion.div
                    className="bg-sky-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.winProbability.teamA}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="bg-amber-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.winProbability.teamB}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KPI 4: Interactive Custom Scenario Result Banner */}
      <AnimatePresence>
        {visibleWidgets.simulator && (
          <motion.div 
            variants={cardEntryVariants}
            className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Scenario Modeler
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    At {customProjection.customRpo.toFixed(1)} RPO
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  Simulated 20-Over Score:{' '}
                  <motion.strong 
                    key={customProjection.customTotal}
                    variants={scoreUpdateVariants}
                    initial="initial"
                    animate="animate"
                    className="text-white text-sm font-mono inline-block"
                  >
                    {customProjection.customTotal}
                  </motion.strong>
                  {customProjection.differenceFromTarget !== null && (
                    <span className={`ml-2 font-mono font-bold ${
                      customProjection.willWin ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ({customProjection.willWin ? `+${customProjection.differenceFromTarget} surplus` : `${customProjection.differenceFromTarget} deficit`} vs target)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.span 
                layout
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border flex items-center gap-1.5 ${
                  customProjection.willWin
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {customProjection.willWin ? 'CHASE SUCCESSFUL' : 'DEFENDING TEAM ADVANTAGE'}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
