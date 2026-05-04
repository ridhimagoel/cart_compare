-- Migration: add helpful indexes for search tables (non-destructive)
-- This migration adds non-destructive indexes to speed up queries
-- involving `search_history` and `search_results`.

ALTER TABLE `search_history`
  ADD INDEX `idx_search_history_user_id` (`user_id`),
  ADD INDEX `idx_search_history_created_at` (`created_at`);

ALTER TABLE `search_results`
  ADD INDEX `idx_search_results_search_history_id` (`search_history_id`),
  ADD INDEX `idx_search_results_store` (`store`(50)),
  ADD INDEX `idx_search_results_fetched_at` (`fetched_at`);

-- Notes:
-- 1) Some MySQL versions do not support `IF NOT EXISTS` for ADD INDEX; if your
--    migration runner errors on those statements, inspect existing indexes and
--    run the appropriate CREATE INDEX commands manually.
-- 2) To enforce referential integrity, consider adding foreign keys (run after
--    verifying there are no orphan rows and after taking a backup):
--      ALTER TABLE search_results ADD CONSTRAINT fk_search_results_history
--        FOREIGN KEY (search_history_id) REFERENCES search_history(id) ON DELETE CASCADE;
--      ALTER TABLE search_history ADD CONSTRAINT fk_search_history_user
--        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
