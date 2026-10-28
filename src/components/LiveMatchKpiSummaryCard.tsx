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
      className="rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/95 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] p-5 sm:p-7 relative overflow-hidden space-y-6"
    >
      {/* Top radiant light rail for subtle glass highlight */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none" />

      {/* Subtle animated background glow accents */}
      <motion.div 
        animate={{ 
          scale: [1, 1.08, 1],
          opacity: [0.12, 0.22, 0.12]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.08, 0.18, 0.08]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Top Banner: Match Telemetry & Phase Header */}
      <motion.div 
        variants={cardEntryVariants}
        className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm shadow-emerald-500/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Broadcast Live Telemetry</span>
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md ${runRate.phaseColor}`}>
              {runRate.matchPhase}
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/5 text-slate-300 text-xs font-mono backdrop-blur-md">
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
              className="text-emerald-400 font-mono text-2xl sm:text-3xl font-extrabold inline-block drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)]"
            >
              {summary.currentScore}
            </motion.span>
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">
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
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition backdrop-blur-md ${
              isCustomizerOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-white/10 hover:border-white/20'
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
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-emerald-500/30 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Interactive KPI Scenario Modeler & Display Customization</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Real-time dynamic recalculation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {/* Custom Target RPO Slider */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Custom Target RPO Slider</span>
                  <motion.span 
                    key={customRpo}
                    variants={scoreUpdateVariants}
                    initial="initial"
                    animate="animate"
                    className="font-mono font-bold text-emerald-400 text-sm drop-shadow-[0_1px_6px_rgba(16,185,129,0.3)]"
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
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
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
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm shadow-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {val.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partnership Milestone Target */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Partnership Milestone Goal</span>
                  <span className="font-mono font-bold text-sky-400 text-sm drop-shadow-[0_1px_6px_rgba(56,189,248,0.3)]">{customMilestone} Runs</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Track deliveries needed to reach next batting milestone.
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
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sm shadow-sky-500/30'
                          : 'bg-slate-800 text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Visibility Toggles */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-sm">
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

      {/* 3 Main KPI Visualizations Grid with Enhanced Glass-Morphism & Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* KPI 1: Run Rate Dynamics */}
        <AnimatePresence>
          {visibleWidgets.runRate && (
            <motion.div 
              variants={cardEntryVariants}
              {...cardHoverProps}
              className="rounded-2xl bg-gradient-to-br from-emerald-950/35 via-slate-900/85 to-slate-950/90 border border-emerald-500/30 hover:border-emerald-400/50 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-xl shadow-emerald-950/20 backdrop-blur-xl transition-all"
            >
              {/* Subtle top inner gradient edge */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span>Run Rate Dynamics</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                    LIVE PACE
                  </span>
                </div>

                {/* Big metric comparison with glass-morphism tiles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">CURRENT RR (CRR)</span>
                    <motion.span 
                      key={runRate.crr}
                      variants={scoreUpdateVariants}
                      initial="initial"
                      animate="animate"
                      className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 inline-block drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)] mt-0.5"
                    >
                      {runRate.crr}
                    </motion.span>
                    <span className="text-[10px] text-slate-400 block font-mono">rpo</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">REQUIRED RR (RRR)</span>
                    <motion.span 
                      key={runRate.rrr}
                      variants={scoreUpdateVariants}
                      initial="initial"
                      animate="animate"
                      className="text-2xl sm:text-3xl font-black font-mono text-amber-400 inline-block drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] mt-0.5"
                    >
                      {runRate.rrr !== null ? runRate.rrr : 'N/A'}
                    </motion.span>
                    <span className="text-[10px] text-slate-400 block font-mono">rpo</span>
                  </div>
                </div>

                {/* Status callout banner */}
                <motion.div 
                  layout
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 backdrop-blur-md shadow-sm ${
                    runRate.isAheadOfRequired
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
                      : runRate.isAheadOfRequired === false
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                      : 'bg-slate-900/80 border-white/10 text-slate-300'
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
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Innings Completion</span>
                  <span className="text-slate-200 font-semibold">{runRate.ballsCompleted} / {runRate.ballsCompleted + runRate.ballsRemaining} Balls</span>
                </div>
                <div className="w-full bg-slate-900/90 border border-white/10 rounded-full h-2.5 overflow-hidden p-0.5">
                  <motion.div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
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
              className="rounded-2xl bg-gradient-to-br from-sky-950/35 via-slate-900/85 to-slate-950/90 border border-sky-500/30 hover:border-sky-400/50 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-xl shadow-sky-950/20 backdrop-blur-xl transition-all"
            >
              {/* Subtle top inner gradient edge */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Current Partnership</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10">
                    {partnership.wicketNumber}TH WICKET
                  </span>
                </div>

                {/* Partnership Total Callout with glass-morphism tile */}
                <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white flex items-baseline gap-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                      <motion.span
                        key={partnership.totalRuns}
                        variants={scoreUpdateVariants}
                        initial="initial"
                        animate="animate"
                        className="inline-block"
                      >
                        {partnership.totalRuns}
                      </motion.span>
                      <span className="text-xs font-medium text-slate-400">runs</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      off <span className="text-slate-200 font-mono font-semibold">{partnership.totalBalls}</span> deliveries
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-sky-400 drop-shadow-[0_1px_4px_rgba(56,189,248,0.3)]">
                      {partnership.runRate} RPO
                    </div>
                    <div className="text-[10px] text-slate-400">Stand tempo</div>
                  </div>
                </div>

                {/* Dual-Color Batsmen Contribution Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
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
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    </div>
                  </div>

                  {/* Progress bar split with glass border */}
                  <div className="w-full h-3 bg-slate-900/90 border border-white/10 rounded-full overflow-hidden flex p-0.5">
                    <motion.div
                      className="bg-sky-500 h-full rounded-l-full shadow-[0_0_6px_rgba(56,189,248,0.4)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${partnership.batsman1.percentage}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      title={`${partnership.batsman1.name}: ${partnership.batsman1.percentage}%`}
                    />
                    <motion.div
                      className="bg-emerald-500 h-full rounded-r-full shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${partnership.batsman2.percentage}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      title={`${partnership.batsman2.name}: ${partnership.batsman2.percentage}%`}
                    />
                  </div>
                </div>
              </div>

              {/* Milestone Goal Progress */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{partnership.milestoneTarget}-Run Stand Goal</span>
                  <span className="text-sky-300 font-bold">{partnership.milestoneProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-900/90 border border-white/10 rounded-full h-2 overflow-hidden p-0.5">
                  <motion.div
                    className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full shadow-[0_0_6px_rgba(56,189,248,0.5)]"
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
              className="rounded-2xl bg-gradient-to-br from-purple-950/35 via-slate-900/85 to-slate-950/90 border border-purple-500/30 hover:border-purple-400/50 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-xl shadow-purple-950/20 backdrop-blur-xl transition-all"
            >
              {/* Subtle top inner gradient edge */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Projected Horizons</span>
                  </span>
                  {summary.targetRuns && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                      TARGET: {summary.targetRuns}
                    </span>
                  )}
                </div>

                {/* 4 Pacing Horizons with refined glass tiles */}
                <div className="space-y-2 pt-1">
                  {projections.map((horizon, idx) => (
                    <motion.div
                      key={horizon.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.3 }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 hover:border-purple-500/40 hover:bg-slate-850/90 transition-all shadow-sm"
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
                          className="text-base font-bold text-white inline-block drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                        >
                          {horizon.projectedTotal}
                        </motion.span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* WinViz Bar */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-sky-400">{match.teamA.shortName}: {summary.winProbability.teamA}%</span>
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-normal">Win Probability</span>
                  <span className="text-amber-400">{match.teamB.shortName}: {summary.winProbability.teamB}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900/90 border border-white/10 rounded-full overflow-hidden flex p-0.5">
                  <motion.div
                    className="bg-sky-500 h-full rounded-l-full shadow-[0_0_6px_rgba(56,189,248,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.winProbability.teamA}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="bg-amber-500 h-full rounded-r-full shadow-[0_0_6px_rgba(245,158,11,0.4)]"
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

      {/* KPI 4: Interactive Custom Scenario Result Banner with Glass-morphism */}
      <AnimatePresence>
        {visibleWidgets.simulator && (
          <motion.div 
            variants={cardEntryVariants}
            className="rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900/90 to-sky-950/50 border border-emerald-400/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          >
            {/* Subtle top sheen */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider drop-shadow-[0_1px_4px_rgba(16,185,129,0.3)]">
                    Scenario Modeler
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 border border-white/10 text-slate-200 font-mono">
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
                    className="text-white text-sm font-mono inline-block font-black drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                  >
                    {customProjection.customTotal}
                  </motion.strong>
                  {customProjection.differenceFromTarget !== null && (
                    <span className={`ml-2 font-mono font-bold ${
                      customProjection.willWin ? 'text-emerald-400 drop-shadow-[0_1px_4px_rgba(16,185,129,0.3)]' : 'text-rose-400 drop-shadow-[0_1px_4px_rgba(244,63,94,0.3)]'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono border flex items-center gap-1.5 backdrop-blur-md ${
                  customProjection.willWin
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-md shadow-rose-500/20'
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
