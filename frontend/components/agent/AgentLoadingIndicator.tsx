import { memo } from 'react';
import { Loader2 } from 'lucide-react';

export const AgentLoadingIndicator = memo(() => {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex max-w-[80%] gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/50"
          aria-hidden="true"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 shadow-lg dark:from-gray-800 dark:to-gray-900">
          <div className="flex gap-1" role="status" aria-label="AI myśli">
            <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.2s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    </div>
  );
});

AgentLoadingIndicator.displayName = 'AgentLoadingIndicator';
