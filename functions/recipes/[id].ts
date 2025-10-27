import { getSql, getRecipeById } from "../_lib/db";

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
    const id = params?.id;
    if (!id) return new Response("Missing id", { status: 400 });
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) return new Response("DB not configured", { status: 500 });

    const sql = getSql(conn);
    const recipe = await getRecipeById(sql, id);
    if (!recipe) return new Response("Not found", { status: 404 });
    // 301 永久重定向到规范化 slug 路径，避免ID与Slug产生重复页面
    const redirectUrl = `/recipes/${encodeURIComponent(String(recipe.slug))}`;
    return new Response(null, {
      status: 301,
      headers: {
        Location: redirectUrl,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (e: any) {
    console.error("SSR /recipes/:id error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};