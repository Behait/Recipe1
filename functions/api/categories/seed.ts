import { getSql, upsertCategory } from '../../_lib/db';

const COMMON_CATEGORIES: string[] = [
  '家常菜', '快手菜', '下饭菜', '素菜', '清真',
  '汤羹', '凉菜', '热菜', '主食', '甜品',
  '早餐', '午餐', '晚餐',
  '低脂', '高蛋白', '儿童', '老人', '孕妇', '减脂', '增肌',
  '川菜', '粤菜', '湘菜', '鲁菜', '浙菜', '苏菜', '闽菜', '徽菜',
];

export const onRequestPost = async ({ env, request }: any) => {
  try {
    const conn = env.DB_CONNECTION_STRING as string | undefined;
    if (!conn) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

    let names: string[] | undefined;
    try {
      const body = await request.json();
      const raw = body?.names;
      if (Array.isArray(raw)) {
        names = raw.map((s: any) => String(s || '').trim()).filter(Boolean);
      }
    } catch {}
    if (!names || names.length === 0) names = COMMON_CATEGORIES;

    const sql = getSql(conn);
    const created: { id: string; name: string; slug: string }[] = [];
    for (const name of names) {
      const cat = await upsertCategory(sql, name);
      created.push(cat);
    }
    return new Response(JSON.stringify({ categories: created }), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to seed categories', detail: String(err?.message || err) }), { status: 500 });
  }
};