import { getSql, listCategories } from "./_lib/db";

function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const onRequestGet = async ({ request, env }: any) => {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const conn = (env as any).DB_CONNECTION_STRING;
    const sql = conn ? getSql(conn) : null;

    const title = q ? `分类索引 - 搜索：${escapeHtml(q)}` : "分类索引";
    const description = q
      ? `在站点分类中搜索关键词：${escapeHtml(q)}`
      : "浏览站点已存在的菜谱分类，点击进入分类列表页";

    let tagsHtml = `<p class="text-slate-600 dark:text-slate-400">暂无分类数据。</p>`;
    try {
      if (sql) {
        const res = await listCategories(sql, 1, 200, q || undefined);
        const items = res.items || [];
        tagsHtml = items.length
          ? items
              .map((it: any) => {
                const encoded = encodeURIComponent(it.name);
                const label = `${escapeHtml(it.name)}${it.recipe_count ? `（${it.recipe_count}）` : ""}`;
                return `<a class="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200" href="/categories/${encoded}">${label}</a>`;
              })
              .join("\n")
          : `<p class="text-slate-600 dark:text-slate-400">暂无匹配分类，请更换搜索词。</p>`;
      }
    } catch (e) {
      console.error("categories index DB error:", e);
      tagsHtml = `<p class="text-slate-600 dark:text-slate-400">分类数据暂不可用。</p>`;
    }

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/categories/")}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/categories/")}" />
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
        <form class="flex items-center gap-2" method="GET" action="/categories/">
          <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="${escapeHtml(q)}" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />
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
        <form class="flex items-center gap-2" method="GET" action="/categories/">
          <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="${escapeHtml(q)}" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />
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
  <main class="max-w-5xl mx-auto px-4 py-6">
    <section class="flex flex-wrap gap-2">
      ${tagsHtml}
    </section>
  </main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    console.error("SSR /categories index error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};