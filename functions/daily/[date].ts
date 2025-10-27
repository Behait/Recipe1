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
    const img = recipe.image_url ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.recipe_name)}" loading="eager"/>` : "";

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
  ${recipe.image_url ? `<meta property="og:image" content="${escapeHtml(recipe.image_url)}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${description}" />
  ${recipe.image_url ? `<meta name="twitter:image" content="${escapeHtml(recipe.image_url)}" />` : ""}
  <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>
  <style>
    body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0;}
    header{padding:16px 24px; border-bottom:1px solid #eee;}
    main{max-width:840px; margin:0 auto; padding:16px;}
    figure{margin:0 0 16px 0}
    img{width:100%; height:auto; border-radius:8px;}
    h1{margin:12px 0}
    .meta{color:#666}
  </style>
</head>
<body>
  <header>
    <a href="/recipes/">← 浏览全部菜谱</a>
    <h1>今日推荐：${escapeHtml(recipe.recipe_name)}</h1>
    <p class="meta">日期：${escapeHtml(date)} ｜ 准备：${escapeHtml(recipe.prep_time)} ｜ 烹饪：${escapeHtml(recipe.cook_time)}</p>
  </header>
  <main>
    <figure>${img}</figure>
    <p>${description}</p>
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