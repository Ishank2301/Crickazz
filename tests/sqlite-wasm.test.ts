import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

export async function runSqliteWasmTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Verify WASM files exist in public and have valid magic numbers
  {
    const start = performance.now();
    try {
      const publicWasm = path.resolve('public/sql-wasm.wasm');
      const browserWasm = path.resolve('public/sql-wasm-browser.wasm');

      if (!fs.existsSync(publicWasm)) {
        throw new Error('public/sql-wasm.wasm is missing');
      }
      if (!fs.existsSync(browserWasm)) {
        throw new Error('public/sql-wasm-browser.wasm is missing');
      }

      // Check magic numbers: 0x00 0x61 0x73 0x6d ('\0asm')
      const pBuf = fs.readFileSync(publicWasm);
      if (pBuf[0] !== 0x00 || pBuf[1] !== 0x61 || pBuf[2] !== 0x73 || pBuf[3] !== 0x6d) {
        throw new Error('public/sql-wasm.wasm magic header mismatch (not valid wasm)');
      }

      const bBuf = fs.readFileSync(browserWasm);
      if (bBuf[0] !== 0x00 || bBuf[1] !== 0x61 || bBuf[2] !== 0x73 || bBuf[3] !== 0x6d) {
        throw new Error('public/sql-wasm-browser.wasm magic header mismatch (not valid wasm)');
      }

      results.push({
        name: 'SQLite WASM Files & Magic Number Validation',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          publicWasmSize: `${(pBuf.length / 1024).toFixed(1)} KB`,
          browserWasmSize: `${(bBuf.length / 1024).toFixed(1)} KB`,
          magicHeader: '0x0061736d (VALID)',
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite WASM Files & Magic Number Validation',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 2: In-Memory SQLite Initialization & Schema Seeding
  {
    const start = performance.now();
    try {
      const wasmPath = path.resolve('public/sql-wasm.wasm');
      const wasmBinary = fs.readFileSync(wasmPath);
      const SQL = await initSqlJs({ wasmBinary });
      const db = new SQL.Database();

      // Create schema
      db.run(`
        CREATE TABLE players (
          player_id INTEGER PRIMARY KEY,
          full_name TEXT,
          country TEXT
        );
        INSERT INTO players (player_id, full_name, country) VALUES (1, 'Virat Kohli', 'India');
        INSERT INTO players (player_id, full_name, country) VALUES (2, 'Rohit Sharma', 'India');
      `);

      const queryRes = db.exec('SELECT * FROM players ORDER BY player_id;');
      if (!queryRes || queryRes.length === 0 || queryRes[0].values.length !== 2) {
        throw new Error('Failed to retrieve seeded player records');
      }

      db.close();

      results.push({
        name: 'SQLite Engine Instantiation & In-Memory Execution',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          recordsRetrieved: queryRes[0].values.length,
          columns: queryRes[0].columns,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'SQLite Engine Instantiation & In-Memory Execution',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 3: Complex Multi-Table Join & Analytical Aggregation
  {
    const start = performance.now();
    try {
      const wasmPath = path.resolve('public/sql-wasm.wasm');
      const wasmBinary = fs.readFileSync(wasmPath);
      const SQL = await initSqlJs({ wasmBinary });
      const db = new SQL.Database();

      db.run(`
        CREATE TABLE matches (match_id INT, team1 TEXT, team2 TEXT, winning_team TEXT);
        CREATE TABLE batting (match_id INT, player_name TEXT, runs INT);
        INSERT INTO matches VALUES (1, 'IND', 'AUS', 'IND'), (2, 'IND', 'PAK', 'IND');
        INSERT INTO batting VALUES (1, 'Kohli', 82), (1, 'Rohit', 45), (2, 'Kohli', 76);
      `);

      const aggRes = db.exec(`
        SELECT b.player_name, COUNT(b.match_id) as matches, SUM(b.runs) as total_runs, AVG(b.runs) as avg_runs
        FROM batting b
        JOIN matches m ON b.match_id = m.match_id
        GROUP BY b.player_name
        ORDER BY total_runs DESC;
      `);

      if (!aggRes || aggRes[0].values[0][0] !== 'Kohli' || aggRes[0].values[0][2] !== 158) {
        throw new Error('Aggregation result mismatch in analytical join query');
      }

      db.close();

      results.push({
        name: 'Analytical Aggregation & Multi-Table Join Engine Check',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          topScorer: aggRes[0].values[0][0],
          runs: aggRes[0].values[0][2],
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Analytical Aggregation & Multi-Table Join Engine Check',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
