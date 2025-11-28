import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, TrendingUp, HelpCircle, MessageCircle, Minimize2 } from 'lucide-react';
import { bidBot, ChatMessage } from '../../services/BidBotService';
import { useAuth } from '../../contexts/AuthContext';

interface BidBotChatProps {
  context?: {
    currentListing?: any;
  };
}

export default function BidBotChat({ context }: BidBotChatProps) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationId = user?.id || 'guest';

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi${profile?.username ? ' ' + profile.username : ''}! 👋 I'm BidBot, your AI auction assistant. I can help you with:

• Bidding strategies and advice
• Price analysis and market insights
• Listing tips and suggestions
• Delivery and shipping options
• Trade negotiations

How can I help you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, profile]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (!bidBot.isConfigured()) {
      alert('BidBot requires an OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await bidBot.chat(
        input,
        {
          userId: user?.id,
          currentListing: context?.currentListing,
          userProfile: profile
        },
        conversationId
      );

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const quickSuggestions = bidBot.getQuickSuggestions(context);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 z-50 group"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          AI
        </span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-2xl z-50 p-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <Bot size={24} className="text-white" />
            <span className="text-white font-semibold">BidBot</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="text-white hover:bg-white/20 rounded p-1 transition-colors"
            >
              <MessageCircle size={20} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col h-[600px] border border-purple-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot size={28} className="text-white" />
              <span className="absolute -bottom-1 -right-1 bg-green-400 rounded-full w-3 h-3 border-2 border-white"></span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">BidBot</h3>
              <p className="text-purple-100 text-xs">Your AI Auction Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/20 rounded p-1.5 transition-colors"
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1.5 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Bot size={16} className="text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600">BidBot</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <p className="text-xs opacity-60 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Bot size={16} className="text-purple-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t bg-white">
          <p className="text-xs text-gray-500 mb-2 flex items-center">
            <Sparkles size={12} className="mr-1" />
            Quick suggestions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickSuggestions.slice(0, 4).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(suggestion)}
                className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg px-3 py-2 text-left transition-colors border border-purple-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-4 py-3 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Powered by AI • May make mistakes
        </p>
      </div>
    </div>
  );
}
