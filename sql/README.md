# 数据库迁移指南

本目录包含数据库表结构的初始化和迁移脚本。

## 文件说明

### 1. `init_neon.sql`
- **用途**：初始化数据库表结构
- **适用场景**：全新部署，创建所有必要的表和索引
- **执行时机**：首次部署到新环境时

### 2. `migrate_recipe_hit_stats.sql`
- **用途**：迁移 `recipe_hit_stats` 表结构
- **主要变更**：
  - 确保 `recipe_name` 列存在
  - 添加 `is_ai_generated` 列（用于区分AI生成和数据库菜谱）
  - 创建必要的索引
  - 更新现有数据
- **适用场景**：现有数据库需要更新表结构

### 3. `rollback_recipe_hit_stats.sql`
- **用途**：回滚 `recipe_hit_stats` 表结构修改
- **适用场景**：迁移出现问题时恢复到之前状态
- **注意**：执行前请确保有数据备份

## 使用方法

### 本地开发环境

1. **配置数据库连接**
   ```bash
   # 在 .dev.vars 文件中设置
   DB_CONNECTION_STRING="postgresql://username:password@localhost:5432/recipe_db?sslmode=require"
   ```

2. **执行迁移**
   ```sql
   -- 连接到数据库后执行
   \i sql/migrate_recipe_hit_stats.sql
   ```

### 生产环境（Neon Database）

1. **登录 Neon 控制台**
   - 访问 [Neon Console](https://console.neon.tech/)
   - 选择你的项目和数据库

2. **执行迁移脚本**
   ```sql
   -- 在 Neon SQL Editor 中执行
   -- 复制 migrate_recipe_hit_stats.sql 的内容并执行
   ```

3. **验证迁移结果**
   ```sql
   -- 检查表结构
   \d recipe_hit_stats
   
   -- 检查数据
   SELECT COUNT(*) FROM recipe_hit_stats;
   ```

### Cloudflare Pages 环境变量配置

1. **进入 Cloudflare Pages 控制台**
   - 选择你的项目
   - 进入 Settings → Environment Variables

2. **添加数据库连接字符串**
   ```
   变量名: DB_CONNECTION_STRING
   值: postgresql://username:password@host:port/database?sslmode=require
   类型: Secret（推荐）或 Plain text
   ```

3. **重新部署**
   - 保存环境变量后触发重新部署

## 迁移验证

执行迁移后，可以通过以下方式验证：

1. **检查表结构**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'recipe_hit_stats'
   ORDER BY ordinal_position;
   ```

2. **检查索引**
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename = 'recipe_hit_stats';
   ```

3. **测试应用功能**
   - 访问菜谱页面，检查统计功能是否正常
   - 查看热门菜谱列表是否正确显示

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 `DB_CONNECTION_STRING` 是否正确配置
   - 确认数据库服务是否正常运行

2. **权限错误**
   - 确认数据库用户有足够的权限创建表和索引
   - 检查 SSL 连接配置

3. **迁移失败**
   - 查看错误日志，确定具体问题
   - 如需回滚，执行 `rollback_recipe_hit_stats.sql`

### 联系支持

如果遇到问题，请检查：
- 数据库连接字符串格式
- 网络连接状态
- 数据库服务状态
- 应用日志中的错误信息