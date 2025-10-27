import { getSql, getRecipeBySlug } from "../_lib/db";

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
  <header class="bg-white dark:bg-slate-800 shadow-md sticky top-0">
    <div class="max-w-3xl mx-auto px-4 py-3">
      <a class="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600" href="/recipes/">← 返回列表</a>
      <h1 class="text-2xl font-bold mt-2">${escapeHtml(recipe.recipe_name)}</h1>
      <p class="text-sm text-slate-600 dark:text-slate-400">准备时间：${escapeHtml(recipe.prep_time)} ｜ 烹饪时间：${escapeHtml(recipe.cook_time)}</p>
    </div>
  </header>
  <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
    <figure class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100">${img}</figure>
    <p class="text-slate-700 dark:text-slate-300">${description}</p>
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h2 class="text-xl font-semibold">食材</h2>
        <ul class="list-disc pl-6 space-y-1">${ingredientsHtml}</ul>
      </div>
      <div>
        <h2 class="text-xl font-semibold">步骤</h2>
        <ol class="list-decimal pl-6 space-y-2">${instructionsHtml}</ol>
      </div>
    </section>
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