import { getSql, listRecipes, listPopularRecipes } from "../_lib/db";

export const onRequestGet = async ({ request, env }: any) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
    const q = url.searchParams.get("q") || undefined;
    const sort = (url.searchParams.get("sort") || "").toLowerCase();

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) {
      return new Response(JSON.stringify({ error: "DB is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sql = getSql(conn);
    const { items, total } = sort === 'popular' ? await listPopularRecipes(sql, page, limit, q) : await listRecipes(sql, page, limit, q);

    return new Response(
      JSON.stringify({ items, total, page, limit, q: q ?? null, sort: sort || null }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (e: any) {
    console.error("/api/recipes list error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};