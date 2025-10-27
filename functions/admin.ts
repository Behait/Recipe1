import { getSql, listCategories } from './_lib/db';

function escapeHtml(str: string) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const onRequestGet = async ({ env, request }: any) => {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const q = url.searchParams.get('q') || undefined;

  const conn = (env as any).DB_CONNECTION_STRING;
  if (!conn) {
    const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8" /><title>管理中心 · 配置缺失</title><meta name="viewport" content="width=device-width, initial-scale=1" /><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-50 text-slate-800"><main class="max-w-3xl mx-auto p-6 space-y-4"><h1 class="text-2xl font-bold">管理中心</h1><div class="p-4 rounded border bg-amber-50 text-amber-900"><p class="font-semibold">检测到数据库连接未配置（DB_CONNECTION_STRING）。</p><ul class="list-disc pl-5 mt-2"><li>在 Cloudflare Pages → Settings → Environment Variables 添加 <code>DB_CONNECTION_STRING</code>，建议使用包含 <code>?sslmode=require</code> 的 Neon 连接串。</li><li>变量类型：可使用“密钥（Secret）”存储，以避免明文暴露；本地开发可用 <code>wrangler.toml</code> 的 <code>[vars]</code> 明文注入。</li><li>执行数据库迁移：在 Neon 运行 <code>sql/init_neon.sql</code>，确保存在 <code>recipe_hit_stats</code> 表与索引。</li></ul><p class="mt-3">配置完成后，请重新部署并刷新本页面。</p></div></main></body></html>`;
    return new Response(html, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const sql = getSql(conn);
  let items: any[] = [];
  let total = 0;
  try {
    const res = await listCategories(sql, page, limit, q);
    items = res.items;
    total = res.total;
  } catch (err: any) {
    const msg = (err && err.message) ? err.message : String(err || 'unknown error');
    const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8" /><title>管理中心 · 错误</title></head><body><h1>管理中心</h1><p>数据库查询失败：${escapeHtml(msg)}</p><p>请检查环境变量 DB_CONNECTION_STRING 与 Neon 数据库可用性。</p></body></html>`;
    return new Response(html, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const rowsHtml = items.map((c: any) => {
    const id = escapeHtml(c.id);
    const name = escapeHtml(c.name);
    const slug = escapeHtml(c.slug);
    const count = Number(c.recipe_count || 0);
    return `<tr class="border-t">
      <td class="px-3 py-2">${name}</td>
      <td class="px-3 py-2 text-slate-500">${slug}</td>
      <td class="px-3 py-2 text-right">${count}</td>
      <td class="px-3 py-2 text-right space-x-2">
        <button class="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50" data-action="rename" data-id="${id}" data-name="${name}">重命名</button>
        <button class="px-2 py-1 rounded border text-red-600 hover:bg-red-50" data-action="delete" data-id="${id}" data-name="${name}">删除</button>
      </td>
    </tr>`;
  }).join('');

  const prevLink = page > 1
    ? '<a class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50" href="/admin?page=' + (page - 1) + '&limit=' + limit + (q ? ('&q=' + encodeURIComponent(q)) : '') + '">上一页</a>'
    : '';
  const nextLink = (page * limit < total)
    ? '<a class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50" href="/admin?page=' + (page + 1) + '&limit=' + limit + (q ? ('&q=' + encodeURIComponent(q)) : '') + '">下一页</a>'
    : '';

  const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>管理中心</title>
  <meta name="description" content="站点管理页，仅管理员可访问" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style> table { width: 100%; border-collapse: collapse; } th, td { border-color: #e2e8f0; } </style>
</head>
<body class="bg-slate-50 text-slate-800">
  <header class="bg-white shadow-md">
    <div class="max-w-5xl mx-auto p-4 flex items-center gap-4">
      <a href="/" class="text-2xl font-bold">菜谱生成器 · 管理中心</a>
      <nav class="ml-auto flex gap-3">
        <a class="px-3 py-2 rounded border hover:bg-slate-50" href="/recipes/?sort=popular">热门</a>
        <a class="px-3 py-2 rounded border hover:bg-slate-50" href="/recipes/?sort=week">本周</a>
        <a class="px-3 py-2 rounded border hover:bg-slate-50" href="/recipes/?sort=recent">近期</a>
        <a class="px-3 py-2 rounded border hover:bg-slate-50" href="/recipes/?sort=weighted">加权</a>
      </nav>
    </div>
  </header>
  <main class="max-w-5xl mx-auto px-4 py-6 space-y-8">
    <section>
      <h2 class="text-xl font-semibold mb-2">系统状态与指引</h2>
      <div class="p-3 rounded border bg-slate-50">
        <p class="text-sm">数据库连接：<span class="font-mono">已配置</span>；如遇 500 错误，请检查 Neon 可用性与 <code>DB_CONNECTION_STRING</code> 的取值（推荐使用密钥 Secret）。</p>
      </div>
    </section>
    <section>
      <h2 class="text-xl font-semibold mb-3">分类管理</h2>
      <form class="mb-4 flex items-center gap-2" method="GET" action="/admin">
        <input class="w-64 rounded-md border px-3 py-2" type="text" name="q" value="${escapeHtml(q || '')}" placeholder="搜索分类名称" />
        <input type="hidden" name="page" value="1" />
        <button class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50" type="submit">搜索</button>
      </form>
      <div class="overflow-x-auto rounded border">
        <table>
          <thead>
            <tr class="bg-slate-100">
              <th class="px-3 py-2 text-left">名称</th>
              <th class="px-3 py-2 text-left">Slug</th>
              <th class="px-3 py-2 text-right">关联数</th>
              <th class="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || '<tr><td class="px-3 py-2" colspan="4">暂无数据</td></tr>'}</tbody>
        </table>
      </div>
      <nav class="mt-3 flex gap-2">
        ${prevLink}${nextLink}
      </nav>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-3">新建分类</h2>
      <form id="newcat-form" class="flex items-center gap-2">
        <input class="w-64 rounded-md border px-3 py-2" type="text" name="name" placeholder="分类名称" />
        <button class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50" type="submit">创建</button>
      </form>
      <div id="newcat-result" class="mt-2 text-sm"></div>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-3">给菜谱添加分类</h2>
      <form id="link-form" class="flex flex-wrap items-center gap-2">
        <input class="w-64 rounded-md border px-3 py-2" type="text" name="recipeId" placeholder="菜谱ID (UUID)" />
        <input class="w-80 rounded-md border px-3 py-2" type="text" name="names" placeholder="分类名称（逗号分隔）" />
        <button class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50" type="submit">添加</button>
      </form>
      <p class="text-slate-500 text-sm mt-1">示例：names 填写 “家常菜, 汤羹”。</p>
      <div id="link-result" class="mt-2 text-sm"></div>
    </section>
  </main>
  <script type="module">
    function promptNewName(oldName){
      const v = window.prompt('重命名为：', oldName || '');
      if(!v) return null;
      return v.trim();
    }
    async function renameCategory(id, newName){
      const res = await fetch('/api/categories/' + id, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name: newName }) });
      const data = await res.json();
      if(!res.ok){ alert('重命名失败：' + (data?.detail || data?.error || res.status)); return; }
      location.reload();
    }
    async function deleteCategory(id){
      if(!confirm('确认删除该分类？其与菜谱的关联也将被删除。')) return;
      const res = await fetch('/api/categories/' + id, { method: 'DELETE' });
      if(!res.ok){ const data = await res.json(); alert('删除失败：' + (data?.detail || data?.error || res.status)); return; }
      location.reload();
    }
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest('button[data-action]');
      if(!btn) return;
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name') || '';
      const action = btn.getAttribute('data-action');
      if(action === 'rename'){
        const nn = promptNewName(name);
        if(nn) renameCategory(id, nn);
      } else if(action === 'delete'){
        deleteCategory(id);
      }
    });

    const form = document.getElementById('link-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const recipeId = String(fd.get('recipeId')||'').trim();
      const names = String(fd.get('names')||'').split(',').map(s=>s.trim()).filter(Boolean);
      if(!recipeId || names.length===0){ alert('请填写菜谱ID与至少一个分类名称'); return; }
      const res = await fetch('/api/recipes/' + encodeURIComponent(recipeId) + '/categories', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ names }) });
      const data = await res.json();
      const box = document.getElementById('link-result');
      if(!res.ok){ box.textContent = '添加失败：' + (data?.detail || data?.error || res.status); return; }
      box.textContent = '已添加分类：' + (data?.categories||[]).map(c=>c.name).join(', ');
    });

    const newCatForm = document.getElementById('newcat-form');
    newCatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(newCatForm);
      const name = String(fd.get('name')||'').trim();
      const box = document.getElementById('newcat-result');
      if(!name){ box.textContent = '请填写分类名称'; return; }
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if(!res.ok){ box.textContent = '创建失败：' + (data?.detail || data?.error || res.status); return; }
      box.textContent = '已创建分类：' + (data?.category?.name || name);
      setTimeout(()=> location.reload(), 600);
    });
  </script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};