-- 修复 recipes 表结构的迁移脚本（修正版）
-- 添加缺失的 hit_count 和 last_accessed_at 列
-- 修正：recipes表的id字段是UUID类型，不是INTEGER

-- 开始事务
BEGIN;

-- 1. 检查并添加 hit_count 列
DO $$
BEGIN
    -- 检查 hit_count 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'hit_count'
    ) THEN
        -- 添加 hit_count 列
        ALTER TABLE recipes ADD COLUMN hit_count INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added hit_count column to recipes table';
        
        -- 为现有记录设置默认值
        UPDATE recipes SET hit_count = 0 WHERE hit_count IS NULL;
        RAISE NOTICE 'Set default hit_count values for existing records';
    ELSE
        RAISE NOTICE 'hit_count column already exists in recipes table';
    END IF;
END
$$;

-- 2. 检查并添加 last_accessed_at 列
DO $$
BEGIN
    -- 检查 last_accessed_at 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'last_accessed_at'
    ) THEN
        -- 添加 last_accessed_at 列
        ALTER TABLE recipes ADD COLUMN last_accessed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_accessed_at column to recipes table';
    ELSE
        RAISE NOTICE 'last_accessed_at column already exists in recipes table';
    END IF;
END
$$;

-- 3. 创建或更新索引以提高查询性能
DO $$
BEGIN
    -- 为 hit_count 创建索引（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'recipes' 
        AND indexname = 'idx_recipes_hit_count'
    ) THEN
        CREATE INDEX idx_recipes_hit_count ON recipes(hit_count DESC);
        RAISE NOTICE 'Created index on hit_count column';
    ELSE
        RAISE NOTICE 'Index on hit_count already exists';
    END IF;
    
    -- 为 last_accessed_at 创建索引（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'recipes' 
        AND indexname = 'idx_recipes_last_accessed_at'
    ) THEN
        CREATE INDEX idx_recipes_last_accessed_at ON recipes(last_accessed_at DESC);
        RAISE NOTICE 'Created index on last_accessed_at column';
    ELSE
        RAISE NOTICE 'Index on last_accessed_at already exists';
    END IF;
END
$$;

-- 4. 验证表结构
SELECT 'Verifying table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recipes'
AND column_name IN ('hit_count', 'last_accessed_at')
ORDER BY column_name;

-- 5. 测试更新功能（修正版 - 使用UUID类型）
DO $$
DECLARE
    test_recipe_id UUID;
    test_recipe_name TEXT;
BEGIN
    -- 获取一个测试用的 recipe ID（UUID类型）
    SELECT id, recipe_name INTO test_recipe_id, test_recipe_name FROM recipes LIMIT 1;
    
    IF test_recipe_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with recipe: % (ID: %)', test_recipe_name, test_recipe_id;
        
        -- 测试 hit_count 更新
        UPDATE recipes 
        SET hit_count = COALESCE(hit_count, 0) + 1,
            last_accessed_at = NOW()
        WHERE id = test_recipe_id;
        
        RAISE NOTICE 'Successfully tested hit_count and last_accessed_at update for recipe: %', test_recipe_name;
        
        -- 验证更新结果
        DECLARE
            current_hit_count INTEGER;
            current_last_accessed TIMESTAMP WITH TIME ZONE;
        BEGIN
            SELECT hit_count, last_accessed_at INTO current_hit_count, current_last_accessed
            FROM recipes WHERE id = test_recipe_id;
            
            RAISE NOTICE 'Current hit_count: %, last_accessed_at: %', current_hit_count, current_last_accessed;
        END;
        
        -- 回滚测试更新
        UPDATE recipes 
        SET hit_count = GREATEST(COALESCE(hit_count, 1) - 1, 0),
            last_accessed_at = NULL
        WHERE id = test_recipe_id;
        
        RAISE NOTICE 'Reverted test update for recipe: %', test_recipe_name;
    ELSE
        RAISE NOTICE 'No recipes found for testing';
    END IF;
END
$$;

-- 6. 最终验证
SELECT 'Final verification...' as step;

-- 检查表结构
SELECT 
    'Table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recipes'
ORDER BY ordinal_position;

-- 检查索引
SELECT 
    'Indexes:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'recipes'
AND indexname LIKE '%hit_count%' OR indexname LIKE '%last_accessed%'
ORDER BY indexname;

-- 提交事务
COMMIT;

SELECT 'Migration completed successfully!' as final_message;

-- 使用说明：
-- 1. 在生产环境的数据库中执行此脚本
-- 2. 脚本会自动检查列是否存在，避免重复添加
-- 3. 会为现有记录设置默认值
-- 4. 会创建必要的索引以提高性能
-- 5. 包含测试功能验证修改是否成功
-- 6. 修正了UUID类型声明错误