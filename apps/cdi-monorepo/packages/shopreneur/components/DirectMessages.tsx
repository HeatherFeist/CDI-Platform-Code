
import React, { useState, useEffect, useRef } from 'react';
import { Message, UserProfile } from '../types';
import { Send, Search, Trash2, MoreVertical, ChevronLeft, Eraser, X, MessageCircle, ShieldCheck } from 'lucide-react';

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

  return (
    <div className="h-[calc(100vh-200px)] glass-card rounded-[3rem] border border-white/5 flex overflow-hidden animate-fadeIn bg-white/[0.01]">
      {/* Sidebar */}
      <div className={`w-full md:w-96 border-r border-white/5 flex flex-col ${activeRecipientId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 space-y-6">
          <h2 className="text-3xl font-display font-bold text-white">Communications</h2>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="text" placeholder="Filter members..." className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm focus:border-indigo-500 outline-none text-white font-medium" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {otherProfiles.map(profile => {
            const lastMsg = allMessages.filter(m => 
              (m.senderId === currentUser.id && m.recipientId === profile.id) ||
              (m.senderId === profile.id && m.recipientId === currentUser.id)
            ).sort((a, b) => b.timestamp - a.timestamp)[0];

            return (
              <div 
                key={profile.id} 
                onClick={() => setActiveRecipientId(profile.id)}
                className={`p-5 flex items-center gap-4 cursor-pointer rounded-[1.5rem] transition-all ${activeRecipientId === profile.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <img src={profile.avatarUrl} className="w-14 h-14 rounded-2xl border border-white/10 bg-slate-800" alt={profile.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-100 text-sm">{profile.name}</h3>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-light leading-none">{lastMsg ? lastMsg.text : 'Initiate secure channel...'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#020617]/50 ${!activeRecipientId ? 'hidden md:flex' : 'flex'}`}>
        {activeRecipient ? (
          <>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveRecipientId(null)} className="md:hidden text-slate-400"><ChevronLeft size={24} /></button>
                <img src={activeRecipient.avatarUrl} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                <div>
                  <h3 className="font-bold text-white">{activeRecipient.name}</h3>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <ShieldCheck size={10} /> Encrypted Session
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => { if(confirm("Purge history?")) conversationMessages.forEach(m => onDeleteMessage(m.id)); }} className="text-slate-500 hover:text-red-400 transition-colors"><Eraser size={20} /></button>
                <MoreVertical size={20} className="text-slate-500" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
              {conversationMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`relative max-w-[65%] px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-lg ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-bl-none backdrop-blur-sm'}`}>
                    {msg.text}
                    <button 
                      onClick={() => onDeleteMessage(msg.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-8 bg-[#020617]/40">
              <div className="flex gap-4 bg-white/5 p-3 rounded-[2rem] border border-white/10 focus-within:border-indigo-500/50 transition-all">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Secure message to ${activeRecipient.name}...`}
                  className="flex-1 bg-transparent px-6 py-3 focus:outline-none text-sm text-white"
                />
                <button type="submit" disabled={!messageInput.trim()} className="bg-white text-black p-4 rounded-[1.5rem] hover:bg-slate-200 disabled:opacity-20 transition-all shadow-xl">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-700 space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/5">
              <MessageCircle size={48} className="text-slate-700" />
            </div>
            <div className="text-center">
              <p className="text-xl font-display font-bold text-slate-600">Secure Comms Hub</p>
              <p className="text-sm font-light text-slate-700 mt-2">Select a member to establish an encrypted connection.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
