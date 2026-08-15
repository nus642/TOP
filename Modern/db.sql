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
    dispatch_id VARCHAR(100) DEFAULT NULL,
    dispatch_version BIGINT DEFAULT NULL,
    responsibility_accepted_at TIMESTAMP NULL DEFAULT NULL,
    started_at TIMESTAMP NULL DEFAULT NULL,
    result_confirmed_at TIMESTAMP NULL DEFAULT NULL,
    result_confirmed_by VARCHAR(100) DEFAULT NULL,
    status ENUM('idle','upcoming','assigned','waiting_acceptance','accepted','playing','interrupted','scored','awaiting_confirmation','confirmed','finished') DEFAULT 'idle',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- Additive upgrade for databases created before M2.
ALTER TABLE matches MODIFY COLUMN status
    ENUM('idle','upcoming','assigned','accepted','playing','interrupted','scored','awaiting_confirmation','confirmed','finished') DEFAULT 'idle';

-- M2 Competition Referee Roster and Atomic Dispatch support.
-- Upgrade path for databases created before dispatch coordination.
ALTER TABLE matches 
  MODIFY COLUMN status ENUM('idle','upcoming','assigned','waiting_acceptance','accepted','playing','interrupted','scored','awaiting_confirmation','confirmed','finished') DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS dispatch_id VARCHAR(100) DEFAULT NULL AFTER assigned_at,
  ADD COLUMN IF NOT EXISTS dispatch_version BIGINT DEFAULT NULL AFTER dispatch_id;

-- M2 Court Management authority. Schedule court references remain the source of
-- known Courts; these rows contain only mutable operating truth.
CREATE TABLE IF NOT EXISTS court_operating_conditions (
    tournament_id INT NOT NULL,
    court_id VARCHAR(100) NOT NULL,
    condition_name ENUM('available','occupied','constrained','uncertain') NOT NULL,
    source_type ENUM('initial_baseline','match_execution','master_report','migration_match_execution') NOT NULL,
    source_reference VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100) DEFAULT NULL,
    effective_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    last_chronology_id BIGINT DEFAULT NULL,
    PRIMARY KEY (tournament_id, court_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS court_disruptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    court_id VARCHAR(100) NOT NULL,
    affected_match_id INT DEFAULT NULL,
    opening_condition ENUM('constrained','uncertain') NOT NULL,
    disposition ENUM('attention_required','deferred','resolved') NOT NULL DEFAULT 'attention_required',
    opened_by VARCHAR(100) NOT NULL,
    opened_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    deferred_by VARCHAR(100) DEFAULT NULL,
    deferred_at TIMESTAMP(6) NULL DEFAULT NULL,
    recovered_by VARCHAR(100) DEFAULT NULL,
    recovered_at TIMESTAMP(6) NULL DEFAULT NULL,
    resolved_at TIMESTAMP(6) NULL DEFAULT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (affected_match_id) REFERENCES matches(id) ON DELETE SET NULL,
    INDEX ix_court_disruptions_open (tournament_id, court_id, disposition)
) DEFAULT CHARSET=utf8mb4;

-- M2 Competition Referee Roster. The Master controls which referees can be
-- assigned to matches in this competition. Only active and eligible referees
-- are dispatch candidates.
CREATE TABLE IF NOT EXISTS competition_referees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    referee_id VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (competition_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    UNIQUE KEY uq_competition_referees (competition_id, referee_id),
    INDEX ix_competition_referees_active (competition_id, active, eligible)
) DEFAULT CHARSET=utf8mb4;

-- M2 Referee Dispatch Reservations. Each dispatch creates one reservation row.
-- The dispatch is atomic: either all changes commit together, or all rollback.
-- The reservation tracks which referee accepted and when, and provides idempotency
-- through the correlation_id.
CREATE TABLE IF NOT EXISTS referee_dispatch_reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dispatch_id VARCHAR(100) NOT NULL,
    match_id INT NOT NULL,
    court_id VARCHAR(100) NOT NULL,
    referee_id VARCHAR(100) NOT NULL,
    expected_version BIGINT NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    accepted_at TIMESTAMP(6) DEFAULT NULL,
    rejected_at TIMESTAMP(6) DEFAULT NULL,
    rejected_reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE KEY uq_dispatch_correlation (correlation_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tournament_coordination_chronology (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    court_id VARCHAR(100) NOT NULL,
    match_id INT DEFAULT NULL,
    event_type VARCHAR(80) NOT NULL,
    source_type VARCHAR(40) NOT NULL,
    actor_id VARCHAR(100) DEFAULT NULL,
    effective_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    correlation_id VARCHAR(100) NOT NULL,
    court_version BIGINT DEFAULT NULL,
    disruption_version BIGINT DEFAULT NULL,
    details JSON DEFAULT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
    UNIQUE KEY uq_coordination_correlation (tournament_id, correlation_id),
    INDEX ix_coordination_history (tournament_id, effective_at, id)
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

-- Reconstruct current occupied truth only for execution that is active at migration.
INSERT IGNORE INTO court_operating_conditions
    (tournament_id, court_id, condition_name, source_type, source_reference, version)
SELECT m.tournament_id, ms.court_id, 'occupied', 'migration_match_execution',
       CONCAT('match:', m.id, ':migration'), 0
FROM matches m
JOIN match_schedules ms ON ms.tournament_id = m.tournament_id AND ms.match_id = m.id
WHERE m.status = 'playing' AND ms.court_id IS NOT NULL AND ms.court_id <> '';

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

-- Participant Readiness owns only check-in facts. Player identity and registration
-- remain referenced from Player Registration's players table.
CREATE TABLE IF NOT EXISTS player_check_ins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP NULL DEFAULT NULL,
    source VARCHAR(50) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_player_check_in (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- Additive migration: source column for Participant Readiness provenance.
-- MySQL does not support ADD COLUMN IF NOT EXISTS; safe to re-run on fresh schemas.
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='player_check_ins' AND COLUMN_NAME='source');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE player_check_ins ADD COLUMN source VARCHAR(50) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
