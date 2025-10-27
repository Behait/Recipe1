import { getSql, getRecipeById, incrementRecipeHit } from "../_lib/db";
import { renderHeader, renderFooter } from "../_lib/layout";

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
    const id = params?.id;
    if (!id) return new Response("Missing id", { status: 400 });
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const recipe = await getRecipeById(sql, id);
    if (!recipe) return new Response("Not found", { status: 404 });
    try { await incrementRecipeHit(sql, recipe.id); } catch (e) { console.error('increment hit error (SSR recipe detail by id):', e); }

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
        { "@type": "ListItem", "position": 3, "name": recipe.recipe_name, "item": url.origin + "/recipes/" + id }
      ]
    };

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/recipes/" + id)}" />
  <meta property="og:title" content="${escapeHtml(recipe.recipe_name)}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/recipes/" + id)}" />
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