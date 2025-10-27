export type HeaderOptions = {
  widthClass?: string;
  rightHtml?: string;
  mobileExtraHtml?: string;
};

export type FooterOptions = {
  widthClass?: string;
};

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
        ${rightHtml}
      </nav>
      <div class="md:hidden ml-auto">
        <div class="space-y-3">
          <div class="flex gap-4">
            <a href="/recipes/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">菜谱</a>
            <a href="/categories/" class="text-slate-700 dark:text-slate-200 hover:text-emerald-600">分类</a>
          </div>
          ${mobileExtraHtml}
        </div>
      </div>
    </div>
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