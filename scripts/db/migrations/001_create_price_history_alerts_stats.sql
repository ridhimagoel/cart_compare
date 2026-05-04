-- 001_create_price_history_alerts_stats.sql
-- Creates price_history, alerts, and product_stats tables and adds columns to watchlist

CREATE TABLE IF NOT EXISTS price_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  watchlist_id BIGINT NULL,
  title TEXT NOT NULL,
  price DECIMAL(12,2) NULL,
  store VARCHAR(100) NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (watchlist_id),
  INDEX (fetched_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  watchlist_id BIGINT NULL,
  price DECIMAL(12,2) NOT NULL,
  store VARCHAR(100) NULL,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged TINYINT(1) DEFAULT 0,
  INDEX (watchlist_id),
  INDEX (acknowledged)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  watchlist_id BIGINT NULL,
  avg_price DECIMAL(12,2) NULL,
  stddev_price DECIMAL(12,2) NULL,
  samples INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (watchlist_id)
) ENGINE=InnoDB;

-- Ensure watchlist has a target_price column and alerted flag
ALTER TABLE watchlist ADD COLUMN target_price DECIMAL(12,2) NULL;
ALTER TABLE watchlist ADD COLUMN alerted TINYINT(1) DEFAULT 0;

ALTER TABLE product_stats ADD UNIQUE INDEX ux_product_stats_watchlist_id (watchlist_id);
