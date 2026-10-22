"""
Page 2: 📊 Top Player Stats Page
Visualizes top batting, bowling, and all-round metrics with head-to-head comparison.
"""

import streamlit as st
import pandas as pd
from utils.db_connection import run_query

st.set_page_config(page_title="Top Player Stats - Cricbuzz LiveStats", page_icon="📊", layout="wide")

st.title("📊 Top Player Statistics & Leaderboards")
st.markdown("Explore batting records, wicket-taking masters, and cross-format player comparisons.")

# Metric Leaderboard Cards
col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("🏆 Leading Run Scorers")
    sql_runs = """
    SELECT p.full_name AS Player, p.country AS Country, SUM(bs.runs_scored) AS Runs,
           ROUND(CAST(SUM(bs.runs_scored) AS FLOAT) / MAX(1, SUM(bs.is_out)), 2) AS Average
    FROM batting_scores bs
    JOIN players p ON bs.player_id = p.player_id
    GROUP BY p.player_id, p.full_name, p.country
    ORDER BY Runs DESC
    LIMIT 5;
    """
    df_runs = run_query(sql_runs)
    st.dataframe(df_runs, use_container_width=True, hide_index=True)

with col2:
    st.subheader("🎯 Top Wicket Takers")
    sql_wkts = """
    SELECT p.full_name AS Bowler, p.country AS Country, SUM(bw.wickets_taken) AS Wickets,
           ROUND(AVG(bw.economy_rate), 2) AS Economy
    FROM bowling_scores bw
    JOIN players p ON bw.player_id = p.player_id
    GROUP BY p.player_id, p.full_name, p.country
    ORDER BY Wickets DESC
    LIMIT 5;
    """
    df_wkts = run_query(sql_wkts)
    st.dataframe(df_wkts, use_container_width=True, hide_index=True)

with col3:
    st.subheader("⚡ Highest Strike Rates")
    sql_sr = """
    SELECT p.full_name AS Batter, p.country AS Country,
           ROUND(AVG(bs.strike_rate), 1) AS StrikeRate, SUM(bs.runs_scored) AS Runs
    FROM batting_scores bs
    JOIN players p ON bs.player_id = p.player_id
    GROUP BY p.player_id, p.full_name, p.country
    HAVING SUM(bs.runs_scored) >= 50
    ORDER BY StrikeRate DESC
    LIMIT 5;
    """
    df_sr = run_query(sql_sr)
    st.dataframe(df_sr, use_container_width=True, hide_index=True)

st.markdown("---")

# Head-to-Head Comparison Tool
st.subheader("⚔️ Head-to-Head Player Comparison")

players_df = run_query("SELECT player_id, full_name, country, playing_role FROM players ORDER BY full_name ASC;")
player_names = players_df["full_name"].tolist()

c1, c2 = st.columns(2)
with c1:
    p1_name = st.selectbox("Select Player 1", options=player_names, index=player_names.index("Virat Kohli") if "Virat Kohli" in player_names else 0)
with c2:
    p2_name = st.selectbox("Select Player 2", options=player_names, index=player_names.index("Travis Head") if "Travis Head" in player_names else min(1, len(player_names)-1))

if p1_name and p2_name:
    comp_sql = """
    SELECT 
        p.full_name,
        p.country,
        p.playing_role,
        COALESCE(SUM(bs.runs_scored), 0) AS total_runs,
        ROUND(CAST(COALESCE(SUM(bs.runs_scored), 0) AS FLOAT) / MAX(1, COALESCE(SUM(bs.is_out), 0)), 2) AS batting_avg,
        ROUND(COALESCE(AVG(bs.strike_rate), 0), 1) AS avg_strike_rate,
        COUNT(CASE WHEN bs.runs_scored >= 100 THEN 1 END) AS centuries,
        COUNT(CASE WHEN bs.runs_scored >= 50 AND bs.runs_scored < 100 THEN 1 END) AS fifties,
        COALESCE(SUM(bw.wickets_taken), 0) AS total_wickets
    FROM players p
    LEFT JOIN batting_scores bs ON p.player_id = bs.player_id
    LEFT JOIN bowling_scores bw ON p.player_id = bw.player_id
    WHERE p.full_name IN (?, ?)
    GROUP BY p.player_id, p.full_name, p.country, p.playing_role;
    """
    comp_df = run_query(comp_sql, params=(p1_name, p2_name))

    st.markdown("##### 📈 Career Metrics Comparison")
    st.dataframe(comp_df, use_container_width=True, hide_index=True)

st.markdown("---")

# Full Filterable Player Roster
st.subheader("🔍 Complete Player Directory")
country_filter = st.selectbox("Filter by Country", options=["All"] + sorted(players_df["country"].unique().tolist()))

if country_filter == "All":
    roster_df = run_query("SELECT player_id, full_name, country, playing_role, batting_style, bowling_style, date_of_birth FROM players ORDER BY country, full_name;")
else:
    roster_df = run_query("SELECT player_id, full_name, country, playing_role, batting_style, bowling_style, date_of_birth FROM players WHERE country = ? ORDER BY full_name;", params=(country_filter,))

st.dataframe(roster_df, use_container_width=True, hide_index=True)
st.caption(f"Showing {len(roster_df)} player records from database.")
