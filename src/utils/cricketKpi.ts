import { Inning, Match, BatsmanScore, BowlerScore, FallOfWicket } from '../types/cricket';

export interface PartnershipStats {
  batsman1: {
    name: string;
    runs: number;
    balls: number;
    strikeRate: number;
    percentage: number;
    isStriker: boolean;
  };
  batsman2: {
    name: string;
    runs: number;
    balls: number;
    strikeRate: number;
    percentage: number;
    isStriker: boolean;
  };
  totalRuns: number;
  totalBalls: number;
  runRate: number;
  wicketNumber: number; // e.g. 5th wicket partnership
  milestoneTarget: number; // e.g. 50
  milestoneProgressPercent: number;
  ballsToMilestoneAtCrr: number;
}

export interface RunRateKpi {
  crr: number;
  rrr: number | null;
  difference: number | null;
  isAheadOfRequired: boolean | null;
  statusText: string;
  ballsCompleted: number;
  ballsRemaining: number;
  oversCompletedDecimal: number;
  matchPhase: 'Powerplay (Ovs 1-6)' | 'Middle Overs (Ovs 7-15)' | 'Death Overs (Ovs 16-20)' | 'General Play';
  phaseColor: string;
}

export interface ProjectedScoreHorizon {
  label: string;
  rpo: number;
  projectedTotal: number;
  description: string;
  tagColor: string;
}

export interface CustomProjectionModel {
  customRpo: number;
  customTotal: number;
  differenceFromTarget: number | null;
  willWin: boolean | null;
}

export interface LiveMatchKpiSummary {
  matchId: string;
  isLive: boolean;
  battingTeamName: string;
  bowlingTeamName: string;
  currentScore: string;
  currentRuns: number;
  currentWickets: number;
  oversDisplay: string;
  maxOvers: number;
  runRate: RunRateKpi;
  partnership: PartnershipStats;
  projections: ProjectedScoreHorizon[];
  customProjection: CustomProjectionModel;
  targetRuns: number | null;
  winProbability: { teamA: number; teamB: number };
}

/**
 * Converts cricket overs format (e.g. 16.5) to total legal balls delivered (101).
 */
export function oversToBalls(overs: number): number {
  const completedOvers = Math.floor(overs);
  const remainderBalls = Math.round((overs - completedOvers) * 10);
  return completedOvers * 6 + remainderBalls;
}

/**
 * Converts total balls to cricket overs format (e.g. 101 -> 16.5).
 */
export function ballsToOvers(balls: number): number {
  const completedOvers = Math.floor(balls / 6);
  const remainderBalls = balls % 6;
  return Number(`${completedOvers}.${remainderBalls}`);
}

/**
 * Calculates current run rate with safe division against zero.
 */
export function calculateCurrentRunRate(runs: number, overs: number): number {
  const balls = oversToBalls(overs);
  if (balls <= 0) return 0.0;
  const crr = (runs / balls) * 6;
  return Number(crr.toFixed(2));
}

/**
 * Calculates required run rate for target chase with safe zero handling.
 */
export function calculateRequiredRunRate(runsNeeded: number, ballsRemaining: number): number {
  if (runsNeeded <= 0) return 0.0;
  if (ballsRemaining <= 0) return 99.9; // Out of balls
  const rrr = (runsNeeded / ballsRemaining) * 6;
  return Number(rrr.toFixed(2));
}

/**
 * Computes partnership dynamics between the two currently active crease batsmen.
 */
