SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS tournaments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL DEFAULT '赛事活动',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    status ENUM('idle','playing','finished','upcoming') DEFAULT 'idle',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
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
