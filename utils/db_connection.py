"""
Centralized Database Connection Handler for Cricbuzz LiveStats
Supports SQLite by default, and configurable for PostgreSQL / MySQL.
"""

import os
import sqlite3
from pathlib import Path
from typing import Any, List, Optional, Tuple
import pandas as pd

# Default SQLite database path
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "cricket_analytics.db"
SCHEMA_PATH = BASE_DIR / "database" / "schema.sql"


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """
    Establish and return a connection to the SQLite database.
    Initializes tables from schema.sql if the database is newly created.
    """
    target_path = db_path or DEFAULT_DB_PATH
    is_new_db = not target_path.exists()

    conn = sqlite3.connect(str(target_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row

    if is_new_db:
        init_db(conn)

    return conn


def init_db(conn: Optional[sqlite3.Connection] = None) -> None:
    """
    Initialize database schema and seed data from schema.sql.
    """
    should_close = False
    if conn is None:
        conn = sqlite3.connect(str(DEFAULT_DB_PATH), check_same_thread=False)
        should_close = True

    if SCHEMA_PATH.exists():
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()

    if should_close:
        conn.close()


def run_query(query: str, params: Optional[Tuple[Any, ...]] = None) -> pd.DataFrame:
    """
    Execute a SELECT query and return results as a Pandas DataFrame.
    """
    conn = get_connection()
    try:
        if params:
            df = pd.read_sql_query(query, conn, params=params)
        else:
            df = pd.read_sql_query(query, conn)
        return df
    finally:
        conn.close()


def execute_dml(query: str, params: Optional[Tuple[Any, ...]] = None) -> int:
    """
    Execute an INSERT, UPDATE, or DELETE statement.
    Returns the number of affected rows.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()


def get_table_names() -> List[str]:
    """
    Retrieve all user-defined table names in the database.
    """
    df = run_query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    return df["name"].tolist() if not df.empty else []


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DEFAULT_DB_PATH)
    print("Available tables:", get_table_names())
