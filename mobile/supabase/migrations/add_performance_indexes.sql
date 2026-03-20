-- Performance indexes for 800+ DAU scalability
-- Run in Supabase SQL Editor

-- Faster analytics queries (time range filtering)
CREATE INDEX IF NOT EXISTS idx_shifts_created_at ON public.shifts(created_at DESC);

-- Faster "all DAY shifts this week" type queries
CREATE INDEX IF NOT EXISTS idx_shifts_user_shift_date ON public.shifts(user_id, shift, date DESC);

-- Faster attachment lookups
-- CREATE INDEX IF NOT EXISTS idx_shifts_attachments ON public.shifts(user_id) WHERE attachments IS NOT NULL;
