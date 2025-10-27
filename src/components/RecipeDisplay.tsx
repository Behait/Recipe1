import React from 'react';
import type { Recipe } from '../types';

interface RecipeDisplayProps {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  onStartOver: () => void;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, onSave, onStartOver }) => {
  const isSaved = !!recipe.id;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-fade-in-fast overflow-hidden">
      {recipe.imageUrl && (
        <img 
          src={recipe.imageUrl} 
          alt={recipe.recipeName} 
          className="w-full h-48 sm:h-64 object-cover" 
        />
      )}
      <div className="p-6 sm:p-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">{recipe.recipeName}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 italic">{recipe.description}</p>
        
        <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 text-center">
          <div className="flex-1 min-w-[120px] bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">准备时间</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{recipe.prepTime}</p>
          </div>
          <div className="flex-1 min-w-[120px] bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">烹饪时间</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{recipe.cookTime}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b-2 border-emerald-500 pb-2">所需食材</h3>
              <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
              {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
              ))}
              </ul>
          </div>
          <div className="md:col-span-3">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b-2 border-emerald-500 pb-2">制作步骤</h3>
              <ol className="space-y-4 text-slate-600 dark:text-slate-300">
              {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                      <span className="bg-emerald-500 text-white font-bold rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3 flex-shrink-0">{index + 1}</span>
                      <span>{instruction}</span>
                  </li>
              ))}
              </ol>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => onSave(recipe)}
            disabled={isSaved}
            className="w-full sm:w-auto flex-1 flex justify-center items-center gap-2 bg-emerald-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-emerald-500 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:dark:bg-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
            </svg>
            <span>{isSaved ? '已保存' : '保存菜谱'}</span>
          </button>
          <button
              onClick={onStartOver}
              className="w-full sm:w-auto flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-slate-400 transition-colors"
          >
            再来一次
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RecipeDisplay;
