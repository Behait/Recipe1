import { getSql, listRecipes, listCategories } from "./_lib/db";

export const onRequestGet = async ({ env, request }: any) => {
  try {
    const origin = new URL(request.url).origin;
    const today = new Date().toISOString().slice(0, 10);

    let recipeItems: any[] = [];
    let categoryItems: any[] = [];
    try {
      const conn = (env as any).DB_CONNECTION_STRING;
      if (conn) {
        const sql = getSql(conn);
        const { items } = await listRecipes(sql, 1, 1000);
        recipeItems = items || [];
        const catRes = await listCategories(sql, 1, 1000);
        categoryItems = catRes.items || [];
      }
    } catch (e) {
      // 非致命：若DB不可用，仍返回基础sitemap
      console.error("sitemap DB error:", e);
    }

    type UrlEntry = { loc: string; lastmod?: string; priority?: string; changefreq?: string };
    const urls: UrlEntry[] = [
      { loc: `${origin}/recipes/`, changefreq: "daily", priority: "0.7" },
      { loc: `${origin}/categories/`, changefreq: "weekly", priority: "0.5" },
      { loc: `${origin}/daily/${today}`, changefreq: "daily", priority: "0.6" },
      { loc: `${origin}/popular/`, changefreq: "daily", priority: "0.7" },
      { loc: `${origin}/week/`, changefreq: "daily", priority: "0.7" },
      { loc: `${origin}/recent/`, changefreq: "daily", priority: "0.7" },
      
    ];
    for (const it of recipeItems) {
      const slug = encodeURIComponent(String(it.slug || it.id));
      const lastmod = it.created_at ? new Date(it.created_at).toISOString() : undefined;
      urls.push({ loc: `${origin}/recipes/${slug}`, lastmod, changefreq: "weekly", priority: "0.8" });
    }
    for (const c of categoryItems) {
      // 站内分类路由使用 name 作为路径参数
      const namePath = encodeURIComponent(String(c.name));
      urls.push({ loc: `${origin}/categories/${namePath}`, changefreq: "weekly", priority: "0.6" });
    }

    const xmlItems = urls
      .map((u) => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq || "weekly"}</changefreq><priority>${u.priority || "0.5"}</priority></url>`) 
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e: any) {
    console.error("/sitemap.xml error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};