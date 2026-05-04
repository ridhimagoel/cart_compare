-- Migration: merge product_stats into watchlist (non-destructive)
-- Adds stats columns to `watchlist` and copies existing data from `product_stats`.
-- This migration does NOT drop `product_stats`; drop it only after verifying data.

-- Add stats columns to watchlist. Older MySQL versions do not support
-- `IF NOT EXISTS` for ADD COLUMN, so we issue plain ALTERs and let the
-- migration runner treat duplicate-column errors as non-fatal.
ALTER TABLE `watchlist` ADD COLUMN `avg_price` DECIMAL(12,2) NULL;
ALTER TABLE `watchlist` ADD COLUMN `stddev_price` DECIMAL(12,2) NULL;
ALTER TABLE `watchlist` ADD COLUMN `stats_samples` INT DEFAULT 0;
ALTER TABLE `watchlist` ADD COLUMN `stats_updated_at` TIMESTAMP NULL;

-- Copy data from product_stats into watchlist where watchlist_id matches
UPDATE `watchlist` w
  JOIN `product_stats` p ON p.watchlist_id = w.id
  SET w.avg_price = p.avg_price,
      w.stddev_price = p.stddev_price,
      w.stats_samples = p.samples,
      w.stats_updated_at = p.updated_at
  WHERE p.watchlist_id IS NOT NULL;

-- After validating the copied data and backups, you may DROP `product_stats`:
--   DROP TABLE IF EXISTS product_stats;

-- If you prefer to keep a normalized stats table, skip this migration and
-- instead add a UNIQUE INDEX on product_stats.watchlist_id to enforce one-row-per-watchlist.
