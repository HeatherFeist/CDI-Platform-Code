
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MessageCircle, Send, X, TrendingUp, Loader2, Bot, Mic, MicOff, Volume2 } from 'lucide-react';
import { ContentPrompt } from '../types';

interface BusinessMentorProps {
  onAddChallenge: (challenges: ContentPrompt[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Custom manual decoding for PCM audio stream as per guidelines
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const BusinessMentor: React.FC<BusinessMentorProps> = ({ onAddChallenge, isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'mentor'; text: string }[]>([
    { sender: 'mentor', text: "Hey Boss! 👋 I'm your Live AI Business Mentor. Click the Mic to talk or type your questions below!" }
  ]);
  const [isLive, setIsLive] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  // Store the promise instead of the resolved session to avoid stale closures and follow guidelines.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setMessages(prev => [...prev, { sender: 'mentor', text: "I'm connected! How can I help you grow today? 🚀" }]);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio output stream
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const audioData = decode(base64Audio);
              const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }

            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
               setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.sender === 'mentor') {
                     return [...prev.slice(0, -1), { sender: 'mentor', text: last.text + message.serverContent!.outputTranscription!.text }];
                  }
                  return [...prev, { sender: 'mentor', text: message.serverContent!.outputTranscription!.text }];
               });
            }
          },
          onerror: (e) => console.error("Live API Error", e),
          onclose: () => {
            setIsLive(false);
            sessionPromiseRef.current = null;
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are a supportive and clever business mentor for teenage entrepreneurs. Keep answers short and motivational.',
          outputAudioTranscription: {}
        }
      });

      sessionPromiseRef.current = sessionPromise;
      await sessionPromise;
    } catch (err) {
      console.error("Failed to start Live session", err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setMessages(prev => [...prev, { sender: 'user', text: inputText }]);
    // Fix: Rely on sessionPromise resolves to call sendRealtimeInput, preventing race conditions and stale closures.
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => {
        session.sendRealtimeInput({ text: inputText });
      });
    }
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-fadeIn">
      <div className="bg-black p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="bg-green-400 p-2 rounded-full text-black">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Live Mentor</h3>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              {isLive ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Streaming</> : "Connecting..."}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
        {!isLive ? (
           <button onClick={startLiveSession} className="w-full bg-primary text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
             <Volume2 size={18} /> Connect Live Voice
           </button>
        ) : (
           <div className="flex items-center gap-2 text-xs font-bold text-primary animate-pulse">
             <Volume2 size={14} /> Live Audio Enabled
           </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <button type="submit" disabled={!inputText.trim() && !isLive} className="bg-black text-white p-2.5 rounded-xl hover:bg-gray-800 transition-colors">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BusinessMentor;
