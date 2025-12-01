import { memo } from 'react';
import { Bot } from 'lucide-react';
import type { AgentMessage as AgentMessageType } from '@/hooks/useAgent';

interface AgentMessageProps {
  message: AgentMessageType;
  index: number;
}

export const AgentMessage = memo<AgentMessageProps>(({ message, index }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`flex max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 ${
            isUser
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50'
              : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/50 animate-pulse-slow'
          }`}
          aria-hidden="true"
        >
          {isUser ? (
            <span className="text-sm font-medium">JA</span>
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>

        {/* Message Content */}
        <div
          className={`rounded-2xl px-4 py-3 transition-all hover:scale-[1.02] ${
            isUser
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 shadow-lg'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          <time
            className={`mt-1 block text-xs ${
              isUser
                ? 'text-primary-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            dateTime={message.timestamp.toISOString()}
          >
            {message.timestamp.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
      </div>
    </div>
  );
});

AgentMessage.displayName = 'AgentMessage';
