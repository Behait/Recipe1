import { getSql, listCategories, upsertCategory } from '../_lib/db';

export const onRequestGet = async ({ env, request }: any) => {
  const conn = env.DB_CONNECTION_STRING as string | undefined;
  if (!conn) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const q = url.searchParams.get('q') || undefined;

  try {
    const sql = getSql(conn);
    const { items, total } = await listCategories(sql, page, limit, q);
    return new Response(JSON.stringify({ items, total, page, limit }), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to list categories', detail: String(err?.message || err) }), { status: 500 });
  }
};

export const onRequestPost = async ({ env, request }: any) => {
  const conn = env.DB_CONNECTION_STRING as string | undefined;
  if (!conn) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  const nameRaw = String(payload?.name || '').trim();
  if (!nameRaw) {
    return new Response(JSON.stringify({ error: 'Missing field: name' }), { status: 400 });
  }
  try {
    const sql = getSql(conn);
    const cat = await upsertCategory(sql, nameRaw);
    return new Response(JSON.stringify({ category: cat }), {
      status: 201,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to create category', detail: String(err?.message || err) }), { status: 500 });
  }
};