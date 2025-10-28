import type { Recipe, RecipeOption } from '../types';

// 辅助函数：将字符串转换为 URL 友好的 slug（支持中文/Unicode）
function slugify(text: string): string {
  // 保留所有字母、数字以及连字符，使用 Unicode 属性匹配（需要 /u 标志）
  const cleaned = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    // 仅移除除字母数字和连字符外的符号，保留中文等 Unicode 字符
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  // 如果清理后为空（例如全是符号或极端情况），用 encodeURIComponent 作为回退
  if (!cleaned) {
    return encodeURIComponent(text)
      .toLowerCase()
      .replace(/%/g, '')
      .replace(/-+/g, '-')
      .slice(0, 60); // 控制长度，避免过长
  }
  return cleaned;
}

// 辅助函数，用于调用我们的后端代理
async function callApi<T>(type: string, payload: object): Promise<T> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "发生未知网络错误" }));
      throw new Error(errorData.error || `服务器返回错误: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API call for type '${type}' failed:`, error);
    // 重新抛出错误，以便UI层可以捕获它
    throw error;
  }
}

// 生成图片逻辑已经在后端完成，这里不再单独调用生成图片
export async function generateRecipeOptions(ingredients: string): Promise<RecipeOption[]> {
  const data = await callApi<{ recipes: string[] }>('generateOptions', { ingredients });
  if (data && Array.isArray(data.recipes)) {
    return data.recipes.map(name => ({ name, slug: slugify(name) }));
  }
  throw new Error("未能从API获取有效的菜谱选项。");
}

export async function generateRecipeDetails(recipeName: string, ingredients: string): Promise<Recipe> {
  const recipeData = await callApi<Recipe>('generateDetails', { recipeName, ingredients });
  return recipeData;
}

export async function generateRecipeOfTheDay(): Promise<Recipe> {
  const recipeData = await callApi<Recipe>('generateRotd', {});
  return recipeData;
}

// 新增只读API：获取列表
export async function fetchRecipes(page = 1, limit = 12, q?: string): Promise<{ items: any[]; total: number; page: number; limit: number; q: string | null }>{
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('q', q);
  const res = await fetch(`/api/recipes?${params.toString()}`);
  if (!res.ok) throw new Error(`获取菜谱列表失败: ${res.status}`);
  return await res.json();
}

// 新增只读API：按ID获取详情（用于管理或调试）
export async function fetchRecipeById(id: string): Promise<any> {
  const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`获取菜谱详情失败: ${res.status}`);
  return await res.json();
}

// 新增只读API：获取每日推荐
export async function fetchDailyByDate(date: string): Promise<any> {
  const res = await fetch(`/api/daily/${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(`获取每日推荐失败: ${res.status}`);
  return await res.json();
}
