-- ============================================================================
-- PORTPAL Database Schema v2 (ML-Ready)
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- This schema replaces v1. If migrating from v1, see MIGRATION notes below.
--
-- Architecture:
--   TIER 1: Reference tables (system-managed, all authenticated users can read)
--   TIER 2: User tables (RLS-protected, users only see their own data)
--   TIER 3: ML/Analytics tables (for future AI features)
-- ============================================================================


-- ============================================================================
-- TIER 1: REFERENCE TABLES
-- These hold the pay engine data. Readable by all authenticated users.
-- Only admins/migrations should write to these.
-- ============================================================================

-- 1. Differential Classes
-- Maps job classification → per-hour pay differential
CREATE TABLE IF NOT EXISTS public.differential_classes (
  id text PRIMARY KEY,            -- 'BASE', 'CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'WHEAT', 'TRAINER'
  amount numeric NOT NULL,        -- Dollar amount added per hour (e.g., 2.50)
  description text
);

-- 2. Jobs
-- Canonical job list with differential classification
CREATE TABLE IF NOT EXISTS public.jobs (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,                          -- e.g., 'TRACTOR TRAILER'
  differential_class_id text REFERENCES public.differential_classes(id),
  differential_amount numeric NOT NULL DEFAULT 0,     -- Denormalized for fast lookup
  sort_order int DEFAULT 0
);

-- 3. Locations
-- Canonical terminal/site list
CREATE TABLE IF NOT EXISTS public.locations (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,        -- e.g., 'CENTENNIAL'
  location_type text DEFAULT 'TERMINAL' CHECK (location_type IN ('TERMINAL', 'WHEAT', 'OTHER')),
  default_day_hours numeric DEFAULT 8,
  default_night_hours numeric DEFAULT 8,
  default_graveyard_hours numeric DEFAULT 6.5,
  sort_order int DEFAULT 0
);

-- 4. Subjobs
-- Valid subjob options per job
CREATE TABLE IF NOT EXISTS public.subjobs (
  id serial PRIMARY KEY,
  job_name text NOT NULL REFERENCES public.jobs(name),
  name text NOT NULL,
  UNIQUE(job_name, name)
);

-- 5. Contract Years
-- BCMEA collective agreement rate periods (2023-2027)
CREATE TABLE IF NOT EXISTS public.contract_years (
  id serial PRIMARY KEY,
  year_number int UNIQUE NOT NULL,       -- 1, 2, 3, 4
  effective_start date NOT NULL,
  effective_end date NOT NULL,
  stbr numeric NOT NULL,                 -- Straight Time Base Rate
  holiday_rate numeric NOT NULL           -- 2x STBR
);

-- 6. Base Rates
-- Full rate table: shift × day_type × contract_year
CREATE TABLE IF NOT EXISTS public.base_rates (
  id serial PRIMARY KEY,
  contract_year_id int REFERENCES public.contract_years(id),
  shift text NOT NULL CHECK (shift IN ('DAY', 'NIGHT', 'GRAVEYARD')),
  day_type text NOT NULL CHECK (day_type IN ('MON-FRI', 'SAT', 'SUN-HOL')),
  regular_rate numeric NOT NULL,
  overtime_rate numeric NOT NULL,         -- 1.5x
  double_time_rate numeric NOT NULL,      -- 2x
  UNIQUE(contract_year_id, shift, day_type)
);

-- 7. Hour Overrides (replaces Bubble PAYDIFFS)
-- Non-standard hours by job+shift+location+subjob
-- If no match → use location defaults (8/8/6.5)
CREATE TABLE IF NOT EXISTS public.hour_overrides (
  id serial PRIMARY KEY,
  job_name text NOT NULL,
  shift text NOT NULL CHECK (shift IN ('DAY', 'NIGHT', 'GRAVEYARD')),
  location_name text NOT NULL,
  subjob_name text DEFAULT '',
  reg_hours numeric NOT NULL,
  ot_hours numeric NOT NULL DEFAULT 0,
  UNIQUE(job_name, shift, location_name, subjob_name)
);


-- ============================================================================
-- TIER 2: USER TABLES
-- Per-user data, protected by Row Level Security.
-- ============================================================================

-- 8. Profiles (enhanced from v1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  seniority integer,
  board text DEFAULT 'A',
  pension_goal numeric DEFAULT 120000,
  union_local text DEFAULT '500',         -- ILWU local number
  home_terminal text,                     -- Preferred terminal
  created_at timestamptz DEFAULT now()
);

-- 9. Shifts (enhanced for ML)
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  day_of_week smallint GENERATED ALWAYS AS (EXTRACT(DOW FROM date)::smallint) STORED,
  job text NOT NULL,
  location text NOT NULL,
  subjob text,
  shift text NOT NULL CHECK (shift IN ('DAY', 'NIGHT', 'GRAVEYARD')),
  reg_hours numeric NOT NULL DEFAULT 8,
  ot_hours numeric NOT NULL DEFAULT 0,
  dt_hours numeric NOT NULL DEFAULT 0,          -- Double time hours
  reg_rate numeric NOT NULL,
  ot_rate numeric NOT NULL,
  dt_rate numeric,                              -- Double time rate
  total_pay numeric NOT NULL,                   -- User-reported pay
  expected_pay numeric,                         -- System-calculated from reference tables
  notes text,
  vessel text,
  foreman text,
  verification_status text DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'DISCREPANCY')),
  created_at timestamptz DEFAULT now()
);

-- 10. Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  job text NOT NULL,
  location text NOT NULL,
  subjob text,
  shift text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 11. Custom Locations
CREATE TABLE IF NOT EXISTS public.custom_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);


-- ============================================================================
-- TIER 3: ML / ANALYTICS TABLES
-- For future AI features (pay verification, anomaly detection, predictions)
-- ============================================================================

-- 12. Pay Verifications
-- Links a shift to a pay stub for comparison
CREATE TABLE IF NOT EXISTS public.pay_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  stub_image_url text,                    -- Pay stub photo/upload
  stub_amount numeric,                    -- Amount shown on pay stub
  calculated_amount numeric,              -- What the pay engine says it should be
  discrepancy numeric GENERATED ALWAYS AS (stub_amount - calculated_amount) STORED,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MATCH', 'DISCREPANCY', 'RESOLVED')),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Reference tables: readable by all authenticated users, no writes via API
