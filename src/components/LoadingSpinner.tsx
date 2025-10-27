import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">正在寻找完美的菜谱...</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">我们的 AI 厨师正在施展魔法！</p>
    </div>
  );
};

export default LoadingSpinner;
