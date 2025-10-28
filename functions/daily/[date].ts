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
    : `<div class=\"w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center\">\
             <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 300\" class=\"w-32 h-24\">\
               <defs>\
                 <linearGradient id=\"bg-daily\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\
                   <stop offset=\"0%\" style=\"stop-color:#f1f5f9;stop-opacity:1\" />\
                   <stop offset=\"100%\" style=\"stop-color:#e2e8f0;stop-opacity:1\" />\
                 </linearGradient>\
               </defs>\
               <rect width=\"400\" height=\"300\" fill=\"url(#bg-daily)\"/>\
               <g transform=\"translate(200,150)\">\
                 <ellipse cx=\"0\" cy=\"-20\" rx=\"45\" ry=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                 <path d=\"M -35,-35 Q -35,-55 -20,-60 Q -10,-65 0,-65 Q 10,-65 20,-60 Q 35,-55 35,-35 L 35,-20 Q 35,-15 30,-15 L -30,-15 Q -35,-15 -35,-20 Z\" fill=\"#64748b\" opacity=\"0.4\"/>\
                 <g transform=\"translate(-60,20)\">\
                   <rect x=\"-2\" y=\"0\" width=\"4\" height=\"40\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <rect x=\"-8\" y=\"-5\" width=\"4\" height=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <rect x=\"-2\" y=\"-5\" width=\"4\" height=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <rect x=\"4\" y=\"-5\" width=\"4\" height=\"15\" fill=\"#64748b\" opacity=\"0.3\"/>\
                 </g>\
                 <g transform=\"translate(60,20)\">\
                   <rect x=\"-2\" y=\"0\" width=\"4\" height=\"35\" fill=\"#64748b\" opacity=\"0.3\"/>\
                   <ellipse cx=\"0\" cy=\"-8\" rx=\"8\" ry=\"12\" fill=\"#64748b\" opacity=\"0.3\"/>\
                 </g>\
               </g>\
               <circle cx=\"80\" cy=\"80\" r=\"3\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <circle cx=\"320\" cy=\"220\" r=\"4\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <circle cx=\"350\" cy=\"100\" r=\"2\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <circle cx=\"50\" cy=\"250\" r=\"3\" fill=\"#10b981\" opacity=\"0.2\"/>\
               <text x=\"200\" y=\"220\" text-anchor=\"middle\" font-family=\"system-ui, sans-serif\" font-size=\"16\" fill=\"#64748b\" opacity=\"0.5\">美味菜谱</text>\
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