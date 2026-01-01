
import React, { useState, useEffect, useRef } from 'react';
import { Message, UserProfile } from '../types';
// Added missing X and MessageCircle icons
import { Send, Search, Trash2, MoreVertical, Phone, Video, ChevronLeft, User, Eraser, X, MessageCircle } from 'lucide-react';

interface DirectMessagesProps {
  currentUser: UserProfile;
  allMessages: Message[];
  onSendMessage: (text: string, recipientId: string) => void;
  onDeleteMessage: (id: string) => void;
  otherProfiles: UserProfile[];
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ currentUser, allMessages, onSendMessage, onDeleteMessage, otherProfiles }) => {
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRecipient = otherProfiles.find(p => p.id === activeRecipientId);
  
  const conversationMessages = allMessages.filter(m => 
    (m.senderId === currentUser.id && m.recipientId === activeRecipientId) ||
    (m.senderId === activeRecipientId && m.recipientId === currentUser.id)
  ).sort((a, b) => a.timestamp - b.timestamp);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRecipientId) return;
    onSendMessage(messageInput, activeRecipientId);
    setMessageInput('');
  };

  const handleEraseChat = () => {
    if (confirm("Erase all messages in this conversation? This cannot be undone.")) {
      conversationMessages.forEach(m => onDeleteMessage(m.id));
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] bg-white rounded-3xl shadow-xl border border-gray-100 flex overflow-hidden animate-fadeIn">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${activeRecipientId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-2xl font-display font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Search family..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {otherProfiles.map(profile => {
            const lastMsg = allMessages.filter(m => 
              (m.senderId === currentUser.id && m.recipientId === profile.id) ||
              (m.senderId === profile.id && m.recipientId === currentUser.id)
            ).sort((a, b) => b.timestamp - a.timestamp)[0];

            return (
              <div 
                key={profile.id} 
                onClick={() => setActiveRecipientId(profile.id)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${activeRecipientId === profile.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
              >
                <img src={profile.avatarUrl} className="w-12 h-12 rounded-full border border-gray-100" alt={profile.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-900 text-sm">{profile.name}</h3>
                    <span className="text-[10px] text-gray-400">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{lastMsg ? (lastMsg.senderId === currentUser.id ? 'You: ' : '') + lastMsg.text : 'Start a chat!'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeRecipientId ? 'hidden md:flex' : 'flex'}`}>
        {activeRecipient ? (
          <>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRecipientId(null)} className="md:hidden"><ChevronLeft size={24} /></button>
                <img src={activeRecipient.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <h3 className="font-bold text-gray-900">{activeRecipient.name}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live Connection</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={handleEraseChat} className="text-gray-300 hover:text-red-500 transition-colors" title="Erase Conversation"><Eraser size={20} /></button>
                <MoreVertical size={20} className="text-gray-300" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {conversationMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} group animate-slideUp`}>
                  <div className={`relative max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.senderId === currentUser.id ? 'bg-black text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                    {msg.text}
                    {/* Fixed missing X component */}
                    <button 
                      onClick={() => onDeleteMessage(msg.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-6 border-t border-gray-100 bg-white">
              <div className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Send message to ${activeRecipient.name}...`}
                  className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm"
                />
                <button type="submit" disabled={!messageInput.trim()} className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              {/* Fixed missing MessageCircle component */}
              <MessageCircle size={64} />
            </div>
            <p className="text-lg font-bold text-gray-400">Your Conversations</p>
            <p className="text-sm">Select a contact to start chatting live!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
