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
  created_at TIMESTAMPTZ DEFAULT now(),
  hit_count INT NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
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

-- Categories taxonomy
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_categories (
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_category_id ON public.recipe_categories (category_id);
COMMENT ON TABLE public.categories IS 'Canonical categories for recipes.';
COMMENT ON TABLE public.recipe_categories IS 'Many-to-many mapping between recipes and categories.';

-- Daily hit aggregation (per recipe per day)
CREATE TABLE IF NOT EXISTS public.recipe_hit_stats (
  recipe_id UUID NOT NULL,
  hit_date DATE NOT NULL,
  hit_count INT NOT NULL DEFAULT 0,
  recipe_name TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  PRIMARY KEY (recipe_id, hit_date)
);

-- 为数据库菜谱添加外键约束（仅对非AI生成的菜谱）
-- 注意：这里使用条件约束，只对is_ai_generated=false的记录应用外键约束
-- 但PostgreSQL不支持条件外键，所以我们移除外键约束，改为应用层处理

CREATE INDEX IF NOT EXISTS idx_recipe_hit_stats_hit_date ON public.recipe_hit_stats (hit_date);
CREATE INDEX IF NOT EXISTS idx_recipe_hit_stats_recipe_id ON public.recipe_hit_stats (recipe_id);

COMMENT ON TABLE public.recipe_hit_stats IS 'Aggregated daily hits for trending calculations.';

COMMIT;