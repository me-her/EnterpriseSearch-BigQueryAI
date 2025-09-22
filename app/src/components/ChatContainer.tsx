import { useState, useEffect } from 'react';
import type { ChatMessage as ChatMessageType, AgentEvent } from '../types/chat';
import { chatApi } from '../services/chatApi';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize a new session on app start
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await chatApi.createNewSession();
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initializeSession();
  }, []);

  const handleNewChat = async () => {
    try {
      await chatApi.createNewSession();
      setMessages([]);
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      message: messageText,
      events: [],
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Get raw events from API
      const events: AgentEvent[] = await chatApi.sendMessage(messageText);
      // Update message with events
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, events }
          : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Create an error event
      const errorEvent: AgentEvent = {
        id: `error-${Date.now()}`,
        timestamp: Date.now() / 1000,
        author: 'system',
        content: {
          role: 'model',
          parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
        },
        invocationId: `error-${Date.now()}`,
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, events: [errorEvent] }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <img src="/BigQuery.png" alt="Bigquery AI/ML assistant" className="w-8 h-8" />
            Bigquery AI/ML Assistant
          </h1>
          
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to SEC Filings Assistant!</h2>
              <p className="text-gray-500">Send a message to get started. I can help you with the contracts data on BigQuery.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start max-w-5xl mx-auto">
            <div className="max-w-xs lg:max-w-md px-5 py-4 bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
