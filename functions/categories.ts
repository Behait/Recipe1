import { getSql, listCategories } from "./_lib/db";
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
  ${renderHeader({
    widthClass: 'max-w-4xl',
    rightHtml: '<form class="flex items-center gap-2" method="GET" action="/categories/">\
      <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q) + '" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>',
    mobileExtraHtml: '<form class="flex items-center gap-2" method="GET" action="/categories/">\
      <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q) + '" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>'
  })}
  <main class="max-w-4xl mx-auto px-4 py-6">
    <section class="flex flex-wrap gap-2">
      ${tagsHtml}
    </section>
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
    console.error("SSR /categories index error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};