SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS tournaments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL DEFAULT '赛事活动',
    sport VARCHAR(50) NOT NULL DEFAULT 'pickleball',
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    level INT DEFAULT 3,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    net INT DEFAULT 0,
    curP INT DEFAULT 0,
    lastR INT DEFAULT -2,
    paired BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    UNIQUE KEY uq_teams_tournament_name (tournament_id, name)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    player_id INT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_members_team_player (team_id, player_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS team_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    code VARCHAR(50),
    name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_rooms_tournament_code (tournament_id, code)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    round_num INT NOT NULL,
    court VARCHAR(20) NOT NULL,
    player1_id INT,
    player2_id INT,
    player3_id INT,
    player4_id INT,
    team1_name VARCHAR(100),
    team2_name VARCHAR(100),
    score1 INT DEFAULT NULL,
    score2 INT DEFAULT NULL,
    referee_id VARCHAR(100) DEFAULT NULL,
    assigned_at TIMESTAMP NULL DEFAULT NULL,
    responsibility_accepted_at TIMESTAMP NULL DEFAULT NULL,
    result_confirmed_at TIMESTAMP NULL DEFAULT NULL,
    result_confirmed_by VARCHAR(100) DEFAULT NULL,
    status ENUM('idle','upcoming','assigned','playing','scored','awaiting_confirmation','confirmed','finished') DEFAULT 'idle',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- Scheduling owns these placement facts; match execution remains in matches.
CREATE TABLE IF NOT EXISTS match_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    match_id INT NOT NULL,
    scheduled_at DATETIME(6) NOT NULL,
    court_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE KEY uq_match_schedules_match (match_id),
    INDEX ix_match_schedules_competition_time (tournament_id, scheduled_at)
) DEFAULT CHARSET=utf8mb4;

-- Append-only trusted records created by official match confirmation. Their
-- identity and attribution remain independent from the mutable match row.
CREATE TABLE IF NOT EXISTS match_official_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    match_id INT NOT NULL,
    referee_id VARCHAR(100) NOT NULL,
    score1 INT NOT NULL,
    score2 INT NOT NULL,
    confirmed_by VARCHAR(100) NOT NULL,
    confirmed_at TIMESTAMP(6) NOT NULL,
    confirmation_responsibility VARCHAR(100) NOT NULL DEFAULT 'referee_result_confirmation',
    evidence_reference VARCHAR(500) DEFAULT NULL,
    evidence_metadata JSON DEFAULT NULL,
    provenance JSON DEFAULT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    INDEX ix_match_official_records_history (tournament_id, match_id, confirmed_at, id)
) DEFAULT CHARSET=utf8mb4;

-- Read-only projection for operational visibility. Every value remains owned by
-- its source table: lifecycle by tournaments, placement by match_schedules, and
-- execution/referee state by matches.
CREATE OR REPLACE VIEW master_operational_match_overview AS
SELECT
    m.tournament_id AS competition_id,
    t.status AS competition_status,
    m.id AS match_id,
    m.round_num AS round_number,
    m.team1_name,
    m.team2_name,
    ms.scheduled_at,
    ms.court_id,
    m.referee_id,
    m.status AS operation_status,
    m.assigned_at,
    m.responsibility_accepted_at,
    m.result_confirmed_at
FROM matches m
JOIN tournaments t ON t.id = m.tournament_id
LEFT JOIN match_schedules ms
    ON ms.tournament_id = m.tournament_id AND ms.match_id = m.id;

-- Materialized competition result facts, derived only from confirmed official records.
CREATE TABLE IF NOT EXISTS competition_standings (
    competition_id INT NOT NULL,
    participant_id INT NOT NULL,
    played INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    score_for INT NOT NULL DEFAULT 0,
    score_against INT NOT NULL DEFAULT 0,
    score_difference INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (competition_id, participant_id),
    FOREIGN KEY (competition_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES players(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pairings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_partners (
    player_id INT NOT NULL,
    partner_id INT NOT NULL,
    tournament_id INT NOT NULL,
    PRIMARY KEY (player_id, partner_id, tournament_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_opponents (
    player_id INT NOT NULL,
    opponent_id INT NOT NULL,
    tournament_id INT NOT NULL,
    PRIMARY KEY (player_id, opponent_id, tournament_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_check_ins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_player_check_in (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS waivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    waiver_version VARCHAR(50) NOT NULL,
    accepted_by VARCHAR(100) NOT NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_waivers_player (tournament_id, player_id, accepted_at)
) DEFAULT CHARSET=utf8mb4;
