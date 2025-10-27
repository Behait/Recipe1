import React from 'react';

interface HeaderProps {
  onToggleSaved: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSaved }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md w-full sticky top-0 z-10">
      <div className="container mx-auto p-4 flex items-center justify-between gap-4">
        <div className="flex items-center min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
            <path d="M15.5 12c-1.38 2.83-4.62 4.5-7.5 3.5s-4.5-4.62-3.5-7.5c.59-1.68 2.16-3 3.92-3.23"></path>
            <path d="M12 9.45a2.55 2.55 0 1 0 0 5.1 2.55 2.55 0 0 0 0-5.1z"></path>
            </svg>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            菜谱生成器
            </h1>
        </div>
        <button 
          onClick={onToggleSaved} 
          className="flex items-center gap-2 bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-emerald-500 transition-all duration-300 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
          </svg>
          <span className="whitespace-nowrap">我保存的菜谱</span>
        </button>
      </div>
    </header>
  );
};

export default Header;