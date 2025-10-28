-- 检查生产环境 recipes 表结构脚本
-- 用于确认 hit_count 和 last_accessed_at 列是否存在

-- 1. 检查 recipes 表的完整结构
SELECT 'Checking recipes table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recipes'
ORDER BY ordinal_position;

-- 2. 检查是否存在 hit_count 列
SELECT 'Checking hit_count column...' as step;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recipes' 
            AND column_name = 'hit_count'
        ) THEN 'hit_count column EXISTS'
        ELSE 'hit_count column MISSING'
    END as hit_count_status;

-- 3. 检查是否存在 last_accessed_at 列
SELECT 'Checking last_accessed_at column...' as step;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recipes' 
            AND column_name = 'last_accessed_at'
        ) THEN 'last_accessed_at column EXISTS'
        ELSE 'last_accessed_at column MISSING'
    END as last_accessed_at_status;

-- 4. 检查 recipes 表中的数据样本
SELECT 'Checking recipes table data sample...' as step;

SELECT 
    id,
    recipe_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recipes' 
            AND column_name = 'hit_count'
        ) THEN 'hit_count column exists'
        ELSE 'hit_count column missing'
    END as hit_count_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recipes' 
            AND column_name = 'last_accessed_at'
        ) THEN 'last_accessed_at column exists'
        ELSE 'last_accessed_at column missing'
    END as last_accessed_at_check,
    created_at
FROM recipes 
LIMIT 3;

-- 5. 如果列存在，检查数据
DO $$
BEGIN
    -- 检查 hit_count 列是否存在并有数据
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'hit_count'
    ) THEN
        RAISE NOTICE 'hit_count column exists, checking data...';
        
        -- 这里需要动态SQL来检查数据，但在DO块中比较复杂
        -- 建议手动执行以下查询：
        -- SELECT COUNT(*) as total_recipes, 
        --        COUNT(CASE WHEN hit_count > 0 THEN 1 END) as recipes_with_hits,
        --        MAX(hit_count) as max_hits,
        --        AVG(hit_count) as avg_hits
        -- FROM recipes;
        
    ELSE
        RAISE NOTICE 'hit_count column is MISSING from recipes table!';
    END IF;
    
    -- 检查 last_accessed_at 列是否存在并有数据
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'last_accessed_at'
    ) THEN
        RAISE NOTICE 'last_accessed_at column exists, checking data...';
    ELSE
        RAISE NOTICE 'last_accessed_at column is MISSING from recipes table!';
    END IF;
END
$$;

-- 6. 检查表的索引
SELECT 'Checking recipes table indexes...' as step;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'recipes'
ORDER BY indexname;

SELECT 'Table structure check completed!' as final_message;