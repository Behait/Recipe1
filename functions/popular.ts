import { getSql, listPopularRecipes } from "./_lib/db";
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

    const { items, total } = await listPopularRecipes(sql, page, limit, q);
    const hasNext = page * limit < total;

    const title = q ? `热门菜谱 - 搜索：${escapeHtml(q)}` : "热门菜谱";
    const description = q ? `搜索关键词 ${escapeHtml(q)} 的热门菜谱` : "站内综合热度排行的菜谱精选";

    const listHtml = (items || []).map((it: any) => {
      const recipeName = escapeHtml(it.recipe_name);
      const desc = escapeHtml(it.description || "");
      const img = it.image_url 
        ? `<img class=\"w-full h-40 object-cover\" src=\"${escapeHtml(it.image_url)}\" alt=\"${recipeName}\" loading=\"lazy\"/>` 
        : `<div class=\"w-full h-40 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-900 flex items-center justify-center\">\
             <svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-16 w-16 text-emerald-500 dark:text-emerald-400\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\
               <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M13 10V3L4 14h7v7l9-11h-7z\" />\
             </svg>\
           </div>`;
      const slug = escapeHtml(it.slug || String(it.id));
      return `<article class=\"rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden\">\n          <a href=\"/recipes/${slug}\" class=\"block\">${img}</a>\n          <div class=\"p-3 space-y-2\">\n            <h2 class=\"text-lg font-semibold\"><a class=\"hover:text-indigo-600\" href=\"/recipes/${slug}\">${recipeName}</a></h2>\n            <p class=\"text-slate-600 dark:text-slate-400 line-clamp-3\">${desc}</p>\n          </div>\n        </article>`;
    }).join("\n");

    const base = url.origin + "/popular/";
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
    rightHtml: '<form method="GET" action="/popular/" class="flex items-center gap-2">\
      <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索热门菜谱" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>',
    mobileExtraHtml: '<form method="GET" action="/popular/" class="flex items-center gap-2">\
      <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索热门菜谱" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>'
  })}
  <main class="max-w-4xl mx-auto px-4 py-6">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-slate-400 mb-4">
      <ol class="flex flex-wrap items-center gap-2">
        <li><a href="/" class="hover:text-emerald-600">首页</a></li>
        <li>/</li>
        <li class="text-slate-700 dark:text-slate-300">热门</li>
      </ol>
    </nav>
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${listHtml}
    </section>
    <nav class="mt-6 flex gap-2">
      ${page > 1 ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/popular/?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}\">上一页</a>` : ''}
      ${hasNext ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/popular/?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}\">下一页</a>` : ''}
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
    console.error("SSR /popular error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};