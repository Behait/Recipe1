import { getSql, upsertCategory, linkRecipeToCategory, listCategoriesByRecipeId } from "../../../_lib/db";

export const onRequestPost = async ({ params, env, request }: any) => {
  try {
    const id = params?.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) {
      return new Response(JSON.stringify({ error: "DB is not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const { names } = await request.json();
    if (!Array.isArray(names) || names.length === 0) {
      return new Response(JSON.stringify({ error: "Body must include 'names': string[]" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const sql = getSql(conn);
    const results: { id: string; name: string; slug: string }[] = [];
    for (const raw of names) {
      const name = String(raw || '').trim();
      if (!name) continue;
      const cat = await upsertCategory(sql, name);
      await linkRecipeToCategory(sql, id, name);
      results.push(cat);
    }

    return new Response(JSON.stringify({ categories: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("POST /api/recipes/:id/categories error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestGet = async ({ params, env }: any) => {
  try {
    const id = params?.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) {
      return new Response(JSON.stringify({ error: "DB is not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const sql = getSql(conn);
    const categories = await listCategoriesByRecipeId(sql, id);
    return new Response(JSON.stringify({ categories }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("GET /api/recipes/:id/categories error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};