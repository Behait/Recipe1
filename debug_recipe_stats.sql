-- 生产环境调试脚本：recipe_hit_stats 表数据问题排查
-- 执行此脚本来诊断统计数据为空的原因

-- 1. 检查表是否存在及其结构
SELECT 'Checking table existence and structure...' as step;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recipe_hit_stats'
ORDER BY ordinal_position;

-- 2. 检查表中的数据量
SELECT 'Checking data count...' as step;

SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT recipe_id) as unique_recipes,
    COUNT(CASE WHEN is_ai_generated = true THEN 1 END) as ai_generated_count,
    COUNT(CASE WHEN is_ai_generated = false THEN 1 END) as db_recipe_count,
    MIN(hit_date) as earliest_date,
    MAX(hit_date) as latest_date
FROM recipe_hit_stats;

-- 3. 检查最近的统计记录
SELECT 'Checking recent records...' as step;

SELECT 
    recipe_id,
    hit_date,
    hit_count,
    recipe_name,
    is_ai_generated
FROM recipe_hit_stats 
ORDER BY hit_date DESC, hit_count DESC 
LIMIT 10;

-- 4. 检查recipes表中的数据
SELECT 'Checking recipes table...' as step;

SELECT 
    COUNT(*) as total_recipes,
    COUNT(CASE WHEN hit_count > 0 THEN 1 END) as recipes_with_hits,
    MAX(hit_count) as max_hit_count,
    AVG(hit_count) as avg_hit_count
FROM recipes;

-- 5. 检查最近访问的菜谱
SELECT 'Checking recently accessed recipes...' as step;

SELECT 
    id,
    recipe_name,
    slug,
    hit_count,
    last_accessed_at
FROM recipes 
WHERE last_accessed_at IS NOT NULL
ORDER BY last_accessed_at DESC 
LIMIT 5;

-- 6. 检查是否有外键约束问题
SELECT 'Checking foreign key constraints...' as step;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'recipe_hit_stats';

-- 7. 测试插入一条记录（用于验证表是否可写）
SELECT 'Testing table write capability...' as step;

-- 生成一个测试UUID
WITH test_data AS (
    SELECT gen_random_uuid() as test_id
)
INSERT INTO recipe_hit_stats (recipe_id, hit_date, hit_count, recipe_name, is_ai_generated)
SELECT test_id, CURRENT_DATE, 1, 'DEBUG_TEST_RECIPE', true
FROM test_data
ON CONFLICT (recipe_id, hit_date) 
DO UPDATE SET hit_count = recipe_hit_stats.hit_count + 1
RETURNING recipe_id, hit_date, hit_count, recipe_name, is_ai_generated;

-- 8. 清理测试数据
DELETE FROM recipe_hit_stats 
WHERE recipe_name = 'DEBUG_TEST_RECIPE' 
AND is_ai_generated = true;

SELECT 'Debug script completed. Check the results above for issues.' as final_message;