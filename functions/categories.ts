function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COMMON_CATEGORIES: string[] = [
  "家常菜", "快手菜", "下饭菜", "素菜", "清真",
  "汤羹", "凉菜", "热菜", "主食", "甜品",
  "早餐", "午餐", "晚餐",
  "低脂", "高蛋白", "儿童", "老人", "孕妇", "减脂", "增肌",
  // 菜系
  "川菜", "粤菜", "湘菜", "鲁菜", "浙菜", "苏菜", "闽菜", "徽菜"
];

export const onRequestGet = async ({ request }: any) => {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();

    const title = q ? `常见分类 - 搜索：${escapeHtml(q)}` : "常见分类索引";
    const description = q
      ? `在常见分类中搜索关键词：${escapeHtml(q)}`
      : "浏览站点常见菜谱分类，点击进入分类列表页";

    const filtered = COMMON_CATEGORIES.filter((name) =>
      q ? name.toLowerCase().includes(q.toLowerCase()) : true
    );

    const tagsHtml = filtered.length
      ? filtered
          .map((name) => {
            const encoded = encodeURIComponent(name);
            return `<a class="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200" href="/categories/${encoded}">${escapeHtml(name)}</a>`;
          })
          .join("\n")
      : `<p class="text-slate-600 dark:text-slate-400">暂无匹配分类，请更换搜索词。</p>`;

    const html = `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url.origin + "/categories/")}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(url.origin + "/categories/")}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
  <header class="bg-white dark:bg-slate-800 shadow-md sticky top-0">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
      <h1 class="text-2xl font-bold">${escapeHtml(title)}</h1>
      <form class="flex items-center gap-2 ml-auto" method="GET" action="/categories/">
        <input class="flex-1 min-w-64 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2" type="text" name="q" value="${escapeHtml(q)}" placeholder="搜索常见分类（如：家常菜、川菜、素菜）" />
        <button class="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" type="submit">搜索</button>
      </form>
    </div>
  </header>
  <main class="max-w-5xl mx-auto px-4 py-6">
    <section class="flex flex-wrap gap-2">
      ${tagsHtml}
    </section>
  </main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    console.error("SSR /categories index error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
};