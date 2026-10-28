import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { 
  LEADERBOARD_QUERIES, 
  BattingLeader, 
  BowlingLeader, 
  StrikeRateLeader, 
  AllRounderLeader, 
  BoundaryLeader,
  LeaderboardSummaryStats 
} from '../src/services/leaderboardService';

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

export async function runLeaderboardTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Setup standalone in-memory DB using wasm binary from public directory
  const wasmPath = path.resolve('public/sql-wasm.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({
    wasmBinary: wasmBuffer,
  });
  const db = new SQL.Database();

  // Load and execute schema from database/schema.sql
  const schemaPath = path.resolve('database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.run(schemaSql);

  // Test 1: Batting Leaders Query Verification
  {
    const start = performance.now();
    try {
      const execRes = db.exec(LEADERBOARD_QUERIES.batting);
      if (!execRes || execRes.length === 0) {
        throw new Error('Batting leaderboard query returned no result set');
      }
      const values = execRes[0].values;
      if (values.length < 5) {
        throw new Error(`Expected at least 5 batting leader records, got ${values.length}`);
      }

      // Check sorting: each row should have runs <= previous row
      let prevRuns = Infinity;
      for (const row of values) {
        const runs = Number(row[6]);
        if (runs > prevRuns) {
          throw new Error(`Batting leaders not sorted descending: ${runs} > ${prevRuns}`);
        }
        prevRuns = runs;
      }

      const topScorer = String(values[0][1]);
      const topRuns = Number(values[0][6]);
      const topAvg = Number(values[0][8]);
      const topSR = Number(values[0][9]);

      if (topRuns <= 0 || topAvg <= 0 || topSR <= 0) {
        throw new Error('Invalid batting statistics calculated (non-positive values)');
      }

      results.push({
        name: 'SQLite Batting Aggregates (Orange Cap) Sorting & Integrity',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          recordCount: values.length,
          leader: topScorer,
          topRuns,
          average: topAvg,
          strikeRate: topSR,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite Batting Aggregates (Orange Cap) Sorting & Integrity',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 2: Bowling Leaders Query Verification
  {
    const start = performance.now();
    try {
      const execRes = db.exec(LEADERBOARD_QUERIES.bowling);
      if (!execRes || execRes.length === 0) {
        throw new Error('Bowling leaderboard query returned no result set');
      }
      const values = execRes[0].values;
      if (values.length < 5) {
        throw new Error(`Expected at least 5 bowling records, got ${values.length}`);
      }

      // Check sorting by wickets
      let prevWickets = Infinity;
      for (const row of values) {
        const wickets = Number(row[9]);
        if (wickets > prevWickets) {
          throw new Error(`Bowling leaders not sorted descending: ${wickets} > ${prevWickets}`);
        }
        prevWickets = wickets;
      }

      const leader = String(values[0][1]);
      const wickets = Number(values[0][9]);
      const economy = Number(values[0][11]);

      results.push({
        name: 'SQLite Bowling Aggregates (Purple Cap) Multi-Table Join & Economy Rates',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          recordCount: values.length,
          leader,
          wickets,
          economy,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite Bowling Aggregates (Purple Cap) Multi-Table Join & Economy Rates',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 3: Strike Rate Kings (HAVING clause qualification)
  {
    const start = performance.now();
    try {
      const execRes = db.exec(LEADERBOARD_QUERIES.strikeRate);
      if (!execRes || execRes.length === 0) {
        throw new Error('Strike rate query returned no result set');
      }
      const values = execRes[0].values;
      for (const row of values) {
        const balls = Number(row[5]);
        if (balls < 20) {
          throw new Error(`HAVING filter failure: player faced ${balls} balls (< 20 minimum)`);
        }
      }

      const topSRPlayer = String(values[0][1]);
      const topSR = Number(values[0][8]);

      results.push({
        name: 'SQLite Strike Rate Kings (HAVING balls_faced >= 20 Clause)',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          qualifiedPlayers: values.length,
          topPlayer: topSRPlayer,
          highestStrikeRate: topSR,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite Strike Rate Kings (HAVING balls_faced >= 20 Clause)',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 4: All-Round MVP Impact Points Calculation
  {
    const start = performance.now();
    try {
      const execRes = db.exec(LEADERBOARD_QUERIES.allRounder);
      if (!execRes || execRes.length === 0) {
        throw new Error('All-Rounder query returned no result set');
      }
      const values = execRes[0].values;
      // Formula: (runs + wickets * 25)
      for (const row of values) {
        const runs = Number(row[4]);
        const wickets = Number(row[6]);
        const impact = Number(row[8]);
        const expectedImpact = runs + wickets * 25;
        if (Math.abs(impact - expectedImpact) > 0.01) {
          throw new Error(`Impact score calculation mismatch: got ${impact}, expected ${expectedImpact}`);
        }
      }

      results.push({
        name: 'SQLite MVP All-Rounder Composite Impact Metric (Runs + Wickets * 25)',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          allRoundersRanked: values.length,
          topMvp: String(values[0][1]),
          topImpactScore: Number(values[0][8]),
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite MVP All-Rounder Composite Impact Metric (Runs + Wickets * 25)',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 5: Boundary Kings (6s & 4s) Aggregation
  {
    const start = performance.now();
    try {
      const execRes = db.exec(LEADERBOARD_QUERIES.boundary);
      if (!execRes || execRes.length === 0) {
        throw new Error('Boundary query returned no result set');
      }
      const values = execRes[0].values;
      const topSixHitter = String(values[0][1]);
      const topSixes = Number(values[0][3]);

      results.push({
        name: 'SQLite Boundary Fireworks & Maximum Sixes Aggregation',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          topBoundaryHitter: topSixHitter,
          maxSixes: topSixes,
          totalRanked: values.length,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite Boundary Fireworks & Maximum Sixes Aggregation',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 6: Tournament Summary Aggregates
  {
    const start = performance.now();
    try {
      const execRes = db.exec(LEADERBOARD_QUERIES.summary);
      if (!execRes || execRes.length === 0) {
        throw new Error('Summary query returned no result set');
      }
      const row = execRes[0].values[0];
      const totalRuns = Number(row[0]);
      const totalWickets = Number(row[1]);
      const totalSixes = Number(row[2]);
      const totalFours = Number(row[3]);
      const totalPlayers = Number(row[4]);

      if (totalRuns <= 500 || totalWickets <= 10 || totalPlayers < 20) {
        throw new Error(`Tournament aggregate counts unexpectedly low: runs=${totalRuns}, wickets=${totalWickets}, players=${totalPlayers}`);
      }

      results.push({
        name: 'SQLite Tournament Summary Scalar Metrics (Subqueries & Rollups)',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          totalRuns,
          totalWickets,
          totalSixes,
          totalFours,
          totalPlayers,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite Tournament Summary Scalar Metrics (Subqueries & Rollups)',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
