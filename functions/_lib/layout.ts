export type HeaderOptions = {
  widthClass?: string;
  rightHtml?: string;
  mobileExtraHtml?: string;
};

export type FooterOptions = {
  widthClass?: string;
};

export type HeadOptions = {
  lang?: string;
  title: string;
  description?: string;
  canonical?: string;
  robotsNoindex?: boolean;
  ogType?: string; // website | article
  ogUrl?: string;
  ogImage?: string | null | undefined;
  siteName?: string;
  locale?: string;
  prevHref?: string;
  nextHref?: string;
  alternates?: {
    rss?: string;
  };
  extraMetaHtml?: string; // custom injections
};

function esc(v: any): string {
  const s = String(v ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHead(opts: HeadOptions): string {
  const title = esc(opts.title || "");
  const desc = esc(opts.description || "");
  const canonical = opts.canonical ? esc(opts.canonical) : "";
  const robots = opts.robotsNoindex ? '<meta name="robots" content="noindex,follow" />' : '';
  const ogType = esc(opts.ogType || "website");
  const ogUrl = esc(opts.ogUrl || opts.canonical || "");
  const ogImageMeta = opts.ogImage ? `<meta property="og:image" content="${esc(opts.ogImage)}" />` : "";
  const siteName = esc(opts.siteName || "AI 菜谱");
  const locale = esc(opts.locale || "zh_CN");
  const prev = opts.prevHref ? `<link rel="prev" href="${esc(opts.prevHref)}" />` : '';
  const next = opts.nextHref ? `<link rel="next" href="${esc(opts.nextHref)}" />` : '';
  const rss = opts.alternates?.rss ? `<link rel="alternate" type="application/rss+xml" title="最新菜谱 RSS" href="${esc(opts.alternates.rss)}" />` : '';
  const canonicalLink = canonical ? `<link rel="canonical" href="${canonical}" />` : '';

  return `
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  ${desc ? `<meta name=\"description\" content=\"${desc}\" />` : ''}
  ${canonicalLink}
  ${robots}
  ${prev}
  ${next}
  <meta property="og:title" content="${title}" />
  ${desc ? `<meta property=\"og:description\" content=\"${desc}\" />` : ''}
  <meta property="og:type" content="${ogType}" />
  ${ogUrl ? `<meta property=\"og:url\" content=\"${ogUrl}\" />` : ''}
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="${locale}" />
  ${ogImageMeta}
  <meta name="twitter:card" content="${ogType === 'article' ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${title}" />
  ${desc ? `<meta name=\"twitter:description\" content=\"${desc}\" />` : ''}
  ${opts.ogImage ? `<meta name=\"twitter:image\" content=\"${esc(opts.ogImage)}\" />` : ''}
  ${rss}
  ${opts.extraMetaHtml || ''}
  <script src="https://cdn.tailwindcss.com"></script>
  `;
}

export function renderHeader(opts: HeaderOptions = {}): string {
  const widthClass = opts.widthClass || "max-w-4xl";
  const rightHtml = opts.rightHtml || "";
  const mobileExtraHtml = opts.mobileExtraHtml || "";
  return `
  <header class="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
    <div class="${widthClass} mx-auto p-4 flex items-center gap-4">
      <a href="/" class="flex items-center min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-500 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
          <path d="M15.5 12c-1.38 2.83-4.62 4.5-7.5 3.5s-4.5-4.62-3.5-7.5c.59-1.68 2.16-3 3.92-3.23"></path>
          <path d="M12 9.45a2.55 2.55 0 1 0 0 5.1 2.55 2.55 0 0 0 0-5.1z"></path>
        </svg>
        <span class="text-2xl font-bold text-slate-800 dark:text-slate-100">菜谱生成器</span>
      </a>
      <nav class="hidden md:flex items-center gap-4 ml-auto">
        <a href="/recipes/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">菜谱</a>
        <a href="/categories/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">分类</a>
        <a href="/popular/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">热门</a>
        <a href="/week/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">本周</a>
        <a href="/recent/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">近期</a>
        ${rightHtml}
      </nav>
      <div class="md:hidden ml-auto">
        <button id="mnav-btn" aria-label="打开菜单" class="p-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    <div id="mnav-panel" class="hidden md:hidden border-t border-slate-200 dark:border-slate-700">
      <div class="${widthClass} mx-auto p-4 space-y-3">
        <div class="flex flex-wrap gap-4">
          <a href="/recipes/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">菜谱</a>
          <a href="/categories/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">分类</a>
          <a href="/popular/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">热门</a>
          <a href="/week/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">本周</a>
          <a href="/recent/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">近期</a>
        </div>
        ${mobileExtraHtml}
      </div>
    </div>
    <script>
      (function(){
        try {
          const btn = document.getElementById('mnav-btn');
          const panel = document.getElementById('mnav-panel');
          if (btn && panel) {
            btn.addEventListener('click', function(){
              if (panel.classList.contains('hidden')) panel.classList.remove('hidden');
              else panel.classList.add('hidden');
            });
          }
        } catch (e) {}
      })();
    </script>
  </header>`;
}

export function renderFooter(opts: FooterOptions = {}): string {
  const widthClass = opts.widthClass || "max-w-4xl";
  return `
  <footer class="w-full mt-auto py-6">
    <div class="${widthClass} mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
      <p>由 Google Gemini 驱动。您的下一道美味佳肴，只需轻轻一点。</p>
    </div>
  </footer>`;
}