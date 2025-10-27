import { getSql, listRecipesByCategoryName, listRecipesByCategorySlug } from "../_lib/db";
import { renderHeader, renderFooter, renderHead } from "../_lib/layout";

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
    // 防止多次编码：先对路径参数做一次 decode，再统一用 encode 构建链接
    const rawName = String(params?.name || "");
    const name = decodeURIComponent(rawName);
    if (!name) return new Response("Missing category name", { status: 400 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)));
    const q = url.searchParams.get("q") || undefined;

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    // 改为基于关联表的查询，确保显示真实关联的菜谱
    let items: any[] = [];
    let total = 0;
    try {
      const res = await listRecipesByCategoryName(sql, name, page, limit, q || undefined);
      items = res.items || [];
      total = res.total || 0;
    } catch (err) {
      console.error("listRecipesByCategoryName error, fallback to slug:", err);
      try {
        const res2 = await listRecipesByCategorySlug(sql, name, page, limit, q || undefined);
        items = res2.items || [];
        total = res2.total || 0;
      } catch (err2) {
        console.error("listRecipesByCategorySlug error, fallback to text search:", err2);
        const offset = (page - 1) * limit;
        const patternName = '%' + name + '%';
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
      }
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
        const slug = escapeHtml(it.slug || String(it.id));
        return `<article class=\"rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden\">\n          <a href=\"/recipes/${slug}\" class=\"block\">${img}</a>\n          <div class=\"p-3 space-y-2\">\n            <h2 class=\"text-lg font-semibold\"><a class=\"hover:text-indigo-600\" href=\"/recipes/${slug}\">${recipeName}</a></h2>\n            <p class=\"text-slate-600 dark:text-slate-400 line-clamp-3\">${desc}</p>\n          </div>\n        </article>`;
      })
      .join("\n");

    const shouldNoindex = Boolean(q);
    const canonicalBase = url.origin + "/categories/" + encodedName;
    const hasNext = page * limit < total;
    const canonical = !q ? (page > 1 ? `${canonicalBase}?page=${page}&limit=${limit}` : canonicalBase) : canonicalBase;

    const html = `<!doctype html>
<html lang="zh">
<head>
  ${renderHead({
    title: escapeHtml(title),
    description: escapeHtml(description),
    canonical: canonical,
    robotsNoindex: shouldNoindex,
    prevHref: page > 1 ? `${canonicalBase}?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}` : undefined,
    nextHref: hasNext ? `${canonicalBase}?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}` : undefined,
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
    rightHtml: '<form method="GET" action="/categories/" class="flex items-center gap-2">\
      <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>',
    mobileExtraHtml: '<form method="GET" action="/categories/" class="flex items-center gap-2">\
      <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="' + escapeHtml(q || '') + '" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>'
  })}
  <main class="max-w-4xl mx-auto px-4 py-6">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-slate-400 mb-4">
      <ol class="flex flex-wrap items-center gap-2">
        <li><a href="/" class="hover:text-emerald-600">首页</a></li>
        <li>/</li>
        <li><a href="/categories/" class="hover:text-emerald-600">分类</a></li>
        <li>/</li>
        <li class="text-slate-700 dark:text-slate-300 truncate max-w-[60ch]" title="${escapeHtml(name)}">${escapeHtml(name)}</li>
      </ol>
    </nav>
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    ${listHtml}
    </section>
  </main>
  <nav class="max-w-4xl mx-auto px-4 pb-8 flex gap-2">
    ${page > 1 ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/categories/${encodedName}?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}\">上一页</a>` : ""}
    ${page * limit < total ? `<a class=\"inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200\" href=\"/categories/${encodedName}?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}\">下一页</a>` : ""}
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
    console.error("SSR /categories/:name error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};