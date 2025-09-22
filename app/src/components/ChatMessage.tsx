import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import type { ChatMessage as ChatMessageType, AgentEvent } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

function CodeBlock({ code, language = 'sql' }: { code: string; language?: string }) {
  return (
    <div className="mt-3">
      <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-inner">
        <div className="text-xs text-gray-400 mb-3 uppercase font-medium tracking-wide">{language}</div>
        <pre className="text-gray-100 text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function TableView({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows || rows.length === 0) return null;
  
  const keys = Object.keys(rows[0] ?? {});
  
  return (
    <div className="mt-3 overflow-x-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {keys.map(key => (
                <th key={key} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.slice(0, 10).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {keys.map(key => (
                  <td key={key} className="px-4 py-3 text-gray-800">
                    {String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <div className="mt-3 text-xs text-gray-500 text-center bg-gray-50 py-2 rounded-lg">
          Showing 10 of {rows.length} rows
        </div>
      )}
    </div>
  );
}

function FunctionCallView({ functionCall }: { functionCall: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { name, args } = functionCall;
  
  return (
    <div className="mt-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
      <div 
        className="flex items-center justify-between cursor-pointer p-3 hover:bg-blue-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-blue-700">🔧 Tool Call: {name}</div>
        </div>
        <div className="text-blue-600">
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          {args?.query && (
            <CodeBlock code={args.query} />
          )}
          
          {args && !args.query && (
            <div className="mt-2 text-xs text-gray-600">
              <ReactMarkdown>{`\`\`\`json\n${JSON.stringify(args, null, 2)}\n\`\`\``}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FunctionResponseView({ functionResponse }: { functionResponse: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { name, response } = functionResponse;
  
  return (
    <div className="mt-3 border-l-4 border-green-400 bg-green-50 rounded-r-lg">
      <div 
        className="flex items-center justify-between cursor-pointer p-3 hover:bg-green-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-green-700">
            ✅ Tool Result: {name} 
            {response?.status && (
              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                response.status === 'SUCCESS' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}>
                {response.status}
              </span>
            )}
          </div>
        </div>
        <div className="text-green-600">
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          {response?.rows && response.rows.length > 0 ? (
            <TableView rows={response.rows} />
          ) : response ? (
            <div className="mt-2 text-xs text-gray-600">
              <ReactMarkdown>{`\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EventView({ event }: { event: AgentEvent }) {
  const parts = event?.content?.parts || [];
  
  return (
    <div className="mt-2">
      {/* Event metadata
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
        <span className="font-medium">{event.author}</span>
        <span>•</span>
        <span>{new Date(event.timestamp * 1000).toLocaleTimeString()}</span>
        {event.finishReason && (
          <>
            <span>•</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{event.finishReason}</span>
          </>
        )}
      </div> */}
      
      {/* Event content */}
      <div className="space-y-2">
        {parts.map((part, i) => {
          if (part.functionCall) {
            return <FunctionCallView key={`call-${i}`} functionCall={part.functionCall} />;
          }
          
          if (part.functionResponse) {
            return <FunctionResponseView key={`response-${i}`} functionResponse={part.functionResponse} />;
          }
          
          if (typeof part.text === 'string' && part.text.trim()) {
            return (
              <div key={`text-${i}`} className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }
          
          return null;
        })}
      </div>
      
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* User Message */}
      <div className="flex justify-end">
        <div className="max-w-2xl px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-md shadow-lg">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{message.message}</ReactMarkdown>
          </div>
        </div>
      </div>
      
      {/* Bot Response */}
      {message.events && message.events.length > 0 && (
        <div className="flex justify-start">
          <div className="max-w-4xl px-5 py-4 bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-md shadow-lg">
            <div className="space-y-4">
              {message.events.map((event, i) => (
                <EventView key={event.id || i} event={event} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}