ALTER TABLE public.differential_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read differential_classes" ON public.differential_classes FOR SELECT USING (true);
CREATE POLICY "Anyone can read jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Anyone can read subjobs" ON public.subjobs FOR SELECT USING (true);
CREATE POLICY "Anyone can read contract_years" ON public.contract_years FOR SELECT USING (true);
CREATE POLICY "Anyone can read base_rates" ON public.base_rates FOR SELECT USING (true);
CREATE POLICY "Anyone can read hour_overrides" ON public.hour_overrides FOR SELECT USING (true);

-- User tables: users can only CRUD their own data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_verifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shifts
CREATE POLICY "Users can view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shifts" ON public.shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shifts" ON public.shifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shifts" ON public.shifts FOR DELETE USING (auth.uid() = user_id);

-- Templates
CREATE POLICY "Users can view own templates" ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);

-- Custom locations
CREATE POLICY "Users can view own custom locations" ON public.custom_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom locations" ON public.custom_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom locations" ON public.custom_locations FOR DELETE USING (auth.uid() = user_id);

-- Pay verifications
CREATE POLICY "Users can view own verifications" ON public.pay_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verifications" ON public.pay_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own verifications" ON public.pay_verifications FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-compute expected_pay on shift insert/update
CREATE OR REPLACE FUNCTION public.compute_expected_pay()
RETURNS trigger AS $$
DECLARE
  v_day_of_week smallint;
  v_day_type text;
  v_contract_year_id int;
  v_base_rate numeric;
  v_ot_rate numeric;
  v_differential numeric;
  v_expected numeric;
