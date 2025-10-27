import { neon } from '@neondatabase/serverless';
import { toSlug } from './slug';

export type RecipeInput = {
  slug: string;
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  image_key?: string | null;
  image_url?: string | null;
  source: 'user' | 'daily';
};

export function getSql(connectionString: string) {
  return neon(connectionString);
}

export async function upsertRecipe(sql: any, data: RecipeInput): Promise<{ id: string; slug: string }> {
  const rows = await sql`
    INSERT INTO recipes (slug, recipe_name, description, prep_time, cook_time, ingredients, instructions, image_key, image_url, source)
    VALUES (${data.slug}, ${data.recipeName}, ${data.description}, ${data.prepTime}, ${data.cookTime}, ${JSON.stringify(data.ingredients)}, ${JSON.stringify(data.instructions)}, ${data.image_key ?? null}, ${data.image_url ?? null}, ${data.source})
    ON CONFLICT (recipe_name) DO UPDATE SET
      description = EXCLUDED.description,
      prep_time = EXCLUDED.prep_time,
      cook_time = EXCLUDED.cook_time,
      ingredients = EXCLUDED.ingredients,
      instructions = EXCLUDED.instructions,
      image_key = EXCLUDED.image_key,
      image_url = EXCLUDED.image_url,
      source = EXCLUDED.source
    RETURNING id, slug;
  `;
  return rows[0];
}

export async function logGeneration(sql: any, ingredientsText: string, recipeId: string): Promise<void> {
  await sql`INSERT INTO generations (ingredients_text, selected_recipe_id) VALUES (${ingredientsText}, ${recipeId})`;
}

export async function setDailyRecommendation(sql: any, dateStr: string, recipeId: string): Promise<void> {
  await sql`INSERT INTO daily_recommendations (recommend_date, recipe_id)
            VALUES (${dateStr}, ${recipeId})
            ON CONFLICT (recommend_date) DO UPDATE SET recipe_id = EXCLUDED.recipe_id`;
}

export async function getRecipeBySlug(sql: any, slug: string): Promise<any | null> {
  const rows = await sql`SELECT id, slug, recipe_name, description, prep_time, cook_time, ingredients, instructions, image_url, source, created_at FROM recipes WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ?? null;
}

export async function getRecipeByName(sql: any, name: string): Promise<any | null> {
  const rows = await sql`SELECT id, slug, recipe_name, description, prep_time, cook_time, ingredients, instructions, image_url, source, created_at FROM recipes WHERE recipe_name = ${name} LIMIT 1`;
  return rows[0] ?? null;
}

export async function listRecipes(sql: any, page: number, limit: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  if (q && q.trim()) {
    const rows = await sql`SELECT id, slug, recipe_name, description, image_url, source, created_at FROM recipes
                            WHERE recipe_name ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'}
                            ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
    const countRows = await sql`SELECT COUNT(*)::int AS count FROM recipes WHERE recipe_name ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'};`;
    return { items: rows, total: countRows[0]?.count ?? 0 };
  }
  const rows = await sql`SELECT id, slug, recipe_name, description, image_url, source, created_at FROM recipes ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM recipes;`;
  return { items: rows, total: countRows[0]?.count ?? 0 };
}

export async function listPopularRecipes(sql: any, page: number, limit: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  const qVal = q && q.trim() ? q.trim() : null;
  const rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at,
                                COALESCE(SUM(s.hit_count), 0)::int AS lifetime_hits
                         FROM recipes r
                         LEFT JOIN recipe_hit_stats s ON s.recipe_id = r.id
                         WHERE CASE WHEN ${qVal}::text IS NULL THEN TRUE ELSE (r.recipe_name ILIKE '%' || ${qVal} || '%' OR r.description ILIKE '%' || ${qVal} || '%') END
                         GROUP BY r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                         ORDER BY lifetime_hits DESC, r.created_at DESC
                         OFFSET ${offset} LIMIT ${limit}`;
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM recipes
                              WHERE CASE WHEN ${qVal}::text IS NULL THEN TRUE ELSE (recipe_name ILIKE '%' || ${qVal} || '%' OR description ILIKE '%' || ${qVal} || '%') END`;
  return { items: rows, total: countRows[0]?.count ?? 0 };
}

export async function getRecipeById(sql: any, id: string): Promise<any | null> {
  const rows = await sql`SELECT id, slug, recipe_name, description, prep_time, cook_time, ingredients, instructions, image_url, source, created_at FROM recipes WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

export async function deleteRecipeById(sql: any, id: string): Promise<{ image_key: string | null } | null> {
  const rows = await sql`DELETE FROM recipes WHERE id = ${id} RETURNING image_key`;
  return rows[0] ?? null;
}

export async function getDailyByDate(sql: any, dateStr: string): Promise<any | null> {
  const rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.prep_time, r.cook_time, r.ingredients, r.instructions, r.image_url, r.source, r.created_at
                         FROM daily_recommendations d JOIN recipes r ON r.id = d.recipe_id
                         WHERE d.recommend_date = ${dateStr} LIMIT 1`;
  return rows[0] ?? null;
}

