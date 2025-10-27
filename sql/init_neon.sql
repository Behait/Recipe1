BEGIN;

-- Extensions for UUID generation and ILIKE/trigram indexing performance
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- trigram indexes for ILIKE

-- Core recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  recipe_name TEXT UNIQUE NOT NULL,
  description TEXT,
  prep_time TEXT,
  cook_time TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  image_key TEXT,
  image_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('user','daily')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_name_trgm ON public.recipes USING gin (recipe_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recipes_description_trgm ON public.recipes USING gin (description gin_trgm_ops);

COMMENT ON TABLE public.recipes IS 'Core recipes for SSR pages and APIs.';

-- Daily recommendation table
CREATE TABLE IF NOT EXISTS public.daily_recommendations (
  recommend_date DATE PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_recipe_id ON public.daily_recommendations (recipe_id);

COMMENT ON TABLE public.daily_recommendations IS 'Mapping a date to a recipe for daily recommendation.';

-- Generation records (ingredient text to selected recipe mapping)
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredients_text TEXT NOT NULL,
  selected_recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations (created_at DESC);

COMMENT ON TABLE public.generations IS 'Record of user prompts and chosen recipe results.';

COMMIT;