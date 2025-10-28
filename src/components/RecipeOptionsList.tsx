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
        {options.map((option, index) => (
          <button
            key={option.slug}
            onClick={() => onSelect(option)}
            className={`w-full text-left p-4 rounded-lg transition-all duration-200 block ${
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
        ))}
      </div>
    </div>
  );
};

export default RecipeOptionsList;
