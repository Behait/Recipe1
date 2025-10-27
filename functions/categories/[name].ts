import { getSql } from "../_lib/db";

function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const onRequestGet = async ({ params, request, env }: any) => {
  try {
    const name = params?.name;
    if (!name) return new Response("Missing category name", { status: 400 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)));
    const q = url.searchParams.get("q") || undefined;

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const offset = (page - 1) * limit;
    const patternName = '%' + name + '%';

    let items: any[] = [];
    let total = 0;

    if (q && q.trim()) {
      const patternQ = '%' + q + '%';
      items = await sql`
        SELECT id, slug, recipe_name, description, image_url, source, created_at
        FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})
          AND (recipe_name ILIKE ${patternQ} OR description ILIKE ${patternQ})
        ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
      const countRows = await sql`
        SELECT COUNT(*)::int AS count FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})
          AND (recipe_name ILIKE ${patternQ} OR description ILIKE ${patternQ})`;
      total = countRows[0]?.count ?? 0;
    } else {
      items = await sql`
        SELECT id, slug, recipe_name, description, image_url, source, created_at
        FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})
        ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
      const countRows = await sql`
        SELECT COUNT(*)::int AS count FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})`;
      total = countRows[0]?.count ?? 0;
    }

    const encodedName = encodeURIComponent(name);
    const title = q ? `分类：${escapeHtml(name)} - 搜索：${escapeHtml(q)}` : `分类：${escapeHtml(name)} - 菜谱列表`;
    const description = q
      ? `分类 ${escapeHtml(name)} 下，匹配关键词 ${escapeHtml(q)} 的菜谱，共 ${total} 条`
      : `分类 ${escapeHtml(name)} 的菜谱，共 ${total} 条`;

    const listHtml = items
      .map((it) => {
        const recipeName = escapeHtml(it.recipe_name);
        const desc = escapeHtml(it.description || "");
        const img = it.image_url ? `<img class=\"w-full h-40 object-cover\" src=\"${escapeHtml(it.image_url)}\" alt=\"${recipeName}\" loading=\"lazy\"/>` : "";
        return `<article class=\"rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden\">\n          <a href=\"/recipes/${it.id}\" class=\"block\">${img}</a>\n          <div class=\"p-3 space-y-2\">\n            <h2 class=\"text-lg font-semibold\"><a class=\"hover:text-indigo-600\" href=\"/recipes/${it.id}\">${recipeName}</a></h2>\n            <p class=\"text-slate-600 dark:text-slate-400 line-clamp-3\">${desc}</p>\n          </div>\n        </article>`;
      })
      .join("\n");

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/categories/" + encodedName)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/categories/" + encodedName)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
  <header class="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
    <div class="max-w-5xl mx-auto p-4 flex items-center gap-4">
      <a href="/" class="flex items-center min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-500 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
          <path d="M15.5 12c-1.38 2.83-4.62 4.5-7.5 3.5s-4.5-4.62-3.5-7.5c.59-1.68 2.16-3 3.92-3.23"></path>
          <path d="M12 9.45a2.55 2.55 0 1 0 0 5.1 2.55 2.55 0 0 0 0-5.1z"></path>
        </svg>
        <span class="text-2xl font-bold text-slate-800 dark:text-slate-100">菜谱生成器</span>
      </a>
      <nav class="hidden md:flex items-center gap-4 ml-auto">
        <a href="/recipes/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Recipes</a>
        <a href="/categories/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Categories</a>
        <form method="GET" action="/categories/${encodedName}" class="flex items-center gap-2">
          <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="${escapeHtml(q || "")}" placeholder="在该分类内搜索" />
          <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>
        </form>
      </nav>
      <div class="ml-auto md:hidden">
        <button id="menu-button" aria-label="打开菜单" class="p-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 dark:border-slate-700">
      <div class="max-w-5xl mx-auto p-4 space-y-3">
        <div class="flex gap-4">
          <a href="/recipes/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Recipes</a>
          <a href="/categories/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Categories</a>
        </div>
        <form method="GET" action="/categories/${encodedName}" class="flex items-center gap-2">
          <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="${escapeHtml(q || "")}" placeholder="在该分类内搜索" />
          <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>
        </form>
      </div>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', function(){
        var btn = document.getElementById('menu-button');
        var menu = document.getElementById('mobile-menu');
        if(btn && menu){ btn.addEventListener('click', function(){ menu.classList.toggle('hidden'); }); }
      });
    </script>
  </header>
  <main class="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    ${listHtml}
  </main>
  <nav class="max-w-5xl mx-auto px-4 pb-8 flex gap-2">
    ${page > 1 ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/categories/${encodedName}?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}\">上一页</a>` : ""}
    ${page * limit < total ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/categories/${encodedName}?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}\">下一页</a>` : ""}
  </nav>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    console.error("SSR /categories/:name error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};