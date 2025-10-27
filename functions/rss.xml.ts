import { getSql, listRecipes } from "./_lib/db";

export const onRequestGet = async ({ env, request }: any) => {
  try {
    const origin = new URL(request.url).origin;
    const siteTitle = "AI 菜谱信息门户";
    const siteLink = origin + "/recipes/";
    const siteDesc = "最新生成与推荐的美味菜谱合集";

    let items: any[] = [];
    try {
      const conn = (env as any).DB_CONNECTION_STRING;
      if (conn) {
        const sql = getSql(conn);
        const res = await listRecipes(sql, 1, 50);
        items = res.items || [];
      }
    } catch (e) {
      console.error("rss db error:", e);
    }

    const rssItems = items.map((it) => {
      const link = `${origin}/recipes/${it.id}`;
      const pubDate = it.created_at ? new Date(it.created_at).toUTCString() : new Date().toUTCString();
      const desc = it.description || "";
      const enclosure = it.image_url ? `<enclosure url="${it.image_url}" type="image/png"/>` : "";
      return `<item>
  <title><![CDATA[${it.recipe_name}]]></title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <description><![CDATA[${desc}]]></description>
  <pubDate>${pubDate}</pubDate>
  ${enclosure}
</item>`;
    }).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title><![CDATA[${siteTitle}]]></title>
  <link>${siteLink}</link>
  <description><![CDATA[${siteDesc}]]></description>
  ${rssItems}
</channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e: any) {
    console.error("/rss.xml error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};