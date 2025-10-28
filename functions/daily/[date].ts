import { getSql, getDailyByDate } from "../_lib/db";
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
    const img = recipe.image_url 
    ? `<img class=\"w-full h-full object-cover\" src=\"${escapeHtml(recipe.image_url)}\" alt=\"${escapeHtml(recipe.recipe_name)}\" loading=\"eager\"/>` 
    : `<div class=\"w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800\">\
             <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 300\" class=\"w-full h-full\">\
               <defs>\
                 <linearGradient id=\"bg-daily\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\
                   <stop offset=\"0%\" style=\"stop-color:#fef3c7;stop-opacity:1\" />\
                   <stop offset=\"100%\" style=\"stop-color:#fbbf24;stop-opacity:1\" />\
                 </linearGradient>\
                 <linearGradient id=\"hat-daily\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\
                   <stop offset=\"0%\" style=\"stop-color:#dc2626;stop-opacity:1\" />\
                   <stop offset=\"100%\" style=\"stop-color:#991b1b;stop-opacity:1\" />\
                 </linearGradient>\
                 <linearGradient id=\"utensil-daily\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\
                   <stop offset=\"0%\" style=\"stop-color:#374151;stop-opacity:1\" />\
                   <stop offset=\"100%\" style=\"stop-color:#1f2937;stop-opacity:1\" />\
                 </linearGradient>\
               </defs>\
               <rect width=\"400\" height=\"300\" fill=\"url(#bg-daily)\" />\
               <path d=\"M200 80 C180 80, 160 100, 160 120 L160 140 C160 150, 170 160, 180 160 L220 160 C230 160, 240 150, 240 140 L240 120 C240 100, 220 80, 200 80 Z\" fill=\"url(#hat-daily)\" />\
               <ellipse cx=\"200\" cy=\"170\" rx=\"50\" ry=\"8\" fill=\"url(#hat-daily)\" />\
               <rect x=\"180\" y=\"180\" width=\"8\" height=\"40\" fill=\"url(#utensil-daily)\" />\
               <rect x=\"212\" y=\"180\" width=\"8\" height=\"40\" fill=\"url(#utensil-daily)\" />\
               <path d=\"M175 200 Q180 195, 185 200 Q190 205, 195 200 Q200 195, 205 200 Q210 205, 215 200 Q220 195, 225 200\" stroke=\"url(#utensil-daily)\" stroke-width=\"3\" fill=\"none\" />\
               <text x=\"200\" y=\"260\" text-anchor=\"middle\" font-size=\"24\" fill=\"#dc2626\" font-family=\"serif\" font-weight=\"bold\">美味菜谱</text>\
             </svg>\
           </div>`;

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
  <meta property="og:site_name" content="AI 菜谱" />
  <meta property="og:locale" content="zh_CN" />
  ${recipe.image_url ? `<meta property=\"og:image\" content=\"${escapeHtml(recipe.image_url)}\" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${description}" />
  ${recipe.image_url ? `<meta name=\"twitter:image\" content=\"${escapeHtml(recipe.image_url)}\" />` : ""}
  <link rel="alternate" type="application/rss+xml" title="最新菜谱 RSS" href="/rss.xml" />
  <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>
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
  <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <figure class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100">${img}</figure>
    <p class="text-slate-700 dark:text-slate-300">${description}</p>
    <div>
      <a class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" href="/recipes/${escapeHtml(recipe.slug)}">查看详情 →</a>
    </div>
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
    console.error("SSR /daily/:date error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};