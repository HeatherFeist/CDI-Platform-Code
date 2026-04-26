import React, { useState, useRef, useEffect } from 'react';
import { googleAIService, ChatResponse } from '../../services/GoogleAIService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  actionItems?: string[];
}

interface AIChatAssistantProps {
  userType: 'buyer' | 'seller' | 'admin';
  currentPage?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({
  userType,
  currentPage,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: getWelcomeMessage(),
        isUser: false,
        timestamp: new Date(),
        suggestions: getInitialSuggestions()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, userType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getWelcomeMessage = () => {
    const messages = {
      buyer: "Hi! I'm your AI shopping assistant for Constructive Designs Marketplace. I can help you find products, understand our nonprofit impact, or answer questions about your purchases. How can I help you today?",
      seller: "Hello! I'm your AI selling assistant. I can help you create better listings, optimize your prices, understand marketplace policies, or grow your nonprofit store. What would you like help with?",
      admin: "Welcome! I'm your AI admin assistant. I can help with platform management, member support, analytics insights, and policy questions. How can I assist you today?"
    };
    return messages[userType];
  };

  const getInitialSuggestions = () => {
    const suggestions = {
      buyer: [
        "How do my purchases support nonprofits?",
        "Help me find eco-friendly products",
        "What's the return policy?",
        "Show me local nonprofit stores"
      ],
      seller: [
        "How can I improve my product listings?",
        "What pricing strategy should I use?",
        "Help me understand marketplace fees",
        "Tips for better product photos"
      ],
      admin: [
        "Show member engagement statistics",
        "Help with member application review",
        "Marketplace policy questions",
        "Revenue optimization suggestions"
      ]
    };
    return suggestions[userType];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await googleAIService.getChatResponse(inputMessage, {
        userType,
        currentPage,
        userHistory: messages.slice(-5).map(m => m.content)
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actionItems: response.actionItems
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact our support team if the issue persists.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[600px] w-96 flex-col overflow-hidden rounded-[1.5rem] border border-slate-700/70 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-indigo-600/90 to-cyan-500/80 p-4 text-white">
        <div className="flex items-center">
          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/35">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs opacity-90 capitalize">{userType} Support</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white transition-colors hover:text-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/60 p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.isUser 
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white' 
                : 'border border-slate-800 bg-slate-900 text-slate-100'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs opacity-75 font-medium">Quick suggestions:</p>
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full rounded bg-slate-950/40 p-2 text-left text-xs transition-colors hover:bg-slate-900/70"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Items */}
              {message.actionItems && message.actionItems.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs opacity-75 font-medium mb-1">Recommended actions:</p>
                  <ul className="space-y-1">
                    {message.actionItems.map((action, index) => (
                      <li key={index} className="text-xs flex items-start">
                        <span className="inline-block w-1 h-1 bg-current rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs opacity-50 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.1s' }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-950/90 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="market-input flex-1 px-3 py-2 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="market-button-primary flex items-center rounded-lg px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Quick actions for the user type */}
        <div className="mt-2 flex flex-wrap gap-1">
          {userType === 'seller' && (
            <>
              <button
                onClick={() => handleSuggestionClick("Help me optimize my listing prices")}
                className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                💰 Price Help
              </button>
              <button
                onClick={() => handleSuggestionClick("Generate product description")}
                className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                ✍️ Write Description
              </button>
            </>
          )}
          
          {userType === 'buyer' && (
            <>
              <button
                onClick={() => handleSuggestionClick("Find eco-friendly products near me")}
                className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                🌱 Eco Products
              </button>
              <button
                onClick={() => handleSuggestionClick("How does my purchase help nonprofits?")}
                className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                ❤️ Impact Info
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Chat launcher button component
export const AIChatLauncher: React.FC<{
  userType: 'buyer' | 'seller' | 'admin';
  currentPage?: string;
}> = ({ userType, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Simulate new message notification (you could integrate with real notifications)
  useEffect(() => {
    const timer = setTimeout(() => setHasNewMessage(true), 30000); // Show after 30 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-950/40 transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        {hasNewMessage && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        )}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <AIChatAssistant
        userType={userType}
        currentPage={currentPage}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};