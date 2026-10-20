import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading inventory records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
      <span className="text-xs text-slate-400 mt-1">Connecting to FastAPI backend...</span>
    </div>
  );
}

export default LoadingState;