export async function incrementRecipeHit(sql: any, id: string): Promise<void> {
  await sql`UPDATE recipes SET hit_count = COALESCE(hit_count, 0) + 1, last_accessed_at = now() WHERE id = ${id}`;
  await sql`INSERT INTO recipe_hit_stats (recipe_id, hit_date, hit_count)
            VALUES (${id}, current_date, 1)
            ON CONFLICT (recipe_id, hit_date)
            DO UPDATE SET hit_count = recipe_hit_stats.hit_count + 1`;
}

// Categories: upsert and linking helpers
export async function upsertCategory(sql: any, name: string): Promise<{ id: string; name: string; slug: string }>{
  const slug = name; // 分类 slug 与名称保持一致（名称唯一）
  const rows = await sql`INSERT INTO categories (name, slug) VALUES (${name}, ${slug})
                         ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
                         RETURNING id, name, slug`;
  return rows[0];
}

export async function linkRecipeToCategory(sql: any, recipeId: string, categoryName: string): Promise<void> {
  const cat = await upsertCategory(sql, categoryName);
  await sql`INSERT INTO recipe_categories (recipe_id, category_id) VALUES (${recipeId}, ${cat.id})
            ON CONFLICT (recipe_id, category_id) DO NOTHING`;
}

export async function listRecipesByCategoryName(sql: any, categoryName: string, page: number, limit: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  const qVal = q && q.trim() ? q.trim() : null;
  let rows: any[] = [];
  let countRows: any[] = [];
  if (!qVal) {
    rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                     FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                       JOIN recipes r ON rc.recipe_id = r.id
                     WHERE c.name = ${categoryName}
                     ORDER BY r.created_at DESC OFFSET ${offset} LIMIT ${limit}`;
    countRows = await sql`SELECT COUNT(*)::int AS count
                          FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                            JOIN recipes r ON rc.recipe_id = r.id
                          WHERE c.name = ${categoryName}`;
  } else {
    rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                     FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                       JOIN recipes r ON rc.recipe_id = r.id
                     WHERE c.name = ${categoryName}
                       AND (r.recipe_name ILIKE '%' || ${qVal} || '%' OR r.description ILIKE '%' || ${qVal} || '%')
                     ORDER BY r.created_at DESC OFFSET ${offset} LIMIT ${limit}`;
    countRows = await sql`SELECT COUNT(*)::int AS count
                          FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                            JOIN recipes r ON rc.recipe_id = r.id
                          WHERE c.name = ${categoryName}
                            AND (r.recipe_name ILIKE '%' || ${qVal} || '%' OR r.description ILIKE '%' || ${qVal} || '%')`;
  }
  return { items: rows, total: countRows[0]?.count ?? 0 };
}

export async function listCategoriesByRecipeId(sql: any, recipeId: string): Promise<{ id: string; name: string; slug: string }[]> {
  const rows = await sql`SELECT c.id, c.name, c.slug
                         FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                         WHERE rc.recipe_id = ${recipeId}
                         ORDER BY c.name ASC`;
  return rows as any[];
}

export async function listCategoriesByRecipeSlug(sql: any, slug: string): Promise<{ id: string; name: string; slug: string }[]> {
  const rows = await sql`SELECT c.id, c.name, c.slug
                         FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                         JOIN recipes r ON rc.recipe_id = r.id
                         WHERE r.slug = ${slug}
                         ORDER BY c.name ASC`;
  return rows as any[];
}

// Categories management and queries
export async function listCategories(sql: any, page: number, limit: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  const qVal = q && q.trim() ? q.trim() : null;
  const rows = await sql`SELECT c.id, c.name, c.slug, COALESCE(COUNT(rc.recipe_id), 0)::int AS recipe_count
                         FROM categories c
                         LEFT JOIN recipe_categories rc ON rc.category_id = c.id
                         WHERE CASE WHEN ${qVal}::text IS NULL THEN TRUE ELSE c.name ILIKE '%' || ${qVal} || '%' END
                         GROUP BY c.id, c.name, c.slug
                         ORDER BY recipe_count DESC, c.name ASC
                         OFFSET ${offset} LIMIT ${limit}`;
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM categories
                              WHERE CASE WHEN ${qVal}::text IS NULL THEN TRUE ELSE name ILIKE '%' || ${qVal} || '%' END`;
  return { items: rows, total: countRows[0]?.count ?? 0 };
}

export async function getCategoryBySlug(sql: any, slug: string): Promise<{ id: string; name: string; slug: string } | null> {
  const rows = await sql`SELECT id, name, slug FROM categories WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ?? null;
}

