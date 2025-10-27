import { getSql, listRecipes } from "./_lib/db";

export const onRequestGet = async ({ env, request }: any) => {
  try {
    const origin = new URL(request.url).origin;
    const today = new Date().toISOString().slice(0, 10);

    let recipeItems: any[] = [];
    try {
      const conn = (env as any).DB_CONNECTION_STRING;
      if (conn) {
        const sql = getSql(conn);
        const { items } = await listRecipes(sql, 1, 1000);
        recipeItems = items || [];
      }
    } catch (e) {
      // 非致命：若DB不可用，仍返回基础sitemap
      console.error("sitemap DB error:", e);
    }

    const urls: string[] = [
      `${origin}/recipes/`,
      `${origin}/daily/${today}`,
    ];
    for (const it of recipeItems) {
      urls.push(`${origin}/recipes/${it.id}`);
    }

    const xmlItems = urls
      .map((u) => `<url><loc>${u}</loc><changefreq>daily</changefreq><priority>${u.includes("/recipes/") && !u.endsWith("/recipes/") ? "0.8" : "0.6"}</priority></url>`) 
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