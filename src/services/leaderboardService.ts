import { executeSql, getDatabase } from './db';

export interface BattingLeader {
  rank: number;
  playerId: number;
  name: string;
  country: string;
  role: string;
  battingStyle: string;
  innings: number;
  runs: number;
  highestScore: number;
  battingAvg: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  centuries: number;
  fifties: number;
}

export interface BowlingLeader {
  rank: number;
  playerId: number;
  name: string;
  country: string;
  role: string;
  bowlingStyle: string;
  innings: number;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  bowlingAvg: number;
  economyRate: number;
  bestWickets: number;
}

export interface StrikeRateLeader {
  rank: number;
  playerId: number;
  name: string;
  country: string;
  role: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  boundaryPercent: number;
}

export interface AllRounderLeader {
  rank: number;
  playerId: number;
  name: string;
  country: string;
  role: string;
  runs: number;
  strikeRate: number;
  wickets: number;
  economyRate: number;
  impactScore: number;
}

export interface BoundaryLeader {
  rank: number;
  playerId: number;
  name: string;
  country: string;
  sixes: number;
  fours: number;
  runs: number;
  boundaryRuns: number;
  boundaryPercent: number;
}

export interface LeaderboardSummaryStats {
  totalRuns: number;
  totalWickets: number;
  totalSixes: number;
  totalFours: number;
  totalPlayers: number;
  highestScore: number;
  highestScorerName: string;
  topWicketTakerName: string;
  topWickets: number;
  queryExecutionMs: number;
}

export const LEADERBOARD_QUERIES = {
  batting: `SELECT 
  p.player_id,
  p.full_name,
  p.country,
  p.playing_role,
  p.batting_style,
  COUNT(b.score_id) as innings,
  SUM(b.runs_scored) as total_runs,
  MAX(b.runs_scored) as highest_score,
  ROUND(AVG(b.runs_scored), 2) as batting_avg,
  ROUND(CAST(SUM(b.runs_scored) AS REAL) / NULLIF(SUM(b.balls_faced), 0) * 100, 2) as strike_rate,
  SUM(b.fours) as total_fours,
  SUM(b.sixes) as total_sixes,
  SUM(CASE WHEN b.runs_scored >= 100 THEN 1 ELSE 0 END) as centuries,
  SUM(CASE WHEN b.runs_scored >= 50 AND b.runs_scored < 100 THEN 1 ELSE 0 END) as fifties
FROM players p
JOIN batting_scores b ON p.player_id = b.player_id
GROUP BY p.player_id, p.full_name, p.country, p.playing_role, p.batting_style
ORDER BY total_runs DESC;`,

  bowling: `SELECT 
  p.player_id,
  p.full_name,
  p.country,
  p.playing_role,
  p.bowling_style,
  COUNT(b.bowling_id) as innings_bowled,
  ROUND(SUM(b.overs_bowled), 1) as total_overs,
  SUM(b.maidens) as total_maidens,
  SUM(b.runs_conceded) as total_runs_conceded,
  SUM(b.wickets_taken) as total_wickets,
  ROUND(CAST(SUM(b.runs_conceded) AS REAL) / NULLIF(SUM(b.wickets_taken), 0), 2) as bowling_avg,
  ROUND(CAST(SUM(b.runs_conceded) AS REAL) / NULLIF(SUM(b.overs_bowled), 0), 2) as economy_rate,
  MAX(b.wickets_taken) as best_wickets
FROM players p
JOIN bowling_scores b ON p.player_id = b.player_id
GROUP BY p.player_id, p.full_name, p.country, p.playing_role, p.bowling_style
ORDER BY total_wickets DESC, economy_rate ASC;`,

  strikeRate: `SELECT 
  p.player_id,
  p.full_name,
  p.country,
  p.playing_role,
  SUM(b.runs_scored) as total_runs,
  SUM(b.balls_faced) as total_balls,
  SUM(b.fours) as total_fours,
  SUM(b.sixes) as total_sixes,
  ROUND(CAST(SUM(b.runs_scored) AS REAL) / NULLIF(SUM(b.balls_faced), 0) * 100, 2) as strike_rate,
  ROUND(CAST(SUM(b.fours * 4 + b.sixes * 6) AS REAL) / NULLIF(SUM(b.runs_scored), 0) * 100, 1) as boundary_percent
FROM players p
JOIN batting_scores b ON p.player_id = b.player_id
GROUP BY p.player_id, p.full_name, p.country, p.playing_role
HAVING SUM(b.balls_faced) >= 20
ORDER BY strike_rate DESC;`,

  allRounder: `SELECT 
  p.player_id,
  p.full_name,
  p.country,
  p.playing_role,
  COALESCE(bat.total_runs, 0) as total_runs,
  COALESCE(bat.strike_rate, 0) as strike_rate,
  COALESCE(bowl.total_wickets, 0) as total_wickets,
  COALESCE(bowl.economy_rate, 0) as economy_rate,
  (COALESCE(bat.total_runs, 0) + COALESCE(bowl.total_wickets, 0) * 25) as impact_score
FROM players p
LEFT JOIN (
  SELECT player_id, SUM(runs_scored) as total_runs,
         ROUND(CAST(SUM(runs_scored) AS REAL) / NULLIF(SUM(balls_faced), 0) * 100, 1) as strike_rate
  FROM batting_scores
  GROUP BY player_id
) bat ON p.player_id = bat.player_id
LEFT JOIN (
  SELECT player_id, SUM(wickets_taken) as total_wickets,
         ROUND(CAST(SUM(runs_conceded) AS REAL) / NULLIF(SUM(overs_bowled), 0), 2) as economy_rate
  FROM bowling_scores
  GROUP BY player_id
) bowl ON p.player_id = bowl.player_id
WHERE COALESCE(bat.total_runs, 0) > 0 OR COALESCE(bowl.total_wickets, 0) > 0
ORDER BY impact_score DESC;`,

  boundary: `SELECT 
  p.player_id,
  p.full_name,
  p.country,
  SUM(b.sixes) as total_sixes,
  SUM(b.fours) as total_fours,
  SUM(b.runs_scored) as total_runs,
  SUM(b.fours * 4 + b.sixes * 6) as boundary_runs,
  ROUND(CAST(SUM(b.fours * 4 + b.sixes * 6) AS REAL) / NULLIF(SUM(b.runs_scored), 0) * 100, 1) as boundary_percent
FROM players p
JOIN batting_scores b ON p.player_id = b.player_id
GROUP BY p.player_id, p.full_name, p.country
ORDER BY total_sixes DESC, total_fours DESC;`,

  summary: `SELECT 
  (SELECT SUM(runs_scored) FROM batting_scores) as total_runs,
  (SELECT SUM(wickets_taken) FROM bowling_scores) as total_wickets,
  (SELECT SUM(sixes) FROM batting_scores) as total_sixes,
  (SELECT SUM(fours) FROM batting_scores) as total_fours,
  (SELECT COUNT(*) FROM players) as total_players,
  (SELECT MAX(runs_scored) FROM batting_scores) as highest_score;`
};