export function computeCurrentPartnership(
  inning: Inning,
  customMilestoneTarget: number = 50
): PartnershipStats {
  const batsmen = inning.batsmen;
  const currentRuns = inning.runs;
  const currentBalls = oversToBalls(inning.overs);

  // Active crease batsmen
  const activeBatsmen = batsmen.filter((b) => b.isBattingNow);
  let b1 = activeBatsmen[0];
  let b2 = activeBatsmen[1];

  // Fallback if flags are not populated
  if (!b1 || !b2) {
    const unOut = batsmen.filter((b) => !b.out);
    b1 = b1 || unOut[0] || batsmen[0];
    b2 = b2 || unOut[1] || batsmen[1] || batsmen[0];
  }

  // Wicket count gives the partnership ordinal (e.g. 0 wickets = 1st wicket, 4 wickets = 5th wicket)
  const wicketNumber = inning.wickets + 1;
  const lastWicket: FallOfWicket | undefined = inning.fallOfWickets && inning.fallOfWickets.length > 0
    ? inning.fallOfWickets[inning.fallOfWickets.length - 1]
    : undefined;

  const lastWicketScore = lastWicket ? lastWicket.score : 0;
  const lastWicketBalls = lastWicket ? oversToBalls(lastWicket.over) : 0;

  const totalPartnershipRuns = Math.max(0, currentRuns - lastWicketScore);
  const totalPartnershipBalls = Math.max(1, currentBalls - lastWicketBalls);

  // Estimate individual batsman contributions in this stand
  // If one player joined later, their total runs since joining is at most their current score
  let b1StandRuns = 0;
  let b2StandRuns = 0;
  let b1StandBalls = 0;
  let b2StandBalls = 0;

  if (b1 && b2) {
    // Proportional or clamped to their total innings scores
    b1StandRuns = Math.min(b1.runs, totalPartnershipRuns);
    b2StandRuns = Math.max(0, totalPartnershipRuns - b1StandRuns);
    b1StandBalls = Math.min(b1.balls, totalPartnershipBalls);
    b2StandBalls = Math.max(0, totalPartnershipBalls - b1StandBalls);
  }

  const b1Percent = totalPartnershipRuns > 0 ? Math.round((b1StandRuns / totalPartnershipRuns) * 100) : 50;
  const b2Percent = totalPartnershipRuns > 0 ? 100 - b1Percent : 50;

  const partnershipRunRate = Number(((totalPartnershipRuns / totalPartnershipBalls) * 6).toFixed(2));
  const milestoneTarget = customMilestoneTarget > 0 ? customMilestoneTarget : 50;
  const milestoneProgressPercent = Math.min(100, Math.round((totalPartnershipRuns / milestoneTarget) * 100));

  const runsNeededForMilestone = Math.max(0, milestoneTarget - totalPartnershipRuns);
  const ballsToMilestoneAtCrr = partnershipRunRate > 0
    ? Math.ceil((runsNeededForMilestone / partnershipRunRate) * 6)
    : 0;

  return {
    batsman1: {
      name: b1?.name || 'Batsman 1',
      runs: b1StandRuns,
      balls: b1StandBalls,
      strikeRate: b1StandBalls > 0 ? Number(((b1StandRuns / b1StandBalls) * 100).toFixed(1)) : 0,
      percentage: b1Percent,
      isStriker: b1?.isStriker ?? true,
    },
    batsman2: {
      name: b2?.name || 'Batsman 2',
      runs: b2StandRuns,
      balls: b2StandBalls,
      strikeRate: b2StandBalls > 0 ? Number(((b2StandRuns / b2StandBalls) * 100).toFixed(1)) : 0,
      percentage: b2Percent,
      isStriker: b2?.isStriker ?? false,
    },
    totalRuns: totalPartnershipRuns,
    totalBalls: totalPartnershipBalls,
    runRate: partnershipRunRate,
    wicketNumber,
    milestoneTarget,
    milestoneProgressPercent,
    ballsToMilestoneAtCrr,
  };
}

/**
 * Computes projected score spectrum at different pacing models.
 */
export function computeProjectedScores(
  currentRuns: number,
  overs: number,
  maxOvers: number = 20,
  crr: number
): ProjectedScoreHorizon[] {
  const ballsCompleted = oversToBalls(overs);
  const totalMatchBalls = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalMatchBalls - ballsCompleted);
  const oversRemaining = ballsRemaining / 6;

  // Model 1: Current Run Rate Continuation
  const atCrr = Math.round(currentRuns + crr * oversRemaining);

  // Model 2: Conservative / Controlled Pace (6.0 - 7.5 RPO)
  const conservativeRpo = Math.max(6.0, Number((crr * 0.8).toFixed(1)));
  const atConservative = Math.round(currentRuns + conservativeRpo * oversRemaining);

  // Model 3: Par Acceleration (8.5 - 9.5 RPO)
  const parRpo = Number((Math.max(crr, 8.5)).toFixed(1));
  const atPar = Math.round(currentRuns + parRpo * oversRemaining);

  // Model 4: Death Overs Power-Hitting Blitz (11.0 - 14.0 RPO)
  const deathRpo = Number((Math.max(12.0, crr + 2.5)).toFixed(1));
  const atDeathBlitz = Math.round(currentRuns + deathRpo * oversRemaining);

  return [
    {
      label: 'Anchor Pace',
      rpo: conservativeRpo,
      projectedTotal: atConservative,
      description: 'Controlled rotation without taking boundary risks',
      tagColor: 'text-slate-300 bg-slate-800 border-slate-700',
    },
    {
      label: 'Current Run Rate',
      rpo: crr,
      projectedTotal: atCrr,
      description: 'Continuing at the exact present tempo',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      label: 'Par Acceleration',
      rpo: parRpo,
      projectedTotal: atPar,
      description: 'Balanced acceleration matching tournament par',
      tagColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      label: 'Death Overs Blast',
      rpo: deathRpo,
      projectedTotal: atDeathBlitz,
      description: 'Maximum risk boundary assault in final overs',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
  ];
}

