import React, { useEffect, useMemo, useState } from 'react';

type TabKey = 'popular' | 'week';

interface RecipeItem {
  id: string;
  slug?: string;
  recipe_name: string;
  description?: string;
  image_url?: string;
  lifetime_hits?: number;
  weekly_hits?: number;
}

interface ApiResponse {
  items: RecipeItem[];
  total: number;
  page: number;
  limit: number;
  sort?: string | null;
}

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'px-4 py-2 rounded-md text-sm font-medium transition-colors ' +
      (active
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600')
    }
  >
    {children}
  </button>
);

const RecipeCard: React.FC<{ item: RecipeItem; badge?: string } > = ({ item, badge }) => {
  const title = item.recipe_name;
  const desc = item.description || '';
  const href = `/recipes/${item.id}`;
  return (
    <article className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      <a href={href} className="block relative">
        {item.image_url && (
          <img src={item.image_url} alt={title} className="w-full h-36 sm:h-40 object-cover" loading="lazy" />
        )}
        {badge && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-500/90 text-white shadow">
            {badge}
          </span>
        )}
      </a>
      <div className="p-3 space-y-2">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{title}</h3>
        {desc && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{desc}</p>}
        <a href={href} className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700">查看详情 →</a>
      </div>
    </article>
  );
};

const TrendingTabs: React.FC = () => {
  const [active, setActive] = useState<TabKey>('popular');
  const [popular, setPopular] = useState<RecipeItem[]>([]);
  const [week, setWeek] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState<{ popular: boolean; week: boolean }>({ popular: false, week: false });
  const [error, setError] = useState<{ popular: string | null; week: string | null }>({ popular: null, week: null });

  const fetchList = async (key: TabKey) => {
    const sortParam = key === 'popular' ? 'popular' : 'popular_week';
    const url = `/api/recipes?sort=${sortParam}&limit=12`;
    try {
      setLoading((s) => ({ ...s, [key]: true }));
      setError((e) => ({ ...e, [key]: null }));
      const res = await fetch(url);
      if (!res.ok) throw new Error(`接口错误 ${res.status}`);
      const data: ApiResponse = await res.json();
      if (key === 'popular') setPopular(data.items || []);
      else setWeek(data.items || []);
    } catch (err: any) {
      setError((e) => ({ ...e, [key]: err?.message || '加载失败' }));
    } finally {
      setLoading((s) => ({ ...s, [key]: false }));
    }
  };

  useEffect(() => {
    // 初次加载热门，并预取本周排行
    fetchList('popular');
    const t = setTimeout(() => fetchList('week'), 0);
    return () => clearTimeout(t);
  }, []);

  const currentItems = useMemo(() => (active === 'popular' ? popular : week), [active, popular, week]);
  const currentLoading = active === 'popular' ? loading.popular : loading.week;
  const currentError = active === 'popular' ? error.popular : error.week;
  const moreHref = active === 'popular' ? '/recipes/?sort=popular' : '/recipes/?sort=popular_week';

  return (
    <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg w-full border border-emerald-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <TabButton active={active === 'popular'} onClick={() => setActive('popular')}>热门</TabButton>
          <TabButton active={active === 'week'} onClick={() => setActive('week')}>本周排行</TabButton>
        </div>
        <a href={moreHref} className="text-sm text-emerald-600 hover:text-emerald-700">查看更多</a>
      </div>

      {currentLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      )}

      {currentError && (
        <p className="text-center text-red-500">{currentError}</p>
      )}

      {!currentLoading && !currentError && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {currentItems.map((it) => (
            <RecipeCard
              key={it.id}
              item={it}
              badge={
                active === 'popular'
                  ? (typeof it.lifetime_hits === 'number' ? `🔥 ${it.lifetime_hits}` : undefined)
                  : (typeof it.weekly_hits === 'number' ? `📈 ${it.weekly_hits}` : undefined)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TrendingTabs;