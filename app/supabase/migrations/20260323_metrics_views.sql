-- ============================================================================
-- PORTPAL Metrics Views
--
-- Creates materialized/standard views for efficient YC-style metric queries.
-- These views aggregate bubble_users and bubble_shifts data to avoid
-- transferring all raw data to the client.
--
-- DO NOT APPLY — review first. These views are read-only and do not modify
-- any existing tables or data.
--
-- RLS Note: These views query bubble_users and bubble_shifts which currently
-- have no RLS policies (they are admin/internal tables). If RLS is added to
-- those tables in the future, these views will need SECURITY DEFINER functions
-- or explicit policy grants.
-- ============================================================================


-- 1. Weekly active users + signups + shifts + pay
--    One row per ISO week (Monday start)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_weekly_growth AS
SELECT
  date_trunc('week', s.date::date)::date AS week_start,
  COUNT(DISTINCT s.bubble_user_id) AS active_users,
  COUNT(*) AS shifts_logged,
  COALESCE(SUM(s.total_pay), 0) AS pay_tracked,
  -- New signups that week (from bubble_users.created_at)
  (
    SELECT COUNT(*)
    FROM public.bubble_users u
    WHERE date_trunc('week', u.created_at::date)::date = date_trunc('week', s.date::date)::date
  ) AS new_signups,
  -- Cumulative signups up to end of this week
  (
    SELECT COUNT(*)
    FROM public.bubble_users u
    WHERE u.created_at::date <= (date_trunc('week', s.date::date) + interval '6 days')::date
  ) AS cumulative_signups
FROM public.bubble_shifts s
WHERE s.date IS NOT NULL
GROUP BY date_trunc('week', s.date::date)::date
ORDER BY week_start;


-- 2. Daily active users (for DAU/WAU/MAU stickiness)
--    One row per day
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_daily_active AS
SELECT
  s.date::date AS day,
  COUNT(DISTINCT s.bubble_user_id) AS dau
FROM public.bubble_shifts s
WHERE s.date IS NOT NULL
GROUP BY s.date::date
ORDER BY day;


-- 3. Monthly cohort retention
--    Each row = one (cohort_month, activity_month) pair with the count of
--    cohort members active that month. Build the cohort triangle in the app.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_cohort_retention AS
WITH cohort AS (
  SELECT
    u.bubble_id,
    date_trunc('month', u.created_at)::date AS cohort_month
  FROM public.bubble_users u
  WHERE u.created_at IS NOT NULL
),
activity AS (
  SELECT DISTINCT
    s.bubble_user_id,
    date_trunc('month', s.date::date)::date AS activity_month
  FROM public.bubble_shifts s
  WHERE s.date IS NOT NULL
)
SELECT
  c.cohort_month,
  a.activity_month,
  -- Months since signup
  EXTRACT(YEAR FROM age(a.activity_month, c.cohort_month)) * 12
    + EXTRACT(MONTH FROM age(a.activity_month, c.cohort_month)) AS months_since_signup,
  COUNT(DISTINCT c.bubble_id) AS active_users,
  -- Cohort size for easy percentage calculation
  (
    SELECT COUNT(*) FROM cohort c2 WHERE c2.cohort_month = c.cohort_month
  ) AS cohort_size
FROM cohort c
JOIN activity a ON a.bubble_user_id = c.bubble_id
WHERE a.activity_month >= c.cohort_month
GROUP BY c.cohort_month, a.activity_month
ORDER BY c.cohort_month, a.activity_month;


-- 4. Peak usage hours
--    Shift logging distribution by hour of day (based on created_at)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_peak_hours AS
SELECT
  EXTRACT(HOUR FROM s.created_at AT TIME ZONE 'America/Vancouver') AS hour_of_day,
  COUNT(*) AS shift_count
FROM public.bubble_shifts s
WHERE s.created_at IS NOT NULL
GROUP BY EXTRACT(HOUR FROM s.created_at AT TIME ZONE 'America/Vancouver')
ORDER BY hour_of_day;


-- 5. Job type distribution
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_job_distribution AS
SELECT
  COALESCE(s.job, 'Unknown') AS job,
  COUNT(*) AS shift_count,
  COALESCE(SUM(s.total_pay), 0) AS total_pay
FROM public.bubble_shifts s
GROUP BY COALESCE(s.job, 'Unknown')
ORDER BY shift_count DESC;


-- 6. Shift type breakdown (DAY/NIGHT/GRAVEYARD)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_shift_types AS
SELECT
  COALESCE(s.shift, 'Unknown') AS shift_type,
  COUNT(*) AS shift_count
FROM public.bubble_shifts s
GROUP BY COALESCE(s.shift, 'Unknown')
ORDER BY shift_count DESC;


-- 7. Summary stats (single-row view for quick dashboard load)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.metrics_summary AS
SELECT
  (SELECT COUNT(*) FROM public.bubble_users) AS total_users,
  (SELECT COUNT(*) FROM public.bubble_users WHERE supabase_user_id IS NOT NULL) AS migrated_users,
  (
    SELECT COUNT(DISTINCT bubble_user_id)
    FROM public.bubble_shifts
    WHERE date >= (CURRENT_DATE - interval '7 days')::date
  ) AS active_users_7d,
  (
    SELECT COUNT(*)
    FROM public.bubble_shifts
    WHERE date >= (CURRENT_DATE - interval '7 days')::date
  ) AS shifts_7d,
  (SELECT COALESCE(SUM(total_pay), 0) FROM public.bubble_shifts) AS total_pay_tracked,
  (
    SELECT COALESCE(SUM(total_pay), 0)
    FROM public.bubble_shifts
    WHERE date >= date_trunc('month', CURRENT_DATE)::date
  ) AS monthly_pay_tracked;


-- ============================================================================
-- ROLLBACK (run manually if needed):
--
-- DROP VIEW IF EXISTS public.metrics_summary;
-- DROP VIEW IF EXISTS public.metrics_shift_types;
-- DROP VIEW IF EXISTS public.metrics_job_distribution;
-- DROP VIEW IF EXISTS public.metrics_peak_hours;
-- DROP VIEW IF EXISTS public.metrics_cohort_retention;
-- DROP VIEW IF EXISTS public.metrics_daily_active;
-- DROP VIEW IF EXISTS public.metrics_weekly_growth;
-- ============================================================================
