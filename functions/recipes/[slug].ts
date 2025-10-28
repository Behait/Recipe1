import { getSql, getRecipeBySlug, incrementRecipeHit, listCategoriesByRecipeSlug, listRecipesByCategorySlug, getPrevRecipeByCreatedAt, getNextRecipeByCreatedAt } from "../_lib/db";
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
    const rawSlug = params?.slug;
    const slug = rawSlug ? decodeURIComponent(rawSlug) : "";
    if (!slug) return new Response("Missing slug", { status: 400 });
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const recipe = await getRecipeBySlug(sql, slug);
    if (!recipe) return new Response("Not found", { status: 404 });
    try { await incrementRecipeHit(sql, recipe.id); } catch (e) { console.error('increment hit error (SSR recipe detail):', e); }

    const url = new URL(request.url);
    const title = `${escapeHtml(recipe.recipe_name)} | 菜谱详情`;
    const description = escapeHtml(recipe.description || "");
    const img = recipe.image_url ? `<img class=\"w-full h-full object-cover\" src=\"${escapeHtml(recipe.image_url)}\" alt=\"${escapeHtml(recipe.recipe_name)}\" loading=\"eager\"/>` : "";

    const ingredientsHtml = (recipe.ingredients || [])
      .map((i: string) => `<li>${escapeHtml(i)}</li>`)?.join("\n") || "";
    const instructionsHtml = (recipe.instructions || [])
      .map((s: string, idx: number) => `<li><strong>步骤 ${idx + 1}：</strong> ${escapeHtml(s)}</li>`)?.join("\n") || "";

    // 优雅降级：若分类或关联查询失败，不影响详情页呈现
    let categories: any[] = [];
    let related: any[] = [];
    try {
      categories = await listCategoriesByRecipeSlug(sql, slug);
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
      console.error('category/related query error (SSR recipe detail):', err);
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
      "mainEntityOfPage": url.origin + "/recipes/" + slug,
    };

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "首页", "item": url.origin + "/" },
        { "@type": "ListItem", "position": 2, "name": "菜谱", "item": url.origin + "/recipes/" },
        { "@type": "ListItem", "position": 3, "name": recipe.recipe_name, "item": url.origin + "/recipes/" + slug }
      ]
    };

    const html = `<!doctype html>
<html lang="zh">
<head>
  ${renderHead({
    title,
    description,
    canonical: url.origin + "/recipes/" + slug,
    ogType: "article",
    ogUrl: url.origin + "/recipes/" + slug,
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
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>',
    mobileExtraHtml: '<form method="GET" action="/recipes/" class="flex items-center gap-2">\
      <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="" placeholder="搜索菜谱" />\
      <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>\
    </form>'
  })}
  <main class="max-w-4xl mx-auto px-4 py-6">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-slate-400 mb-4">
      <ol class="flex flex-wrap items-center gap-2">
        <li><a href="/" class="hover:text-emerald-600">首页</a></li>
        <li>/</li>
        <li><a href="/recipes/" class="hover:text-emerald-600">菜谱</a></li>
        <li>/</li>
        <li class="text-slate-700 dark:text-slate-300 truncate max-w-[60ch]" title="${escapeHtml(recipe.recipe_name)}">${escapeHtml(recipe.recipe_name)}</li>
      </ol>
    </nav>
    <article class="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <figure class="w-full h-48 sm:h-64 bg-slate-100">${img}</figure>
      <div class="p-6 sm:p-8">
        <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">${escapeHtml(recipe.recipe_name)}</h1>
        <p class="text-slate-600 dark:text-slate-400 mb-6 italic">${description}</p>
        <div class="flex flex-wrap gap-4 sm:gap-6 mb-6 text-center">
          <div class="flex-1 min-w-[120px] bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">准备时间</p>
            <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">${escapeHtml(recipe.prep_time)}</p>
          </div>
          <div class="flex-1 min-w-[120px] bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">烹饪时间</p>
            <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">${escapeHtml(recipe.cook_time)}</p>
          </div>
        </div>
        <section class="grid md:grid-cols-5 gap-8">
          <div class="md:col-span-2">
            <h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b-2 border-emerald-500 pb-2">所需食材</h2>
            <ul class="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">${ingredientsHtml}</ul>
          </div>
          <div class="md:col-span-3">
            <h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b-2 border-emerald-500 pb-2">制作步骤</h2>
            <ol class="space-y-4 text-slate-600 dark:text-slate-300">
              ${(recipe.instructions || []).map((instruction: string, index: number) => `
                <li class="flex items-start">
                  <span class="bg-emerald-500 text-white font-bold rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3 flex-shrink-0">${index + 1}</span>
                  <span>${escapeHtml(instruction)}</span>
                </li>
              `).join('')}
            </ol>
          </div>
        </section>
        ${(related && related.length) ? `
        <section class="mt-10">
          <h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">你可能还喜欢</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${related.map((r: any) => `
              <a href="/recipes/${escapeHtml(r.slug)}" class="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                <div class="h-36 bg-slate-100 overflow-hidden">${r.image_url ? `<img src='${escapeHtml(r.image_url)}' alt='${escapeHtml(r.recipe_name)}' class='w-full h-full object-cover' loading='lazy'/>` : ''}</div>
                <div class="p-3">
                  <h3 class="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">${escapeHtml(r.recipe_name)}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">${escapeHtml(r.description || '')}</p>
                </div>
              </a>
            `).join('')}
          </div>
        </section>
        ` : ''}
        <section class="mt-8 flex items-center justify-between">
          <div>
            ${prev ? `<a class=\"text-emerald-600 hover:underline\" href=\"/recipes/${escapeHtml(prev.slug)}\">← 上一篇：${escapeHtml(prev.recipe_name)}<\/a>` : '<span class="text-slate-400">已是最新</span>'}
          </div>
          <div>
            ${next ? `<a class=\"text-emerald-600 hover:underline\" href=\"/recipes/${escapeHtml(next.slug)}\">下一篇：${escapeHtml(next.recipe_name)} →<\/a>` : '<span class="text-slate-400">已是最早</span>'}
          </div>
        </section>
      </div>
    </article>
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
    console.error("SSR /recipes/:slug error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};