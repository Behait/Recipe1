import { getSql, getRecipeById, deleteRecipeById } from "../../_lib/db";

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

export const onRequestDelete = async ({ params, env }: any) => {
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
    const deleted = await deleteRecipeById(sql, id);
    // Optionally remove image from R2 if bound and key exists
    try {
      const key = deleted?.image_key;
      const bucket: any = (env as any).R2_BUCKET;
      if (bucket && key) {
        await bucket.delete(key);
      }
    } catch (e) {
      console.warn("R2 delete error (ignored):", e);
    }

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("DELETE /api/recipes/:id error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};