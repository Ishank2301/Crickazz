-- ====================================================================
-- 🏏 Cricbuzz LiveStats: Relational Database Schema & Sample Data
-- Database Engine: SQLite / PostgreSQL compatible
-- ====================================================================

-- 1. Venues Table
CREATE TABLE IF NOT EXISTS venues (
    venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    capacity INTEGER NOT NULL
);

-- 2. Series / Tournaments Table
CREATE TABLE IF NOT EXISTS series (
    series_id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_name TEXT NOT NULL,
    host_country TEXT NOT NULL,
    match_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    matches_planned INTEGER NOT NULL
);

-- 3. Players Table
CREATE TABLE IF NOT EXISTS players (
    player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    country TEXT NOT NULL,
    playing_role TEXT NOT NULL, -- Batsman, Bowler, All-rounder, Wicket-keeper
    batting_style TEXT NOT NULL,
    bowling_style TEXT NOT NULL,
    date_of_birth TEXT NOT NULL
);

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id INTEGER,
    match_description TEXT NOT NULL,
    format TEXT NOT NULL, -- Test, ODI, T20I, T20
    match_date TEXT NOT NULL,
    venue_id INTEGER,
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    toss_winner TEXT NOT NULL,
    toss_decision TEXT NOT NULL, -- bat / bowl
    winning_team TEXT NOT NULL,
    victory_margin INTEGER NOT NULL,
    victory_type TEXT NOT NULL, -- runs / wickets
    FOREIGN KEY (series_id) REFERENCES series(series_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- 5. Batting Scorecards Table
CREATE TABLE IF NOT EXISTS batting_scores (
    score_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    innings_num INTEGER NOT NULL,
    batting_position INTEGER NOT NULL,
    runs_scored INTEGER NOT NULL,
    balls_faced INTEGER NOT NULL,
    fours INTEGER NOT NULL,
    sixes INTEGER NOT NULL,
    strike_rate REAL NOT NULL,
    dismissal_mode TEXT,
    is_out INTEGER NOT NULL, -- 1 for out, 0 for not out
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- 6. Bowling Scorecards Table
CREATE TABLE IF NOT EXISTS bowling_scores (
    bowling_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    innings_num INTEGER NOT NULL,
    overs_bowled REAL NOT NULL,
    maidens INTEGER NOT NULL,
    runs_conceded INTEGER NOT NULL,
    wickets_taken INTEGER NOT NULL,
    economy_rate REAL NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- 7. Fielding Stats Table
CREATE TABLE IF NOT EXISTS fielding_stats (
    fielding_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    format TEXT NOT NULL,
    catches INTEGER NOT NULL,
    stumpings INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- 8. Partnerships Table
CREATE TABLE IF NOT EXISTS partnerships (
    partnership_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    innings_num INTEGER NOT NULL,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    runs INTEGER NOT NULL,
    balls INTEGER NOT NULL,
    wicket_number INTEGER NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player1_id) REFERENCES players(player_id),
    FOREIGN KEY (player2_id) REFERENCES players(player_id)
);

-- ====================================================================
-- SEED SAMPLE DATA
-- ====================================================================

-- Insert Venues
INSERT INTO venues (venue_name, city, country, capacity) VALUES
('Narendra Modi Stadium', 'Ahmedabad', 'India', 132000),
('Melbourne Cricket Ground', 'Melbourne', 'Australia', 100024),
('Eden Gardens', 'Kolkata', 'India', 68000),
('Perth Stadium', 'Perth', 'Australia', 60000),
('Lord''s Cricket Ground', 'London', 'England', 31100),
('The Oval', 'London', 'England', 27500),
('Wankhede Stadium', 'Mumbai', 'India', 33108),
('Sydney Cricket Ground', 'Sydney', 'Australia', 48000),
('Gaddafi Stadium', 'Lahore', 'Pakistan', 27000),
('National Stadium', 'Karachi', 'Pakistan', 34228),
('SuperSport Park', 'Centurion', 'South Africa', 22000),
('Dubai International Stadium', 'Dubai', 'UAE', 25000),
('M. Chinnaswamy Stadium', 'Bengaluru', 'India', 40000),
('Adelaide Oval', 'Adelaide', 'Australia', 53583);

-- Insert Series
INSERT INTO series (series_name, host_country, match_type, start_date, matches_planned) VALUES
('ICC Men''s T20 World Cup 2024', 'USA & West Indies', 'T20I', '2024-06-01', 55),
('Border-Gavaskar Trophy 2024-25', 'Australia', 'Test', '2024-11-22', 5),
('India Tour of Sri Lanka 2024', 'Sri Lanka', 'ODI', '2024-08-02', 3),
('England Tour of Pakistan 2024', 'Pakistan', 'Test', '2024-10-07', 3),
('Indian Premier League 2024', 'India', 'T20', '2024-03-22', 74),
('Australia Tour of England 2024', 'England', 'ODI', '2024-09-19', 5),
('South Africa Tour of India 2023', 'India', 'Test', '2023-12-10', 2),
('ICC Champions Trophy 2025', 'Pakistan', 'ODI', '2025-02-19', 15);

-- Insert Players
INSERT INTO players (full_name, country, playing_role, batting_style, bowling_style, date_of_birth) VALUES
('Virat Kohli', 'India', 'Batsman', 'Right-hand bat', 'Right-arm medium', '1988-11-05'),
('Rohit Sharma', 'India', 'Batsman', 'Right-hand bat', 'Right-arm off break', '1987-04-30'),
('Jasprit Bumrah', 'India', 'Bowler', 'Right-hand bat', 'Right-arm fast', '1993-12-06'),
('Hardik Pandya', 'India', 'All-rounder', 'Right-hand bat', 'Right-arm fast-medium', '1993-10-11'),
('Ravindra Jadeja', 'India', 'All-rounder', 'Left-hand bat', 'Slow left-arm orthodox', '1988-12-06'),
('Rishabh Pant', 'India', 'Wicket-keeper', 'Left-hand bat', 'None', '1997-10-04'),
('Shubman Gill', 'India', 'Batsman', 'Right-hand bat', 'Right-arm off break', '1999-09-08'),
('Yashasvi Jaiswal', 'India', 'Batsman', 'Left-hand bat', 'Right-arm leg break', '2001-12-28'),
('Kuldeep Yadav', 'India', 'Bowler', 'Left-hand bat', 'Left-arm wrist spin', '1994-12-14'),
('Travis Head', 'Australia', 'Batsman', 'Left-hand bat', 'Right-arm off break', '1993-12-29'),
('Pat Cummins', 'Australia', 'Bowler', 'Right-hand bat', 'Right-arm fast', '1993-05-08'),
('Mitchell Starc', 'Australia', 'Bowler', 'Left-hand bat', 'Left-arm fast', '1990-01-30'),
('Glenn Maxwell', 'Australia', 'All-rounder', 'Right-hand bat', 'Right-arm off break', '1988-10-14'),
('Mitchell Marsh', 'Australia', 'All-rounder', 'Right-hand bat', 'Right-arm medium', '1991-10-20'),
('Steve Smith', 'Australia', 'Batsman', 'Right-hand bat', 'Right-arm leg break', '1989-06-02'),
('Josh Inglis', 'Australia', 'Wicket-keeper', 'Right-hand bat', 'None', '1995-03-04'),
('Babar Azam', 'Pakistan', 'Batsman', 'Right-hand bat', 'Right-arm off break', '1994-10-15'),
('Shaheen Afridi', 'Pakistan', 'Bowler', 'Left-hand bat', 'Left-arm fast', '2000-04-06'),
('Mohammad Rizwan', 'Pakistan', 'Wicket-keeper', 'Right-hand bat', 'None', '1992-06-01'),
('Shadab Khan', 'Pakistan', 'All-rounder', 'Right-hand bat', 'Right-arm leg break', '1998-10-04'),
('Joe Root', 'England', 'Batsman', 'Right-hand bat', 'Right-arm off break', '1990-12-30'),
('Ben Stokes', 'England', 'All-rounder', 'Left-hand bat', 'Right-arm fast-medium', '1991-06-04'),
('Jos Buttler', 'England', 'Wicket-keeper', 'Right-hand bat', 'None', '1990-09-08'),
('Jofra Archer', 'England', 'Bowler', 'Right-hand bat', 'Right-arm fast', '1995-04-01'),
('Kane Williamson', 'New Zealand', 'Batsman', 'Right-hand bat', 'Right-arm off break', '1990-08-08'),
('Rashid Khan', 'Afghanistan', 'All-rounder', 'Right-hand bat', 'Right-arm leg break', '1998-09-20'),
('Heinrich Klaasen', 'South Africa', 'Wicket-keeper', 'Right-hand bat', 'Right-arm off break', '1991-07-30'),
('Kagiso Rabada', 'South Africa', 'Bowler', 'Left-hand bat', 'Right-arm fast', '1995-05-25');

-- Insert Matches
INSERT INTO matches (series_id, match_description, format, match_date, venue_id, team1, team2, toss_winner, toss_decision, winning_team, victory_margin, victory_type) VALUES
(2, 'India vs Australia, 1st Test at Perth', 'Test', '2024-11-26', 4, 'India', 'Australia', 'India', 'bat', 'India', 295, 'runs'),
(2, 'India vs Australia, 2nd Test at Adelaide', 'Test', '2024-12-08', 14, 'Australia', 'India', 'Australia', 'bowl', 'Australia', 10, 'wickets'),
(2, 'India vs Australia, 3rd Test at MCG', 'Test', '2024-12-30', 2, 'Australia', 'India', 'India', 'bowl', 'India', 4, 'wickets'),
(1, 'India vs South Africa, T20 World Cup Final', 'T20I', '2024-06-29', 12, 'India', 'South Africa', 'India', 'bat', 'India', 7, 'runs'),
(1, 'India vs Pakistan, T20 World Cup Group Stage', 'T20I', '2024-06-09', 12, 'India', 'Pakistan', 'Pakistan', 'bowl', 'India', 6, 'runs'),
(1, 'Australia vs England, T20 World Cup Super 8', 'T20I', '2024-06-08', 12, 'Australia', 'England', 'England', 'bowl', 'Australia', 36, 'runs'),
(6, 'England vs Australia, 1st ODI at Trent Bridge', 'ODI', '2024-09-19', 5, 'England', 'Australia', 'England', 'bat', 'Australia', 7, 'wickets'),
(6, 'England vs Australia, 2nd ODI at Headingley', 'ODI', '2024-09-21', 6, 'England', 'Australia', 'Australia', 'bat', 'Australia', 68, 'runs'),
(4, 'Pakistan vs England, 1st Test at Multan', 'Test', '2024-10-11', 9, 'Pakistan', 'England', 'Pakistan', 'bat', 'England', 47, 'runs'),
(4, 'Pakistan vs England, 2nd Test at Multan', 'Test', '2024-10-18', 9, 'Pakistan', 'England', 'Pakistan', 'bat', 'Pakistan', 152, 'runs'),
(3, 'Sri Lanka vs India, 1st ODI at Colombo', 'ODI', '2024-08-02', 1, 'Sri Lanka', 'India', 'Sri Lanka', 'bat', 'Tie', 0, 'runs'),
(3, 'Sri Lanka vs India, 2nd ODI at Colombo', 'ODI', '2024-08-04', 1, 'Sri Lanka', 'India', 'Sri Lanka', 'bat', 'Sri Lanka', 32, 'runs'),
(1, 'Afghanistan vs Australia, T20 World Cup Super 8', 'T20I', '2024-06-22', 12, 'Afghanistan', 'Australia', 'Australia', 'bowl', 'Afghanistan', 21, 'runs'),
(5, 'KKR vs SRH, IPL 2024 Final at Chennai', 'T20', '2024-05-26', 7, 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Sunrisers Hyderabad', 'bat', 'Kolkata Knight Riders', 8, 'wickets'),
(5, 'RCB vs CSK, IPL 2024 Thriller at Bengaluru', 'T20', '2024-05-18', 13, 'Royal Challengers Bengaluru', 'Chennai Super Kings', 'Chennai Super Kings', 'bowl', 'Royal Challengers Bengaluru', 27, 'runs'),
(2, 'India vs Australia, Bilateral T20I at MCG', 'T20I', '2026-10-15', 2, 'Australia', 'India', 'India', 'bowl', 'India', 3, 'wickets'),
(2, 'India vs Australia, Bilateral T20I at Sydney', 'T20I', '2026-10-12', 8, 'Australia', 'India', 'Australia', 'bat', 'Australia', 18, 'runs'),
(1, 'England vs Pakistan, T20 Warm-up at Lord''s', 'T20I', '2026-10-02', 5, 'England', 'Pakistan', 'England', 'bowl', 'England', 4, 'wickets'),
(7, 'India vs South Africa, 1st Test at Centurion', 'Test', '2023-12-28', 11, 'South Africa', 'India', 'South Africa', 'bowl', 'South Africa', 32, 'runs'),
(7, 'India vs South Africa, 2nd Test at Cape Town', 'Test', '2024-01-04', 11, 'South Africa', 'India', 'South Africa', 'bat', 'India', 7, 'wickets'),
(8, 'South Africa vs New Zealand, Champions Trophy Semi', 'ODI', '2025-02-28', 12, 'South Africa', 'New Zealand', 'South Africa', 'bat', 'South Africa', 24, 'runs');

-- Insert Batting Scores
INSERT INTO batting_scores (match_id, player_id, innings_num, batting_position, runs_scored, balls_faced, fours, sixes, strike_rate, dismissal_mode, is_out) VALUES
(1, 1, 2, 4, 100, 143, 8, 2, 69.93, 'not out', 0),
(4, 1, 1, 3, 76, 59, 6, 2, 128.81, 'c Rabada b Jansen', 1),
(5, 1, 1, 3, 4, 3, 1, 0, 133.33, 'c Usman b Naseem', 1),
(7, 1, 2, 3, 85, 92, 9, 1, 92.39, 'c Marsh b Hazlewood', 1),
(16, 1, 2, 3, 64, 41, 7, 2, 156.10, 'not out', 0),
(17, 1, 2, 3, 45, 32, 4, 1, 140.62, 'c Head b Zampa', 1),
(4, 2, 1, 1, 9, 5, 2, 0, 180.00, 'c Klaasen b Maharaj', 1),
(5, 2, 1, 1, 13, 12, 1, 1, 108.33, 'c Shaheen b Rauf', 1),
(1, 2, 1, 1, 52, 65, 6, 2, 80.00, 'c Carey b Cummins', 1),
(7, 2, 2, 1, 112, 104, 12, 4, 107.69, 'c Smith b Starc', 1),
(16, 2, 2, 1, 46, 25, 5, 3, 184.00, 'c Starc b Hazlewood', 1),
(1, 8, 2, 1, 161, 297, 15, 3, 54.21, 'c Smith b Marsh', 1),
(16, 8, 2, 2, 24, 14, 3, 1, 171.43, 'c Maxwell b Zampa', 1),
(1, 6, 1, 5, 37, 78, 3, 1, 47.44, 'b Cummins', 1),
(4, 6, 1, 4, 0, 2, 0, 0, 0.00, 'c de Kock b Maharaj', 1),
(5, 6, 1, 4, 42, 31, 6, 0, 135.48, 'c Babar b Amir', 1),
(16, 6, 2, 5, 9, 5, 1, 0, 180.00, 'b Starc', 1),
(4, 4, 1, 6, 5, 2, 1, 0, 250.00, 'not out', 0),
(16, 4, 2, 6, 28, 14, 2, 2, 200.00, 'not out', 0),
(1, 10, 1, 1, 89, 101, 11, 2, 88.12, 'c Pant b Bumrah', 1),
(6, 10, 1, 1, 34, 18, 2, 3, 188.89, 'b Archer', 1),
(7, 10, 1, 1, 154, 129, 20, 5, 119.38, 'not out', 0),
(16, 10, 1, 1, 68, 34, 7, 4, 200.00, 'c Rohit b Bumrah', 1),
(5, 17, 2, 2, 13, 10, 2, 0, 130.00, 'c Suryakumar b Bumrah', 1),
(9, 17, 1, 3, 30, 71, 5, 0, 42.25, 'lbw b Woakes', 1),
(10, 17, 1, 3, 82, 110, 9, 1, 74.55, 'c Root b Leach', 1),
(8, 21, 1, 3, 106, 114, 8, 1, 92.98, 'c Carey b Hazlewood', 1),
(9, 21, 2, 3, 262, 375, 17, 0, 69.86, 'c Rizwan b Salman', 1),
(4, 27, 2, 5, 52, 27, 2, 5, 192.59, 'c Pant b Hardik', 1),
(21, 27, 1, 4, 108, 68, 9, 6, 158.82, 'not out', 0),
(16, 13, 1, 3, 38, 18, 4, 2, 211.11, 'c Hardik b Arshdeep', 1),
(6, 13, 1, 4, 28, 15, 3, 1, 186.67, 'c Buttler b Rashid', 1);

-- Insert Bowling Scores
INSERT INTO bowling_scores (match_id, player_id, innings_num, overs_bowled, maidens, runs_conceded, wickets_taken, economy_rate) VALUES
(1, 3, 1, 18.0, 4, 30, 5, 1.67),
(1, 3, 2, 12.2, 2, 42, 3, 3.41),
(4, 3, 2, 4.0, 0, 18, 2, 4.50),
(5, 3, 2, 4.0, 0, 14, 3, 3.50),
(16, 3, 1, 4.0, 0, 28, 2, 7.00),
(17, 3, 1, 4.0, 0, 24, 2, 6.00),
(1, 11, 1, 17.4, 3, 67, 4, 3.80),
(1, 11, 2, 15.0, 2, 54, 2, 3.60),
(16, 11, 2, 3.0, 0, 34, 1, 11.33),
(1, 12, 1, 19.0, 2, 72, 3, 3.79),
(7, 12, 2, 9.0, 1, 48, 2, 5.33),
(16, 12, 2, 3.5, 0, 39, 1, 10.17),
(4, 4, 2, 3.0, 0, 20, 3, 6.67),
(5, 4, 2, 4.0, 0, 24, 2, 6.00),
(16, 4, 1, 4.0, 0, 44, 0, 11.00),
(5, 18, 1, 4.0, 0, 29, 1, 7.25),
(10, 18, 2, 16.0, 3, 51, 3, 3.19),
(4, 9, 2, 4.0, 0, 45, 0, 11.25),
(16, 9, 1, 4.0, 0, 39, 1, 9.75),
(13, 26, 2, 4.0, 0, 17, 3, 4.25),
(6, 24, 1, 4.0, 0, 28, 2, 7.00),
(8, 24, 2, 10.0, 0, 58, 2, 5.80);

-- Insert Fielding Stats
INSERT INTO fielding_stats (player_id, format, catches, stumpings) VALUES
(1, 'ODI', 152, 0),
(1, 'Test', 115, 0),
(1, 'T20I', 54, 0),
(2, 'ODI', 98, 0),
(2, 'Test', 62, 0),
(6, 'Test', 124, 14),
(6, 'T20I', 32, 8),
(15, 'Test', 182, 0),
(10, 'Test', 42, 0),
(21, 'Test', 198, 0),
(23, 'ODI', 214, 38),
(23, 'T20I', 68, 15);

-- Insert Partnerships
INSERT INTO partnerships (match_id, innings_num, player1_id, player2_id, runs, balls, wicket_number) VALUES
(1, 2, 8, 1, 201, 312, 2),
(7, 2, 2, 1, 124, 118, 2),
(16, 2, 1, 4, 78, 48, 5),
(4, 1, 1, 6, 82, 64, 4),
(9, 2, 21, 22, 145, 192, 4),
(21, 1, 27, 28, 114, 82, 5);
