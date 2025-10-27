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
    const slug = params?.slug;
    if (!slug) return new Response("Missing slug", { status: 400 });
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const recipe = await getRecipeBySlug(sql, slug);
    if (!recipe) return new Response("Not found", { status: 404 });

    const url = new URL(request.url);
    const title = `${escapeHtml(recipe.recipe_name)} | 菜谱详情`;
    const description = escapeHtml(recipe.description || "");
    const img = recipe.image_url ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.recipe_name)}" loading="eager"/>` : "";

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
  ${recipe.image_url ? `<meta property="og:image" content="${escapeHtml(recipe.image_url)}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(recipe.recipe_name)}" />
  <meta name="twitter:description" content="${description}" />
  ${recipe.image_url ? `<meta name="twitter:image" content="${escapeHtml(recipe.image_url)}" />` : ""}
  <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>
  <script type="application/ld+json">${escapeHtml(JSON.stringify(breadcrumbLd))}</script>
  <style>
    body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0;}
    header{padding:16px 24px; border-bottom:1px solid #eee;}
    main{max-width:840px; margin:0 auto; padding:16px;}
    figure{margin:0 0 16px 0}
    img{width:100%; height:auto; border-radius:8px;}
    h1{margin:12px 0}
    .meta{color:#666}
    .grid{display:grid; grid-template-columns:1fr 1fr; gap:16px}
    ul{padding-left:18px}
  </style>
</head>
<body>
  <header>
    <a href="/recipes/">← 返回列表</a>
    <h1>${escapeHtml(recipe.recipe_name)}</h1>
    <p class="meta">准备时间：${escapeHtml(recipe.prep_time)} ｜ 烹饪时间：${escapeHtml(recipe.cook_time)}</p>
  </header>
  <main>
    <figure>${img}</figure>
    <p>${description}</p>
    <section class="grid">
      <div>
        <h2>食材</h2>
        <ul>${ingredientsHtml}</ul>
      </div>
      <div>
        <h2>步骤</h2>
        <ol>${instructionsHtml}</ol>
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