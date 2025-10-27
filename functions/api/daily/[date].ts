import { getSql, getDailyByDate } from "../../_lib/db";

export const onRequestGet = async ({ params, env }: any) => {
  try {
    const date = params?.date;
    if (!date) {
      return new Response(JSON.stringify({ error: "Missing date" }), {
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
    const recipe = await getDailyByDate(sql, date);
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
    console.error("/api/daily/:date error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};