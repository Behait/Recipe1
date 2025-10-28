import React from 'react';
import type { Recipe } from '../types';

interface RecipeOfTheDayProps {
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
}

const RecipeOfTheDay: React.FC<RecipeOfTheDayProps> = ({ recipe, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse flex flex-col items-center text-center">
          <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (recipe) {
      return (
        <div className="text-center">
          {recipe.imageUrl && (
             <img src={recipe.imageUrl} alt={recipe.recipeName} className="w-full h-40 object-cover rounded-lg mb-4 shadow-sm" />
          )}
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 mb-2">{recipe.recipeName}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{recipe.description}</p>
          <a
            href={`/recipes/${recipe.slug}`}
            className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-emerald-500 transition-all duration-300"
          >
            查看详情
          </a>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-emerald-500/20">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center border-b pb-3 border-slate-200 dark:border-slate-700">
        ✨ 今日推荐 ✨
      </h2>
      {renderContent()}
    </div>
  );
};

export default RecipeOfTheDay;
