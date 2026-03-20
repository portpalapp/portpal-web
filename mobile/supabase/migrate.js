const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

// Step 1: Drop all existing policies
const step1_dropPolicies = `
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;
`;

// Step 2: Drop old indexes
const step2_dropIndexes = `
DROP INDEX IF EXISTS idx_shifts_user_id;
DROP INDEX IF EXISTS idx_shifts_date;
DROP INDEX IF EXISTS idx_templates_user_id;
DROP INDEX IF EXISTS idx_custom_locations_user_id;
`;

// Step 3: Create reference tables
const step3_refTables = `
CREATE TABLE IF NOT EXISTS public.differential_classes (
  id text PRIMARY KEY,
  amount numeric NOT NULL,
  description text
);
CREATE TABLE IF NOT EXISTS public.jobs (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  differential_class_id text REFERENCES public.differential_classes(id),
  differential_amount numeric NOT NULL DEFAULT 0,
  sort_order int DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.locations (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  location_type text DEFAULT 'TERMINAL' CHECK (location_type IN ('TERMINAL', 'WHEAT', 'OTHER')),
  default_day_hours numeric DEFAULT 8,
  default_night_hours numeric DEFAULT 8,
  default_graveyard_hours numeric DEFAULT 6.5,
  sort_order int DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.subjobs (
  id serial PRIMARY KEY,
  job_name text NOT NULL REFERENCES public.jobs(name),
  name text NOT NULL,
  UNIQUE(job_name, name)
);
CREATE TABLE IF NOT EXISTS public.contract_years (
  id serial PRIMARY KEY,
  year_number int UNIQUE NOT NULL,
  effective_start date NOT NULL,
  effective_end date NOT NULL,
  stbr numeric NOT NULL,
  holiday_rate numeric NOT NULL
);
CREATE TABLE IF NOT EXISTS public.base_rates (
  id serial PRIMARY KEY,
  contract_year_id int REFERENCES public.contract_years(id),
  shift text NOT NULL CHECK (shift IN ('DAY', 'NIGHT', 'GRAVEYARD')),
  day_type text NOT NULL CHECK (day_type IN ('MON-FRI', 'SAT', 'SUN-HOL')),
  regular_rate numeric NOT NULL,
  overtime_rate numeric NOT NULL,
  double_time_rate numeric NOT NULL,
  UNIQUE(contract_year_id, shift, day_type)
);
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
`;

// Step 4: Alter existing user tables
const step4_alterTables = `
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS union_local text DEFAULT '500';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_terminal text;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS day_of_week smallint GENERATED ALWAYS AS (EXTRACT(DOW FROM date)::smallint) STORED;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS dt_hours numeric NOT NULL DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS dt_rate numeric;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expected_pay numeric;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS vessel text;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS foreman text;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'UNVERIFIED';
`;

// Step 5: Create ML tables
const step5_mlTables = `
CREATE TABLE IF NOT EXISTS public.pay_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  stub_image_url text,
  stub_amount numeric,
  calculated_amount numeric,
  discrepancy numeric GENERATED ALWAYS AS (stub_amount - calculated_amount) STORED,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MATCH', 'DISCREPANCY', 'RESOLVED')),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);
`;

// Step 6: RLS policies
const step6_rls = `
ALTER TABLE public.differential_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read differential_classes" ON public.differential_classes FOR SELECT USING (true);
CREATE POLICY "Anyone can read jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Anyone can read subjobs" ON public.subjobs FOR SELECT USING (true);
CREATE POLICY "Anyone can read contract_years" ON public.contract_years FOR SELECT USING (true);
CREATE POLICY "Anyone can read base_rates" ON public.base_rates FOR SELECT USING (true);
CREATE POLICY "Anyone can read hour_overrides" ON public.hour_overrides FOR SELECT USING (true);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shifts" ON public.shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shifts" ON public.shifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shifts" ON public.shifts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own templates" ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own custom locations" ON public.custom_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom locations" ON public.custom_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom locations" ON public.custom_locations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own verifications" ON public.pay_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verifications" ON public.pay_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own verifications" ON public.pay_verifications FOR UPDATE USING (auth.uid() = user_id);
`;

// Step 7: Triggers
const step7_triggers = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $fn$
BEGIN
  INSERT INTO public.profiles (id, name) VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.compute_expected_pay()