BEGIN
  -- Determine day type from date
  v_day_of_week := EXTRACT(DOW FROM NEW.date)::smallint;
  IF v_day_of_week = 0 THEN
    v_day_type := 'SUN-HOL';
  ELSIF v_day_of_week = 6 THEN
    v_day_type := 'SAT';
  ELSE
    v_day_type := 'MON-FRI';
  END IF;

  -- Find contract year for this date
  SELECT id INTO v_contract_year_id
  FROM public.contract_years
  WHERE NEW.date >= effective_start AND NEW.date < effective_end
  LIMIT 1;

  IF v_contract_year_id IS NULL THEN
    -- No matching contract year, skip calculation
    NEW.expected_pay := NULL;
    RETURN NEW;
  END IF;

  -- Get base rate for shift + day_type + contract_year
  SELECT regular_rate, overtime_rate INTO v_base_rate, v_ot_rate
  FROM public.base_rates
  WHERE contract_year_id = v_contract_year_id
    AND shift = NEW.shift
    AND day_type = v_day_type;

  IF v_base_rate IS NULL THEN
    NEW.expected_pay := NULL;
    RETURN NEW;
  END IF;

  -- Get job differential
  SELECT COALESCE(differential_amount, 0) INTO v_differential
  FROM public.jobs
  WHERE name = NEW.job;

  IF v_differential IS NULL THEN
    v_differential := 0;
  END IF;

  -- Calculate expected pay
  -- Regular: (base_rate + differential) × reg_hours
  -- OT: (base_rate + differential) × 1.5 × ot_hours
  v_expected := ((v_base_rate + v_differential) * NEW.reg_hours)
              + ((v_base_rate + v_differential) * 1.5 * NEW.ot_hours);

  -- Add double time if applicable
  IF NEW.dt_hours > 0 AND NEW.dt_rate IS NOT NULL THEN
    v_expected := v_expected + (NEW.dt_rate * NEW.dt_hours);
  END IF;

  NEW.expected_pay := ROUND(v_expected, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS compute_expected_pay_trigger ON public.shifts;
CREATE TRIGGER compute_expected_pay_trigger
  BEFORE INSERT OR UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.compute_expected_pay();


-- ============================================================================
-- INDEXES
-- ============================================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON public.shifts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_job ON public.shifts(job);
CREATE INDEX IF NOT EXISTS idx_shifts_location ON public.shifts(location);
CREATE INDEX IF NOT EXISTS idx_shifts_day_of_week ON public.shifts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_shifts_verification ON public.shifts(verification_status);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_locations_user_id ON public.custom_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_verifications_user_id ON public.pay_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_verifications_shift_id ON public.pay_verifications(shift_id);

-- Reference table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_name ON public.jobs(name);
CREATE INDEX IF NOT EXISTS idx_jobs_diff_class ON public.jobs(differential_class_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_hour_overrides_lookup ON public.hour_overrides(job_name, shift, location_name, subjob_name);
CREATE INDEX IF NOT EXISTS idx_base_rates_lookup ON public.base_rates(contract_year_id, shift, day_type);


-- ============================================================================
-- SEED DATA: Differential Classes
-- ============================================================================

INSERT INTO public.differential_classes (id, amount, description) VALUES
  ('BASE',    0.00, 'No differential - base longshoreman rate'),
  ('CLASS_1', 2.50, 'Certified tradespersons'),
  ('CLASS_2', 1.00, 'Heavy equipment operators, specialized dock/ship roles'),
  ('CLASS_3', 0.65, 'Mobile equipment operators, specialized dock roles'),
  ('CLASS_4', 0.50, 'Grain, lift truck, checker, first aid, service roles'),
  ('WHEAT',   1.15, 'Wheat jobs (Class 4 + grain commodity supplement)'),
  ('TRAINER', 1.67, 'Trainer differential (special multiplier applies)')
ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, description = EXCLUDED.description;


-- ============================================================================
-- SEED DATA: Jobs (44 canonical jobs from Bubble database)
-- ============================================================================

INSERT INTO public.jobs (name, differential_class_id, differential_amount, sort_order) VALUES
  ('40 TON (TOP PICK)',    'CLASS_3', 0.65,  1),
  ('BULLDOZER',            'CLASS_3', 0.65,  2),
  ('BULK OPERATOR',        'CLASS_2', 1.00,  3),
  ('BUNNY BUS',            'BASE',    0.00,  4),
  ('CARPENTER',            'CLASS_1', 2.50,  5),
  ('DOCK CHECKER',         'BASE',    0.00,  6),
  ('DOCK GANTRY',          'CLASS_2', 1.00,  7),
  ('DOW MEN',              'BASE',    0.00,  8),
  ('ELECTRICIAN',          'CLASS_1', 2.50,  9),
  ('EXCAVATOR',            'CLASS_3', 0.65, 10),
  ('FIRST AID',            'CLASS_2', 1.00, 11),
  ('FRONT END LOADER',     'CLASS_3', 0.65, 12),
  ('GEARPERSON',           'CLASS_4', 0.50, 13),
  ('HATCH TENDER/SIGNAL',  'CLASS_2', 1.00, 14),
  ('HD MECHANIC',          'CLASS_1', 2.50, 15),
  ('HEAD CHECKER',         'CLASS_3', 0.65, 16),
  ('KOMATSU',              'CLASS_3', 0.65, 17),
  ('LABOUR',               'BASE',    0.00, 18),
  ('LIFT TRUCK',           'CLASS_4', 0.50, 19),
  ('LINES',                'BASE',    0.00, 20),
  ('LIQUID BULK',          'BASE',    0.00, 21),
  ('LOCI',                 'CLASS_3', 0.65, 22),
  ('LOCKERMAN',            'BASE',    0.00, 23),
  ('MILLWRIGHT',           'CLASS_1', 2.50, 24),
  ('MOBILE CRANE',         'CLASS_3', 0.65, 25),
  ('OB',                   'BASE',    0.00, 26),
  ('PAINTER',              'BASE',    0.00, 27),
  ('PLUMBER',              'CLASS_1', 2.50, 28),
  ('PUSHER',               'BASE',    0.00, 29),
  ('RAIL MOUNTED GANTRY',  'CLASS_2', 1.00, 30),
  ('REACHSTACKER',         'CLASS_3', 0.65, 31),
  ('RUBBER TIRE GANTRY',   'CLASS_2', 1.00, 32),
  ('SHIP GANTRY',          'CLASS_2', 1.00, 33),
  ('STORESPERSON',         'CLASS_2', 1.00, 34),
  ('SWITCHMAN',            'CLASS_3', 0.65, 35),
  ('TRACKMEN',             'CLASS_1', 2.50, 36),
  ('TRACTOR TRAILER',      'CLASS_3', 0.65, 37),
  ('TRAINER',              'TRAINER', 1.67, 38),
  ('TRAINING',             'BASE',    0.00, 39),
  ('WELDER',               'CLASS_1', 2.50, 40),
  ('WHEAT MACHINE',        'WHEAT',   1.15, 41),
  ('WHEAT SPECIALTY',      'WHEAT',   1.15, 42),
  ('WINCH DRIVER',         'CLASS_2', 1.00, 43)
ON CONFLICT (name) DO UPDATE SET
  differential_class_id = EXCLUDED.differential_class_id,
  differential_amount = EXCLUDED.differential_amount,
  sort_order = EXCLUDED.sort_order;


-- ============================================================================
-- SEED DATA: Locations (24 terminals/sites)
-- ============================================================================

INSERT INTO public.locations (name, location_type, default_day_hours, default_night_hours, default_graveyard_hours, sort_order) VALUES
  ('CENTENNIAL',              'TERMINAL', 9,   9,   7.5, 1),
  ('VANTERM',                 'TERMINAL', 8,   8,   6.5, 2),
  ('DELTAPORT',              'TERMINAL', 8,   8,   6.5, 3),
  ('FRASER SURREY',           'TERMINAL', 8,   8,   6.5, 4),
  ('LYNNTERM',                'TERMINAL', 8,   8,   6.5, 5),
  ('NEPTUNE',                 'TERMINAL', 8,   8,   6.5, 6),
  ('VAN WHARVES',             'TERMINAL', 8,   8,   6.5, 7),
  ('CANADA PLACE',            'TERMINAL', 8,   8,   6.5, 8),
  ('PORT MOODY',              'TERMINAL', 8,   8,   6.5, 9),
  ('SQUAMISH',                'TERMINAL', 8,   8,   6.5, 10),
  ('FIBRECO',                 'TERMINAL', 8,   8,   6.5, 11),
  ('ANNACIS AUTO',            'TERMINAL', 8,   8,   6.5, 12),
  ('BC SUGAR',                'TERMINAL', 8,   8,   6.5, 13),
  ('CHEMTRADE',               'TERMINAL', 8,   8,   6.5, 14),
  ('UNIVAR',                  'TERMINAL', 8,   8,   6.5, 15),
  ('WATERFRONT TRAIN. CNTR',  'TERMINAL', 8,   8,   6.5, 16),
  ('WESTERN LOCKER',          'TERMINAL', 8,   8,   6.5, 17),
  ('ALLIANCE GRAIN',          'WHEAT',    7.5, 7.5, 7.5, 18),
  ('G3',                      'WHEAT',    7.5, 7.5, 7.5, 19),
  ('CASCADIA',                'WHEAT',    7.5, 7.5, 7.5, 20),
  ('RICHARDSON',              'WHEAT',    7.5, 7.5, 7.5, 21),
  ('CARGILL',                 'WHEAT',    7.5, 7.5, 7.5, 22),
  ('VITERRA PAC',             'WHEAT',    7.5, 7.5, 7.5, 23),
  ('G3 TERMINAL',             'WHEAT',    7.5, 7.5, 7.5, 24)
ON CONFLICT (name) DO UPDATE SET
  location_type = EXCLUDED.location_type,
  default_day_hours = EXCLUDED.default_day_hours,
  default_night_hours = EXCLUDED.default_night_hours,
  default_graveyard_hours = EXCLUDED.default_graveyard_hours,
  sort_order = EXCLUDED.sort_order;


-- ============================================================================
-- SEED DATA: Subjobs
-- ============================================================================

INSERT INTO public.subjobs (job_name, name) VALUES
  -- TRACTOR TRAILER
  ('TRACTOR TRAILER', 'RAIL (TT)'),
  ('TRACTOR TRAILER', 'SHIP (TT)'),
  ('TRACTOR TRAILER', 'YARD (TT)'),
  ('TRACTOR TRAILER', 'BARGE (TT)'),
  ('TRACTOR TRAILER', 'RAIL (HC)'),
  -- HEAD CHECKER
  ('HEAD CHECKER', 'TOWER (HC)'),
  ('HEAD CHECKER', 'RAIL (HC)'),
  ('HEAD CHECKER', 'INGATE (HC)'),
  ('HEAD CHECKER', 'OUTGATE (HC)'),
  ('HEAD CHECKER', 'CANOPY (HC)'),
  ('HEAD CHECKER', 'GOPHER (HC)'),
  ('HEAD CHECKER', 'PENTHOUSE (HC)'),
  ('HEAD CHECKER', 'REEFER (HC)'),
  ('HEAD CHECKER', 'EQUIP. CONTROL (HC)'),
  ('HEAD CHECKER', 'RAIL PLANNER (HC)'),
  ('HEAD CHECKER', 'RAIL PLNR -GOPHER  (HC)'),
  ('HEAD CHECKER', 'YARD PLANNER (HC)'),
  -- LABOUR
  ('LABOUR', 'LASHING (LAB)'),
  ('LABOUR', 'SHEDMEN (LAB)'),
  ('LABOUR', 'COASTWISE (LAB)'),
  ('LABOUR', 'UTILITY (LAB)'),
  ('LABOUR', 'SPARE (LAB)'),
  ('LABOUR', 'JANITOR (LAB)'),
  ('LABOUR', 'HOLD (LAB)'),
  ('LABOUR', 'BLANK'),
  -- FIRST AID
  ('FIRST AID', 'DOCK (FA)'),
  ('FIRST AID', 'SHIP (FA)'),
  ('FIRST AID', 'STORES (FA)'),
  -- LIFT TRUCK
  ('LIFT TRUCK', 'BLANK'),
  -- DOCK CHECKER
  ('DOCK CHECKER', 'BLANK'),
  -- BULK OPERATOR
  ('BULK OPERATOR', 'BLANK'),
  -- LIQUID BULK
  ('LIQUID BULK', 'BLANK'),
  -- TRAINER
  ('TRAINER', 'SENIOR (TRNR)'),
  ('TRAINER', 'BLANK (TRNR)')
ON CONFLICT (job_name, name) DO NOTHING;


-- ============================================================================
-- SEED DATA: Contract Years (BCMEA 2023-2027)
-- ============================================================================

INSERT INTO public.contract_years (year_number, effective_start, effective_end, stbr, holiday_rate) VALUES
  (1, '2023-04-01', '2024-04-01', 50.64, 101.28),
  (2, '2024-04-01', '2025-04-01', 53.17, 106.34),
  (3, '2025-04-01', '2026-04-01', 55.30, 110.60),
  (4, '2026-04-01', '2027-04-01', 57.51, 115.02)
ON CONFLICT (year_number) DO UPDATE SET
  effective_start = EXCLUDED.effective_start,
  effective_end = EXCLUDED.effective_end,
  stbr = EXCLUDED.stbr,
  holiday_rate = EXCLUDED.holiday_rate;


-- ============================================================================
-- SEED DATA: Base Rates (all 4 years × 3 shifts × 3 day types = 36 rows)
-- Source: contractData.ts (ILWU Canada BCMEA Collective Agreement)
-- ============================================================================

-- Helper: get contract_year_id by year_number
-- Year 1 (Apr 2023 - Apr 2024), STBR = $50.64
INSERT INTO public.base_rates (contract_year_id, shift, day_type, regular_rate, overtime_rate, double_time_rate)
SELECT cy.id, v.shift, v.day_type, v.regular_rate, v.overtime_rate, v.double_time_rate
FROM public.contract_years cy
CROSS JOIN (VALUES
  ('DAY',       'MON-FRI',  50.64,  75.96, 101.28),
  ('DAY',       'SAT',      64.82,  97.23, 129.64),
  ('DAY',       'SUN-HOL',  81.02, 121.53, 162.04),
  ('NIGHT',     'MON-FRI',  63.80,  95.70, 127.60),
  ('NIGHT',     'SAT',      81.02, 121.53, 162.04),
  ('NIGHT',     'SUN-HOL',  81.02, 121.53, 162.04),
  ('GRAVEYARD', 'MON-FRI',  78.80, 118.20, 157.60),
  ('GRAVEYARD', 'SAT',      81.02, 121.53, 162.04),
  ('GRAVEYARD', 'SUN-HOL',  81.02, 121.53, 162.04)
) AS v(shift, day_type, regular_rate, overtime_rate, double_time_rate)
WHERE cy.year_number = 1
ON CONFLICT (contract_year_id, shift, day_type) DO UPDATE SET
  regular_rate = EXCLUDED.regular_rate,
  overtime_rate = EXCLUDED.overtime_rate,
  double_time_rate = EXCLUDED.double_time_rate;

-- Year 2 (Apr 2024 - Apr 2025), STBR = $53.17
INSERT INTO public.base_rates (contract_year_id, shift, day_type, regular_rate, overtime_rate, double_time_rate)
SELECT cy.id, v.shift, v.day_type, v.regular_rate, v.overtime_rate, v.double_time_rate
FROM public.contract_years cy
CROSS JOIN (VALUES
  ('DAY',       'MON-FRI',  53.17,  79.76, 106.34),
  ('DAY',       'SAT',      68.06, 102.09, 136.12),
  ('DAY',       'SUN-HOL',  85.07, 127.61, 170.14),
  ('NIGHT',     'MON-FRI',  66.98, 100.47, 133.96),
  ('NIGHT',     'SAT',      85.07, 127.61, 170.14),
  ('NIGHT',     'SUN-HOL',  85.07, 127.61, 170.14),
  ('GRAVEYARD', 'MON-FRI',  82.73, 124.10, 165.46),
  ('GRAVEYARD', 'SAT',      85.07, 127.61, 170.14),
  ('GRAVEYARD', 'SUN-HOL',  85.07, 127.61, 170.14)
) AS v(shift, day_type, regular_rate, overtime_rate, double_time_rate)
WHERE cy.year_number = 2
ON CONFLICT (contract_year_id, shift, day_type) DO UPDATE SET
  regular_rate = EXCLUDED.regular_rate,
  overtime_rate = EXCLUDED.overtime_rate,
  double_time_rate = EXCLUDED.double_time_rate;

-- Year 3 (Apr 2025 - Apr 2026), STBR = $55.30
INSERT INTO public.base_rates (contract_year_id, shift, day_type, regular_rate, overtime_rate, double_time_rate)
SELECT cy.id, v.shift, v.day_type, v.regular_rate, v.overtime_rate, v.double_time_rate
FROM public.contract_years cy
CROSS JOIN (VALUES
  ('DAY',       'MON-FRI',  55.30,  82.95, 110.60),
  ('DAY',       'SAT',      70.78, 106.17, 141.56),
  ('DAY',       'SUN-HOL',  88.48, 132.72, 176.96),
  ('NIGHT',     'MON-FRI',  69.67, 104.51, 139.34),
  ('NIGHT',     'SAT',      88.48, 132.72, 176.96),
  ('NIGHT',     'SUN-HOL',  88.48, 132.72, 176.96),
  ('GRAVEYARD', 'MON-FRI',  86.05, 129.08, 172.10),
  ('GRAVEYARD', 'SAT',      88.48, 132.72, 176.96),
  ('GRAVEYARD', 'SUN-HOL',  88.48, 132.72, 176.96)
) AS v(shift, day_type, regular_rate, overtime_rate, double_time_rate)
WHERE cy.year_number = 3
ON CONFLICT (contract_year_id, shift, day_type) DO UPDATE SET
  regular_rate = EXCLUDED.regular_rate,
  overtime_rate = EXCLUDED.overtime_rate,
  double_time_rate = EXCLUDED.double_time_rate;

-- Year 4 (Apr 2026 - Apr 2027), STBR = $57.51
INSERT INTO public.base_rates (contract_year_id, shift, day_type, regular_rate, overtime_rate, double_time_rate)
SELECT cy.id, v.shift, v.day_type, v.regular_rate, v.overtime_rate, v.double_time_rate
FROM public.contract_years cy
CROSS JOIN (VALUES
  ('DAY',       'MON-FRI',  57.51,  86.27, 115.02),
  ('DAY',       'SAT',      73.61, 110.42, 147.22),
  ('DAY',       'SUN-HOL',  92.02, 138.03, 184.04),
  ('NIGHT',     'MON-FRI',  72.45, 108.68, 144.90),
  ('NIGHT',     'SAT',      92.02, 138.03, 184.04),
  ('NIGHT',     'SUN-HOL',  92.02, 138.03, 184.04),
  ('GRAVEYARD', 'MON-FRI',  89.49, 134.24, 178.98),
  ('GRAVEYARD', 'SAT',      92.02, 138.03, 184.04),
  ('GRAVEYARD', 'SUN-HOL',  92.02, 138.03, 184.04)
) AS v(shift, day_type, regular_rate, overtime_rate, double_time_rate)
WHERE cy.year_number = 4
ON CONFLICT (contract_year_id, shift, day_type) DO UPDATE SET
  regular_rate = EXCLUDED.regular_rate,
  overtime_rate = EXCLUDED.overtime_rate,
  double_time_rate = EXCLUDED.double_time_rate;


-- ============================================================================
-- SEED DATA: Hour Overrides (224 entries from PAYDIFFS_clean.csv)
-- Only jobs/shifts/locations where hours differ from standard (8/8/6.5)
-- ============================================================================

INSERT INTO public.hour_overrides (job_name, shift, location_name, subjob_name, reg_hours, ot_hours) VALUES
  -- 40 TON (TOP PICK)
  ('40 TON (TOP PICK)', 'DAY', 'CENTENNIAL', '', 9, 0),
  ('40 TON (TOP PICK)', 'DAY', 'VANTERM', '', 9, 0),
  ('40 TON (TOP PICK)', 'GRAVEYARD', 'CENTENNIAL', '', 7.5, 0),
  ('40 TON (TOP PICK)', 'GRAVEYARD', 'VANTERM', '', 9, 0),
  ('40 TON (TOP PICK)', 'NIGHT', 'CENTENNIAL', '', 9, 0),
  ('40 TON (TOP PICK)', 'NIGHT', 'VANTERM', '', 9, 0),
  -- BULK OPERATOR
  ('BULK OPERATOR', 'DAY', 'NEPTUNE', '', 7.5, 0.5),
  ('BULK OPERATOR', 'DAY', 'PORT MOODY', '', 7.5, 0.5),
  ('BULK OPERATOR', 'DAY', 'VAN WHARVES', '', 7.5, 0.5),
  ('BULK OPERATOR', 'GRAVEYARD', 'NEPTUNE', '', 6, 0.5),
  ('BULK OPERATOR', 'GRAVEYARD', 'PORT MOODY', '', 7, 0),
  ('BULK OPERATOR', 'GRAVEYARD', 'VAN WHARVES', '', 6, 1),
  ('BULK OPERATOR', 'NIGHT', 'NEPTUNE', '', 7.5, 0.5),
  ('BULK OPERATOR', 'NIGHT', 'PORT MOODY', '', 7.5, 0.5),
  ('BULK OPERATOR', 'NIGHT', 'VAN WHARVES', '', 7.5, 1.5),
  -- BULLDOZER
  ('BULLDOZER', 'DAY', 'NEPTUNE', '', 7.5, 0.5),
  ('BULLDOZER', 'GRAVEYARD', 'NEPTUNE', '', 6, 1.5),
  -- BUNNY BUS
  ('BUNNY BUS', 'DAY', 'CENTENNIAL', '', 9, 0),
  ('BUNNY BUS', 'DAY', 'NEPTUNE', '', 7.5, 0.5),
  ('BUNNY BUS', 'DAY', 'VANTERM', '', 7.5, 0.5),
  ('BUNNY BUS', 'GRAVEYARD', 'CENTENNIAL', '', 7.5, 0),
  ('BUNNY BUS', 'NIGHT', 'CENTENNIAL', '', 9, 0),
  -- DOCK CHECKER
  ('DOCK CHECKER', 'DAY', 'CANADA PLACE', '', 7, 2),
  ('DOCK CHECKER', 'DAY', 'NEPTUNE', '', 7.5, 1),
  ('DOCK CHECKER', 'GRAVEYARD', 'NEPTUNE', '', 7.5, 2),
  -- DOW MEN
  ('DOW MEN', 'NIGHT', 'UNIVAR', '', 8.5, 0),
  -- ELECTRICIAN
  ('ELECTRICIAN', 'DAY', 'DELTAPORT', '', 7.5, 1.5),
  ('ELECTRICIAN', 'DAY', 'NEPTUNE', '', 7.5, 1.5),
  ('ELECTRICIAN', 'GRAVEYARD', 'DELTAPORT', '', 6, 1.5),
  ('ELECTRICIAN', 'NIGHT', 'DELTAPORT', '', 7.5, 1),
  ('ELECTRICIAN', 'NIGHT', 'NEPTUNE', '', 7.5, 1.5),
  -- EXCAVATOR
  ('EXCAVATOR', 'NIGHT', 'NEPTUNE', '', 7.5, 0.5),
  -- FIRST AID
  ('FIRST AID', 'DAY', 'CENTENNIAL', 'DOCK (FA)', 8, 1),
  ('FIRST AID', 'DAY', 'CENTENNIAL', 'SHIP (FA)', 8, 0.5),
  ('FIRST AID', 'DAY', 'DELTAPORT', 'DOCK (FA)', 8, 0.5),
  ('FIRST AID', 'DAY', 'FRASER SURREY', 'DOCK (FA)', 9, 0.5),
  ('FIRST AID', 'DAY', 'FRASER SURREY', 'SHIP (FA)', 8, 0.5),
  ('FIRST AID', 'DAY', 'LYNNTERM', 'DOCK (FA)', 8, 1),
  ('FIRST AID', 'DAY', 'NEPTUNE', 'DOCK (FA)', 8, 1.5),
  ('FIRST AID', 'DAY', 'PORT MOODY', 'DOCK (FA)', 8, 0.5),
  ('FIRST AID', 'DAY', 'PORT MOODY', 'STORES (FA)', 8, 1),
  ('FIRST AID', 'DAY', 'VAN WHARVES', 'DOCK (FA)', 8, 1.5),
  ('FIRST AID', 'DAY', 'VAN WHARVES', 'SHIP (FA)', 8, 0.5),
  ('FIRST AID', 'DAY', 'VAN WHARVES', 'STORES (FA)', 8, 1.5),
  ('FIRST AID', 'DAY', 'VANTERM', 'DOCK (FA)', 8, 1),
  ('FIRST AID', 'DAY', 'WATERFRONT TRAIN. CNTR', 'DOCK (FA)', 8, 0),
  ('FIRST AID', 'GRAVEYARD', 'CENTENNIAL', 'DOCK (FA)', 6.5, 1),
  ('FIRST AID', 'GRAVEYARD', 'DELTAPORT', 'DOCK (FA)', 6.5, 0.5),
  ('FIRST AID', 'GRAVEYARD', 'FRASER SURREY', 'DOCK (FA)', 7.5, 0.5),
  ('FIRST AID', 'GRAVEYARD', 'FRASER SURREY', 'SHIP (FA)', 7.5, 0.5),
  ('FIRST AID', 'GRAVEYARD', 'NEPTUNE', 'DOCK (FA)', 6.5, 0.5),
  ('FIRST AID', 'GRAVEYARD', 'PORT MOODY', 'SHIP (FA)', 6.5, 0.5),
  ('FIRST AID', 'GRAVEYARD', 'VAN WHARVES', 'DOCK (FA)', 6.5, 0.5),
  ('FIRST AID', 'NIGHT', 'CENTENNIAL', 'DOCK (FA)', 8, 1),
  ('FIRST AID', 'NIGHT', 'FRASER SURREY', 'SHIP (FA)', 8, 0.5),
  ('FIRST AID', 'NIGHT', 'PORT MOODY', 'DOCK (FA)', 8, 1),
  ('FIRST AID', 'NIGHT', 'PORT MOODY', 'STORES (FA)', 8, 1),
  -- FRONT END LOADER
  ('FRONT END LOADER', 'DAY', 'NEPTUNE', '', 7.5, 0.5),
  ('FRONT END LOADER', 'DAY', 'VAN WHARVES', '', 7.5, 1.5),
  ('FRONT END LOADER', 'GRAVEYARD', 'NEPTUNE', '', 6, 0.5),
  ('FRONT END LOADER', 'GRAVEYARD', 'VAN WHARVES', '', 6, 1.5),
  ('FRONT END LOADER', 'NIGHT', 'NEPTUNE', '', 7.5, 0.5),
  ('FRONT END LOADER', 'NIGHT', 'VAN WHARVES', '', 7.5, 0.5),
  -- HD MECHANIC
  ('HD MECHANIC', 'DAY', 'DELTAPORT', '', 7.5, 0.5),
  ('HD MECHANIC', 'DAY', 'FRASER SURREY', '', 9, 0),
  ('HD MECHANIC', 'GRAVEYARD', 'DELTAPORT', '', 6, 0.5),
  ('HD MECHANIC', 'GRAVEYARD', 'FRASER SURREY', '', 8, 0),
  ('HD MECHANIC', 'GRAVEYARD', 'VANTERM', '', 7, 0),
  ('HD MECHANIC', 'NIGHT', 'DELTAPORT', '', 7.5, 0.5),
  ('HD MECHANIC', 'NIGHT', 'FRASER SURREY', '', 9, 0),
  ('HD MECHANIC', 'NIGHT', 'VANTERM', '', 6.5, 0),
  -- HEAD CHECKER
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'CANOPY (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'EQUIP. CONTROL (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'GOPHER (HC)', 8, 1),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'INGATE (HC)', 8, 1),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'PENTHOUSE (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'RAIL (HC)', 9, 1),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'RAIL PLANNER (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'RAIL PLNR -GOPHER  (HC)', 9, 1),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'REEFER (HC)', 8, 1),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'TOWER (HC)', 9, 1),
  ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'YARD PLANNER (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'LYNNTERM', 'CANOPY (HC)', 8, 1.5),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'CANOPY (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'GOPHER (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'INGATE (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'OUTGATE (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'PENTHOUSE (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'RAIL (HC)', 8, 2),
  ('HEAD CHECKER', 'DAY', 'VANTERM', 'TOWER (HC)', 8, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'CANOPY (HC)', 7.5, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'EQUIP. CONTROL (HC)', 6.5, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'GOPHER (HC)', 6.5, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'INGATE (HC)', 7.5, 0.5),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL (HC)', 7.5, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL PLANNER (HC)', 6.5, 2),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL PLNR -GOPHER  (HC)', 7.5, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'TOWER (HC)', 7.5, 0),
  ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'CANOPY (HC)', 6.5, 0.5),
  ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'INGATE (HC)', 6.5, 1.5),
  ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'RAIL (HC)', 6.5, 1),
  ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'TOWER (HC)', 6.5, 0.5),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'CANOPY (HC)', 8, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'EQUIP. CONTROL (HC)', 8, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'GOPHER (HC)', 8, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'INGATE (HC)', 8, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'PENTHOUSE (HC)', 8, 2),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'RAIL (HC)', 9, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'RAIL PLANNER (HC)', 8, 2),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'RAIL PLNR -GOPHER  (HC)', 9, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'TOWER (HC)', 9, 1),
  ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'YARD PLANNER (HC)', 8, 2),
  ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'CANOPY (HC)', 8, 1.5),
  ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'INGATE (HC)', 8, 1.5),
  ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'OUTGATE (HC)', 8, 1.5),
  ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'PENTHOUSE (HC)', 8, 1.5),
  ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'RAIL (HC)', 8, 1),
  ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'TOWER (HC)', 8, 0.5),
  -- KOMATSU
  ('KOMATSU', 'DAY', 'NEPTUNE', '', 7, 1),
  -- LABOUR
  ('LABOUR', 'DAY', 'CENTENNIAL', 'SHEDMEN (LAB)', 9, 1),
  ('LABOUR', 'NIGHT', 'CENTENNIAL', 'SHEDMEN (LAB)', 9, 1),
  ('LABOUR', 'DAY', 'CENTENNIAL', 'JANITOR (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'CENTENNIAL', 'SPARE (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'CENTENNIAL', 'UTILITY (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'NEPTUNE', 'JANITOR (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'NEPTUNE', 'SPARE (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'NEPTUNE', 'UTILITY (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'VAN WHARVES', 'HOLD (LAB)', 8, 1),
  ('LABOUR', 'DAY', 'VAN WHARVES', 'UTILITY (LAB)', 8, 1),
  ('LABOUR', 'GRAVEYARD', 'CENTENNIAL', 'SHEDMEN (LAB)', 7.5, 1),
  ('LABOUR', 'NIGHT', 'VAN WHARVES', 'SPARE (LAB)', 8, 0.5),
  ('LABOUR', 'NIGHT', 'VAN WHARVES', 'UTILITY (LAB)', 8, 0.5),
  ('LABOUR', 'NIGHT', 'CANADA PLACE', 'COASTWISE (LAB)', 7.5, 0.5),
  ('LABOUR', 'NIGHT', 'CANADA PLACE', 'BLANK', 7, 0.5),
  -- LIFT TRUCK
  ('LIFT TRUCK', 'DAY', 'CANADA PLACE', '', 7, 2),
  ('LIFT TRUCK', 'DAY', 'CENTENNIAL', '', 9, 0),
  ('LIFT TRUCK', 'DAY', 'FRASER SURREY', '', 9, 0),
  ('LIFT TRUCK', 'DAY', 'NEPTUNE', '', 9, 0),
  ('LIFT TRUCK', 'GRAVEYARD', 'CENTENNIAL', '', 7.5, 0),
  ('LIFT TRUCK', 'NIGHT', 'CENTENNIAL', '', 9, 0),
  -- LINES
  ('LINES', 'DAY', 'VAN WHARVES', '', 4, 0),
  -- LIQUID BULK
  ('LIQUID BULK', 'DAY', 'PORT MOODY', '', 7.5, 0.5),
  ('LIQUID BULK', 'GRAVEYARD', 'PORT MOODY', '', 6, 0.5),
  ('LIQUID BULK', 'NIGHT', 'PORT MOODY', '', 7.5, 0.5),
  -- LOCI
  ('LOCI', 'DAY', 'NEPTUNE', '', 7.5, 0.5),
  ('LOCI', 'GRAVEYARD', 'NEPTUNE', '', 6, 0.5),
  ('LOCI', 'NIGHT', 'NEPTUNE', '', 7.5, 0.5),
  ('LOCI', 'NIGHT', 'VAN WHARVES', '', 0, 9),
  -- LOCKERMAN
  ('LOCKERMAN', 'DAY', 'VITERRA PAC', '', 9, 0),
  -- MOBILE CRANE
  ('MOBILE CRANE', 'DAY', 'CANADA PLACE', '', 7, 2),
  -- PLUMBER
  ('PLUMBER', 'DAY', 'NEPTUNE', '', 7.5, 1.5),
  ('PLUMBER', 'DAY', 'VAN WHARVES', '', 4, 4),
  -- RAIL MOUNTED GANTRY
  ('RAIL MOUNTED GANTRY', 'DAY', 'CENTENNIAL', '', 9, 0),
  ('RAIL MOUNTED GANTRY', 'GRAVEYARD', 'CENTENNIAL', '', 7.5, 0),
  ('RAIL MOUNTED GANTRY', 'NIGHT', 'CENTENNIAL', '', 9, 0),
  -- REACHSTACKER
  ('REACHSTACKER', 'DAY', 'CENTENNIAL', '', 9, 0),
  ('REACHSTACKER', 'GRAVEYARD', 'CENTENNIAL', '', 7.5, 0),
  ('REACHSTACKER', 'NIGHT', 'CENTENNIAL', '', 9, 0),
  -- RUBBER TIRE GANTRY
  ('RUBBER TIRE GANTRY', 'DAY', 'VANTERM', '', 9, 0),
  ('RUBBER TIRE GANTRY', 'GRAVEYARD', 'CENTENNIAL', '', 7.5, 0),
  ('RUBBER TIRE GANTRY', 'GRAVEYARD', 'VANTERM', '', 7.5, 0),
  ('RUBBER TIRE GANTRY', 'NIGHT', 'VANTERM', '', 6.5, 0),
  -- STORESPERSON
  ('STORESPERSON', 'DAY', 'CANADA PLACE', '', 7, 2),
  ('STORESPERSON', 'DAY', 'NEPTUNE', '', 7.5, 1.5),
  ('STORESPERSON', 'DAY', 'VANTERM', '', 9, 0),
  ('STORESPERSON', 'NIGHT', 'NEPTUNE', '', 7.5, 1.5),
  -- TRACTOR TRAILER
  ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', '', 9, 0),
  ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', 'RAIL (HC)', 9, 0),
  ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', 'RAIL (TT)', 9, 0),
  ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', 'SHIP (TT)', 9, 0),
  ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', 'YARD (TT)', 9, 0),
  ('TRACTOR TRAILER', 'DAY', 'DELTAPORT', 'SHIP (TT)', 8, 1),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'BARGE (TT)', 6.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL (HC)', 7.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL (TT)', 7.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'SHIP (TT)', 7.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'YARD (TT)', 7.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'DELTAPORT', 'RAIL (TT)', 7.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'DELTAPORT', 'SHIP (TT)', 7.5, 0),
  ('TRACTOR TRAILER', 'GRAVEYARD', 'VANTERM', 'RAIL (TT)', 7.5, 0),
  ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', '', 9, 0),
  ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', 'RAIL (HC)', 9, 0),
  ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', 'RAIL (TT)', 9, 0),
  ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', 'SHIP (TT)', 9, 0),
  ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', 'YARD (TT)', 9, 0),
  ('TRACTOR TRAILER', 'NIGHT', 'DELTAPORT', 'RAIL (TT)', 8, 1),
  ('TRACTOR TRAILER', 'NIGHT', 'DELTAPORT', 'SHIP (TT)', 8, 1),
  ('TRACTOR TRAILER', 'NIGHT', 'VANTERM', 'RAIL (TT)', 8, 1),
  ('TRACTOR TRAILER', 'NIGHT', 'VANTERM', 'SHIP (TT)', 8, 1),
  -- TRAINER
  ('TRAINER', 'DAY', 'CENTENNIAL', 'SENIOR (TRNR)', 9, 1),
  ('TRAINER', 'NIGHT', 'NEPTUNE', 'BLANK (TRNR)', 8, 1),
  -- WHEAT MACHINE
  ('WHEAT MACHINE', 'DAY', 'ALLIANCE GRAIN', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'DAY', 'CARGILL', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'DAY', 'CASCADIA', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'DAY', 'G3', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'DAY', 'RICHARDSON', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'DAY', 'VITERRA PAC', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'GRAVEYARD', 'ALLIANCE GRAIN', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'GRAVEYARD', 'G3', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'GRAVEYARD', 'RICHARDSON', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'NIGHT', 'CARGILL', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'NIGHT', 'CASCADIA', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'NIGHT', 'G3', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'NIGHT', 'RICHARDSON', '', 7.5, 0.5),
  ('WHEAT MACHINE', 'NIGHT', 'VITERRA PAC', '', 7.5, 0.5),
  -- WHEAT SPECIALTY
  ('WHEAT SPECIALTY', 'DAY', 'ALLIANCE GRAIN', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'DAY', 'CARGILL', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'DAY', 'CASCADIA', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'DAY', 'G3', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'DAY', 'RICHARDSON', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'DAY', 'VITERRA PAC', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'GRAVEYARD', 'ALLIANCE GRAIN', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'GRAVEYARD', 'CARGILL', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'GRAVEYARD', 'CASCADIA', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'GRAVEYARD', 'G3', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'GRAVEYARD', 'RICHARDSON', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'GRAVEYARD', 'VITERRA PAC', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'NIGHT', 'ALLIANCE GRAIN', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'NIGHT', 'CARGILL', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'NIGHT', 'CASCADIA', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'NIGHT', 'G3', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'NIGHT', 'RICHARDSON', '', 7.5, 0.5),
  ('WHEAT SPECIALTY', 'NIGHT', 'VITERRA PAC', '', 7.5, 0.5),
  -- WINCH DRIVER
  ('WINCH DRIVER', 'DAY', 'CANADA PLACE', '', 7, 1)
ON CONFLICT (job_name, shift, location_name, subjob_name) DO UPDATE SET
  reg_hours = EXCLUDED.reg_hours,
  ot_hours = EXCLUDED.ot_hours;


-- ============================================================================
-- MIGRATION NOTES (from v1 schema)
--
-- If you already have the v1 schema running, you'll need to:
--
-- 1. Add new columns to existing tables:
--    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS union_local text DEFAULT '500';
--    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_terminal text;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS day_of_week smallint
--      GENERATED ALWAYS AS (EXTRACT(DOW FROM date)::smallint) STORED;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS dt_hours numeric DEFAULT 0;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS dt_rate numeric;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS expected_pay numeric;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS vessel text;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS foreman text;
--    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS verification_status text
--      DEFAULT 'UNVERIFIED';
--
-- 2. Create the new reference tables (differential_classes through hour_overrides)
--    and run all the SEED DATA inserts above.
--
-- 3. Create the pay_verifications table.
--
-- 4. Add the new RLS policies and indexes.
--
-- 5. Create the compute_expected_pay trigger.
-- ============================================================================
