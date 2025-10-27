import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative flex flex-col sm:flex-row justify-between items-center gap-4" role="alert">
      <div>
        <strong className="font-bold">出错了！ </strong>
        <span className="block sm:inline">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-100 dark:focus:ring-offset-slate-800 focus:ring-red-500 transition-colors duration-200 flex-shrink-0 self-start sm:self-center"
        >
          再试一次
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
