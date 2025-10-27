import { getSql, getRecipeById } from "../../_lib/db";

export const onRequestGet = async ({ params, env }: any) => {
  try {
    const id = params?.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) {
      return new Response(JSON.stringify({ error: "DB is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sql = getSql(conn);
    const recipe = await getRecipeById(sql, id);
    if (!recipe) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e: any) {
    console.error("/api/recipes/:id error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};