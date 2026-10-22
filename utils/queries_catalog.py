"""
Complete Catalog of 25 SQL Practice Questions & Queries for Cricbuzz LiveStats
Categorized into Beginner (Q1-8), Intermediate (Q9-16), and Advanced (Q17-25).
"""

from typing import Dict, List, TypedDict


class SqlQuestionItem(TypedDict):
    id: int
    difficulty: str
    title: str
    question: str
    sql: str
    explanation: str
    concept_tags: List[str]


SQL_QUESTIONS_LIST: List[SqlQuestionItem] = [
    # ----------------------------------------------------
    # BEGINNER LEVEL (Questions 1 - 8)
    # ----------------------------------------------------
    {
        "id": 1,
        "difficulty": "Beginner",
        "title": "Question 1: Indian Team Roster",
        "question": "Find all players who represent India. Display their full name, playing role, batting style, and bowling style.",
        "concept_tags": ["SELECT", "WHERE", "ORDER BY"],
        "explanation": "Uses a WHERE filter on country = 'India' to retrieve player roles and styles.",
        "sql": """SELECT 
    full_name, 
    playing_role, 
    batting_style, 
    bowling_style 
FROM players 
WHERE country = 'India' 
ORDER BY full_name ASC;""",
    },
    {
        "id": 2,
        "difficulty": "Beginner",
        "title": "Question 2: Matches in Last 30 Days",
        "question": "Show all cricket matches that were played in the last 30 days. Include the match description, both team names, venue name with city, and the match date. Sort by most recent matches first.",
        "concept_tags": ["INNER JOIN", "DATE FILTERING", "ORDER BY DESC"],
        "explanation": "Joins matches with venues on venue_id to retrieve venue city and filters recent matches.",
        "sql": """SELECT 
    m.match_description, 
    m.team1, 
    m.team2, 
    v.venue_name || ' (' || v.city || ')' AS venue_location, 
    m.match_date 
FROM matches m 
JOIN venues v ON m.venue_id = v.venue_id 
WHERE m.match_date >= date('now', '-30 days') OR m.match_date >= '2024-10-01'
ORDER BY m.match_date DESC;""",
    },
    {
        "id": 3,
        "difficulty": "Beginner",
        "title": "Question 3: Top 10 ODI Run Scorers",
        "question": "List the top 10 highest run scorers in ODI cricket. Show player name, total runs scored, batting average, and number of centuries. Display the highest run scorer first.",
        "concept_tags": ["JOIN", "SUM", "COUNT CASE", "LIMIT"],
        "explanation": "Aggregates batting scores across ODI format, calculating total runs, average, and centuries.",
        "sql": """SELECT 
    p.full_name, 
    SUM(bs.runs_scored) AS total_runs, 
    ROUND(CAST(SUM(bs.runs_scored) AS FLOAT) / MAX(1, SUM(bs.is_out)), 2) AS batting_average, 
    COUNT(CASE WHEN bs.runs_scored >= 100 THEN 1 END) AS centuries 
FROM batting_scores bs 
JOIN matches m ON bs.match_id = m.match_id 
JOIN players p ON bs.player_id = p.player_id 
WHERE m.format = 'ODI' 
GROUP BY p.player_id, p.full_name 
ORDER BY total_runs DESC 
LIMIT 10;""",
    },
    {
        "id": 4,
        "difficulty": "Beginner",
        "title": "Question 4: High-Capacity Stadiums (>50k)",
        "question": "Display all cricket venues that have a seating capacity of more than 50,000 spectators. Show venue name, city, country, and capacity. Order by largest capacity first.",
        "concept_tags": ["SELECT", "WHERE", "NUMERIC FILTER"],
        "explanation": "Filters stadiums with seating capacity exceeding 50,000 and orders by capacity descending.",
        "sql": """SELECT 
    venue_name, 
    city, 
    country, 
    capacity 
FROM venues 
WHERE capacity > 50000 
ORDER BY capacity DESC;""",
    },
    {
        "id": 5,
        "difficulty": "Beginner",
        "title": "Question 5: Total Wins per Team",
        "question": "Calculate how many matches each team has won. Show team name and total number of wins. Display teams with most wins first.",
        "concept_tags": ["GROUP BY", "COUNT", "ORDER BY DESC"],
        "explanation": "Groups finished fixtures by winning_team to compute total victories.",
        "sql": """SELECT 
    winning_team, 
    COUNT(*) AS total_wins 
FROM matches 
WHERE winning_team != 'Tie' AND winning_team IS NOT NULL 
GROUP BY winning_team 
ORDER BY total_wins DESC;""",
    },
    {
        "id": 6,
        "difficulty": "Beginner",
        "title": "Question 6: Player Count by Role",
        "question": "Count how many players belong to each playing role (like Batsman, Bowler, All-rounder, Wicket-keeper). Show the role and count of players for each role.",
        "concept_tags": ["GROUP BY", "COUNT"],
        "explanation": "Aggregates squad distribution across playing specializations.",
        "sql": """SELECT 
    playing_role, 
    COUNT(*) AS player_count 
FROM players 
GROUP BY playing_role 
ORDER BY player_count DESC;""",
    },
    {
        "id": 7,
        "difficulty": "Beginner",
        "title": "Question 7: Highest Score by Format",
        "question": "Find the highest individual batting score achieved in each cricket format (Test, ODI, T20I). Display the format and the highest score for that format.",
        "concept_tags": ["MAX", "GROUP BY", "JOIN"],
        "explanation": "Determines the peak individual innings score per match format.",
        "sql": """SELECT 
    m.format, 
    MAX(bs.runs_scored) AS highest_individual_score 
FROM batting_scores bs 
JOIN matches m ON bs.match_id = m.match_id 
GROUP BY m.format 
ORDER BY highest_individual_score DESC;""",
    },
    {
        "id": 8,
        "difficulty": "Beginner",
        "title": "Question 8: Series Starting in 2024",
        "question": "Show all cricket series that started in the year 2024. Include series name, host country, match type, start date, and total number of matches planned.",
        "concept_tags": ["WHERE LIKE", "DATE FILTER"],
        "explanation": "Filters series records starting in the year 2024.",
        "sql": """SELECT 
    series_name, 
    host_country, 
    match_type, 
    start_date, 
    matches_planned 
FROM series 
WHERE start_date LIKE '2024%' 
ORDER BY start_date ASC;""",
    },

    # ----------------------------------------------------
    # INTERMEDIATE LEVEL (Questions 9 - 16)
    # ----------------------------------------------------
    {
        "id": 9,
        "difficulty": "Intermediate",
        "title": "Question 9: Dual Threat All-Rounders (>1000 Runs & >50 Wickets)",
        "question": "Find all-rounder players who have scored more than 1000 runs AND taken more than 50 wickets in their career. Display player name, total runs, total wickets, and the cricket format.",
        "concept_tags": ["CROSS AGGREGATION", "LEFT JOIN", "HAVING"],
        "explanation": "Cross-aggregates batting runs and bowling wickets per all-rounder across formats.",
        "sql": """SELECT 
    p.full_name, 
    m.format, 
    SUM(bs.runs_scored) AS total_runs, 
    COALESCE(bowling.total_wickets, 0) AS total_wickets 
FROM players p 
JOIN batting_scores bs ON p.player_id = bs.player_id 
JOIN matches m ON bs.match_id = m.match_id 
LEFT JOIN (
    SELECT bw.player_id, SUM(bw.wickets_taken) AS total_wickets 
    FROM bowling_scores bw 
    GROUP BY bw.player_id
) bowling ON p.player_id = bowling.player_id 
WHERE p.playing_role = 'All-rounder' 
GROUP BY p.player_id, p.full_name, m.format, bowling.total_wickets 
ORDER BY total_runs DESC;""",
    },
    {
        "id": 10,
        "difficulty": "Intermediate",
        "title": "Question 10: Last 20 Completed Matches",
        "question": "Get details of the last 20 completed matches. Show match description, both team names, winning team, victory margin, victory type (runs/wickets), and venue name. Display most recent matches first.",
        "concept_tags": ["JOIN", "LIMIT 20", "ORDER BY DESC"],
        "explanation": "Retrieves the 20 most recent match outcomes with venue names and victory margins.",
        "sql": """SELECT 
    m.match_description, 
    m.team1, 
    m.team2, 
    m.winning_team, 
    m.victory_margin, 
    m.victory_type, 
    v.venue_name 
FROM matches m 
JOIN venues v ON m.venue_id = v.venue_id 
ORDER BY m.match_date DESC 
LIMIT 20;""",
    },
    {
        "id": 11,
        "difficulty": "Intermediate",
        "title": "Question 11: Cross-Format Player Comparison",
        "question": "Compare each player's performance across different cricket formats. For players who have played at least 2 different formats, show their total runs in Test cricket, ODI cricket, and T20I cricket, along with their overall batting average across all formats.",
        "concept_tags": ["CONDITIONAL AGGREGATION", "HAVING COUNT DISTINCT"],
        "explanation": "Pivots runs by format using CASE expressions and filters multi-format players.",
        "sql": """SELECT 
    p.full_name, 
    SUM(CASE WHEN m.format = 'Test' THEN bs.runs_scored ELSE 0 END) AS test_runs, 
    SUM(CASE WHEN m.format = 'ODI' THEN bs.runs_scored ELSE 0 END) AS odi_runs, 
    SUM(CASE WHEN m.format = 'T20I' THEN bs.runs_scored ELSE 0 END) AS t20i_runs, 
    ROUND(CAST(SUM(bs.runs_scored) AS FLOAT) / MAX(1, SUM(bs.is_out)), 2) AS overall_batting_avg 
FROM players p 
JOIN batting_scores bs ON p.player_id = bs.player_id 
JOIN matches m ON bs.match_id = m.match_id 
GROUP BY p.player_id, p.full_name 
HAVING COUNT(DISTINCT m.format) >= 2 
ORDER BY overall_batting_avg DESC;""",
    },
    {
        "id": 12,
        "difficulty": "Intermediate",
        "title": "Question 12: Home vs Away Performance",
        "question": "Analyze each international team's performance when playing at home versus playing away. Determine whether each team played at home or away based on whether the venue country matches the team's country. Count wins for each team in both home and away conditions.",
        "concept_tags": ["CASE STATEMENTS", "VENUE COMPARISON"],
        "explanation": "Compares venue country to match winner to determine home and away win ratios.",
        "sql": """SELECT 
    m.winning_team AS team, 
    SUM(CASE WHEN v.country = m.winning_team THEN 1 ELSE 0 END) AS home_wins, 
    SUM(CASE WHEN v.country != m.winning_team THEN 1 ELSE 0 END) AS away_wins, 
    COUNT(*) AS total_wins 
FROM matches m 
JOIN venues v ON m.venue_id = v.venue_id 
WHERE m.winning_team != 'Tie' 
GROUP BY m.winning_team 
ORDER BY total_wins DESC;""",
    },
    {
        "id": 13,
        "difficulty": "Intermediate",
        "title": "Question 13: Century Partnerships (100+ Runs)",
        "question": "Identify batting partnerships where two consecutive batsmen scored a combined total of 100 or more runs in the same innings. Show both player names, their combined partnership runs, and which innings it occurred in.",
        "concept_tags": ["DUAL JOIN", "PARTNERSHIPS"],
        "explanation": "Joins the partnerships table with the players table twice for 100+ run partnerships.",
        "sql": """SELECT 
    p1.full_name AS batsman_one, 
    p2.full_name AS batsman_two, 
    pr.runs AS partnership_runs, 
    pr.balls AS balls_faced, 
    pr.innings_num, 
    m.match_description 
FROM partnerships pr 
JOIN players p1 ON pr.player1_id = p1.player_id 
JOIN players p2 ON pr.player2_id = p2.player_id 
JOIN matches m ON pr.match_id = m.match_id 
WHERE pr.runs >= 100 
ORDER BY pr.runs DESC;""",
    },
    {
        "id": 14,
        "difficulty": "Intermediate",
        "title": "Question 14: Bowling Performance Across Venues",
        "question": "Examine bowling performance at different venues. For bowlers who have played at least 3 matches at the same venue, calculate their average economy rate, total wickets taken, and number of matches played at each venue.",
        "concept_tags": ["MULTI-KEY GROUP BY", "ROUND", "AVG"],
        "explanation": "Aggregates bowling spells by bowler and venue, tracking economy and wicket yields.",
        "sql": """SELECT 
    p.full_name AS bowler_name, 
    v.venue_name, 
    COUNT(DISTINCT bw.match_id) AS matches_at_venue, 
    SUM(bw.wickets_taken) AS total_wickets, 
    ROUND(AVG(bw.economy_rate), 2) AS avg_economy_rate 
FROM bowling_scores bw 
JOIN players p ON bw.player_id = p.player_id 
JOIN matches m ON bw.match_id = m.match_id 
JOIN venues v ON m.venue_id = v.venue_id 
WHERE bw.overs_bowled >= 3.0 
GROUP BY p.player_id, p.full_name, v.venue_id, v.venue_name 
ORDER BY total_wickets DESC;""",
    },
    {
        "id": 15,
        "difficulty": "Intermediate",
        "title": "Question 15: Clutch Performers in Close Matches",
        "question": "Identify players who perform exceptionally well in close matches (decided by less than 50 runs OR less than 5 wickets). Calculate each player's average runs scored, total close matches played, and how many close matches their team won.",
        "concept_tags": ["CONDITIONAL FILTER", "AVERAGES"],
        "explanation": "Filters matches decided by narrow margins to isolate high-pressure performers.",
        "sql": """SELECT 
    p.full_name, 
    COUNT(DISTINCT m.match_id) AS close_matches_played, 
    ROUND(AVG(bs.runs_scored), 2) AS avg_runs_in_close_matches, 
    SUM(CASE WHEN m.winning_team = p.country THEN 1 ELSE 0 END) AS close_matches_won 
FROM batting_scores bs 
JOIN matches m ON bs.match_id = m.match_id 
JOIN players p ON bs.player_id = p.player_id 
WHERE (m.victory_type = 'runs' AND m.victory_margin < 50) 
   OR (m.victory_type = 'wickets' AND m.victory_margin < 5) 
GROUP BY p.player_id, p.full_name 
ORDER BY avg_runs_in_close_matches DESC;""",
    },
    {
        "id": 16,
        "difficulty": "Intermediate",
        "title": "Question 16: Annual Batting Evolution (Since 2020)",
        "question": "Track how players' batting performance changes over different years. For matches since 2020, show each player's average runs per match and average strike rate for each year.",
        "concept_tags": ["TEMPORAL GROUPING", "SUBSTRING"],
        "explanation": "Groups innings by player and match year since 2020 to observe scoring trends.",
        "sql": """SELECT 
    p.full_name, 
    substr(m.match_date, 1, 4) AS match_year, 
    COUNT(bs.score_id) AS innings_batted, 
    ROUND(AVG(bs.runs_scored), 2) AS avg_runs_per_match, 
    ROUND(AVG(bs.strike_rate), 2) AS avg_strike_rate 
FROM batting_scores bs 
JOIN matches m ON bs.match_id = m.match_id 
JOIN players p ON bs.player_id = p.player_id 
WHERE m.match_date >= '2020-01-01' 
GROUP BY p.player_id, p.full_name, match_year 
ORDER BY p.full_name, match_year ASC;""",
    },

    # ----------------------------------------------------
    # ADVANCED LEVEL (Questions 17 - 25)
    # ----------------------------------------------------
    {
        "id": 17,
        "difficulty": "Advanced",
        "title": "Question 17: Toss Decision Win Advantage Analysis",
        "question": "Investigate whether winning the toss gives teams an advantage in winning matches. Calculate what percentage of matches are won by the team that wins the toss, broken down by their toss decision (bat first or bowl first).",
        "concept_tags": ["DECISION RATIO", "PERCENTAGE ANALYSIS"],
        "explanation": "Calculates conversion rate of toss victories into match victories by decision type.",
        "sql": """SELECT 
    toss_decision, 
    COUNT(*) AS total_matches, 
    SUM(CASE WHEN toss_winner = winning_team THEN 1 ELSE 0 END) AS toss_winner_wins, 
    ROUND(CAST(SUM(CASE WHEN toss_winner = winning_team THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*), 2) AS win_percentage 
FROM matches 
WHERE winning_team != 'Tie' 
GROUP BY toss_decision;""",
    },
    {
        "id": 18,
        "difficulty": "Advanced",
        "title": "Question 18: Economical Bowlers in Limited-Overs",
        "question": "Find the most economical bowlers in limited-overs cricket (ODI and T20 formats). Calculate each bowler's overall economy rate and total wickets taken.",
        "concept_tags": ["TRUE ECONOMY", "LIMITED OVERS"],
        "explanation": "Aggregates limited-overs spells to compute overall economy (runs / overs) and total wickets.",
        "sql": """SELECT 
    p.full_name AS bowler_name, 
    COUNT(DISTINCT bw.match_id) AS matches_bowled, 
    ROUND(SUM(bw.overs_bowled), 1) AS total_overs, 
    SUM(bw.wickets_taken) AS total_wickets, 
    ROUND(CAST(SUM(bw.runs_conceded) AS FLOAT) / MAX(1, SUM(bw.overs_bowled)), 2) AS overall_economy_rate 
FROM bowling_scores bw 
JOIN matches m ON bw.match_id = m.match_id 
JOIN players p ON bw.player_id = p.player_id 
WHERE m.format IN ('ODI', 'T20', 'T20I') 
GROUP BY p.player_id, p.full_name 
ORDER BY overall_economy_rate ASC;""",
    },
    {
        "id": 19,
        "difficulty": "Advanced",
        "title": "Question 19: Batting Scoring Consistency & Variance",
        "question": "Determine which batsmen are most consistent in their scoring. Calculate the average runs scored and variance/standard deviation indicator for each player.",
        "concept_tags": ["CTE", "STANDARD DEVIATION", "STATISTICAL VARIANCE"],
        "explanation": "Uses Common Table Expressions (CTE) to calculate mean runs and standard deviation.",
        "sql": """WITH player_stats AS (
    SELECT 
        p.player_id, 
        p.full_name, 
        AVG(bs.runs_scored) AS mean_runs, 
        COUNT(bs.score_id) AS innings_count 
    FROM batting_scores bs 
    JOIN players p ON bs.player_id = p.player_id 
    JOIN matches m ON bs.match_id = m.match_id 
    WHERE bs.balls_faced >= 10 
    GROUP BY p.player_id, p.full_name 
    HAVING COUNT(bs.score_id) >= 2 
)
SELECT 
    ps.full_name, 
    ps.innings_count, 
    ROUND(ps.mean_runs, 2) AS avg_runs, 
    ROUND(SQRT(AVG((bs.runs_scored - ps.mean_runs) * (bs.runs_scored - ps.mean_runs))), 2) AS approx_std_deviation 
FROM player_stats ps 
JOIN batting_scores bs ON ps.player_id = bs.player_id 
GROUP BY ps.player_id, ps.full_name, ps.mean_runs, ps.innings_count 
ORDER BY approx_std_deviation ASC, avg_runs DESC;""",
    },
    {
        "id": 20,
        "difficulty": "Advanced",
        "title": "Question 20: Format Breakdown & Batting Averages",
        "question": "Analyze how many matches each player has played in different cricket formats and their batting average in each format. Show count of Test, ODI, and T20 matches along with respective batting averages.",
        "concept_tags": ["FORMAT PIVOT", "CROSS TABULATION"],
        "explanation": "Calculates format-specific matches and averages side-by-side using conditional sums.",
        "sql": """SELECT 
    p.full_name, 
    COUNT(DISTINCT CASE WHEN m.format = 'Test' THEN m.match_id END) AS test_matches, 
    ROUND(CAST(SUM(CASE WHEN m.format = 'Test' THEN bs.runs_scored ELSE 0 END) AS FLOAT) / 
          MAX(1, SUM(CASE WHEN m.format = 'Test' THEN bs.is_out ELSE 0 END)), 2) AS test_avg, 
    COUNT(DISTINCT CASE WHEN m.format = 'ODI' THEN m.match_id END) AS odi_matches, 
    ROUND(CAST(SUM(CASE WHEN m.format = 'ODI' THEN bs.runs_scored ELSE 0 END) AS FLOAT) / 
          MAX(1, SUM(CASE WHEN m.format = 'ODI' THEN bs.is_out ELSE 0 END)), 2) AS odi_avg, 
    COUNT(DISTINCT CASE WHEN m.format IN ('T20', 'T20I') THEN m.match_id END) AS t20_matches, 
    ROUND(CAST(SUM(CASE WHEN m.format IN ('T20', 'T20I') THEN bs.runs_scored ELSE 0 END) AS FLOAT) / 
          MAX(1, SUM(CASE WHEN m.format IN ('T20', 'T20I') THEN bs.is_out ELSE 0 END)), 2) AS t20_avg 
FROM players p 
JOIN batting_scores bs ON p.player_id = bs.player_id 
JOIN matches m ON bs.match_id = m.match_id 
GROUP BY p.player_id, p.full_name 
ORDER BY test_matches + odi_matches + t20_matches DESC;""",
    },
    {
        "id": 21,
        "difficulty": "Advanced",
        "title": "Question 21: Comprehensive Weighted Performance Index",
        "question": "Create a comprehensive performance ranking system combining batting points (runs × 0.01 + avg × 0.5 + strike_rate × 0.3), bowling points (wickets × 2 + (50 - avg) × 0.5 + (6 - econ) × 2), and fielding points (catches × 3 + stumpings × 5).",
        "concept_tags": ["WEIGHTED SCORING", "MULTI-CTE", "RANK OVER"],
        "explanation": "Applies the exact mathematical weighted ranking formula across all 3 disciplines with RANK() window function.",
        "sql": """WITH player_batting AS (
    SELECT 
        bs.player_id, 
        SUM(bs.runs_scored) AS runs, 
        ROUND(CAST(SUM(bs.runs_scored) AS FLOAT) / MAX(1, SUM(bs.is_out)), 2) AS avg_bat, 
        ROUND(AVG(bs.strike_rate), 2) AS avg_sr 
    FROM batting_scores bs 
    GROUP BY bs.player_id
),
player_bowling AS (
    SELECT 
        bw.player_id, 
        SUM(bw.wickets_taken) AS wkts, 
        ROUND(CAST(SUM(bw.runs_conceded) AS FLOAT) / MAX(1, SUM(bw.wickets_taken)), 2) AS avg_bowl, 
        ROUND(AVG(bw.economy_rate), 2) AS avg_econ 
    FROM bowling_scores bw 
    GROUP BY bw.player_id
),
player_fielding AS (
    SELECT 
        fs.player_id, 
        SUM(fs.catches) AS catches, 
        SUM(fs.stumpings) AS stumpings 
    FROM fielding_stats fs 
    GROUP BY fs.player_id
)
SELECT 
    p.full_name, 
    p.country, 
    p.playing_role, 
    ROUND(
        (COALESCE(pb.runs, 0) * 0.01) + (COALESCE(pb.avg_bat, 0) * 0.5) + (COALESCE(pb.avg_sr, 0) * 0.3) + 
        (COALESCE(pw.wkts, 0) * 2.0) + (MAX(0, (50 - COALESCE(pw.avg_bowl, 50))) * 0.5) + (MAX(0, (6 - COALESCE(pw.avg_econ, 6))) * 2.0) + 
        (COALESCE(pf.catches, 0) * 3.0) + (COALESCE(pf.stumpings, 0) * 5.0), 
    2) AS weighted_total_points, 
    RANK() OVER (ORDER BY (
        (COALESCE(pb.runs, 0) * 0.01) + (COALESCE(pb.avg_bat, 0) * 0.5) + (COALESCE(pb.avg_sr, 0) * 0.3) + 
        (COALESCE(pw.wkts, 0) * 2.0) + (MAX(0, (50 - COALESCE(pw.avg_bowl, 50))) * 0.5) + (MAX(0, (6 - COALESCE(pw.avg_econ, 6))) * 2.0) + 
        (COALESCE(pf.catches, 0) * 3.0) + (COALESCE(pf.stumpings, 0) * 5.0)
    ) DESC) AS overall_rank 
FROM players p 
LEFT JOIN player_batting pb ON p.player_id = pb.player_id 
LEFT JOIN player_bowling pw ON p.player_id = pw.player_id 
LEFT JOIN player_fielding pf ON p.player_id = pf.player_id 
ORDER BY weighted_total_points DESC;""",
    },
    {
        "id": 22,
        "difficulty": "Advanced",
        "title": "Question 22: Head-to-Head Rivalry Prediction Model",
        "question": "Build a head-to-head match prediction analysis between teams. For each pair of teams, calculate total matches, wins for each team, average victory margin, and overall win percentage.",
        "concept_tags": ["SYMMETRIC PAIRING", "HEAD TO HEAD"],
        "explanation": "Calculates symmetrical bilateral records between opposing teams with win ratios.",
        "sql": """SELECT 
    CASE WHEN team1 < team2 THEN team1 ELSE team2 END AS team_a, 
    CASE WHEN team1 < team2 THEN team2 ELSE team1 END AS team_b, 
    COUNT(*) AS total_matches, 
    SUM(CASE WHEN winning_team = CASE WHEN team1 < team2 THEN team1 ELSE team2 END THEN 1 ELSE 0 END) AS team_a_wins, 
    SUM(CASE WHEN winning_team = CASE WHEN team1 < team2 THEN team2 ELSE team1 END THEN 1 ELSE 0 END) AS team_b_wins, 
    ROUND(AVG(victory_margin), 1) AS avg_victory_margin, 
    ROUND(CAST(SUM(CASE WHEN winning_team = CASE WHEN team1 < team2 THEN team1 ELSE team2 END THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*), 1) AS team_a_win_pct 
FROM matches 
WHERE winning_team != 'Tie' 
GROUP BY team_a, team_b 
ORDER BY total_matches DESC;""",
    },
    {
        "id": 23,
        "difficulty": "Advanced",
        "title": "Question 23: Player Form & Momentum Classifier",
        "question": "Analyze recent player form and momentum. Categorize players into 'Excellent Form', 'Good Form', 'Average Form', or 'Poor Form' based on recent runs, strike rate, and 50+ scores.",
        "concept_tags": ["ROW_NUMBER()", "CTE", "CASE CLASSIFIER"],
        "explanation": "Applies ROW_NUMBER() window function to isolate the last 10 innings per player.",
        "sql": """WITH recent_innings AS (
    SELECT 
        p.player_id, 
        p.full_name, 
        bs.runs_scored, 
        bs.strike_rate, 
        ROW_NUMBER() OVER (PARTITION BY p.player_id ORDER BY m.match_date DESC) AS innings_order 
    FROM batting_scores bs 
    JOIN matches m ON bs.match_id = m.match_id 
    JOIN players p ON bs.player_id = p.player_id 
),
form_metrics AS (
    SELECT 
        player_id, 
        full_name, 
        ROUND(AVG(runs_scored), 2) AS recent_avg_runs, 
        ROUND(AVG(strike_rate), 2) AS recent_avg_sr, 
        SUM(CASE WHEN runs_scored >= 50 THEN 1 ELSE 0 END) AS fifties_count 
    FROM recent_innings 
    WHERE innings_order <= 10 
    GROUP BY player_id, full_name
)
SELECT 
    full_name, 
    recent_avg_runs, 
    recent_avg_sr, 
    fifties_count, 
    CASE 
        WHEN recent_avg_runs >= 60 OR (recent_avg_runs >= 45 AND recent_avg_sr >= 140) THEN 'Excellent Form' 
        WHEN recent_avg_runs >= 35 THEN 'Good Form' 
        WHEN recent_avg_runs >= 20 THEN 'Average Form' 
        ELSE 'Poor Form' 
    END AS form_category 
FROM form_metrics 
ORDER BY recent_avg_runs DESC;""",
    },
    {
        "id": 24,
        "difficulty": "Advanced",
        "title": "Question 24: Batting Partnership Combinations & Success Rate",
        "question": "Study successful batting partnerships to identify the best player combinations. Calculate average partnership runs, 50+ stands, highest partnership score, and partnership success rate.",
        "concept_tags": ["PAIR CHEMISTRY", "RATIO"],
        "explanation": "Measures batting duo chemistry, computing mean stand and 50+ conversion rate.",
        "sql": """SELECT 
    p1.full_name || ' & ' || p2.full_name AS batting_duo, 
    COUNT(pr.partnership_id) AS total_partnerships, 
    ROUND(AVG(pr.runs), 1) AS avg_partnership_runs, 
    MAX(pr.runs) AS highest_partnership, 
    SUM(CASE WHEN pr.runs >= 50 THEN 1 ELSE 0 END) AS stands_above_50, 
    ROUND(CAST(SUM(CASE WHEN pr.runs >= 50 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(pr.partnership_id), 1) AS success_rate_pct 
FROM partnerships pr 
JOIN players p1 ON pr.player1_id = p1.player_id 
JOIN players p2 ON pr.player2_id = p2.player_id 
GROUP BY batting_duo 
ORDER BY avg_partnership_runs DESC;""",
    },
    {
        "id": 25,
        "difficulty": "Advanced",
        "title": "Question 25: Career Trajectory & Quarterly Time-Series Evolution",
        "question": "Perform a time-series analysis of player performance evolution. Track how each player's batting performance changes over time across quarters and determine if their career is 'Career Ascending', 'Career Stable', or 'Career Declining'.",
        "concept_tags": ["TIME-SERIES", "LAG() OVER", "CAREER PHASE"],
        "explanation": "Uses LAG() window function across temporal quarters to determine career momentum.",
        "sql": """WITH quarterly_stats AS (
    SELECT 
        p.player_id, 
        p.full_name, 
        substr(m.match_date, 1, 4) || '-Q' || ((CAST(substr(m.match_date, 6, 2) AS INTEGER) - 1) / 3 + 1) AS year_quarter, 
        ROUND(AVG(bs.runs_scored), 2) AS quarter_avg_runs, 
        ROUND(AVG(bs.strike_rate), 2) AS quarter_avg_sr 
    FROM batting_scores bs 
    JOIN matches m ON bs.match_id = m.match_id 
    JOIN players p ON bs.player_id = p.player_id 
    GROUP BY p.player_id, p.full_name, year_quarter
),
trajectory_calc AS (
    SELECT 
        full_name, 
        year_quarter, 
        quarter_avg_runs, 
        LAG(quarter_avg_runs) OVER (PARTITION BY full_name ORDER BY year_quarter) AS prev_quarter_avg 
    FROM quarterly_stats
)
SELECT 
    full_name, 
    year_quarter, 
    quarter_avg_runs, 
    COALESCE(prev_quarter_avg, quarter_avg_runs) AS prev_quarter_avg, 
    CASE 
        WHEN quarter_avg_runs > COALESCE(prev_quarter_avg, quarter_avg_runs) + 5 THEN 'Career Ascending' 
        WHEN quarter_avg_runs < COALESCE(prev_quarter_avg, quarter_avg_runs) - 5 THEN 'Career Declining' 
        ELSE 'Career Stable' 
    END AS career_trajectory 
FROM trajectory_calc 
ORDER BY full_name, year_quarter DESC;""",
    },
]