export async function getCategoryById(sql: any, id: string): Promise<{ id: string; name: string; slug: string } | null> {
  const rows = await sql`SELECT id, name, slug FROM categories WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

export async function renameCategory(sql: any, id: string, newName: string): Promise<{ id: string; name: string; slug: string }>{
  const newSlug = newName; // slug 直接等于名称
  const rows = await sql`UPDATE categories SET name = ${newName}, slug = ${newSlug} WHERE id = ${id} RETURNING id, name, slug`;
  return rows[0];
}

export async function deleteCategory(sql: any, id: string): Promise<void> {
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

export async function listRecipesByCategorySlug(sql: any, slug: string, page: number, limit: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  const qVal = q && q.trim() ? q.trim() : null;
  let rows: any[] = [];
  let countRows: any[] = [];
  if (!qVal) {
    rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                     FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                       JOIN recipes r ON rc.recipe_id = r.id
                     WHERE c.slug = ${slug}
                     ORDER BY r.created_at DESC OFFSET ${offset} LIMIT ${limit}`;
    countRows = await sql`SELECT COUNT(*)::int AS count
                          FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                            JOIN recipes r ON rc.recipe_id = r.id
                          WHERE c.slug = ${slug}`;
  } else {
    rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                     FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                       JOIN recipes r ON rc.recipe_id = r.id
                     WHERE c.slug = ${slug}
                       AND (r.recipe_name ILIKE '%' || ${qVal} || '%' OR r.description ILIKE '%' || ${qVal} || '%')
                     ORDER BY r.created_at DESC OFFSET ${offset} LIMIT ${limit}`;
    countRows = await sql`SELECT COUNT(*)::int AS count
                          FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                            JOIN recipes r ON rc.recipe_id = r.id
                          WHERE c.slug = ${slug}
                            AND (r.recipe_name ILIKE '%' || ${qVal} || '%' OR r.description ILIKE '%' || ${qVal} || '%')`;
  }
  return { items: rows, total: countRows[0]?.count ?? 0 };
}

// Trending queries: weekly, recent 30 days, and weighted decay
export async function listTrendingByWindow(sql: any, page: number, limit: number, windowDays: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  const qVal = q && q.trim() ? q.trim() : null;
  const rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at,
                                COALESCE(SUM(s.hit_count), 0)::int AS window_hits
                         FROM recipes r
                         LEFT JOIN recipe_hit_stats s ON s.recipe_id = r.id AND s.hit_date >= (current_date - ${windowDays})
                         WHERE CASE WHEN ${qVal}::text IS NULL THEN TRUE ELSE (r.recipe_name ILIKE '%' || ${qVal} || '%' OR r.description ILIKE '%' || ${qVal} || '%') END
                         GROUP BY r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                         ORDER BY window_hits DESC, r.created_at DESC
                         OFFSET ${offset} LIMIT ${limit}`;
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM recipes
                              WHERE CASE WHEN ${qVal}::text IS NULL THEN TRUE ELSE (recipe_name ILIKE '%' || ${qVal} || '%' OR description ILIKE '%' || ${qVal} || '%') END`;
  return { items: rows, total: countRows[0]?.count ?? 0 };
}

export async function listWeeklyTrendingRecipes(sql: any, page: number, limit: number, q?: string) {
  return listTrendingByWindow(sql, page, limit, 7, q);
}

export async function listRecentTrendingRecipes(sql: any, page: number, limit: number, q?: string) {
  return listTrendingByWindow(sql, page, limit, 30, q);
}

export async function listWeightedPopularRecipes(sql: any, page: number, limit: number, q?: string): Promise<{ items: any[]; total: number }>{
  const offset = (page - 1) * limit;
  // Exponential decay by days since hit_date, cutoff at 180 days for efficiency
  const rows = await sql`SELECT r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at,
                                COALESCE(SUM(s.hit_count * POWER(0.85, (current_date - s.hit_date))), 0) AS weighted_score
                         FROM recipes r
                         LEFT JOIN recipe_hit_stats s ON s.recipe_id = r.id AND s.hit_date >= (current_date - 180)
                         WHERE ${q && q.trim() ? sql`(r.recipe_name ILIKE ${'%' + q + '%'} OR r.description ILIKE ${'%' + q + '%'})` : sql`TRUE`}
                         GROUP BY r.id, r.slug, r.recipe_name, r.description, r.image_url, r.source, r.created_at
                         ORDER BY weighted_score DESC, r.created_at DESC
                         OFFSET ${offset} LIMIT ${limit}`;
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM recipes WHERE ${q && q.trim() ? sql`(recipe_name ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})` : sql`TRUE`}`;
  return { items: rows, total: countRows[0]?.count ?? 0 };
}