# DB Migrations & Scheduled Jobs

This document explains how to apply the provided MySQL migrations, enable the event scheduler, and run the provided migration script.

1) Set environment variables (example):

```
set DB_MYSQL_HOST=localhost
set DB_MYSQL_PORT=3306
set DB_MYSQL_USER=cartuser
set DB_MYSQL_PASSWORD=your_password
set DB_MYSQL_DATABASE=cart_compare
```

2) Run migrations (requires Node installed and `mysql2`):

```
node scripts/db/run_mysql_migrations.js
```

3) Events and privileges

- The migrations create two MySQL Events (`ev_update_stats`, `ev_check_alerts`) to run stored procedures on a schedule.
- The server must have the `event_scheduler` enabled. On a machine where you control MySQL you can run (requires SUPER/global privileges):

```
-- enable event scheduler (may require admin privileges)
SET GLOBAL event_scheduler = ON;
```

- If you cannot enable the scheduler at the server level, you can run the stored procedures from a separate cron/Node job that calls the SQL procedures periodically.

4) What the migrations do

- Create `price_history` table (stores scraped prices over time)
- Create `alerts` table (records triggered alerts)
- Create `product_stats` table (rolling aggregates per watchlist entry)
- Add `target_price` and `alerted` flag to `watchlist`
- Create stored procedures: `proc_update_stats`, `proc_check_alerts`
- Create scheduled events to run those procedures periodically

5) Troubleshooting

- If you get syntax errors when running the migrations, ensure your MySQL server is 8.0+ (or adjust SQL accordingly). Some ALTER TABLE IF NOT EXISTS forms are MySQL 8+.
- If `SET GLOBAL event_scheduler = ON` fails, you can run the procedures with an external scheduler instead.
