import { getSql, listRecipes, listPopularRecipes, listWeeklyTrendingRecipes, listRecentTrendingRecipes, listWeightedPopularRecipes } from "../_lib/db";

export const onRequestGet = async ({ request, env }: any) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
    const q = url.searchParams.get("q") || undefined;
    const sort = (url.searchParams.get("sort") || "").toLowerCase();

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn || conn === "placeholder") {
      return new Response(JSON.stringify({ items: [], total: 0, page, limit, q: q ?? null, sort: sort || null }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const sql = getSql(conn);
    let result: { items: any[]; total: number };
    switch (sort) {
      case 'popular':
        result = await listPopularRecipes(sql, page, limit, q);
        break;
      case 'popular_week':
      case 'week':
        result = await listWeeklyTrendingRecipes(sql, page, limit, q);
        break;
      case 'popular_recent':
      case 'recent':
        result = await listRecentTrendingRecipes(sql, page, limit, q);
        break;
      case 'weighted':
        result = await listWeightedPopularRecipes(sql, page, limit, q);
        break;
      default:
        result = await listRecipes(sql, page, limit, q);
    }
    const { items, total } = result;

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