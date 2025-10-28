import React from 'react';
import { RecipeOption } from '../types';

interface RecipeOptionsListProps {
  options: RecipeOption[];
  onSelect: (option: RecipeOption) => void;
  selectedOption: RecipeOption | null;
}

const RecipeOptionsList: React.FC<RecipeOptionsListProps> = ({ options, onSelect, selectedOption }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
        我们为您找到了几个菜谱：
      </h2>
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.slug} className="flex gap-2">
            <button
              onClick={() => onSelect(option)}
              className={`flex-1 text-left p-4 rounded-lg transition-all duration-200 ${
                selectedOption?.slug === option.slug
                  ? 'bg-emerald-100 dark:bg-emerald-900 ring-2 ring-emerald-500 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50'
              }`}
            >
              <p
                className={`font-bold text-lg ${
                  selectedOption?.slug === option.slug
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {option.name}
              </p>
            </button>
            {option.slug && (
              <a
                href={`/recipes/${option.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                title="在新页面查看详情"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeOptionsList;