RETURNS trigger AS $fn$
DECLARE
  v_day_of_week smallint; v_day_type text; v_contract_year_id int;
  v_base_rate numeric; v_ot_rate numeric; v_differential numeric; v_expected numeric;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM NEW.date)::smallint;
  IF v_day_of_week = 0 THEN v_day_type := 'SUN-HOL';
  ELSIF v_day_of_week = 6 THEN v_day_type := 'SAT';
  ELSE v_day_type := 'MON-FRI'; END IF;
  SELECT id INTO v_contract_year_id FROM public.contract_years WHERE NEW.date >= effective_start AND NEW.date < effective_end LIMIT 1;
  IF v_contract_year_id IS NULL THEN NEW.expected_pay := NULL; RETURN NEW; END IF;
  SELECT regular_rate, overtime_rate INTO v_base_rate, v_ot_rate FROM public.base_rates WHERE contract_year_id = v_contract_year_id AND shift = NEW.shift AND day_type = v_day_type;
  IF v_base_rate IS NULL THEN NEW.expected_pay := NULL; RETURN NEW; END IF;
  SELECT COALESCE(differential_amount, 0) INTO v_differential FROM public.jobs WHERE name = NEW.job;
  IF v_differential IS NULL THEN v_differential := 0; END IF;
  v_expected := ((v_base_rate + v_differential) * NEW.reg_hours) + ((v_base_rate * 1.5 + v_differential) * NEW.ot_hours);
  IF NEW.dt_hours > 0 AND NEW.dt_rate IS NOT NULL THEN v_expected := v_expected + (NEW.dt_rate * NEW.dt_hours); END IF;
  NEW.expected_pay := ROUND(v_expected, 2);
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS compute_expected_pay_trigger ON public.shifts;
CREATE TRIGGER compute_expected_pay_trigger BEFORE INSERT OR UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.compute_expected_pay();
`;

// Step 8: Indexes
const step8_indexes = `
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
CREATE INDEX IF NOT EXISTS idx_jobs_name ON public.jobs(name);
CREATE INDEX IF NOT EXISTS idx_jobs_diff_class ON public.jobs(differential_class_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_hour_overrides_lookup ON public.hour_overrides(job_name, shift, location_name, subjob_name);
CREATE INDEX IF NOT EXISTS idx_base_rates_lookup ON public.base_rates(contract_year_id, shift, day_type);
`;

// Step 9: Seed data - read from schema.sql and extract only the INSERT statements
const schemaPath = path.join(__dirname, 'schema.sql');
const fullSchema = fs.readFileSync(schemaPath, 'utf8');
// Extract everything from "SEED DATA" onwards
const seedStart = fullSchema.indexOf('-- SEED DATA: Differential Classes');
const seedEnd = fullSchema.indexOf('-- MIGRATION NOTES');
const step9_seed = fullSchema.substring(seedStart, seedEnd > 0 ? seedEnd : undefined);

const steps = [
  { name: '1. Drop existing policies', sql: step1_dropPolicies },
  { name: '2. Drop old indexes', sql: step2_dropIndexes },
  { name: '3. Create reference tables', sql: step3_refTables },
  { name: '4. Alter existing user tables', sql: step4_alterTables },
  { name: '5. Create ML tables', sql: step5_mlTables },
  { name: '6. Apply RLS policies', sql: step6_rls },
  { name: '7. Create triggers', sql: step7_triggers },
  { name: '8. Create indexes', sql: step8_indexes },
  { name: '9. Seed reference data', sql: step9_seed },
];

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL.\n');

  for (const step of steps) {
    try {
      console.log(`Running ${step.name}...`);
      await client.query(step.sql);
      console.log(`  ✓ ${step.name} complete`);
    } catch (e) {
      console.error(`  ✗ ${step.name} FAILED: ${e.message}`);
      if (e.detail) console.error(`    Detail: ${e.detail}`);
      // Don't stop on error, continue with next step
    }
  }

  // Verify results
  console.log('\n--- Verification ---');
  const tables = ['differential_classes', 'jobs', 'locations', 'subjobs', 'contract_years', 'base_rates', 'hour_overrides', 'profiles', 'shifts', 'templates', 'custom_locations', 'pay_verifications'];
  for (const t of tables) {
    try {
      const res = await client.query(`SELECT count(*) FROM public.${t}`);
      console.log(`  ${t}: ${res.rows[0].count} rows`);
    } catch (e) {
      console.log(`  ${t}: ERROR - ${e.message}`);
    }
  }

  await client.end();
  console.log('\nDone!');
}

run().catch(e => { console.error('FATAL:', e.message); client.end(); });
