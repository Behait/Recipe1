import React from 'react';

const Welcome: React.FC = () => {
  return (
    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">欢迎使用菜谱生成器！</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        还在为做什么菜而烦恼吗？输入您手头的食材，让我们的 AI 厨师为您创作一道创意菜谱吧。
      </p>
      <div className="welcome-container">
        <img src="/images/ai-chef.png" alt="一位正在烹饪的AI厨师" className="welcome-image" />
        <h1>欢迎使用 <span className="highlight">AI菜谱生成器</span></h1>
        <p>输入您拥有的食材，发现无限美食可能！</p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <p className="font-semibold">快速、简单又美味的菜肴正等着您！</p>
    </div>
  );
};

export default Welcome;
