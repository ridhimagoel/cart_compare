-- 002_procs_events.sql
-- Stored procedures and scheduled events to compute stats and check alerts.

-- proc_update_stats: compute avg/stddev/samples for each watchlist_id and upsert into product_stats
DROP PROCEDURE IF EXISTS proc_update_stats;
CREATE PROCEDURE proc_update_stats()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE wid BIGINT;
  DECLARE cur CURSOR FOR SELECT DISTINCT watchlist_id FROM price_history WHERE watchlist_id IS NOT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO wid;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    -- compute aggregates
    SELECT AVG(price) INTO @avg FROM price_history WHERE watchlist_id = wid AND price IS NOT NULL;
    SELECT STDDEV_POP(price) INTO @std FROM price_history WHERE watchlist_id = wid AND price IS NOT NULL;
    SELECT COUNT(*) INTO @samples FROM price_history WHERE watchlist_id = wid AND price IS NOT NULL;

    IF @samples IS NULL THEN
      SET @samples = 0;
    END IF;

    INSERT INTO product_stats (watchlist_id, avg_price, stddev_price, samples)
      VALUES (wid, @avg, @std, @samples)
      ON DUPLICATE KEY UPDATE
        avg_price = VALUES(avg_price),
        stddev_price = VALUES(stddev_price),
        samples = VALUES(samples),
        updated_at = CURRENT_TIMESTAMP;

  END LOOP;
  CLOSE cur;
END;

-- proc_check_alerts: for watchlist rows with target_price and not alerted, compare latest price and create alerts
DROP PROCEDURE IF EXISTS proc_check_alerts;
CREATE PROCEDURE proc_check_alerts()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE wid BIGINT;
  DECLARE target_price DECIMAL(12,2);
  DECLARE latest_price DECIMAL(12,2);
  DECLARE cur CURSOR FOR SELECT id, target_price FROM watchlist WHERE target_price IS NOT NULL AND alerted = 0;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO wid, target_price;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    SELECT price INTO latest_price FROM price_history WHERE watchlist_id = wid AND price IS NOT NULL ORDER BY fetched_at DESC LIMIT 1;

    IF latest_price IS NOT NULL AND latest_price <= target_price THEN
      INSERT INTO alerts (watchlist_id, price) VALUES (wid, latest_price);
      UPDATE watchlist SET alerted = 1 WHERE id = wid;
    END IF;

  END LOOP;
  CLOSE cur;
END;

-- Scheduled events (requires event_scheduler to be ON on the server)
CREATE EVENT IF NOT EXISTS ev_update_stats
ON SCHEDULE EVERY 10 MINUTE
DO CALL proc_update_stats();

CREATE EVENT IF NOT EXISTS ev_check_alerts
ON SCHEDULE EVERY 5 MINUTE
DO CALL proc_check_alerts();

-- Note: enabling the event scheduler may require SUPER privileges:
--   SET GLOBAL event_scheduler = ON;
