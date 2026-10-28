import React, { useState, useEffect, useRef } from 'react';
import { Match, BallCommentary, BatsmanScore, BowlerScore, Inning } from '../types/cricket';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Zap, 
  CheckCircle, 
  Flag, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Layers, 
  TrendingUp, 
  Award,
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { cardEntryVariants, scoreUpdateVariants, commentaryItemVariants } from '../utils/animationVariants';

interface MatchCenterProps {
  match: Match;
  onUpdateMatch: (updated: Match) => void;
  onResetMatch: () => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({
  match,
  onUpdateMatch,
  onResetMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'commentary' | 'scorecard' | 'teams' | 'predictor'>('commentary');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(2000); // 2000ms = normal, 1000ms = 2x, 500ms = 4x
  const [commentaryFilter, setCommentaryFilter] = useState<'all' | 'boundaries' | 'wickets'>('all');
  const [lastEventToast, setLastEventToast] = useState<{ text: string; type: 'four' | 'six' | 'wicket' | 'normal' } | null>(null);

  const isLive = match.status === 'live';
  const currentInning: Inning | undefined = match.innings[match.currentInningIndex];
  const firstInning: Inning | undefined = match.innings[0];

  // Auto-play simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating && isLive) {
      timer = setInterval(() => {
        simulateNextBall();
      }, simSpeed);
    }
    return () => clearInterval(timer);
  }, [isSimulating, simSpeed, match]);

  // Flash toast effect timer
  useEffect(() => {
    if (lastEventToast) {
      const timer = setTimeout(() => {
        setLastEventToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [lastEventToast]);

  // Ball commentary templates for realistic cricket flavor
  const getCommentaryText = (outcome: { runs: number; isWicket: boolean; isFour: boolean; isSix: boolean; wicketType?: string }, batsman: string, bowler: string): string => {
    if (outcome.isSix) {
      const sixLines = [
        `SIX! High, handsome, and into the crowd! ${batsman} picks the length early and clobbers it over deep midwicket!`,
        `MAXIMUM! What a clean strike from ${batsman}! Slower ball right in the slot, deposited deep into the stands!`,
        `SIX! Stand and deliver! ${batsman} lofts ${bowler} straight back over the sight screen for a towering hit!`,
      ];
      return sixLines[Math.floor(Math.random() * sixLines.length)];
    }
    if (outcome.isFour) {
      const fourLines = [
        `FOUR! Sublime stroke! ${batsman} opens the face and pierces the gap between point and cover!`,
        `CRACKING FOUR! Squeezed through backward point, beats the diving fielder with sheer timing!`,
        `FOUR! Pulled with authority through midwicket! No chance for deep square leg to cut that off!`,
      ];
      return fourLines[Math.floor(Math.random() * fourLines.length)];
    }
    if (outcome.isWicket) {
      const wktLines = [
        `OUT! EDGED AND TAKEN! ${bowler} strikes! A faint nick and the wicketkeeper makes no mistake! Huge breakthrough!`,
        `BOWLED HIM! Cleaned up! A peach of a yorker that dismantles the stumps! What a delivery by ${bowler}!`,
        `OUT! Hole out at long-on! ${batsman} went for the big one but didn't get enough elevation, straight to the fielder!`,
      ];
      return wktLines[Math.floor(Math.random() * wktLines.length)];
    }
    if (outcome.runs === 0) {
      const dotLines = [
        `Good length delivery on off stump, defended solidly back to ${bowler}.`,
        `Beaten outside off! Sharp bounce and deviation, beats the outside edge.`,
        `Pushed firmly towards mid-off, fielder is alert, no run taken.`,
      ];
      return dotLines[Math.floor(Math.random() * dotLines.length)];
    }
    if (outcome.runs === 1) {
      return `Tucked off the pads towards square leg for a quick single. Good rotation of strike by ${batsman}.`;
    }
    if (outcome.runs === 2) {
      return `Driven into the deep cover gap. They hustle back for the second run and beat the throw easily!`;
    }
    return `Pushed down the ground for ${outcome.runs} runs.`;
  };

  const simulateNextBall = () => {
    if (!currentInning || currentInning.isCompleted) {
      setIsSimulating(false);
      return;
    }

    // Determine current over and ball
    const currentOverDecimal = currentInning.overs;
    const completedOvers = Math.floor(currentOverDecimal);
    const completedBalls = Math.round((currentOverDecimal - completedOvers) * 10);
    const nextBallNumber = completedBalls === 5 ? 6 : completedBalls + 1;
    const nextOverNumber = completedBalls === 5 ? completedOvers + 1 : completedOvers;

    // Check if match already reached target or completed
    const target = match.targetRuns || (firstInning ? firstInning.runs + 1 : 206);
    if (currentInning.runs >= target) {
      setIsSimulating(false);
      return;
    }
    if (currentInning.wickets >= 10 || currentInning.overs >= currentInning.maxOvers) {
      setIsSimulating(false);
      return;
    }

    // Find current batsmen (striker and non-striker)
    const batsmen = [...currentInning.batsmen];
    let strikerIndex = batsmen.findIndex((b) => b.isBattingNow && b.isStriker);
    let nonStrikerIndex = batsmen.findIndex((b) => b.isBattingNow && !b.isStriker);

    if (strikerIndex === -1) {
      strikerIndex = batsmen.findIndex((b) => !b.out);
      if (strikerIndex !== -1) batsmen[strikerIndex].isBattingNow = true;
    }
    if (nonStrikerIndex === -1 && strikerIndex !== -1) {
      nonStrikerIndex = batsmen.findIndex((b, idx) => !b.out && idx !== strikerIndex);
      if (nonStrikerIndex !== -1) batsmen[nonStrikerIndex].isBattingNow = true;
    }

    const striker = batsmen[strikerIndex];
    const bowlers = [...currentInning.bowlers];
    let currentBowlerIndex = bowlers.findIndex((b) => b.isBowlingNow);
    if (currentBowlerIndex === -1) currentBowlerIndex = 0;
    const bowler = bowlers[currentBowlerIndex];

    // Probability roll for ball outcome
    // 0: 30%, 1: 30%, 2: 12%, 3: 2%, 4: 12%, 6: 8%, W: 6%
    const rand = Math.random();
    let runsScored = 0;
    let isWicket = false;
    let isFour = false;
    let isSix = false;

    if (rand < 0.28) {
      runsScored = 0;
    } else if (rand < 0.58) {
      runsScored = 1;
    } else if (rand < 0.70) {
      runsScored = 2;
    } else if (rand < 0.72) {
      runsScored = 3;
    } else if (rand < 0.84) {
      runsScored = 4;
      isFour = true;
    } else if (rand < 0.92) {
      runsScored = 6;
      isSix = true;
    } else {
      isWicket = true;
    }

    // Audio triggers
    if (isSix) {
      sounds.playSix();
      setLastEventToast({ text: `💥 MAXIMUM! 6 Runs for ${striker?.name || 'Batsman'}!`, type: 'six' });
    } else if (isFour) {
      sounds.playBoundary();
      setLastEventToast({ text: `🏏 FOUR! Boundary by ${striker?.name || 'Batsman'}!`, type: 'four' });
    } else if (isWicket) {
      sounds.playWicket();
      setLastEventToast({ text: `🚨 WICKET! ${striker?.name || 'Batsman'} is OUT!`, type: 'wicket' });
    }

    // Update striker stats
    let newWickets = currentInning.wickets;
    const newFallOfWickets = [...currentInning.fallOfWickets];

    if (isWicket && striker) {
      newWickets += 1;
      striker.out = true;
      striker.balls += 1;
      striker.isBattingNow = false;
      striker.isStriker = false;
      striker.dismissal = `c & b ${bowler.name}`;
      newFallOfWickets.push({
        score: currentInning.runs + runsScored,
        wicketNumber: newWickets,
        batsmanName: striker.name,
        over: Number(`${completedOvers}.${completedBalls + 1}`),
      });

      // Bring next batsman if available
      const nextInLine = batsmen.find((b) => !b.out && !b.isBattingNow);
      if (nextInLine) {
        nextInLine.isBattingNow = true;
        nextInLine.isStriker = true;
      }
    } else if (striker) {
      striker.runs += runsScored;
      striker.balls += 1;
      if (isFour) striker.fours += 1;
      if (isSix) striker.sixes += 1;
      striker.strikeRate = Number(((striker.runs / striker.balls) * 100).toFixed(1));
    }

    // Update bowler stats
    bowler.runs += runsScored;
    if (isWicket) bowler.wickets += 1;

    // Over calculation
    let newOvers = completedOvers;
    let newOversDisplay = '';
    let rotateStrike = runsScored % 2 !== 0;

    if (completedBalls === 5) {
      // Completed the 6th ball of the over
      newOvers = completedOvers + 1;
      newOversDisplay = `${newOvers}.0`;
      bowler.overs = Math.floor(bowler.overs) + 1;
      // Over ended, rotate strike naturally
      rotateStrike = !rotateStrike;
      // Change bowler for next over
      bowlers.forEach((b) => (b.isBowlingNow = false));
      const nextBowlerIdx = (currentBowlerIndex + 1) % bowlers.length;
      bowlers[nextBowlerIdx].isBowlingNow = true;
    } else {
      newOversDisplay = `${completedOvers}.${completedBalls + 1}`;
      bowler.overs = Number(`${Math.floor(bowler.overs)}.${(Math.round((bowler.overs - Math.floor(bowler.overs)) * 10) + 1)}`);
    }

    bowler.economy = Number((bowler.runs / Math.max(1, bowler.overs)).toFixed(2));

    // Rotate strike if needed
    if (rotateStrike && !isWicket) {
      batsmen.forEach((b) => {
        if (b.isBattingNow) {
          b.isStriker = !b.isStriker;
        }
      });
    }

    const totalRuns = currentInning.runs + runsScored;
    const isCompleted = totalRuns >= target || newWickets >= 10 || (completedBalls === 5 && newOvers >= currentInning.maxOvers);

    // Commentary text
    const commentaryMsg = getCommentaryText(
      { runs: runsScored, isWicket, isFour, isSix },
      striker?.name || 'Batsman',
      bowler.name
    );

    const newCommentaryItem: BallCommentary = {
      id: `ball-${Date.now()}`,
      over: completedOvers,
      ball: completedBalls + 1,
      bowlerName: bowler.name,
      batsmanName: striker?.name || 'Batsman',
      runs: runsScored,
      isWicket,
      isFour,
      isSix,
      isExtra: false,
      commentary: commentaryMsg,
      timestamp: 'Just now',
    };

    // Recalculate target, run rates & dynamic win probability
    const totalMatchBalls = (currentInning.maxOvers || 20) * 6;
    const ballsRemaining = Math.max(0, totalMatchBalls - (completedOvers * 6 + completedBalls + 1));
    const runsRemaining = Math.max(0, target - totalRuns);
    const totalOversDecimal = completedOvers + (completedBalls + 1) / 6;
    const crr = totalOversDecimal > 0 ? Number((totalRuns / totalOversDecimal).toFixed(2)) : 0;
    const rrr = ballsRemaining > 0 ? Number(((runsRemaining / ballsRemaining) * 6).toFixed(2)) : 0;

    // Win probability algorithm based on chase state
    let teamAProb = 50;
    if (isCompleted) {
      teamAProb = totalRuns >= target ? 100 : 0;
    } else {
      const runDiffFactor = (crr - rrr) * 5;
      const wicketsFactor = (10 - newWickets) * 3;
      teamAProb = Math.min(95, Math.max(5, Math.round(50 + runDiffFactor + (wicketsFactor - 15))));
    }

    let summaryStatus = '';
    if (totalRuns >= target) {
      summaryStatus = `${match.teamA.name} won by ${10 - newWickets} wickets! 🏆`;
    } else if (newWickets >= 10 || (completedBalls === 5 && newOvers >= currentInning.maxOvers)) {
      summaryStatus = `${match.teamB.name} won by ${runsRemaining} runs! 🏆`;
    } else {
      summaryStatus = `${match.teamA.name} need ${runsRemaining} runs in ${ballsRemaining} balls to win`;
    }

    const updatedMatch: Match = {
      ...match,
      status: isCompleted ? 'completed' : 'live',
      summaryStatus,
      requiredRunRate: rrr,
      currentRunRate: crr,
      winProbability: {
        teamA: teamAProb,
        teamB: 100 - teamAProb,
      },
      teamA: {
        ...match.teamA,
        score: `${totalRuns}/${newWickets}`,
        overs: newOversDisplay,
      },
      innings: [
        match.innings[0],
        {
          ...currentInning,
          runs: totalRuns,
          wickets: newWickets,
          overs: Number(newOversDisplay),
          isCompleted,
          batsmen,
          bowlers,
          fallOfWickets: newFallOfWickets,
        },
      ],
      commentary: [newCommentaryItem, ...match.commentary],
    };

    onUpdateMatch(updatedMatch);
  };

  // Filter commentary balls
  const filteredCommentary = match.commentary.filter((item) => {
    if (commentaryFilter === 'boundaries') return item.isFour || item.isSix;
    if (commentaryFilter === 'wickets') return item.isWicket;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast popup for live simulation actions */}
      {lastEventToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce transition-all">
          <div className={`px-4 py-2.5 rounded-xl shadow-2xl font-bold text-sm border flex items-center gap-2 ${
            lastEventToast.type === 'six'
              ? 'bg-purple-600 text-white border-purple-400'
              : lastEventToast.type === 'four'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : lastEventToast.type === 'wicket'
              ? 'bg-red-600 text-white border-red-400'
              : 'bg-slate-800 text-white border-slate-700'
          }`}>
            <Sparkles className="w-4 h-4" />
            <span>{lastEventToast.text}</span>
          </div>
        </div>
      )}

      {/* Main Match Header Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">{match.series}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">{match.format}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{match.venue}</span>
            </div>
            {isLive ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                {match.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Big Teams Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 items-center">
          {/* Team A */}
          <motion.div 
            variants={cardEntryVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`p-4 rounded-xl border transition ${
              match.currentInningIndex === 1
                ? 'bg-slate-800/60 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">{match.teamA.flag}</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">{match.teamA.name}</h2>
                  <span className="text-xs text-slate-400">
                    {match.currentInningIndex === 1 ? 'Chasing • Batting 2nd' : 'Batting 1st'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <motion.div 
                  key={match.teamA.score}
                  variants={scoreUpdateVariants}
                  initial="initial"
                  animate="animate"
                  className="text-2xl sm:text-3xl font-extrabold font-mono-numbers text-white"
                >
                  {match.teamA.score || 'Yet to bat'}
                </motion.div>
                {match.teamA.overs && (
                  <div className="text-xs text-slate-400 font-mono-numbers">
                    ({match.teamA.overs} Ovs)
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Team B */}
          <motion.div 
            variants={cardEntryVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`p-4 rounded-xl border transition ${
              match.currentInningIndex === 0
                ? 'bg-slate-800/60 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">{match.teamB.flag}</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">{match.teamB.name}</h2>
                  <span className="text-xs text-slate-400">
                    {match.currentInningIndex === 0 ? 'Batting 1st' : 'Defending Target 206'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <motion.div 
                  key={match.teamB.score}
                  variants={scoreUpdateVariants}
                  initial="initial"
                  animate="animate"
                  className="text-2xl sm:text-3xl font-extrabold font-mono-numbers text-white"
                >
                  {match.teamB.score || 'Yet to bat'}
                </motion.div>
                {match.teamB.overs && (
                  <div className="text-xs text-slate-400 font-mono-numbers">
                    ({match.teamB.overs} Ovs)
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Equation & Run Rates */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-300">{match.summaryStatus}</p>
              <p className="text-xs text-slate-400 mt-0.5">{match.toss}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-numbers">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">CRR: </span>
              <span className="font-bold text-slate-200">{match.currentRunRate}</span>
            </div>
            {match.requiredRunRate !== undefined && (
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">RRR: </span>
                <span className="font-bold text-amber-400">{match.requiredRunRate}</span>
              </div>
            )}
            {match.targetRuns && (
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Target: </span>
                <span className="font-bold text-slate-200">{match.targetRuns}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Win Probability Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-sky-400">{match.teamA.shortName}: {match.winProbability.teamA}%</span>
            <span className="text-slate-400 uppercase tracking-wider text-[11px]">Win Probability (WinViz)</span>
            <span className="text-amber-400">{match.teamB.shortName}: {match.winProbability.teamB}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className="bg-sky-500 h-full transition-all duration-500" 
              style={{ width: `${match.winProbability.teamA}%` }} 
            />
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${match.winProbability.teamB}%` }} 
            />
          </div>
        </div>

        {/* Interactive Simulation Controls Bar */}
        <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              SIMULATOR
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Control the live match action ball-by-ball:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Next Ball */}
            <button
              onClick={() => {
                simulateNextBall();
                sounds.playClick();
              }}
              disabled={match.status === 'completed'}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Next Ball</span>
            </button>

            {/* Auto Play / Pause */}
            <button
              onClick={() => {
                setIsSimulating(!isSimulating);
                sounds.playClick();
              }}
              disabled={match.status === 'completed'}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition border ${
                isSimulating
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Live Sim</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Auto-Play</span>
                </>
              )}
            </button>

            {/* Speed toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              {[
                { label: '1x', speed: 2000 },
                { label: '2x', speed: 1000 },
                { label: '4x', speed: 400 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSimSpeed(s.speed)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    simSpeed === s.speed ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Reset Match */}
            <button
              onClick={() => {
                setIsSimulating(false);
                onResetMatch();
                sounds.playClick();
              }}
              title="Reset match to default 17th over thriller"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-sm font-semibold">
        {[
          { id: 'commentary', label: 'Live Commentary' },
          { id: 'scorecard', label: 'Full Scorecard' },
          { id: 'predictor', label: 'Win Predictor & Run Rates' },
          { id: 'teams', label: 'Squads & Venue' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              sounds.playClick();
            }}
            className={`px-4 py-2.5 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Live Ball-by-Ball Commentary */}
      {activeTab === 'commentary' && (
        <div className="space-y-4">
          {/* Recent balls pill stream */}
          <div className="flex items-center justify-between bg-slate-900 rounded-xl p-3 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Deliveries:</span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {match.commentary.slice(0, 10).map((b) => (
                <div
                  key={b.id}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono-numbers font-bold text-xs shrink-0 ${
                    b.isSix
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : b.isFour
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : b.isWicket
                      ? 'bg-red-600 text-white ring-2 ring-red-400'
                      : b.runs === 0
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  {b.isWicket ? 'W' : b.runs}
                </div>
              ))}
            </div>
          </div>

          {/* Commentary Filters */}
          <div className="flex items-center gap-2 text-xs">
            {[
              { id: 'all', label: 'All Balls' },
              { id: 'boundaries', label: 'Boundaries (4s & 6s)' },
              { id: 'wickets', label: 'Wickets' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCommentaryFilter(f.id as typeof commentaryFilter)}
                className={`px-3 py-1 rounded-lg transition ${
                  commentaryFilter === f.id
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Ball Feed */}
          <div className="space-y-3">
            {filteredCommentary.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                No events match this filter yet.
              </div>
            ) : (
              filteredCommentary.map((c) => (
                <motion.div
                  key={c.id}
                  variants={commentaryItemVariants}
                  initial="initial"
                  animate="animate"
                  layout
                  className={`p-4 rounded-xl border transition ${
                    c.isSix
                      ? 'bg-purple-950/20 border-purple-500/40'
                      : c.isFour
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : c.isWicket
                      ? 'bg-red-950/20 border-red-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="font-mono-numbers font-bold text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded">
                        {c.over}.{c.ball}
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        {c.bowlerName} to {c.batsmanName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        c.isSix
                          ? 'bg-purple-600 text-white'
                          : c.isFour
                          ? 'bg-emerald-600 text-white'
                          : c.isWicket
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.isWicket ? 'WICKET' : c.isSix ? 'SIX (6)' : c.isFour ? 'FOUR (4)' : `${c.runs} run${c.runs !== 1 ? 's' : ''}`}
                      </span>
                      <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                    {c.commentary}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Full Scorecard */}
      {activeTab === 'scorecard' && currentInning && (
        <div className="space-y-6">
          {/* Batting Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>{currentInning.teamName} Innings</span>
                <span className="text-xs font-normal text-slate-400 font-mono-numbers">
                  ({currentInning.runs}/{currentInning.wickets} in {currentInning.overs} ov)
                </span>
              </h3>
              <span className="text-xs text-slate-400 font-mono-numbers">
                CRR: {match.currentRunRate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Batter</th>
                    <th className="py-2.5 px-3 font-semibold">Dismissal</th>
                    <th className="py-2.5 px-3 text-right font-semibold">R</th>
                    <th className="py-2.5 px-3 text-right font-semibold">B</th>
                    <th className="py-2.5 px-3 text-right font-semibold">4s</th>
                    <th className="py-2.5 px-3 text-right font-semibold">6s</th>
                    <th className="py-2.5 px-4 text-right font-semibold">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                  {currentInning.batsmen.map((b) => (
                    <tr key={b.playerId} className={`hover:bg-slate-850/50 ${b.isBattingNow ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-100 flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isBattingNow && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                            {b.isStriker ? 'STRIKER' : 'NON-STRIKER'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                        {b.out ? b.dismissal : 'not out *'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100">{b.runs}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{b.balls}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{b.fours}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{b.sixes}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300 font-medium">{b.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Extras & Total */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div>
                <span className="font-semibold text-slate-300">Extras: </span>
                <span>{currentInning.extras.total} (b {currentInning.extras.byes}, lb {currentInning.extras.legByes}, w {currentInning.extras.wides}, nb {currentInning.extras.noBalls})</span>
              </div>
              <div className="font-bold text-slate-200">
                Total: <span className="text-emerald-400 font-mono-numbers">{currentInning.runs}/{currentInning.wickets}</span> ({currentInning.overs} Ovs)
              </div>
            </div>
          </div>

          {/* Bowling Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm">Bowling</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Bowler</th>
                    <th className="py-2.5 px-3 text-right font-semibold">O</th>
                    <th className="py-2.5 px-3 text-right font-semibold">M</th>
                    <th className="py-2.5 px-3 text-right font-semibold">R</th>
                    <th className="py-2.5 px-3 text-right font-semibold">W</th>
                    <th className="py-2.5 px-4 text-right font-semibold">ECON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                  {currentInning.bowlers.map((b) => (
                    <tr key={b.playerId} className={`hover:bg-slate-850/50 ${b.isBowlingNow ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-100 flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isBowlingNow && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-slate-950">
                            BOWLING
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{b.overs}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{b.maidens}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-200">{b.runs}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{b.wickets}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300 font-medium">{b.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fall of Wickets */}
          {currentInning.fallOfWickets.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Fall of Wickets
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {currentInning.fallOfWickets.map((fow) => (
                  <span
                    key={fow.wicketNumber}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    <span className="font-bold text-red-400">{fow.score}/{fow.wicketNumber}</span> ({fow.batsmanName}, {fow.over} ov)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Win Predictor & Run Rates */}
      {activeTab === 'predictor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Run Rate Comparator */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Run Rate Analytics</span>
              </h3>

              <div className="space-y-3 font-mono-numbers">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Current Run Rate (CRR)</span>
                    <span className="font-bold text-emerald-400">{match.currentRunRate} rpo</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, match.currentRunRate * 8)}%` }} />
                  </div>
                </div>

                {match.requiredRunRate !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Required Run Rate (RRR)</span>
                      <span className="font-bold text-amber-400">{match.requiredRunRate} rpo</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, match.requiredRunRate * 8)}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {match.currentRunRate >= (match.requiredRunRate || 10) ? (
                  <p className="text-emerald-300">
                    ✅ India’s scoring rate is matching the asking rate. Maintaining boundary frequency in the next 12 deliveries is critical.
                  </p>
                ) : (
                  <p className="text-amber-300">
                    ⚠️ The required rate is climbing. India will require at least one 15+ run over from Starc or Cummins to bring the equation down.
                  </p>
                )}
              </div>
            </div>

            {/* Win Probability Explainer */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>Live Win Probability (Crickazz AI Engine)</span>
              </h3>

              <div className="flex items-center justify-around py-4">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-sky-400 font-mono-numbers">
                    {match.winProbability.teamA}%
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-1">{match.teamA.name}</div>
                </div>

                <div className="text-slate-600 font-extrabold text-lg">VS</div>

                <div className="text-center">
                  <div className="text-3xl font-extrabold text-amber-400 font-mono-numbers">
                    {match.winProbability.teamB}%
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-1">{match.teamB.name}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Win probability factors in historical MCG T20 chase patterns, batting depth in the shed, bowler economy rates, and pressure multiplier per dot ball.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Squads & Venue */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* India Squad */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>{match.teamA.flag}</span>
              <span>{match.teamA.name} Playing XI</span>
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 divide-y divide-slate-800/60">
              <li className="pt-2 flex justify-between"><span>Rohit Sharma (c)</span><span className="text-slate-500">Top-order Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Yashasvi Jaiswal</span><span className="text-slate-500">Opening Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Virat Kohli</span><span className="text-slate-500">Top-order Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Suryakumar Yadav</span><span className="text-slate-500">Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Rishabh Pant (wk)</span><span className="text-slate-500">Wicketkeeper Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Hardik Pandya</span><span className="text-slate-500">All-rounder</span></li>
              <li className="pt-2 flex justify-between"><span>Ravindra Jadeja</span><span className="text-slate-500">All-rounder</span></li>
              <li className="pt-2 flex justify-between"><span>Kuldeep Yadav</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Jasprit Bumrah</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Arshdeep Singh</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Mohammed Siraj</span><span className="text-slate-500">Bowler</span></li>
            </ul>
          </div>

          {/* Australia Squad */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>{match.teamB.flag}</span>
              <span>{match.teamB.name} Playing XI</span>
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 divide-y divide-slate-800/60">
              <li className="pt-2 flex justify-between"><span>Travis Head</span><span className="text-slate-500">Opening Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Mitchell Marsh (c)</span><span className="text-slate-500">All-rounder</span></li>
              <li className="pt-2 flex justify-between"><span>Glenn Maxwell</span><span className="text-slate-500">All-rounder</span></li>
              <li className="pt-2 flex justify-between"><span>Josh Inglis (wk)</span><span className="text-slate-500">Wicketkeeper Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Tim David</span><span className="text-slate-500">Batter</span></li>
              <li className="pt-2 flex justify-between"><span>Marcus Stoinis</span><span className="text-slate-500">All-rounder</span></li>
              <li className="pt-2 flex justify-between"><span>Pat Cummins</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Mitchell Starc</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Adam Zampa</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Josh Hazlewood</span><span className="text-slate-500">Bowler</span></li>
              <li className="pt-2 flex justify-between"><span>Nathan Ellis</span><span className="text-slate-500">Bowler</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
