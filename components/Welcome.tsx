import React from 'https://esm.sh/react@^19.2.0';

const Welcome: React.FC = () => {
  return (
    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">欢迎使用菜谱生成器！</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        还在为做什么菜而烦恼吗？输入您手头的食材，让我们的 AI 厨师为您创作一道创意菜谱吧。
      </p>
      <div className="flex justify-center items-center text-emerald-600 dark:text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="font-semibold">快速、简单又美味的菜肴正等着您！</p>
      </div>
    </div>
  );
};

export default Welcome;