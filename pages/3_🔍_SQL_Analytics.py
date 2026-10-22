"""
Page 3: 🔍 SQL Queries & Analytics Page
Integrates 25 complete advanced SQL practice questions across Beginner, Intermediate, and Advanced tiers.
"""

import time
import streamlit as st
import pandas as pd
from utils.db_connection import run_query, get_table_names
from utils.queries_catalog import SQL_QUESTIONS_LIST

st.set_page_config(page_title="SQL Analytics - Cricbuzz LiveStats", page_icon="🔍", layout="wide")

st.title("🔍 SQL Queries & Analytics Workbench")
st.markdown(
    "Interactive relational data analysis executing **25 complete SQL practice questions** directly on the SQLite database."
)

# Filter Controls
col_diff, col_search = st.columns([1, 2])
with col_diff:
    diff_filter = st.selectbox(
        "Filter by Difficulty Tier",
        options=["All", "Beginner", "Intermediate", "Advanced"],
        index=0,
    )
with col_search:
    search_term = st.text_input("Search questions by keyword or SQL concept", "")

filtered_questions = [
    q for q in SQL_QUESTIONS_LIST
    if (diff_filter == "All" or q["difficulty"] == diff_filter)
    and (search_term.lower() in q["title"].lower() or search_term.lower() in q["question"].lower() or any(search_term.lower() in tag.lower() for tag in q["concept_tags"]))
]

st.markdown(f"**Available Questions ({len(filtered_questions)} of 25)**")

# Select a question
selected_title = st.selectbox(
    "Select an Analytical Question to Inspect & Execute:",
    options=[f"{q['id']}. {q['title']} [{q['difficulty']}]" for q in filtered_questions],
    index=0 if filtered_questions else None,
)

if selected_title:
    selected_id = int(selected_title.split(".")[0])
    current_q = next((q for q in SQL_QUESTIONS_LIST if q["id"] == selected_id), None)

    if current_q:
        st.markdown(f"### 📋 {current_q['title']}")
        st.info(f"**Question**: {current_q['question']}")

        # Tags and Difficulty
        st.markdown(
            f"**Tier**: `{current_q['difficulty']}` | **Concepts**: "
            + " ".join([f"`{tag}`" for tag in current_q["concept_tags"]])
        )

        with st.expander("📖 SQL Explanation & Methodology", expanded=True):
            st.write(current_q["explanation"])
            st.code(current_q["sql"], language="sql")

        # Execution controls
        btn_run = st.button("▶️ Execute Query", key=f"run_{current_q['id']}")

        if btn_run or f"result_{current_q['id']}" in st.session_state:
            try:
                start_time = time.time()
                result_df = run_query(current_q["sql"])
                elapsed_ms = (time.time() - start_time) * 1000

                st.session_state[f"result_{current_q['id']}"] = result_df

                st.success(f"✅ Execution successful! Retrieved **{len(result_df)} rows** in `{elapsed_ms:.2f} ms`.")
                st.dataframe(result_df, use_container_width=True)

                # CSV Download button
                csv_data = result_df.to_csv(index=False).encode("utf-8")
                st.download_button(
                    label="📥 Download Result as CSV",
                    data=csv_data,
                    file_name=f"query_{current_q['id']}_results.csv",
                    mime="text/csv",
                )
            except Exception as err:
                st.error(f"Execution Error: {err}")

st.markdown("---")

# Custom Interactive SQL Console
st.subheader("💻 Custom SQL Query Console (Scratchpad)")
st.caption("Write and run arbitrary SQL queries on the cricket database. Table names: " + ", ".join([f"`{t}`" for t in get_table_names()]))

custom_query = st.text_area(
    "Enter SQL Statement:",
    value="SELECT full_name, country, playing_role FROM players LIMIT 5;",
    height=120,
)

if st.button("🚀 Run Custom SQL"):
    try:
        t0 = time.time()
        custom_df = run_query(custom_query)
        dt = (time.time() - t0) * 1000
        st.success(f"✅ Returned {len(custom_df)} rows in {dt:.2f} ms")
        st.dataframe(custom_df, use_container_width=True)
    except Exception as e:
        st.error(f"SQL Error: {e}")
