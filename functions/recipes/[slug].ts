import { getSql, getRecipeBySlug, incrementRecipeHit } from "../_lib/db";

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

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.recipe_name,
      "description": recipe.description,
      "image": recipe.image_url || undefined,
      "recipeIngredient": recipe.ingredients || [],
      "recipeInstructions": (recipe.instructions || []).map((txt: string) => ({ "@type": "HowToStep", text: txt })),
      "totalTime": `${recipe.prep_time} + ${recipe.cook_time}`,
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
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/recipes/" + slug)}" />
  <meta property="og:title" content="${escapeHtml(recipe.recipe_name)}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/recipes/" + slug)}" />
  ${recipe.image_url ? `<meta property=\"og:image\" content=\"${escapeHtml(recipe.image_url)}\" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(recipe.recipe_name)}" />
  <meta name="twitter:description" content="${description}" />
  ${recipe.image_url ? `<meta name=\"twitter:image\" content=\"${escapeHtml(recipe.image_url)}\" />` : ""}
  <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>
  <script type="application/ld+json">${escapeHtml(JSON.stringify(breadcrumbLd))}</script>
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
        <form method="GET" action="/recipes/" class="flex items-center gap-2">
          <input class="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="" placeholder="搜索菜谱" />
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
        <form method="GET" action="/recipes/" class="flex items-center gap-2">
          <input class="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="" placeholder="搜索菜谱" />
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
      </div>
    </article>
  </main>
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