export async function fetchBattingLeaders(): Promise<{ data: BattingLeader[]; latencyMs: number }> {
  await getDatabase();
  const res = executeSql(LEADERBOARD_QUERIES.batting);
  const data: BattingLeader[] = res.values.map((row, idx) => ({
    rank: idx + 1,
    playerId: Number(row[0]),
    name: String(row[1]),
    country: String(row[2]),
    role: String(row[3]),
    battingStyle: String(row[4] || 'Right-hand bat'),
    innings: Number(row[5] || 0),
    runs: Number(row[6] || 0),
    highestScore: Number(row[7] || 0),
    battingAvg: Number(row[8] || 0),
    strikeRate: Number(row[9] || 0),
    fours: Number(row[10] || 0),
    sixes: Number(row[11] || 0),
    centuries: Number(row[12] || 0),
    fifties: Number(row[13] || 0),
  }));
  return { data, latencyMs: res.executionTimeMs };
}

export async function fetchBowlingLeaders(): Promise<{ data: BowlingLeader[]; latencyMs: number }> {
  await getDatabase();
  const res = executeSql(LEADERBOARD_QUERIES.bowling);
  const data: BowlingLeader[] = res.values.map((row, idx) => ({
    rank: idx + 1,
    playerId: Number(row[0]),
    name: String(row[1]),
    country: String(row[2]),
    role: String(row[3]),
    bowlingStyle: String(row[4] || 'Right-arm medium'),
    innings: Number(row[5] || 0),
    overs: Number(row[6] || 0),
    maidens: Number(row[7] || 0),
    runsConceded: Number(row[8] || 0),
    wickets: Number(row[9] || 0),
    bowlingAvg: Number(row[10] || 0),
    economyRate: Number(row[11] || 0),
    bestWickets: Number(row[12] || 0),
  }));
  return { data, latencyMs: res.executionTimeMs };
}

