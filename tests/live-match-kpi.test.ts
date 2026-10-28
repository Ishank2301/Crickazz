import { 
  oversToBalls, 
  ballsToOvers, 
  calculateCurrentRunRate, 
  calculateRequiredRunRate, 
  computeCurrentPartnership, 
  computeProjectedScores, 
  computeCustomProjection, 
  getLiveMatchKpiSummary, 
  getMatchPhase 
} from '../src/utils/cricketKpi';
import { INITIAL_MATCHES } from '../src/data/mockCricketData';

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

export async function runLiveMatchKpiTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Overs and Balls Conversion Precision
  {
    const start = performance.now();
    try {
      const b1 = oversToBalls(16.5);
      if (b1 !== 101) throw new Error(`Expected 16.5 overs = 101 balls, got ${b1}`);

      const b2 = oversToBalls(20.0);
      if (b2 !== 120) throw new Error(`Expected 20.0 overs = 120 balls, got ${b2}`);

      const b0 = oversToBalls(0.0);
      if (b0 !== 0) throw new Error(`Expected 0.0 overs = 0 balls, got ${b0}`);

      const o1 = ballsToOvers(101);
      if (o1 !== 16.5) throw new Error(`Expected 101 balls = 16.5 overs, got ${o1}`);

      results.push({
        name: 'Cricket Ball & Over Bidirectional Conversion Precision',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: { b1, b2, o1 },
      });
    } catch (e: any) {
      results.push({
        name: 'Cricket Ball & Over Bidirectional Conversion Precision',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 2: Current Run Rate (CRR) & Zero-Division Safeguards
  {
    const start = performance.now();
    try {
      const crrNormal = calculateCurrentRunRate(172, 16.5);
      if (Math.abs(crrNormal - 10.22) > 0.02) {
        throw new Error(`Expected CRR ~10.22, got ${crrNormal}`);
      }

      const crrZeroOvers = calculateCurrentRunRate(0, 0);
      if (crrZeroOvers !== 0 || isNaN(crrZeroOvers) || !isFinite(crrZeroOvers)) {
        throw new Error(`Zero-division guard failed: got ${crrZeroOvers}`);
      }

      results.push({
        name: 'Current Run Rate (CRR) Mathematical Precision & Zero-Division Guard',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: { crrNormal, crrZeroOvers },
      });
    } catch (e: any) {
      results.push({
        name: 'Current Run Rate (CRR) Mathematical Precision & Zero-Division Guard',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 3: Required Run Rate (RRR) & Chase Math
  {
    const start = performance.now();
    try {
      const rrrNormal = calculateRequiredRunRate(34, 19);
      if (Math.abs(rrrNormal - 10.74) > 0.02) {
        throw new Error(`Expected RRR ~10.74, got ${rrrNormal}`);
      }

      const rrrCompleted = calculateRequiredRunRate(0, 15);
      if (rrrCompleted !== 0.0) {
        throw new Error(`Expected 0.0 when target reached, got ${rrrCompleted}`);
      }

      const rrrZeroBalls = calculateRequiredRunRate(10, 0);
      if (rrrZeroBalls !== 99.9) {
        throw new Error(`Expected 99.9 when out of balls, got ${rrrZeroBalls}`);
      }

      results.push({
        name: 'Required Run Rate (RRR) Target Chase Pacing & Out-of-Balls Bounds',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: { rrrNormal, rrrCompleted, rrrZeroBalls },
      });
    } catch (e: any) {
      results.push({
        name: 'Required Run Rate (RRR) Target Chase Pacing & Out-of-Balls Bounds',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 4: Current Partnership Computation & Batsmen Split
  {
    const start = performance.now();
    try {
      const match = INITIAL_MATCHES[0];
      const inning = match.innings[1]; // India 2nd inning
      const p = computeCurrentPartnership(inning, 50);

      if (p.totalRuns !== 17) {
        throw new Error(`Expected 17 partnership runs (172 - 155), got ${p.totalRuns}`);
      }
      if (p.wicketNumber !== 5) {
        throw new Error(`Expected 5th wicket partnership, got ${p.wicketNumber}`);
      }
      if (p.batsman1.runs + p.batsman2.runs !== p.totalRuns) {
        throw new Error(`Batsmen runs sum (${p.batsman1.runs} + ${p.batsman2.runs}) does not match total ${p.totalRuns}`);
      }
      if (p.batsman1.percentage + p.batsman2.percentage !== 100) {
        throw new Error(`Percentage split does not equal 100%: ${p.batsman1.percentage}% + ${p.batsman2.percentage}%`);
      }

      results.push({
        name: 'Active Crease Partnership Decomposition & Milestone Trajectory',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          wicket: p.wicketNumber,
          totalRuns: p.totalRuns,
          b1: `${p.batsman1.name} (${p.batsman1.runs})`,
          b2: `${p.batsman2.name} (${p.batsman2.runs})`,
          progress: `${p.milestoneProgressPercent}%`,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Active Crease Partnership Decomposition & Milestone Trajectory',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 5: Multi-Horizon Projected Scores Spectrum
  {
    const start = performance.now();
    try {
      const horizons = computeProjectedScores(172, 16.5, 20, 10.22);
      if (horizons.length !== 4) {
        throw new Error(`Expected 4 projection horizons, got ${horizons.length}`);
      }

      // Check strictly ascending or ordered projections
      const death = horizons.find((h) => h.label === 'Death Overs Blast')!.projectedTotal;
      const current = horizons.find((h) => h.label === 'Current Run Rate')!.projectedTotal;
      const anchor = horizons.find((h) => h.label === 'Anchor Pace')!.projectedTotal;

      if (death <= current || current <= anchor) {
        throw new Error(`Pacing horizons ordering invalid: Anchor (${anchor}), Current (${current}), Death (${death})`);
      }

      results.push({
        name: 'Multi-Horizon Projected Score Engine (Anchor, Current, Par, Death Overs)',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: { anchor, current, death },
      });
    } catch (e: any) {
      results.push({
        name: 'Multi-Horizon Projected Score Engine (Anchor, Current, Par, Death Overs)',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 6: Custom Scenario Modeler (Custom RPO Slider)
  {
    const start = performance.now();
    try {
      // Simulate at 14.0 RPO in the remaining 19 balls (3.167 overs)
      // Remaining runs = 14 * 3.167 = 44.3 runs -> Final total = 172 + 44 = 216
      const sim = computeCustomProjection(172, 16.5, 20, 14.0, 206);
      if (sim.customTotal < 210 || sim.customTotal > 220) {
        throw new Error(`Unexpected custom simulated score: ${sim.customTotal}`);
      }
      if (sim.willWin !== true) {
        throw new Error(`Expected win outcome at 14.0 RPO, got ${sim.willWin}`);
      }
      if (sim.differenceFromTarget !== sim.customTotal - 206) {
        throw new Error('Difference from target mismatch');
      }

      results.push({
        name: 'Interactive Scenario Modeler & Custom Pacing Simulation',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          simulatedRpo: 14.0,
          simulatedTotal: sim.customTotal,
          targetDiff: sim.differenceFromTarget,
          chaseSuccess: sim.willWin,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Interactive Scenario Modeler & Custom Pacing Simulation',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 7: Match Phase Indicator & Telemetry Aggregation
  {
    const start = performance.now();
    try {
      const p1 = getMatchPhase(4.2, 20);
      if (!p1.phase.includes('Powerplay')) throw new Error(`Expected Powerplay, got ${p1.phase}`);

      const p2 = getMatchPhase(11.0, 20);
      if (!p2.phase.includes('Middle Overs')) throw new Error(`Expected Middle Overs, got ${p2.phase}`);

      const p3 = getMatchPhase(17.1, 20);
      if (!p3.phase.includes('Death Overs')) throw new Error(`Expected Death Overs, got ${p3.phase}`);

      const match = INITIAL_MATCHES[0];
      const summary = getLiveMatchKpiSummary(match, { customRpo: 12.0, customMilestoneTarget: 50 });
      if (!summary.battingTeamName || !summary.bowlingTeamName) {
        throw new Error('Team names missing in summary');
      }

      results.push({
        name: 'Match Phase Detection & End-to-End Live KPI Summary Contract',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          phase4: p1.phase,
          phase11: p2.phase,
          phase17: p3.phase,
          battingTeam: summary.battingTeamName,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Match Phase Detection & End-to-End Live KPI Summary Contract',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
