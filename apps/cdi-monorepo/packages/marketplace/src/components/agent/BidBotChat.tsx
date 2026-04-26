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
        className="group fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 p-4 text-white shadow-2xl shadow-indigo-950/50 transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/30"
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
      <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-slate-700/70 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <Bot size={24} className="text-indigo-300" />
            <span className="text-white font-semibold">BidBot</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <MessageCircle size={20} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-96 flex-col overflow-hidden rounded-[1.75rem] border border-slate-700/70 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-indigo-600/90 to-cyan-500/80 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot size={28} className="text-white" />
              <span className="absolute -bottom-1 -right-1 bg-green-400 rounded-full w-3 h-3 border-2 border-white"></span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">BidBot</h3>
              <p className="text-slate-100 text-xs">Your AI Auction Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="rounded p-1.5 text-white transition-colors hover:bg-slate-900/40"
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1.5 text-white transition-colors hover:bg-slate-900/40"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/60 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white'
                  : 'border border-slate-800 bg-slate-900 text-slate-100 shadow-sm'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Bot size={16} className="text-indigo-300" />
                  <span className="text-xs font-semibold text-indigo-300">BidBot</span>
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Bot size={16} className="text-indigo-300" />
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-3">
          <p className="mb-2 flex items-center text-xs text-slate-400">
            <Sparkles size={12} className="mr-1" />
            Quick suggestions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickSuggestions.slice(0, 4).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(suggestion)}
                className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-left text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-950/90 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="market-input flex-1 px-4 py-3 text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="market-button-primary rounded-xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Powered by AI • May make mistakes
        </p>
      </div>
    </div>
  );
}