/**
 * Computes custom projection model for user-adjusted RPO slider.
 */
export function computeCustomProjection(
  currentRuns: number,
  overs: number,
  maxOvers: number = 20,
  customRpo: number,
  targetRuns: number | null
): CustomProjectionModel {
  const ballsCompleted = oversToBalls(overs);
  const totalMatchBalls = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalMatchBalls - ballsCompleted);
  const oversRemaining = ballsRemaining / 6;

  const customTotal = Math.round(currentRuns + customRpo * oversRemaining);
  const differenceFromTarget = targetRuns !== null ? customTotal - targetRuns : null;
  const willWin = targetRuns !== null ? customTotal >= targetRuns : null;

  return {
    customRpo,
    customTotal,
    differenceFromTarget,
    willWin,
  };
}

/**
 * Computes match phase based on completed overs in T20/ODI match.
 */
export function getMatchPhase(overs: number, maxOvers: number = 20): {
  phase: 'Powerplay (Ovs 1-6)' | 'Middle Overs (Ovs 7-15)' | 'Death Overs (Ovs 16-20)' | 'General Play';
  color: string;
} {
  if (maxOvers === 20) {
    if (overs <= 6.0) return { phase: 'Powerplay (Ovs 1-6)', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' };
    if (overs <= 15.0) return { phase: 'Middle Overs (Ovs 7-15)', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
    return { phase: 'Death Overs (Ovs 16-20)', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  return { phase: 'General Play', color: 'text-slate-300 bg-slate-800 border-slate-700' };
}

/**
 * Aggregates all KPI data for the active match into a unified summary object.
 */
export function getLiveMatchKpiSummary(
  match: Match,
  options?: {
    customRpo?: number;
    customMilestoneTarget?: number;
  }
): LiveMatchKpiSummary {
  const is2ndInning = match.currentInningIndex === 1;
  const activeInning = match.innings[match.currentInningIndex] || match.innings[0];
  const maxOvers = activeInning.maxOvers || 20;

  const currentRuns = activeInning.runs;
  const currentWickets = activeInning.wickets;
  const overs = activeInning.overs;
  const oversDisplay = `${overs}`;

  const ballsCompleted = oversToBalls(overs);
  const totalMatchBalls = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalMatchBalls - ballsCompleted);

  const crr = calculateCurrentRunRate(currentRuns, overs);

  let rrr: number | null = null;
  let difference: number | null = null;
  let isAhead: boolean | null = null;
  let statusText = `${crr} runs per over`;

  if (is2ndInning && match.targetRuns) {
    const runsRemaining = Math.max(0, match.targetRuns - currentRuns);
    rrr = calculateRequiredRunRate(runsRemaining, ballsRemaining);
    difference = Number((crr - rrr).toFixed(2));
    isAhead = crr >= rrr;
    statusText = isAhead
      ? `+${difference} RPO ahead of target pace`
      : `${Math.abs(difference)} RPO behind required tempo`;
  }

  const { phase, color } = getMatchPhase(overs, maxOvers);

  const runRateKpi: RunRateKpi = {
    crr,
    rrr,
    difference,
    isAheadOfRequired: isAhead,
    statusText,
    ballsCompleted,
    ballsRemaining,
    oversCompletedDecimal: overs,
    matchPhase: phase,
    phaseColor: color,
  };

  const partnership = computeCurrentPartnership(activeInning, options?.customMilestoneTarget ?? 50);
  const projections = computeProjectedScores(currentRuns, overs, maxOvers, crr);

  const customRpo = options?.customRpo ?? (rrr !== null ? Math.round(rrr * 10) / 10 : Math.round(crr * 10) / 10);
  const customProjection = computeCustomProjection(
    currentRuns,
    overs,
    maxOvers,
    customRpo,
    match.targetRuns || null
  );

  const battingTeam = is2ndInning ? match.teamA : match.teamB;
  const bowlingTeam = is2ndInning ? match.teamB : match.teamA;

  return {
    matchId: match.id,
    isLive: match.status === 'live',
    battingTeamName: battingTeam.name,
    bowlingTeamName: bowlingTeam.name,
    currentScore: `${currentRuns}/${currentWickets}`,
    currentRuns,
    currentWickets,
    oversDisplay,
    maxOvers,
    runRate: runRateKpi,
    partnership,
    projections,
    customProjection,
    targetRuns: match.targetRuns || null,
    winProbability: match.winProbability,
  };
}
