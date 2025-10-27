import { getSql, getDailyByDate } from "../_lib/db";

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
    const date = params?.date;
    if (!date) return new Response("Missing date", { status: 400 });
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const recipe = await getDailyByDate(sql, date);
    if (!recipe) return new Response("Not found", { status: 404 });

    const url = new URL(request.url);
    const title = `今日推荐（${escapeHtml(date)}） - ${escapeHtml(recipe.recipe_name)}`;
    const description = escapeHtml(recipe.description || "");
    const img = recipe.image_url ? `<img class=\"w-full h-full object-cover\" src=\"${escapeHtml(recipe.image_url)}\" alt=\"${escapeHtml(recipe.recipe_name)}\" loading=\"eager\"/>` : "";

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

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/daily/" + date)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/daily/" + date)}" />
  ${recipe.image_url ? `<meta property=\"og:image\" content=\"${escapeHtml(recipe.image_url)}\" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${description}" />
  ${recipe.image_url ? `<meta name=\"twitter:image\" content=\"${escapeHtml(recipe.image_url)}\" />` : ""}
  <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
  <header class="bg-white dark:bg-slate-800 shadow-md sticky top-0">
    <div class="max-w-3xl mx-auto px-4 py-3">
      <a class="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600" href="/recipes/">← 浏览全部菜谱</a>
      <h1 class="text-2xl font-bold mt-2">今日推荐：${escapeHtml(recipe.recipe_name)}</h1>
      <p class="text-sm text-slate-600 dark:text-slate-400">日期：${escapeHtml(date)} ｜ 准备：${escapeHtml(recipe.prep_time)} ｜ 烹饪：${escapeHtml(recipe.cook_time)}</p>
    </div>
  </header>
  <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
    <figure class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100">${img}</figure>
    <p class="text-slate-700 dark:text-slate-300">${description}</p>
    <div>
      <a class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" href="/recipes/${escapeHtml(recipe.slug)}">查看详情 →</a>
    </div>
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
    console.error("SSR /daily/:date error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};