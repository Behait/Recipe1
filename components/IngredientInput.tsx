import React from 'https://esm.sh/react@^19.2.0';

interface IngredientInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const IngredientInput: React.FC<IngredientInputProps> = ({ value, onChange, onSubmit, isLoading }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg transition-shadow hover:shadow-xl w-full">
      <label htmlFor="ingredients" className="block text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">
        您有什么食材？
      </label>
      <textarea
        id="ingredients"
        value={value}
        onChange={onChange}
        placeholder="例如：鸡胸肉, 米饭, 西兰花, 酱油, 大蒜"
        className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className="mt-4 w-full flex justify-center items-center bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-emerald-500 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:dark:bg-slate-600"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在生成...
          </>
        ) : (
          '生成我的菜谱！'
        )}
      </button>
    </div>
  );
};

export default IngredientInput;