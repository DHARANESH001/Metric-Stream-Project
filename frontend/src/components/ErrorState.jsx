import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center my-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900">Server Connection Error</h3>
      <p className="mt-1 text-sm text-rose-700 max-w-md mx-auto">
        {message || 'Unable to connect to the backend server. Please verify that the API is running.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      )}
    </div>
  );
}

export default ErrorState;
