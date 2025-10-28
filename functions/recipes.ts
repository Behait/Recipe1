import { getSql, listRecipes, listPopularRecipes, listWeeklyTrendingRecipes, listRecentTrendingRecipes, listWeightedPopularRecipes } from "./_lib/db";
import { renderHeader, renderFooter } from "./_lib/layout";

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
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)));
    const q = url.searchParams.get("q") || undefined;
    const sort = (url.searchParams.get("sort") || "").toLowerCase();

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) {
      return new Response("DB not configured", { status: 500 });
    }

    const sql = getSql(conn);
    let result: { items: any[]; total: number };
    switch (sort) {
      case 'popular':
        result = await listPopularRecipes(sql, page, limit, q);
        break;
      case 'popular_week':
      case 'week':
        result = await listWeeklyTrendingRecipes(sql, page, limit, q);
        break;
      case 'popular_recent':
      case 'recent':
        result = await listRecentTrendingRecipes(sql, page, limit, q);
        break;
      case 'weighted':
        result = await listWeightedPopularRecipes(sql, page, limit, q);
        break;
      default:
        result = await listRecipes(sql, page, limit, q);
    }
    const { items, total } = result;

    const titleBase = q ? `菜谱列表 - 搜索：${escapeHtml(q)}` : "菜谱列表";
    let title = titleBase;
    let description = q ? `搜索关键词：${escapeHtml(q)} 的菜谱结果，共 ${total} 条` : `共 ${total} 条菜谱，可按页浏览`;
    if (!q) {
      switch (sort) {
        case 'popular':
          title = `${titleBase}（热门排序）`;
          description = `共 ${total} 条菜谱，按热门排序（命中次数/最近访问）`;
          break;
        case 'popular_week':
        case 'week':
          title = `${titleBase}（本周热榜）`;
          description = `共 ${total} 条菜谱，按近7天命中聚合进行排序`;
          break;
        case 'popular_recent':
        case 'recent':
          title = `${titleBase}（近期热榜）`;
          description = `共 ${total} 条菜谱，按近30天命中聚合进行排序`;
          break;
        case 'weighted':
          title = `${titleBase}（加权热榜）`;
          description = `应用时间衰减（近180天指数衰减）计算热度得分`;
          break;
      }
    }

    const listHtml = items
      .map((it) => {
        const name = escapeHtml(it.recipe_name);
        const desc = escapeHtml(it.description || "");
        const img = it.image_url 
          ? `<img class=\"w-full h-40 object-cover\" src=\"${escapeHtml(it.image_url)}\" alt=\"${name}\" loading=\"lazy\"/>` 
          : `<div class=\"w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center\">\
             <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 300\" class=\"w-32 h-24\">\
               <defs>\
                 <linearGradient id=\"bg-recipes\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\
                   <stop offset=\"0%\" style=\"stop-color:#f1f5f9;stop-opacity:1\" />\
                   <stop offset=\"100%\" style=\"stop-color:#e2e8f0;stop-opacity:1\" />\
                 </linearGradient>\
               </defs>\
               <rect width=\"400\" height=\"300\" fill=\"url(#bg-recipes)\"/>\
               <g transform=\"translate(200,150)\">\
                 <ellipse cx=\"0\" cy=\"-20\" rx=\"45\" ry=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                 <path d=\"M -35,-35 Q -35,-55 -20,-60 Q -10,-65 0,-65 Q 10,-65 20,-60 Q 35,-55 35,-35 L 35,-20 Q 35,-15 30,-15 L -30,-15 Q -35,-15 -35,-20 Z\" fill=\"#64748b\" opacity=\"0.4\"/>\
                 <g transform=\"translate(-60,20)\">\
                   <rect x=\"-2\" y=\"0\" width=\"4\" height=\"40\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <rect x=\"-8\" y=\"-5\" width=\"4\" height=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <rect x=\"-2\" y=\"-5\" width=\"4\" height=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <rect x=\"4\" y=\"-5\" width=\"4\" height=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                 </g>\
                 <g transform=\"translate(60,20)\">\
                   <rect x=\"-2\" y=\"0\" width=\"4\" height=\"35\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <ellipse cx=\"0\" cy=\"-8\" rx=\"8\" ry=\"12\" fill=\"#64748b\" opacity=\"0.3\"/>\
                 </g>\
               </g>\
               <circle cx=\"80\" cy=\"80\" r=\"3\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <circle cx=\"320\" cy=\"220\" r=\"4\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <circle cx=\"350\" cy=\"100\" r=\"2\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <circle cx=\"50\" cy=\"250\" r=\"3\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <text x=\"200\" y=\"220\" text-anchor=\"middle\" font-family=\"system-ui, sans-serif\" font-size=\"16\" fill=\"#64748b\" opacity=\"0.5\">美味菜谱</text>\
             </svg>\
           </div>`;
        const slug = escapeHtml(it.slug || String(it.id));
        return `<article class=\"rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden\">\n          <a href=\"/recipes/${slug}\" class=\"block\">${img}</a>\n          <div class=\"p-3 space-y-2\">\n            <h2 class=\"text-lg font-semibold\"><a class=\"hover:text-indigo-600\" href=\"/recipes/${slug}\">${name}</a></h2>\n            <p class=\"text-slate-600 dark:text-slate-400 line-clamp-3\">${desc}</p>\n          </div>\n        </article>`;
      })
      .join("\n");

    const canonicalBase = url.origin + "/recipes/";
    const shouldNoindex = Boolean(q) || Boolean(sort);
    const hasNext = page * limit < total;
    const canonical = !q && !sort ? (page > 1 ? `${canonicalBase}?page=${page}&limit=${limit}` : canonicalBase) : canonicalBase;

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  ${shouldNoindex ? '<meta name="robots" content="noindex,follow" />' : ''}
  ${page > 1 ? `<link rel="prev" href="${escapeHtml(`${canonicalBase}?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`)}" />` : ''}
  ${hasNext ? `<link rel="next" href="${escapeHtml(`${canonicalBase}?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`)}" />` : ''}
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:site_name" content="AI 菜谱" />
  <meta property="og:locale" content="zh_CN" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="alternate" type="application/rss+xml" title="最新菜谱 RSS" href="/rss.xml" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
  ${renderHeader({
    widthClass: 'max-w-4xl',
    rightHtml: '<form method="GET" action="/recipes/" class="flex items-center gap-2">\
      <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索菜谱" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>',
    mobileExtraHtml: '<form method="GET" action="/recipes/" class="flex items-center gap-2">\
      <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索菜谱" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>'
  })}
  <main class="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    ${listHtml}
  </main>
  <nav class="max-w-4xl mx-auto px-4 pb-8 flex gap-2">
    ${page > 1 ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/recipes/?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}\">上一页</a>` : ""}
    ${page * limit < total ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/recipes/?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}\">下一页</a>` : ""}
  </nav>
  ${renderFooter({ widthClass: 'max-w-4xl' })}
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    console.error("SSR /recipes error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};