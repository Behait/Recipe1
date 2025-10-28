import { getSql, getRecipeById, getRecipeBySlug, listCategoriesByRecipeSlug, listRecipesByCategorySlug, getPrevRecipeByCreatedAt, getNextRecipeByCreatedAt } from "../_lib/db";
import { renderHeader, renderFooter, renderHead } from "../_lib/layout";

function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const onRequestGet = async ({ params, env, request }: any) => {
  try {
    const raw = params?.id;
    let param = "";
    try {
      param = raw ? decodeURIComponent(raw) : "";
    } catch (deErr) {
      console.error('decode id error:', deErr, 'raw=', raw);
      param = raw || "";
    }
    console.log('SSR /recipes/:id begin:', param);
    if (!param) return new Response("Missing id", { status: 400 });
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);

    // 仅当参数是 UUID 格式时按 id 查询并重定向；否则按 slug 直接渲染详情页
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    if (isUuid) {
      const recipe = await getRecipeById(sql, param);
      if (!recipe) return new Response("Not found", { status: 404 });
      const redirectUrl = `/recipes/${encodeURIComponent(String(recipe.slug))}`;
      return new Response(null, {
        status: 301,
        headers: {
          Location: redirectUrl,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // 将非 UUID 的参数视为 slug，直接渲染详情页，避免路由优先级导致的 500
    const recipe = await getRecipeBySlug(sql, param);
    if (!recipe) return new Response("Not found", { status: 404 });

    // 可选：命中次数递增（不影响页面渲染）
    try { await (await import('../_lib/db')).incrementRecipeHit(sql, recipe.id); } catch (e) { console.error('increment hit error (SSR recipe detail via id-fallback):', e); }

    const url = new URL(request.url);
    const title = `${escapeHtml(recipe.recipe_name)} | 菜谱详情`;
    const description = escapeHtml(recipe.description || "");
    const img = recipe.image_url ? `<img class="w-full h-full object-cover" src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.recipe_name)}" loading="eager"/>` : "";

    const ingredientsHtml = (recipe.ingredients || [])
      .map((i: string) => `<li>${escapeHtml(i)}</li>`)?.join("\n") || "";
    const instructionsHtml = (recipe.instructions || [])
      .map((s: string, idx: number) => `<li><strong>步骤 ${idx + 1}：</strong> ${escapeHtml(s)}</li>`)?.join("\n") || "";

    // 优雅降级：分类/关联查询失败时不影响详情页呈现
    let categories: any[] = [];
    let related: any[] = [];
    try {
      categories = await listCategoriesByRecipeSlug(sql, param);
      const relatedPool: any[] = [];
      for (const cat of categories.slice(0, 2)) {
        const { items } = await listRecipesByCategorySlug(sql, cat.slug, 1, 8);
        relatedPool.push(...items);
      }
      const seen: Record<string, boolean> = {};
      related = relatedPool
        .filter((r) => r.id !== recipe.id)
        .filter((r) => (seen[r.id] ? false : (seen[r.id] = true)))
        .slice(0, 6);
    } catch (err) {
      console.error('category/related query error (SSR recipe detail via id-fallback):', err);
      categories = [];
      related = [];
    }

    const prev = await getPrevRecipeByCreatedAt(sql, recipe.created_at);
    const next = await getNextRecipeByCreatedAt(sql, recipe.created_at);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.recipe_name,
      "description": recipe.description,
      "image": recipe.image_url || undefined,
      "recipeIngredient": recipe.ingredients || [],
      "recipeInstructions": (recipe.instructions || []).map((txt: string) => ({ "@type": "HowToStep", text: txt })),
      "totalTime": `${recipe.prep_time} + ${recipe.cook_time}`,
      "datePublished": recipe.created_at || undefined,
      "dateModified": recipe.created_at || undefined,
      "author": { "@type": "Organization", "name": "AI 菜谱" },
      "recipeCategory": (categories || []).map((c: any) => c.name),
      "keywords": (categories || []).map((c: any) => c.name).join(", ") || undefined,
      "mainEntityOfPage": url.origin + "/recipes/" + param,
    };

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "首页", "item": url.origin + "/" },
        { "@type": "ListItem", "position": 2, "name": "菜谱", "item": url.origin + "/recipes/" },
        { "@type": "ListItem", "position": 3, "name": recipe.recipe_name, "item": url.origin + "/recipes/" + param }
      ]
    };

    const html = `<!doctype html>
<html lang="zh">
<head>
  ${renderHead({
    title,
    description,
    canonical: url.origin + "/recipes/" + param,
    ogType: "article",
    ogUrl: url.origin + "/recipes/" + param,
    ogImage: recipe.image_url,
    siteName: "AI 菜谱",
    locale: "zh_CN",
    alternates: { rss: "/rss.xml" }
  })}
  <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>
  <script type="application/ld+json">${escapeHtml(JSON.stringify(breadcrumbLd))}</script>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
  ${renderHeader({
    widthClass: 'max-w-4xl',
    rightHtml: '<form method="GET" action="/recipes/" class="flex items-center gap-2">\
      <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="" placeholder="搜索菜谱" />\
      <button class="rounded-md bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-2" type="submit">搜索</button>\
    </form>',
  })}
  <main class="mx-auto max-w-4xl px-4 py-6">
    <article class="space-y-6">
      <section class="rounded-md overflow-hidden bg-white dark:bg-slate-800 shadow">
        <div class="h-64 bg-slate-100 dark:bg-slate-700">${img}</div>
        <div class="p-4">
          <h1 class="text-2xl font-bold mb-2">${escapeHtml(recipe.recipe_name)}</h1>
          <p class="text-slate-600 dark:text-slate-300 mb-4">${description}</p>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><span class="font-semibold">准备时间：</span>${escapeHtml(recipe.prep_time || '未知')}</div>
            <div><span class="font-semibold">烹饪时间：</span>${escapeHtml(recipe.cook_time || '未知')}</div>
          </div>
          <h2 class="text-xl font-semibold mt-6 mb-2">食材</h2>
          <ul class="list-disc pl-5 space-y-1">${ingredientsHtml}</ul>
          <h2 class="text-xl font-semibold mt-6 mb-2">步骤</h2>
          <ol class="list-decimal pl-5 space-y-2">${instructionsHtml}</ol>
        </div>
      </section>

      ${(categories && categories.length) ? `<section class="bg-white dark:bg-slate-800 rounded-md shadow p-4">
        <h3 class="text-lg font-semibold mb-2">相关分类</h3>
        <div class="flex flex-wrap gap-2">
          ${categories.map((c: any) => `<a class="inline-block rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1" href="/categories/${encodeURIComponent(c.slug)}">${escapeHtml(c.name)}</a>`).join('')}
        </div>
      </section>` : ''}

      ${(related && related.length) ? `<section class="bg-white dark:bg-slate-800 rounded-md shadow p-4">
        <h3 class="text-lg font-semibold mb-2">相关推荐</h3>
        <ul class="space-y-2">
          ${related.map((r: any) => `<li><a class="text-blue-600 dark:text-blue-400 hover:underline" href="/recipes/${encodeURIComponent(r.slug)}">${escapeHtml(r.recipe_name)}</a></li>`).join('')}
        </ul>
      </section>` : ''}
    </article>

    <nav class="mt-8 flex items-center justify-between">
      ${prev ? `<a class="text-blue-600 dark:text-blue-400 hover:underline" href="/recipes/${encodeURIComponent(prev.slug)}">← 上一条：${escapeHtml(prev.recipe_name)}</a>` : '<span />'}
      ${next ? `<a class="text-blue-600 dark:text-blue-400 hover:underline" href="/recipes/${encodeURIComponent(next.slug)}">下一条：${escapeHtml(next.recipe_name)} →</a>` : '<span />'}
    </nav>
  </main>
  ${renderFooter({ widthClass: 'max-w-4xl' })}
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e: any) {
    console.error("SSR /recipes/:id error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};