export async function fetchStrikeRateLeaders(): Promise<{ data: StrikeRateLeader[]; latencyMs: number }> {
  await getDatabase();
  const res = executeSql(LEADERBOARD_QUERIES.strikeRate);
  const data: StrikeRateLeader[] = res.values.map((row, idx) => ({
    rank: idx + 1,
    playerId: Number(row[0]),
    name: String(row[1]),
    country: String(row[2]),
    role: String(row[3]),
    runs: Number(row[4] || 0),
    balls: Number(row[5] || 0),
    fours: Number(row[6] || 0),
    sixes: Number(row[7] || 0),
    strikeRate: Number(row[8] || 0),
    boundaryPercent: Number(row[9] || 0),
  }));
  return { data, latencyMs: res.executionTimeMs };
}

export async function fetchAllRounderLeaders(): Promise<{ data: AllRounderLeader[]; latencyMs: number }> {
  await getDatabase();
  const res = executeSql(LEADERBOARD_QUERIES.allRounder);
  const data: AllRounderLeader[] = res.values.map((row, idx) => ({
    rank: idx + 1,
    playerId: Number(row[0]),
    name: String(row[1]),
    country: String(row[2]),
    role: String(row[3]),
    runs: Number(row[4] || 0),
    strikeRate: Number(row[5] || 0),
    wickets: Number(row[6] || 0),
    economyRate: Number(row[7] || 0),
    impactScore: Number(row[8] || 0),
  }));
  return { data, latencyMs: res.executionTimeMs };
}

export async function fetchBoundaryLeaders(): Promise<{ data: BoundaryLeader[]; latencyMs: number }> {
  await getDatabase();
  const res = executeSql(LEADERBOARD_QUERIES.boundary);
  const data: BoundaryLeader[] = res.values.map((row, idx) => ({
    rank: idx + 1,
    playerId: Number(row[0]),
    name: String(row[1]),
    country: String(row[2]),
    sixes: Number(row[3] || 0),
    fours: Number(row[4] || 0),
    runs: Number(row[5] || 0),
    boundaryRuns: Number(row[6] || 0),
    boundaryPercent: Number(row[7] || 0),
  }));
  return { data, latencyMs: res.executionTimeMs };
}

export async function fetchLeaderboardSummary(): Promise<LeaderboardSummaryStats> {
  await getDatabase();
  const t0 = performance.now();
  const res = executeSql(LEADERBOARD_QUERIES.summary);
  const row = res.values[0] || [0, 0, 0, 0, 0, 0];

  // Fetch highest scorer player name
  const topBatting = executeSql(`
    SELECT p.full_name, SUM(b.runs_scored) as total_runs
    FROM players p
    JOIN batting_scores b ON p.player_id = b.player_id
    GROUP BY p.player_id, p.full_name
    ORDER BY total_runs DESC
    LIMIT 1;
  `);

  // Fetch top wicket taker
  const topBowling = executeSql(`
    SELECT p.full_name, SUM(b.wickets_taken) as total_wickets
    FROM players p
    JOIN bowling_scores b ON p.player_id = b.player_id
    GROUP BY p.player_id, p.full_name
    ORDER BY total_wickets DESC
    LIMIT 1;
  `);

  const executionMs = Number((performance.now() - t0).toFixed(2));

  return {
    totalRuns: Number(row[0] || 0),
    totalWickets: Number(row[1] || 0),
    totalSixes: Number(row[2] || 0),
    totalFours: Number(row[3] || 0),
    totalPlayers: Number(row[4] || 0),
    highestScore: Number(row[5] || 0),
    highestScorerName: topBatting.values[0] ? String(topBatting.values[0][0]) : 'Virat Kohli',
    topWicketTakerName: topBowling.values[0] ? String(topBowling.values[0][0]) : 'Jasprit Bumrah',
    topWickets: topBowling.values[0] ? Number(topBowling.values[0][1]) : 17,
    queryExecutionMs: executionMs,
  };
}
