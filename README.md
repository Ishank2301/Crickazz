# 🏏 Cricbuzz LiveStats: Real-Time Cricket Insights & SQL-Based Analytics

A comprehensive sports analytics dashboard and relational database workbench integrating live Cricbuzz match data, interactive player statistics, an in-browser SQLite database engine, 25 structured SQL practice queries, and complete CRUD data operations.

---

## 🚀 Key Modules & Deliverables

### 1. ⚡ Live Match Center
- Real-time match tracking with Cricbuzz REST API connector (RapidAPI configurable + local cached fallback).
- Interactive ball-by-ball simulator engine with speed controls (1x, 2x, 4x), sound synthesis for boundaries and wickets, and dynamic win probability calculations.
- Comprehensive scorecards covering Batsmen, Bowlers, Fall of Wickets, Extras, and Run Rate analytics.

### 2. 📊 Top Player Statistics
- Multi-format leaderboards for top run-scorers, wicket-takers, and power hitters (strike rate).
- Searchable player directory with role, style, and nationality filters.
- Head-to-head comparison tool comparing career milestones between any two players.

### 3. 🔍 SQL Queries & Analytics (25 Complete Practice Questions)
Interactive in-browser SQLite engine (WebAssembly) pre-seeded with normalized tables (`players`, `matches`, `venues`, `series`, `batting_scores`, `bowling_scores`, `partnerships`, `fielding_stats`).

- **Beginner Level (Q1 – Q8)**: Basic `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, and single-table `GROUP BY`.
- **Intermediate Level (Q9 – Q16)**: Multi-table `JOIN`s, conditional aggregation (`SUM(CASE ...)`), venue performance tracking, clutch player metrics, and partnership combinations.
- **Advanced Level (Q17 – Q25)**: Strategic toss win advantage, limited-overs bowling economy benchmarks, statistical variance / standard deviation modeling, weighted multi-discipline MVP rankings, player momentum classifiers, and quarterly time-series career trajectory (`LAG()` window function).
- Built-in SQL scratchpad with CSV dataset export.

### 4. 🛠️ CRUD Administrative Console
- Form-driven UI for data manipulation without raw SQL requirements.
- Add, update, and delete player profiles and completed match fixtures with real-time relational table updates.

### 5. 🏠 Home Page & Architecture
- Domain use cases spanning Sports Media & Broadcasting, Fantasy Cricket Platforms, Cricket Analytics Firms, Education, and Match Predictions.
- Relational schema and Entity-Relationship architecture documentation.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: SQLite (WebAssembly via `sql.js`)
- **API**: RapidAPI Cricbuzz REST API Client
- **Icons & Audio**: Lucide React, Web Audio API Sound Synthesizer

---

## 💻 Local Development Setup

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build production bundle
npm run build
```