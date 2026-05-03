-- Migration: create search_results table
CREATE TABLE IF NOT EXISTS `search_results` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `search_history_id` BIGINT NOT NULL,
  `title` TEXT,
  `price` DECIMAL(12,2) DEFAULT NULL,
  `store` VARCHAR(100) DEFAULT NULL,
  `url` TEXT,
  `metadata` JSON DEFAULT NULL,
  `fetched_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `search_history_id` (`search_history_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
