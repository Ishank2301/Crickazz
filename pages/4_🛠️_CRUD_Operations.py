"""
Page 4: 🛠️ CRUD Operations Page
Full Create, Read, Update, Delete interface for data management using form-based Streamlit UI.
"""

import streamlit as st
import pandas as pd
from utils.db_connection import run_query, execute_dml

st.set_page_config(page_title="CRUD Operations - Cricbuzz LiveStats", page_icon="🛠️", layout="wide")

st.title("🛠️ Database CRUD Management")
st.markdown("Perform administrative Create, Read, Update, and Delete operations on cricket records.")

crud_tab_player, crud_tab_match = st.tabs(["👤 Manage Players (CRUD)", "🏏 Manage Matches (CRUD)"])

with crud_tab_player:
    st.subheader("1. ➕ Create New Player")
    with st.form("add_player_form", clear_on_submit=True):
        c1, c2 = st.columns(2)
        with c1:
            name = st.text_input("Full Name *", placeholder="e.g. Jasprit Bumrah")
            country = st.selectbox("Country", ["India", "Australia", "England", "South Africa", "Pakistan", "New Zealand", "Afghanistan", "West Indies", "Sri Lanka"])
            role = st.selectbox("Playing Role", ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"])
        with c2:
            bat_style = st.selectbox("Batting Style", ["Right-hand bat", "Left-hand bat"])
            bowl_style = st.text_input("Bowling Style", value="Right-arm fast")
            dob = st.date_input("Date of Birth")

        submitted = st.form_submit_button("💾 Save Player")
        if submitted:
            if not name.strip():
                st.error("Player name is mandatory.")
            else:
                try:
                    insert_sql = """
                    INSERT INTO players (full_name, country, playing_role, batting_style, bowling_style, date_of_birth)
                    VALUES (?, ?, ?, ?, ?, ?);
                    """
                    execute_dml(insert_sql, (name.strip(), country, role, bat_style, bowl_style, str(dob)))
                    st.success(f"✅ Successfully registered player: **{name}**")
                except Exception as err:
                    st.error(f"Failed to create player: {err}")

    st.markdown("---")

    st.subheader("2. 📖 Read & Search Players")
    search_query = st.text_input("Filter players by name or country", "")
    if search_query.strip():
        players_df = run_query(
            "SELECT * FROM players WHERE full_name LIKE ? OR country LIKE ? ORDER BY player_id DESC;",
            params=(f"%{search_query}%", f"%{search_query}%"),
        )
    else:
        players_df = run_query("SELECT * FROM players ORDER BY player_id DESC;")

    st.dataframe(players_df, use_container_width=True, hide_index=True)

    st.markdown("---")

    st.subheader("3. ✏️ Update Player Information")
    if not players_df.empty:
        player_options = {f"{row['player_id']} - {row['full_name']} ({row['country']})": row['player_id'] for _, row in players_df.iterrows()}
        selected_player_str = st.selectbox("Select Player to Update", list(player_options.keys()))
        selected_id = player_options[selected_player_str]

        current_row = players_df[players_df["player_id"] == selected_id].iloc[0]

        with st.form("update_player_form"):
            u_name = st.text_input("Full Name", value=current_row["full_name"])
            u_country = st.text_input("Country", value=current_row["country"])
            u_role = st.selectbox(
                "Playing Role",
                ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"],
                index=["Batsman", "Bowler", "All-rounder", "Wicket-keeper"].index(current_row["playing_role"]) if current_row["playing_role"] in ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"] else 0,
            )
            u_bat = st.selectbox(
                "Batting Style",
                ["Right-hand bat", "Left-hand bat"],
                index=0 if current_row["batting_style"] == "Right-hand bat" else 1,
            )
            u_bowl = st.text_input("Bowling Style", value=current_row["bowling_style"])

            btn_update = st.form_submit_button("🔄 Update Record")
            if btn_update:
                try:
                    update_sql = """
                    UPDATE players
                    SET full_name = ?, country = ?, playing_role = ?, batting_style = ?, bowling_style = ?
                    WHERE player_id = ?;
                    """
                    execute_dml(update_sql, (u_name, u_country, u_role, u_bat, u_bowl, selected_id))
                    st.success(f"✅ Record updated for {u_name}")
                except Exception as e:
                    st.error(f"Update failed: {e}")

    st.markdown("---")

    st.subheader("4. 🗑️ Delete Player Record")
    if not players_df.empty:
        del_player_str = st.selectbox("Select Player to Remove", list(player_options.keys()), key="del_select")
        del_id = player_options[del_player_str]

        if st.button("⚠️ Confirm Delete Player", type="primary"):
            try:
                execute_dml("DELETE FROM batting_scores WHERE player_id = ?;", (del_id,))
                execute_dml("DELETE FROM bowling_scores WHERE player_id = ?;", (del_id,))
                execute_dml("DELETE FROM players WHERE player_id = ?;", (del_id,))
                st.success(f"✅ Successfully deleted player ID: {del_id}")
            except Exception as e:
                st.error(f"Delete failed: {e}")

with crud_tab_match:
    st.subheader("🏏 Match Records CRUD")
    with st.form("add_match_form"):
        m_desc = st.text_input("Match Description", placeholder="e.g. India vs England, 1st ODI")
        m_format = st.selectbox("Format", ["T20I", "ODI", "Test", "T20"])
        m_date = st.date_input("Match Date")
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            t1 = st.text_input("Team 1", value="India")
            t2 = st.text_input("Team 2", value="England")
        with col_m2:
            winner = st.text_input("Winning Team", value="India")
            margin = st.number_input("Margin", min_value=1, value=25)
            v_type = st.selectbox("Victory Type", ["runs", "wickets"])

        if st.form_submit_button("💾 Insert Match"):
            if not m_desc:
                st.error("Match description is required.")
            else:
                m_sql = """
                INSERT INTO matches (series_id, match_description, format, match_date, venue_id, team1, team2, toss_winner, toss_decision, winning_team, victory_margin, victory_type)
                VALUES (1, ?, ?, ?, 1, ?, ?, ?, 'bat', ?, ?, ?);
                """
                execute_dml(m_sql, (m_desc, m_format, str(m_date), t1, t2, t1, winner, margin, v_type))
                st.success("✅ Match successfully created.")

    st.markdown("##### Existing Match Records")
    matches_df = run_query("SELECT match_id, match_description, format, match_date, team1, team2, winning_team, victory_margin, victory_type FROM matches ORDER BY match_id DESC;")
    st.dataframe(matches_df, use_container_width=True, hide_index=True)
