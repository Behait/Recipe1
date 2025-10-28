-- 回滚脚本：撤销 recipe_hit_stats 表结构修改
-- 用途：在迁移出现问题时恢复到之前的状态

BEGIN;

-- 警告信息
DO $$
BEGIN
    RAISE WARNING 'This rollback script will remove columns and data from recipe_hit_stats table!';
    RAISE WARNING 'Make sure you have a backup before proceeding!';
END
$$;

-- 1. 删除新增的列（如果存在）
DO $$
BEGIN
    -- 删除 is_ai_generated 列
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'recipe_hit_stats' 
               AND column_name = 'is_ai_generated') THEN
        ALTER TABLE public.recipe_hit_stats DROP COLUMN is_ai_generated;
        RAISE NOTICE 'Dropped column: is_ai_generated';
    END IF;
    
    -- 删除 recipe_name 列（如果这是新增的）
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'recipe_hit_stats' 
               AND column_name = 'recipe_name') THEN
        -- 注意：只有在确认 recipe_name 是新增列时才删除
        -- 如果原来就有这个列，请注释掉下面这行
        -- ALTER TABLE public.recipe_hit_stats DROP COLUMN recipe_name;
        RAISE NOTICE 'Skipped dropping recipe_name column (may be original column)';
    END IF;
END
$$;

-- 2. 删除新增的索引（如果存在）
DO $$
BEGIN
    -- 删除 recipe_id 索引
    IF EXISTS (SELECT 1 FROM pg_indexes 
               WHERE schemaname = 'public' 
               AND tablename = 'recipe_hit_stats' 
               AND indexname = 'idx_recipe_hit_stats_recipe_id') THEN
        DROP INDEX IF EXISTS public.idx_recipe_hit_stats_recipe_id;
        RAISE NOTICE 'Dropped index: idx_recipe_hit_stats_recipe_id';
    END IF;
    
    -- 删除 hit_date 索引
    IF EXISTS (SELECT 1 FROM pg_indexes 
               WHERE schemaname = 'public' 
               AND tablename = 'recipe_hit_stats' 
               AND indexname = 'idx_recipe_hit_stats_hit_date') THEN
        DROP INDEX IF EXISTS public.idx_recipe_hit_stats_hit_date;
        RAISE NOTICE 'Dropped index: idx_recipe_hit_stats_hit_date';
    END IF;
END
$$;

-- 3. 验证回滚结果
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
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
    
    RAISE NOTICE 'After rollback: Table recipe_hit_stats has % columns and % indexes', column_count, index_count;
    
    -- 显示当前表结构
    RAISE NOTICE 'Current table structure after rollback:';
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

-- 回滚完成提示
SELECT 'Rollback completed!' as status;