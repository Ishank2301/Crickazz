"""
🏏 Cricbuzz LiveStats: Real-Time Cricket Insights & SQL-Based Analytics
Multi-page Streamlit Application Entry Point
"""

import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
from utils.db_connection import get_connection, run_query, get_table_names
from utils.threejs_stadium import get_threejs_pitch_html

# Configure page settings
st.set_page_config(
    page_title="Cricbuzz LiveStats: Real-Time Cricket Insights & SQL-Based Analytics",
    page_icon="🏏",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling
st.markdown(
    """
    <style>
    .main-title {
        font-size: 2.4rem;
        font-weight: 800;
        color: #10B981;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.1rem;
        color: #94A3B8;
        margin-bottom: 1.5rem;
    }
    .card-box {
        padding: 1.25rem;
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
    }
    .metric-badge {
        background-color: #0F172A;
        border: 1px solid #10B981;
        color: #10B981;
        padding: 0.2rem 0.6rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Header Section
st.markdown('<div class="main-title">🏏 Cricbuzz LiveStats</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-title">Real-Time Cricket Insights & SQL-Based Analytics Dashboard</div>',
    unsafe_allow_html=True,
)

st.info(
    "💡 **Domain**: Sports Analytics | **Tech Stack**: Python • SQL • Streamlit • JSON • REST API • Pandas • SQLite"
)

# Quick Overview Columns
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(label="⚡ Live Matches Module", value="Active", delta="Cricbuzz API")
with col2:
    st.metric(label="📊 Player Stats Module", value="28+ Stars", delta="All Formats")
with col3:
    st.metric(label="🔍 SQL Analytics Module", value="25 Queries", delta="Beginner - Advanced")
with col4:
    st.metric(label="🛠️ CRUD Operations Module", value="Full Access", delta="SQLite / PostgreSQL")

st.markdown("---")

# Main Content Tabs
tab_overview, tab_3d, tab_architecture, tab_use_cases, tab_db_status = st.tabs(
    ["📌 Project Overview", "🎯 3D Hawkeye Stadium", "🏛️ Relational Database Schema", "💼 Business Use Cases", "🗄️ Database Live Status"]
)

with tab_overview:
    st.subheader("🎯 Problem Statement & Approach")
    st.write(
        """
        Build a comprehensive cricket analytics dashboard that integrates live data from the **Cricbuzz API** with a 
        **relational SQL database** to create an interactive web application delivering:
        - **⚡ Real-time match updates**: Live scorecards, ball-by-ball commentary, and match situations.
        - **📊 Detailed player statistics**: Career batting and bowling aggregates, strike rates, and head-to-head comparison.
        - **🔍 SQL-driven analytics**: 25 complete, structured SQL queries spanning Beginner, Intermediate, and Advanced analytical models.
        - **🛠️ Full CRUD operations**: Form-based UI to Create, Read, Update, and Delete player and match records.
        """
    )

    st.subheader("🚀 Multi-Page Application Guide")
    st.markdown(
        """
        Use the **Sidebar Navigation** on the left to explore all functional modules:
        1. **`1_⚡_Live_Matches.py`**: Real-time scorecards, Cricbuzz API configuration, live simulator, and win probabilities.
        2. **`2_📊_Top_Player_Stats.py`**: Career leaderboards (most runs, wickets, strike rate) and head-to-head player comparison.
        3. **`3_🔍_SQL_Analytics.py`**: The 25 SQL practice questions workbook with live query execution, result tables, and CSV export.
        4. **`4_🛠️_CRUD_Operations.py`**: Form-based data administration to insert, update, or remove records.
        5. **`5_🎯_3D_Hawkeye_Stadium.py`**: Interactive WebGL 3D pitch, ball trajectory physics, and Preset Camera Views.
        """
    )

with tab_3d:
    st.subheader("🎯 Interactive 3D Stadium & Hawkeye Physics Viewport")
    st.markdown(
        "Interactive WebGL physics viewport featuring **Preset Camera Views**: **Bird's Eye**, **Bowler's End**, and **Umpire View**."
    )
    components.html(get_threejs_pitch_html(), height=620, scrolling=False)

with tab_architecture:
    st.subheader("🏛️ Entity-Relationship Architecture (8 Normalized Tables)")
    st.code(
        """
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
        """,
        language="text",
    )
    st.markdown(
        """
        - **`players`**: Athlete biographical info, role, batting/bowling style.
        - **`matches`**: Fixture dates, venues, toss winner, toss decision, winning team, and victory margins.
        - **`venues`**: Stadium names, cities, host countries, and seating capacities.
        - **`series`**: International bilateral tours and premier leagues (IPL, World Cup, BGT).
        - **`batting_scores`**: Inning-by-inning runs, balls, boundaries (4s, 6s), strike rates, dismissals.
        - **`bowling_scores`**: Inning-by-inning overs, maidens, runs conceded, wickets, economy rates.
        - **`fielding_stats`**: Career catches and stumpings by format.
        - **`partnerships`**: Pair-wise batting partnership runs, balls faced, and wicket number.
        """
    )

with tab_use_cases:
    st.subheader("💼 Real-World Commercial & Educational Use Cases")
    uc1, uc2 = st.columns(2)

    with uc1:
        st.markdown(
            """
            **1. 📺 Sports Media & Broadcasting**
            - Real-time match commentary updates.
            - Statistical talking points for pre-match broadcasting desks.
            - Historical head-to-head records during live matches.

            **2. 🎮 Fantasy Cricket Platforms**
            - Player form tracking over the last 5-10 matches.
            - Venue-specific averages for captaincy selection.
            - Live scoring updates for fantasy tournaments.
            """
        )
    with uc2:
        st.markdown(
            """
            **3. 📈 Cricket Analytics Firms**
            - Comprehensive weighted performance index for player recruitment.
            - Bowler economy rate benchmarks in death overs.
            - Batting partnership chemistry evaluation.

            **4. 🎓 Educational Institutions**
            - Hands-on SQL practice with real-world sports data.
            - Learning JOINs, subqueries, CTEs, and Window Functions (`RANK`, `LAG`).
            - End-to-end Python REST API and data pipeline engineering.
            """
        )

with tab_db_status:
    st.subheader("🗄️ Database Connection & Live Tables")
    try:
        conn = get_connection()
        tables = get_table_names()
        st.success(f"✅ Connected to SQLite Database successfully. Found {len(tables)} tables.")

        table_summary = []
        for tbl in tables:
            count_df = run_query(f"SELECT COUNT(*) as count FROM {tbl};")
            count = count_df["count"].iloc[0] if not count_df.empty else 0
            table_summary.append({"Table Name": tbl, "Total Records": count})

        st.dataframe(pd.DataFrame(table_summary), use_container_width=True)
    except Exception as e:
        st.error(f"Database error: {e}")

st.markdown("---")
st.caption("Cricbuzz LiveStats • Created by Ishank2301")
st.caption("If you liked the project please star the repo.")
