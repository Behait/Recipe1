-- 数据库迁移脚本：修改 recipe_hit_stats 表结构（修复版本）
-- 用途：确保表结构与应用代码保持一致，支持AI生成菜谱的统计

BEGIN;

-- 1. 检查表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'recipe_hit_stats') THEN
        RAISE NOTICE 'Table recipe_hit_stats does not exist, creating it...';
        
        -- 创建表（如果不存在）
        CREATE TABLE public.recipe_hit_stats (
            recipe_id UUID NOT NULL,
            hit_date DATE NOT NULL,
            hit_count INT NOT NULL DEFAULT 0,
            recipe_name TEXT,
            is_ai_generated BOOLEAN DEFAULT false,
            PRIMARY KEY (recipe_id, hit_date)
        );
        
        -- 创建索引
        CREATE INDEX idx_recipe_hit_stats_hit_date ON public.recipe_hit_stats (hit_date);
        CREATE INDEX idx_recipe_hit_stats_recipe_id ON public.recipe_hit_stats (recipe_id);
        
        -- 添加表注释
        COMMENT ON TABLE public.recipe_hit_stats IS 'Aggregated daily hits for trending calculations.';
        
        RAISE NOTICE 'Table recipe_hit_stats created successfully.';
    ELSE
        RAISE NOTICE 'Table recipe_hit_stats already exists, checking columns...';
    END IF;
END
$$;

-- 2. 检查并添加缺失的列
DO $$
BEGIN
    -- 检查 recipe_name 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'recipe_hit_stats' 
                   AND column_name = 'recipe_name') THEN
        ALTER TABLE public.recipe_hit_stats ADD COLUMN recipe_name TEXT;
        RAISE NOTICE 'Added column: recipe_name';
    END IF;
    
    -- 检查 is_ai_generated 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'recipe_hit_stats' 
                   AND column_name = 'is_ai_generated') THEN
        ALTER TABLE public.recipe_hit_stats ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: is_ai_generated';
    END IF;
END
$$;

-- 3. 检查并创建缺失的索引
DO $$
BEGIN
    -- 检查 hit_date 索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'recipe_hit_stats' 
                   AND indexname = 'idx_recipe_hit_stats_hit_date') THEN
        CREATE INDEX idx_recipe_hit_stats_hit_date ON public.recipe_hit_stats (hit_date);
        RAISE NOTICE 'Created index: idx_recipe_hit_stats_hit_date';
    END IF;
    
    -- 检查 recipe_id 索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'recipe_hit_stats' 
                   AND indexname = 'idx_recipe_hit_stats_recipe_id') THEN
        CREATE INDEX idx_recipe_hit_stats_recipe_id ON public.recipe_hit_stats (recipe_id);
        RAISE NOTICE 'Created index: idx_recipe_hit_stats_recipe_id';
    END IF;
END
$$;

-- 4. 更新现有数据（如果有的话）- 修复版本
DO $$
DECLARE
    updated_rows INTEGER;
BEGIN
    -- 将现有记录的 is_ai_generated 设置为 false（假设现有记录都是数据库菜谱）
    UPDATE public.recipe_hit_stats 
    SET is_ai_generated = false 
    WHERE is_ai_generated IS NULL;
    
    -- 获取更新的行数
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    IF updated_rows > 0 THEN
        RAISE NOTICE 'Updated % existing records to set is_ai_generated = false', updated_rows;
    ELSE
        RAISE NOTICE 'No records needed updating for is_ai_generated column';
    END IF;
END
$$;

-- 5. 验证表结构 - 修复版本
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    rec RECORD;
BEGIN
    -- 检查列数
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'recipe_hit_stats';
    
    -- 检查索引数
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'recipe_hit_stats';
    
    RAISE NOTICE 'Table recipe_hit_stats has % columns and % indexes', column_count, index_count;
    
    -- 显示表结构
    RAISE NOTICE 'Current table structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipe_hit_stats'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            rec.column_name, rec.data_type, rec.is_nullable, COALESCE(rec.column_default, 'none');
    END LOOP;
END
$$;

COMMIT;

-- 迁移完成提示
SELECT 'Migration completed successfully!' as status;