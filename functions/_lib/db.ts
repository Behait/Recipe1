import { neon } from '@neondatabase/serverless';

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