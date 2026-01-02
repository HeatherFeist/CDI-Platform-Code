
import React, { useState, useEffect } from 'react';
import { CreatorStats, ContentPrompt } from '../types';
import { scanTrendsAndGenerateChallenges } from '../services/geminiService';
import BusinessTip from './BusinessTip';
import { Trophy, TrendingUp, Users, Flame, Zap, CheckCircle, Loader2, Globe, ExternalLink, ShieldCheck, Target, ArrowRight, ThumbsUp, Heart, Play, Home } from 'lucide-react';

interface CommunityLobbyProps {
  creatorStats: CreatorStats;
  onVote: (postId: string) => void;
  onBackToStore: () => void;
}

interface Submission {
  id: string;
  userName: string;
  avatar: string;
  contentUrl: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  title: string;
  votes: number;
  timestamp: number;
}

const CommunityLobby: React.FC<CommunityLobbyProps> = ({ creatorStats, onVote, onBackToStore }) => {
  const [challenges, setChallenges] = useState<ContentPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'voting' | 'leaderboard'>('challenges');
  const [submissions, setSubmissions] = useState<Submission[]>([
    { id: '1', userName: 'Sister 1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Trin', contentUrl: 'https://tiktok.com', platform: 'TikTok', title: 'Viral Glow Up Kit Review', votes: 12, timestamp: Date.now() - 100000 },
    { id: '2', userName: 'Sister 2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', contentUrl: 'https://instagram.com', platform: 'Instagram', title: 'New Fashion Drop Lookbook', votes: 8, timestamp: Date.now() - 500000 }
  ]);

  const fetchChallenges = async () => {
    setLoading(true);
    const results = await scanTrendsAndGenerateChallenges();
    setChallenges(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleVoteSubmission = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, votes: s.votes + 1 } : s));
  };

  const familyLeaderboard = [
    { name: "Mom (Executive)", points: 4500, level: "Empire Builder", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mom" },
    { name: "Sister 1 (Founder)", points: 3850, level: "Viral Icon", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Trin" },
    { name: "Sister 2 (Founder)", points: 3600, level: "Rising Star", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella" },
  ];

  return (
    <div className="animate-fadeIn space-y-16">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBackToStore} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
             <Home size={20} />
          </button>
          <div className="space-y-2">
            <h2 className="text-5xl font-display font-bold text-white tracking-tight">Enterprise Network</h2>
            <p className="text-slate-500 font-light">Collaborate and compete to scale the organization.</p>
          </div>
        </div>
        <div className="flex gap-4 glass-card p-2 rounded-2xl border border-white/5">
           <button onClick={() => setActiveTab('challenges')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'challenges' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Operations</button>
           <button onClick={() => setActiveTab('voting')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'voting' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Voting Feed</button>
           <button onClick={() => setActiveTab('leaderboard')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Ranking</button>
        </div>
      </div>

      {activeTab === 'challenges' && (
        <div className="space-y-12">
          <div className="relative glass-card rounded-[3rem] p-12 overflow-hidden border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4 max-w-xl">
                   <div className="flex items-center gap-3">
                      <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">AI Intel active</span>
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Scanning Social Trends</span>
                   </div>
                   <h3 className="text-4xl font-display font-bold text-white">Daily Growth Challenges</h3>
                   <p className="text-slate-400 font-light leading-relaxed">Gemini scans the web for viral trends. Complete these tasks as a family to earn organizational points and level up your enterprise status.</p>
                </div>
                <button onClick={fetchChallenges} disabled={loading} className="bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3 shadow-2xl disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="text-indigo-600" />} Refresh Strategy
                </button>
             </div>
             <Globe className="absolute -right-20 -bottom-20 opacity-5 text-white" size={300} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {challenges.map((challenge, idx) => (
              <div key={idx} className="glass-card p-8 rounded-[2.5rem] border border-white/5 group hover:border-indigo-500/30 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-6">
                   <div className={`p-3 rounded-2xl ${challenge.platform === 'TikTok' ? 'bg-black text-white' : challenge.platform === 'Instagram' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white' : 'bg-red-600 text-white'}`}>
                      {challenge.platform === 'TikTok' ? <Play size={20} /> : <Globe size={20} />}
                   </div>
                   <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">+{challenge.xpReward} Points</span>
                </div>
                <h4 className="text-xl font-display font-bold text-white mb-3">{challenge.title}</h4>
                <p className="text-slate-500 text-sm font-light leading-relaxed mb-8 flex-1">{challenge.description}</p>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {challenge.sources?.slice(0, 2).map((s, i) => (
                      <a key={i} href={s} target="_blank" className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:underline"><ExternalLink size={10}/> Source {i+1}</a>
                    ))}
                  </div>
                  <button onClick={() => alert("Submission Portal Active: Paste your link to submit!")} className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white">
                    Submit Entry <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'voting' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-4xl font-display font-bold text-white">Voting Feed</h3>
              <p className="text-slate-500 font-light mt-2">Vote on the family's best content creations to help them earn bonus XP.</p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Submit Your Link</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {submissions.map((sub) => (
              <div key={sub.id} className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/[0.02]">
                <div className="h-48 bg-slate-900 flex items-center justify-center relative">
                   {sub.platform === 'TikTok' ? <Play size={48} className="text-white opacity-20" /> : <Heart size={48} className="text-white opacity-20" />}
                   <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
                      {sub.platform}
                   </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <img src={sub.avatar} className="w-12 h-12 rounded-xl border border-white/10" alt="" />
                    <div>
                       <p className="font-bold text-white leading-none">{sub.userName}</p>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1.5">{sub.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       <ThumbsUp size={16} className="text-indigo-400" />
                       <span className="text-white font-bold">{sub.votes} Votes</span>
                    </div>
                    <button onClick={() => handleVoteSubmission(sub.id)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors bg-indigo-600/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                       Cast Growth Vote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="glass-card rounded-[3rem] p-12 border border-white/5 relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                <div className="space-y-4">
                   <h3 className="text-4xl font-display font-bold text-white">The Power Ranking</h3>
                   <p className="text-slate-500 font-light">Who is leading the family's digital expansion this week?</p>
                </div>
                <BusinessTip title="Healthy Rivalry" content="Competitive business goals keep the momentum high. Complete challenges to earn Capital Points!" />
             </div>

             <div className="space-y-4">
               {familyLeaderboard.map((user, idx) => (
                 <div key={idx} className={`flex items-center justify-between p-8 rounded-[2rem] transition-all border ${idx === 0 ? 'bg-white/5 border-indigo-500/30 shadow-2xl shadow-indigo-500/5 scale-105' : 'bg-white/[0.02] border-white/5'}`}>
                   <div className="flex items-center gap-8">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                         {idx + 1}
                      </div>
                      <img src={user.avatar} className="w-16 h-16 rounded-2xl border border-white/10" alt="" />
                      <div>
                         <h4 className="text-xl font-display font-bold text-white mb-1">{user.name}</h4>
                         <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                           <Target size={12} /> {user.level}
                         </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-3xl font-display font-bold text-white">{user.points.toLocaleString()}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capital Points</p>
                   </div>
                 </div>
               ))}
             </div>
             <Trophy className="absolute -left-20 -bottom-20 opacity-5 text-white" size={400} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityLobby;
