import { getSql, listRecentTrendingRecipes } from "./_lib/db";
import { renderHeader, renderFooter, renderHead } from "./_lib/layout";

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

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });
    const sql = getSql(conn);

    const { items, total } = await listRecentTrendingRecipes(sql, page, limit, q);
    const hasNext = page * limit < total;

    const title = q ? `近期热榜 - 搜索：${escapeHtml(q)}` : "近期热榜";
    const description = q ? `搜索关键词 ${escapeHtml(q)} 的近期热榜` : "近30天热度趋势的菜谱精选";

    const listHtml = (items || []).map((it: any) => {
      const recipeName = escapeHtml(it.recipe_name);
      const desc = escapeHtml(it.description || "");
      const img = it.image_url 
        ? `<img class=\"w-full h-40 object-cover\" src=\"${escapeHtml(it.image_url)}\" alt=\"${recipeName}\" loading=\"lazy\"/>` 
        : `<div class=\"w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center\">\
             <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 300\" class=\"w-32 h-24\">\
               <defs>\
                 <linearGradient id=\"bg-recent\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\
                   <stop offset=\"0%\" style=\"stop-color:#f1f5f9;stop-opacity:1\" />\
                   <stop offset=\"100%\" style=\"stop-color:#e2e8f0;stop-opacity:1\" />\
                 </linearGradient>\
               </defs>\
               <rect width=\"400\" height=\"300\" fill=\"url(#bg-recent)\"/>\
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
      return `<article class=\"rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden\">\n          <a href=\"/recipes/${slug}\" class=\"block\">${img}</a>\n          <div class=\"p-3 space-y-2\">\n            <h2 class=\"text-lg font-semibold\"><a class=\"hover:text-indigo-600\" href=\"/recipes/${slug}\">${recipeName}</a></h2>\n            <p class=\"text-slate-600 dark:text-slate-400 line-clamp-3\">${desc}</p>\n          </div>\n        </article>`;
    }).join("\n");

    const base = url.origin + "/recent/";
    const canonical = q ? base : (page > 1 ? `${base}?page=${page}&limit=${limit}` : base);
    const shouldNoindex = Boolean(q);

    const html = `<!doctype html>
<html lang="zh">
<head>
  ${renderHead({
    title,
    description,
    canonical,
    robotsNoindex: shouldNoindex,
    prevHref: page > 1 ? `${base}?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}` : undefined,
    nextHref: hasNext ? `${base}?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}` : undefined,
    ogType: 'website',
    ogUrl: canonical,
    siteName: 'AI 菜谱',
    locale: 'zh_CN',
    alternates: { rss: '/rss.xml' }
  })}
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
  ${renderHeader({
    widthClass: 'max-w-4xl',
    rightHtml: '<form method="GET" action="/recent/" class="flex items-center gap-2">\
      <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索近期热榜" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>',
    mobileExtraHtml: '<form method="GET" action="/recent/" class="flex items-center gap-2">\
      <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索近期热榜" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>'
  })}
  <main class="max-w-4xl mx-auto px-4 py-6">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-slate-400 mb-4">
      <ol class="flex flex-wrap items-center gap-2">
        <li><a href="/" class="hover:text-emerald-600">首页</a></li>
        <li>/</li>
        <li class="text-slate-700 dark:text-slate-300">近期</li>
      </ol>
    </nav>
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${listHtml}
    </section>
    <nav class="mt-6 flex gap-2">
      ${page > 1 ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/recent/?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}\">上一页</a>` : ''}
      ${hasNext ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/recent/?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}\">下一页</a>` : ''}
    </nav>
  </main>
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
    console.error("SSR /recent error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};