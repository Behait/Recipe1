import React from 'react';
import { RecipeOption } from '../types';

interface RecipeOptionsListProps {
  options: RecipeOption[];
  onSelect: (option: RecipeOption) => void;
  selectedOption: RecipeOption | null;
}

const RecipeOptionsList: React.FC<RecipeOptionsListProps> = ({ options, onSelect, selectedOption }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-fade-in-fast">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            我们为您找到了几个菜谱：
        </h2>
        <div className="space-y-3">
            {options.map((option, index) => {
                const isSelected = option.name === selectedOption?.name;
                const linkClasses = `w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                    isSelected
                      ? 'bg-emerald-100 dark:bg-emerald-900 ring-2 ring-emerald-500 shadow-md cursor-default'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 hover:shadow-sm'
                }`;
                const textClasses = `font-bold text-lg group-hover:text-emerald-800 dark:group-hover:text-emerald-200 ${
                    isSelected
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-emerald-700 dark:text-emerald-300'
                }`;

                return (
                    <a
                        key={index}
                        href={`/recipes/${option.slug}`}
                        onClick={(e) => {
                            e.preventDefault(); // 阻止默认的链接跳转行为
                            onSelect(option);
                        }}
                        className={linkClasses}
                    >
                        <p className={textClasses}>{option.name}</p>
                    </a>
                );
            })}
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

export default RecipeOptionsList;
