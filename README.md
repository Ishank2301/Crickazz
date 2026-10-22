# 🏏 Cricbuzz LiveStats: Real-Time Cricket Insights & SQL-Based Analytics

A comprehensive sports analytics and database engineering dashboard integrating live Cricbuzz match data with a relational SQL database to create an interactive multi-page web application.

---

## 🎯 Problem Statement & Skills Takeaway

- **Domain**: Sports Analytics & Database Engineering
- **Core Skills**: Python • SQL • Streamlit • JSON • REST API • Pandas • Relational Database Management

The platform delivers:
- ⚡ **Real-time match updates**: Live scorecards, ball-by-ball commentary, and match situations.
- 📊 **Detailed player statistics**: Multi-format leaderboards and head-to-head player comparisons.
- 🔍 **SQL-driven analytics**: 25 complete, structured SQL queries spanning Beginner, Intermediate, and Advanced analytical models.
- 🛠️ **Full CRUD operations**: Form-based UI to Create, Read, Update, and Delete player and match records.

---

## 💼 Business Use Cases

1. **📺 Sports Media & Broadcasting**: Real-time match commentary updates, player performance analysis for pre-match discussions, and historical data trends for match predictions.
2. **🎮 Fantasy Cricket Platforms**: Player form analysis over recent matches, head-to-head statistics for team selection, and live score updates for fantasy leagues.
3. **📈 Cricket Analytics Firms**: Advanced statistical modeling, weighted multi-discipline MVP rankings, bowler economy rates in limited overs, and partnership success metrics.
4. **🎓 Educational Institutions**: Teaching relational database operations with real-world sports data, learning multi-table JOINs, subqueries, CTEs, and Window Functions (`RANK`, `LAG`).
5. **🎲 Sports Betting & Prediction**: Historical performance analysis for odds calculation, toss advantage win rate modeling, and player form/momentum tracking.

---

## 📂 Project Architecture & Directory Structure

```
Crickazz/
│
├── main.py                     # Streamlit multi-page home application entry point
├── requirements.txt            # Python dependencies (streamlit, pandas, requests, plotly)
│
├── database/
│   └── schema.sql              # Normalized DDL schema & sample records for 8 tables
│
├── pages/
│   ├── 1_⚡_Live_Matches.py      # Module 1: Live match updates via Cricbuzz REST API
│   ├── 2_📊_Top_Player_Stats.py  # Module 2: Player leaderboards & head-to-head tool
│   ├── 3_🔍_SQL_Analytics.py     # Module 3: 25 SQL practice questions with live runner
│   └── 4_🛠️_CRUD_Operations.py   # Module 4: Form-driven Create, Read, Update, Delete
│
└── utils/
    ├── db_connection.py        # Centralized SQLite/PostgreSQL connection handler
    ├── cricbuzz_api.py         # Cricbuzz REST API client using Python requests
    └── queries_catalog.py      # All 25 complete SQL practice questions catalog
```

---

## 🗄️ Relational Database Schema (8 Tables)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   venues    │ 1───* │   matches    │ *───1 │   series    │
│  venue_id   │       │   match_id   │       │  series_id  │
└─────────────┘       └──────┬───────┘       └─────────────┘
                             │ 1
                 ┌───────────┴───────────┐
                 │ *                     │ *
          ┌──────▼───────┐        ┌──────▼───────┐
          │batting_scores│        │bowling_scores│
          │  score_id    │        │  bowling_id  │
          └──────┬───────┘        └──────┬───────┘
                 │ *                     │ *
                 └───────────┬───────────┘
                             │ *
                      ┌──────▼───────┐
                      │   players    │
                      │  player_id   │
                      └──────────────┘
```

---

## 🧮 25 Complete SQL Practice Questions

### Beginner Level (Questions 1 - 8)
- **Q1**: Find all players who represent India with full name, role, and styles (`WHERE country = 'India'`).
- **Q2**: Show matches played in the last 30 days with venue location and teams (`INNER JOIN`, `DATE FILTER`).
- **Q3**: Top 10 highest run scorers in ODI cricket with runs, average, and centuries (`JOIN`, `SUM`, `LIMIT`).
- **Q4**: Display cricket venues with seating capacity > 50,000 ordered by capacity (`WHERE capacity > 50000`).
- **Q5**: Calculate how many matches each team has won (`GROUP BY winning_team`, `COUNT`).
- **Q6**: Count players belonging to each playing role (`GROUP BY playing_role`).
- **Q7**: Highest individual batting score achieved in each cricket format (`MAX(runs_scored)`, `GROUP BY format`).
- **Q8**: Show all cricket series that started in the year 2024 (`WHERE start_date LIKE '2024%'`).

### Intermediate Level (Questions 9 - 16)
- **Q9**: All-rounders with > 1000 runs AND > 50 wickets across their career (`CROSS AGGREGATION`, `HAVING`).
- **Q10**: Details of the last 20 completed matches with victory margins (`ORDER BY match_date DESC LIMIT 20`).
- **Q11**: Compare player performance across different formats for players in ≥ 2 formats (`CASE PIVOT`).
- **Q12**: Analyze international team performance when playing at home versus away (`CASE WHEN v.country = m.winning_team`).
- **Q13**: Century batting partnerships where consecutive batsmen scored 100+ combined runs (`SELF-JOIN`).
- **Q14**: Bowling performance at different venues for bowlers with ≥ 3 matches at same venue (`MULTI-KEY GROUP BY`).
- **Q15**: Clutch performers in close matches decided by < 50 runs or < 5 wickets (`CONDITIONAL FILTER`).
- **Q16**: Annual batting evolution since 2020 showing average runs per match and strike rate (`SUBSTR(match_date, 1, 4)`).

### Advanced Level (Questions 17 - 25)
- **Q17**: Toss decision win advantage percentage by choosing to bat first vs. bowl first (`RATIO CALCULATION`).
- **Q18**: Economical bowlers in limited-overs cricket with true career economy rate (`LIMITED OVERS FILTER`).
- **Q19**: Batting scoring consistency and standard deviation variance modeling (`CTE`, `SQRT VARIANCE`).
- **Q20**: Match count and batting average breakdown across Test, ODI, and T20 (`CROSS-TABULATION`).
- **Q21**: Comprehensive weighted performance index combining batting, bowling, and fielding points (`RANK() OVER`).
- **Q22**: Head-to-head match prediction model between team pairs with victory margins and win rates (`SYMMETRIC PAIRING`).
- **Q23**: Player form and momentum classifier categorizing into Excellent, Good, Average, or Poor form (`ROW_NUMBER() OVER`).
- **Q24**: Batting partnership combinations, average partnership runs, and 50+ conversion rates (`PAIR CHEMISTRY`).
- **Q25**: Time-series analysis of player performance evolution tracking quarterly trajectory (`LAG() OVER`).

---

## 🚀 How to Run

### Python / Streamlit Execution (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/Ishank2301/Crickazz.git
cd Crickazz

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch Streamlit Application
streamlit run main.py
```

The application will open automatically in your browser at `http://localhost:8501`.

### Web / Node.js Deployment (Alternative)

```bash
npm install
npm run dev
```
Runs at `http://localhost:3000`.