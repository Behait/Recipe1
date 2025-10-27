import { getSql, getCategoryById, renameCategory, deleteCategory } from '../../_lib/db';

export const onRequestPut = async ({ env, request, params }: any) => {
  const conn = env.DB_CONNECTION_STRING as string | undefined;
  if (!conn) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const id = String(params?.id || '').trim();
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const newName = String(body?.name || '').trim();
  if (!newName) return new Response(JSON.stringify({ error: 'Missing new name' }), { status: 400 });

  try {
    const sql = getSql(conn);
    const existed = await getCategoryById(sql, id);
    if (!existed) return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
    const updated = await renameCategory(sql, id, newName);
    return new Response(JSON.stringify({ category: updated }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err: any) {
    const message = String(err?.message || err);
    const code = /duplicate key value violates unique constraint/i.test(message) ? 409 : 500;
    return new Response(JSON.stringify({ error: 'Failed to rename category', detail: message }), { status: code });
  }
};

export const onRequestDelete = async ({ env, params }: any) => {
  const conn = env.DB_CONNECTION_STRING as string | undefined;
  if (!conn) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const id = String(params?.id || '').trim();
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  try {
    const sql = getSql(conn);
    const existed = await getCategoryById(sql, id);
    if (!existed) return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
    await deleteCategory(sql, id);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to delete category', detail: String(err?.message || err) }), { status: 500 });
  }
};