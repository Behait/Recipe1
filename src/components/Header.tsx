import React, { useState } from 'react';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `/recipes/?q=${encodeURIComponent(q)}`;
    setOpen(false);
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md w-full sticky top-0 z-10">
      <div className="container mx-auto p-4 flex items-center gap-4">
        <a href="/" className="flex items-center min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
            <path d="M15.5 12c-1.38 2.83-4.62 4.5-7.5 3.5s-4.5-4.62-3.5-7.5c.59-1.68 2.16-3 3.92-3.23"></path>
            <path d="M12 9.45a2.55 2.55 0 1 0 0 5.1 2.55 2.55 0 0 0 0-5.1z"></path>
          </svg>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">菜谱生成器</h1>
        </a>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-4 ml-auto">
          <a href="/recipes/" className="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Recipes</a>
          <a href="/categories/" className="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Categories</a>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索菜谱"
              className="w-52 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
            />
            <button type="submit" className="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">搜索</button>
          </form>
        </nav>

        {/* 移动端折叠菜单 */}
        <div className="ml-auto md:hidden">
          <button aria-label="打开菜单" onClick={() => setOpen((v) => !v)} className="p-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
          <div className="container mx-auto p-4 space-y-3">
            <div className="flex gap-4">
              <a href="/recipes/" className="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Recipes</a>
              <a href="/categories/" className="text-slate-700 dark:text-slate-200 hover:text-emerald-600">Categories</a>
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索菜谱"
                className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
              />
              <button type="submit" className="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">搜索</button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;