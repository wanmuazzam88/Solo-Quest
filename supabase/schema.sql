-- ==============================================================================
-- PROJECT: ARISE — THE SYSTEM // SUPABASE POSTGRESQL DATABASE SCHEMA
-- Full relational schema, Row Level Security (RLS), and real-time leaderboard
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLE: public.hunter_profiles
-- Stores hunter stats, attributes, points, currencies, rank tiers, and titles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hunter_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  hunter_name TEXT NOT NULL UNIQUE,
  email TEXT,
  level INTEGER DEFAULT 1 NOT NULL,
  current_xp INTEGER DEFAULT 0 NOT NULL,
  ap INTEGER DEFAULT 0 NOT NULL,
  str INTEGER DEFAULT 10 NOT NULL,
  agi INTEGER DEFAULT 10 NOT NULL,
  vit INTEGER DEFAULT 10 NOT NULL,
  int INTEGER DEFAULT 10 NOT NULL,
  per INTEGER DEFAULT 10 NOT NULL,
  gold INTEGER DEFAULT 100 NOT NULL,
  essence INTEGER DEFAULT 0 NOT NULL,
  rank_tier_index INTEGER DEFAULT 0 NOT NULL,
  rank_code TEXT DEFAULT 'E-IV' NOT NULL,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  max_streak INTEGER DEFAULT 0 NOT NULL,
  hrs_score INTEGER DEFAULT 0 NOT NULL,
  combat_power INTEGER DEFAULT 120 NOT NULL,
  total_focus_minutes INTEGER DEFAULT 0 NOT NULL,
  total_km_run NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  in_penalty_zone BOOLEAN DEFAULT FALSE NOT NULL,
  penalty_mode TEXT DEFAULT 'OPTIONAL' NOT NULL,
  active_title TEXT DEFAULT '',
  active_skin_id TEXT DEFAULT 'default',
  active_border_id TEXT DEFAULT '',
  active_shadow_id TEXT DEFAULT '',
  equipped_relic_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE: public.hunter_quests
-- Stores daily and custom quests, targets, progress, and completion status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hunter_quests (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  target_progress NUMERIC(10, 2) DEFAULT 1 NOT NULL,
  current_progress NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  preset TEXT,
  is_penalty_quest BOOLEAN DEFAULT FALSE NOT NULL,
  is_exam BOOLEAN DEFAULT FALSE NOT NULL,
  is_bonus BOOLEAN DEFAULT FALSE NOT NULL,
  created_date TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- ==============================================================================
-- TABLE: public.hunter_runs
-- Stores Strava-style GPS running telemetry, routes, splits, and paces
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hunter_runs (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_sec INTEGER NOT NULL,
  moving_sec INTEGER NOT NULL,
  avg_pace_str TEXT NOT NULL,
  max_speed_kmh NUMERIC(6, 2) DEFAULT 0 NOT NULL,
  total_steps INTEGER DEFAULT 0 NOT NULL,
  avg_cadence_spm INTEGER DEFAULT 0 NOT NULL,
  calories INTEGER DEFAULT 0 NOT NULL,
  elevation_gain_meters INTEGER DEFAULT 0 NOT NULL,
  splits JSONB DEFAULT '[]'::jsonb NOT NULL,
  route_sample JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- ==============================================================================
-- TABLE: public.hunter_inventory
-- Stores owned relics, loot boxes, unlocked skins, titles, borders, and shadows
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hunter_inventory (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  owned_items JSONB DEFAULT '{}'::jsonb NOT NULL,
  boxes JSONB DEFAULT '{"BLESSED": 0, "CURSED": 0}'::jsonb NOT NULL,
  unlocked_skins TEXT[] DEFAULT '{"default"}' NOT NULL,
  unlocked_titles TEXT[] DEFAULT '{}' NOT NULL,
  unlocked_borders TEXT[] DEFAULT '{}' NOT NULL,
  shadows JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE: public.hunter_logs
-- Stores daily verification history and penalty records for HRS calculation
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hunter_logs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  hrs_xp INTEGER DEFAULT 0 NOT NULL,
  verified_mins INTEGER DEFAULT 0 NOT NULL,
  focus_mins INTEGER DEFAULT 0 NOT NULL,
  quests INTEGER DEFAULT 0 NOT NULL,
  failed BOOLEAN DEFAULT FALSE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, date)
);

-- ==============================================================================
-- PERFORMANCE INDEXES (Optimized for Real-Time Global Leaderboards)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_hunter_profiles_hrs ON public.hunter_profiles(hrs_score DESC);
CREATE INDEX IF NOT EXISTS idx_hunter_profiles_division ON public.hunter_profiles(rank_tier_index, hrs_score DESC);
CREATE INDEX IF NOT EXISTS idx_hunter_profiles_power ON public.hunter_profiles(combat_power DESC, level DESC);
CREATE INDEX IF NOT EXISTS idx_hunter_runs_user ON public.hunter_runs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_hunter_quests_user ON public.hunter_quests(user_id, is_completed);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data security while keeping global leaderboards publicly accessible
-- ==============================================================================

-- 1. Hunter Profiles RLS
ALTER TABLE public.hunter_profiles ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (authenticated or anonymous) to view hunter profiles for global leaderboards
DROP POLICY IF EXISTS "Public Leaderboard Access" ON public.hunter_profiles;
CREATE POLICY "Public Leaderboard Access"
  ON public.hunter_profiles FOR SELECT
  USING (true);

-- Allow hunters to insert/update only their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON public.hunter_profiles;
CREATE POLICY "Users can manage own profile"
  ON public.hunter_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Hunter Quests RLS
ALTER TABLE public.hunter_quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quests" ON public.hunter_quests;
CREATE POLICY "Users can manage own quests"
  ON public.hunter_quests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Hunter Runs RLS
ALTER TABLE public.hunter_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own runs" ON public.hunter_runs;
CREATE POLICY "Users can manage own runs"
  ON public.hunter_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Hunter Inventory RLS
ALTER TABLE public.hunter_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own inventory" ON public.hunter_inventory;
CREATE POLICY "Users can manage own inventory"
  ON public.hunter_inventory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Hunter Logs RLS
ALTER TABLE public.hunter_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own logs" ON public.hunter_logs;
CREATE POLICY "Users can manage own logs"
  ON public.hunter_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- DATABASE TRIGGER: Auto-provision Hunter Profile upon Registration
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_hunter()
RETURNS TRIGGER AS $$
DECLARE
  desired_name TEXT;
BEGIN
  desired_name := COALESCE(new.raw_user_meta_data->>'hunter_name', 'HUNTER_' || SUBSTRING(new.id::text, 1, 6));
  
  -- Create Hunter Profile
  INSERT INTO public.hunter_profiles (
    id,
    hunter_name,
    email,
    level,
    current_xp,
    ap,
    gold,
    rank_tier_index,
    rank_code,
    penalty_mode
  ) VALUES (
    new.id,
    desired_name,
    new.email,
    1,
    0,
    0,
    100,
    0,
    'E-IV',
    COALESCE(new.raw_user_meta_data->>'penalty_mode', 'OPTIONAL')
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- Create Initial Hunter Inventory
  INSERT INTO public.hunter_inventory (
    user_id,
    owned_items,
    boxes,
    unlocked_skins
  ) VALUES (
    new.id,
    '{"c_pot_low": 1, "c_key_subway": 1}'::jsonb,
    '{"BLESSED": 0, "CURSED": 0}'::jsonb,
    '{"default"}'
  ) ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_hunter();
