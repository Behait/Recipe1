import React from 'react';
import type { Recipe } from '../types';

interface SavedRecipesProps {
  recipes: Recipe[];
  onView: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onClose: () => void;
}

const SavedRecipes: React.FC<SavedRecipesProps> = ({ recipes, onView, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center animate-fade-in-fast" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">我保存的菜谱</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="overflow-y-auto p-6">
          {recipes.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">您还没有保存任何菜谱。</p>
          ) : (
            <ul className="space-y-4">
              {recipes.map((recipe) => (
                <li key={recipe.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex items-center justify-between transition-shadow hover:shadow-md">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{recipe.recipeName}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onView(recipe)} className="text-sm bg-emerald-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-emerald-600 transition-colors">查看</button>
                    <button onClick={() => onDelete(recipe.id!)} className="text-sm bg-red-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-red-600 transition-colors">删除</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SavedRecipes;
