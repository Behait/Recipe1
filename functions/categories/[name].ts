import { getSql } from "../_lib/db";

function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const onRequestGet = async ({ params, request, env }: any) => {
  try {
    const name = params?.name;
    if (!name) return new Response("Missing category name", { status: 400 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)));
    const q = url.searchParams.get("q") || undefined;

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const offset = (page - 1) * limit;
    const patternName = '%' + name + '%';

    let items: any[] = [];
    let total = 0;

    if (q && q.trim()) {
      const patternQ = '%' + q + '%';
      items = await sql`
        SELECT id, slug, recipe_name, description, image_url, source, created_at
        FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})
          AND (recipe_name ILIKE ${patternQ} OR description ILIKE ${patternQ})
        ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
      const countRows = await sql`
        SELECT COUNT(*)::int AS count FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})
          AND (recipe_name ILIKE ${patternQ} OR description ILIKE ${patternQ})`;
      total = countRows[0]?.count ?? 0;
    } else {
      items = await sql`
        SELECT id, slug, recipe_name, description, image_url, source, created_at
        FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})
        ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
      const countRows = await sql`
        SELECT COUNT(*)::int AS count FROM recipes
        WHERE (recipe_name ILIKE ${patternName} OR description ILIKE ${patternName})`;
      total = countRows[0]?.count ?? 0;
    }

    const encodedName = encodeURIComponent(name);
    const title = q ? `分类：${escapeHtml(name)} - 搜索：${escapeHtml(q)}` : `分类：${escapeHtml(name)} - 菜谱列表`;
    const description = q
      ? `分类 ${escapeHtml(name)} 下，匹配关键词 ${escapeHtml(q)} 的菜谱，共 ${total} 条`
      : `分类 ${escapeHtml(name)} 的菜谱，共 ${total} 条`;

    const listHtml = items
      .map((it) => {
        const recipeName = escapeHtml(it.recipe_name);
        const desc = escapeHtml(it.description || "");
        const img = it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="${recipeName}" loading="lazy"/>` : "";
        return `<article class="card">
          <a href="/recipes/${it.slug}" class="thumb">${img}</a>
          <h2><a href="/recipes/${it.slug}">${recipeName}</a></h2>
          <p class="desc">${desc}</p>
        </article>`;
      })
      .join("\n");

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/categories/" + encodedName)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/categories/" + encodedName)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <style>
    body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0;}
    header{padding:16px 24px; border-bottom:1px solid #eee;}
    main{max-width:960px; margin:0 auto; padding:16px; display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px;}
    .card{border:1px solid #eee; border-radius:8px; padding:12px; background:#fff;}
    .thumb img{width:100%; height:auto; border-radius:6px; display:block;}
    .desc{color:#555;}
    nav.pagination{max-width:960px; margin:16px auto; padding:0 16px; display:flex; gap:8px;}
    nav.pagination a{padding:8px 12px; border:1px solid #ddd; border-radius:6px; text-decoration:none; color:#333;}
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <form method="GET" action="/categories/${encodedName}" style="display:flex; gap:8px">
      <input type="text" name="q" value="${escapeHtml(q || "")}" placeholder="在该分类内搜索" />
      <button type="submit">搜索</button>
    </form>
  </header>
  <main>
    ${listHtml}
  </main>
  <nav class="pagination">
    ${page > 1 ? `<a href="/categories/${encodedName}?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}">上一页</a>` : ""}
    ${page * limit < total ? `<a href="/categories/${encodedName}?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}">下一页</a>` : ""}
  </nav>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    console.error("SSR /categories/:name error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};