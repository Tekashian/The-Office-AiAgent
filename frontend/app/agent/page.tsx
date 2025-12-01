'use client';

import { usePDFRefresh } from '@/context/pdfRefreshContext';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgent } from '@/hooks/useAgent';
import { AgentMessage } from '@/components/agent/AgentMessage';
import { AgentInput } from '@/components/agent/AgentInput';
import { AgentExamples } from '@/components/agent/AgentExamples';
import { AgentLoadingIndicator } from '@/components/agent/AgentLoadingIndicator';

export default function AgentPage() {
  const { triggerRefresh } = usePDFRefresh();

  const {
    messages,
    input,
    isLoading,
    showExamples,
    setInput,
    sendMessage,
    hideExamples,
    messagesEndRef,
  } = useAgent({
    onPDFGenerated: triggerRefresh,
    requireAuth: true,
  });

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    hideExamples();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col p-6 min-h-0">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Rozmawiaj z agentem AI i automatyzuj swoje zadania
        </p>

        <Card className="flex flex-1 flex-col min-h-0">
          <CardContent className="flex flex-1 flex-col p-0 min-h-0">
            {/* Messages */}
            <div className="flex-1 space-y-4 p-6 overflow-y-auto custom-scrollbar">
              {messages.map((message, index) => (
                <AgentMessage key={message.id} message={message} index={index} />
              ))}

              {/* Example Prompts */}
              {showExamples && messages.length === 1 && (
                <AgentExamples onSelectPrompt={handleSelectPrompt} />
              )}

              {/* Loading Indicator */}
              {isLoading && <AgentLoadingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <AgentInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={false}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
