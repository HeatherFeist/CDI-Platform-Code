import React, { useState } from 'react';
import { SocialPost, CreatorStats } from '../types';
import { Heart, MessageCircle, Share2, Award, TrendingUp, Users, Video, Instagram, Facebook, Smartphone, Crown, Eye, Trophy, Medal, Flame } from 'lucide-react';

interface CommunityLobbyProps {
  creatorStats: CreatorStats;
  onVote: (postId: string) => void;
}

// Mock Data for the Community Feed
const MOCK_FEED: SocialPost[] = [
  {
    id: '1',
    authorName: 'Bella Styles',
    shopName: 'Bella\'s Boutique',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    caption: 'My entry for the #PackWithMe challenge! 📦✨ Using eco-friendly tissue paper this week.',
    likes: 124,
    views: 4500,
    platform: 'TikTok',
    isChallengeEntry: true,
    hasVoted: false,
    taggedUsers: ['TrinTreasures', 'SarahGlows']
  },
  {
    id: '2',
    authorName: 'TechByJake',
    shopName: 'Jake\'s Gadgets',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jake',
    caption: 'Just dropped these new wireless buds. Check the sound test on my story! 🎧',
    likes: 89,
    views: 1200,
    platform: 'Instagram',
    isChallengeEntry: false,
    hasVoted: false,
  },
  {
    id: '3',
    authorName: 'GlowWithSarah',
    shopName: 'Sarah Skincare',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    caption: 'Trying the "Day in the Life of a Teen CEO" trend. It is harder than it looks! 😅',
    likes: 256,
    views: 8900,
    platform: 'TikTok',
    isChallengeEntry: true,
    hasVoted: false,
    taggedUsers: ['BellaStyles']
  }
];

const CommunityLobby: React.FC<CommunityLobbyProps> = ({ creatorStats, onVote }) => {
  const [posts, setPosts] = useState<SocialPost[]>(MOCK_FEED);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'tournament'>('feed');

  // Simulated Leaderboard Data
  const MOCK_LEADERBOARD = [
    { id: '1', name: 'Sophia G.', shop: 'Sophia\'s Slimes', points: 12400, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
    { id: '2', name: 'Marcus T.', shop: 'Kickz Custom', points: 9800, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
    { id: '3', name: 'Emily R.', shop: 'Em\'s Gems', points: 8750, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
    { id: '4', name: 'You', shop: 'Your Shop', points: creatorStats.points, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' }, // User
    { id: '5', name: 'Tyler B.', shop: 'Tech Haven', points: 4200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tyler' },
  ].sort((a, b) => b.points - a.points);

  // Tournament Data (sorted by views)
  const TOURNAMENT_ENTRIES = [...posts].filter(p => p.platform === 'TikTok').sort((a, b) => b.views - a.views);

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === id) {
        // Simple toggle logic for demo
        const newLikes = post.hasVoted ? post.likes - 1 : post.likes + 1;
        if (!post.hasVoted) onVote(id); // Trigger XP reward for voting
        return { ...post, likes: newLikes, hasVoted: !post.hasVoted };
      }
      return post;
    }));
  };

  const handleShare = (post: SocialPost) => {
      const url = encodeURIComponent(`https://trinstreasures.app/post/${post.id}`);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case 'TikTok': return <Smartphone size={14} className="text-black" />;
      case 'Instagram': return <Instagram size={14} className="text-pink-600" />;
      case 'Facebook': return <Facebook size={14} className="text-blue-600" />;
      default: return <Video size={14} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      {/* Community Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <h2 className="text-4xl font-display font-bold">Teen CEO Hub 🌍</h2>
             {creatorStats.subscriptionPlan !== 'Free' && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Crown size={12} /> {creatorStats.subscriptionPlan} Member
                </span>
             )}
          </div>
          <p className="text-indigo-100 text-lg max-w-2xl">
            Connect, collab, and compete! Vote for your favorite challenge entries and climb the leaderboard.
          </p>
          <div className="mt-6 flex gap-4">
             <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-2">
               <Users size={20} />
               <span className="font-bold">1.2k Online</span>
             </div>
             <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-2">
               <Award size={20} />
               <span className="font-bold">Challenge: Viral Cup</span>
             </div>
          </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-primary" /> {activeTab === 'feed' ? 'The Feed' : activeTab === 'leaderboard' ? 'Top Teen CEOs' : 'TikTok Tournament'}
            </h3>
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
               <button 
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'feed' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 Latest
               </button>
               <button 
                onClick={() => setActiveTab('tournament')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'tournament' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 🔥 Tournaments
               </button>
               <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'leaderboard' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 Leaderboard
               </button>
            </div>
          </div>

          {activeTab === 'feed' && (
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={post.avatarUrl} alt={post.authorName} className="w-10 h-10 rounded-full bg-gray-100" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{post.authorName}</h4>
                        <p className="text-xs text-gray-500">{post.shopName}</p>
                      </div>
                    </div>
                    {post.isChallengeEntry && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Award size={12} /> Challenge Entry
                      </span>
                    )}
                  </div>
                  
                  {/* Mock Video Content Placeholder */}
                  <div className="w-full aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                     <Video className="text-white opacity-50 group-hover:scale-110 transition-transform" size={48} />
                     <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                        <PlatformIcon platform={post.platform} />
                        {post.platform}
                     </div>
                  </div>

                  <p className="text-gray-800 text-sm mb-4 leading-relaxed">
                    {post.caption} <br/>
                    {post.taggedUsers && post.taggedUsers.map(user => (
                       <span key={user} className="text-blue-600 font-medium cursor-pointer hover:underline mr-1">@{user}</span>
                    ))}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.hasVoted ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}
                      >
                        <Heart size={18} fill={post.hasVoted ? "currentColor" : "none"} />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                        <Eye size={18} /> {post.views > 1000 ? (post.views / 1000).toFixed(1) + 'k' : post.views}
                      </button>
                      <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
                        <MessageCircle size={18} />
                        Comment
                      </button>
                    </div>
                    <button 
                      onClick={() => handleShare(post)}
                      className="text-gray-400 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <Share2 size={18} /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'tournament' && (
             <div className="space-y-6">
               <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 text-white relative overflow-hidden">
                  <div className="relative z-10 text-center">
                    <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold font-display text-white mb-2">TikTok Viral Cup 🏆</h3>
                    <p className="text-gray-300 mb-6">Create the best "Unboxing Transition" video! The video with the most views by Sunday wins the cup and 1,000 XP.</p>
                    <div className="flex justify-center gap-8">
                       <div className="text-center">
                         <div className="text-2xl font-bold text-yellow-400">1st</div>
                         <div className="text-xs text-gray-400">Prize</div>
                       </div>
                       <div className="text-center">
                         <div className="text-2xl font-bold text-white">5 Days</div>
                         <div className="text-xs text-gray-400">Left</div>
                       </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Flame size={200} className="text-red-500" />
                  </div>
               </div>

               <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2"><TrendingUp size={18} /> Live Rankings</h4>
               
               <div className="space-y-3">
                 {TOURNAMENT_ENTRIES.map((entry, index) => (
                    <div key={entry.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                       <div className="text-xl font-bold text-gray-300 w-8 text-center">#{index + 1}</div>
                       <img src={entry.avatarUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-200" />
                       <div className="flex-1">
                          <h5 className="font-bold text-gray-900">{entry.authorName}</h5>
                          <p className="text-xs text-gray-500 line-clamp-1">{entry.caption}</p>
                       </div>
                       <div className="text-right">
                          <div className="font-bold text-lg text-gray-900 flex items-center gap-1 justify-end">
                            <Eye size={14} className="text-gray-400" /> {entry.views.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-green-500 font-bold flex items-center gap-1 justify-end">
                            <TrendingUp size={10} /> +12% today
                          </div>
                       </div>
                    </div>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
                 <div className="flex items-center gap-2 mb-2">
                    <Medal className="text-yellow-600" />
                    <h4 className="font-bold text-yellow-800 text-lg">XP Leaderboard</h4>
                 </div>
                 <p className="text-sm text-gray-600">See who's dominating the teen business world this week! Complete challenges to climb the ranks.</p>
               </div>
               
               <div className="divide-y divide-gray-100">
                  {MOCK_LEADERBOARD.map((user, index) => {
                    const isCurrentUser = user.name === 'You';
                    return (
                      <div key={user.id} className={`p-5 flex items-center gap-4 ${isCurrentUser ? 'bg-purple-50' : ''}`}>
                        <div className="w-8 text-center">
                          {index === 0 ? (
                            <span className="text-2xl">🥇</span>
                          ) : index === 1 ? (
                            <span className="text-2xl">🥈</span>
                          ) : index === 2 ? (
                            <span className="text-2xl">🥉</span>
                          ) : (
                            <span className="font-display font-bold text-xl text-gray-400">#{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="relative">
                          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm" />
                          {index < 3 && <div className="absolute -bottom-1 -right-1 bg-yellow-400 border border-white w-4 h-4 rounded-full"></div>}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <h4 className={`font-bold ${isCurrentUser ? 'text-purple-700' : 'text-gray-900'}`}>{user.name}</h4>
                             {isCurrentUser && <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">ME</span>}
                          </div>
                          <p className="text-xs text-gray-500">{user.shop}</p>
                        </div>

                        <div className="text-right">
                           <div className="font-bold text-gray-900 flex items-center gap-1 justify-end">
                             {user.points.toLocaleString()} <span className="text-xs text-gray-400">XP</span>
                           </div>
                           <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 ml-auto">
                              <div 
                                className={`h-full rounded-full ${index === 0 ? 'bg-yellow-400' : isCurrentUser ? 'bg-purple-500' : 'bg-gray-300'}`} 
                                style={{ width: `${(user.points / MOCK_LEADERBOARD[0].points) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>

        {/* Sidebar: Networking & Stats */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-gray-800">Your Network</h3>
                 {creatorStats.subscriptionPlan === 'Elite' ? (
                   <span className="text-xs bg-black text-white px-2 py-0.5 rounded flex items-center gap-1"><Crown size={10} /> Elite</span>
                 ) : (
                   <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Free Plan</span>
                 )}
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                     {creatorStats.level[0]}
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                 </div>
                 <div>
                   <div className="font-bold text-gray-900">You ({creatorStats.level})</div>
                   <div className="text-xs text-gray-500">{creatorStats.streak} Day Streak 🔥</div>
                 </div>
              </div>
              <div className="space-y-3">
                 <button className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                   <Users size={16} /> Find Collaborators
                 </button>
                 <button className="w-full py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                   Invite Friends
                 </button>
              </div>
              
              {creatorStats.subscriptionPlan === 'Free' && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 text-center">
                   <p className="text-xs font-bold text-yellow-800 mb-2">Unlock Unlimited Networking!</p>
                   <button className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-sm hover:bg-yellow-500 transition-colors">Upgrade to Pro</button>
                </div>
              )}
           </div>

           <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
              <h3 className="font-bold text-purple-900 mb-2">Challenge of the Week</h3>
              <p className="text-sm text-purple-700 mb-4">
                Create a <strong>TikTok</strong> showing your "Packing Process". Use the hashtag #TeenBossPack.
              </p>
              <div className="h-2 bg-purple-200 rounded-full mb-2">
                 <div className="h-full w-3/4 bg-purple-600 rounded-full"></div>
              </div>
              <p className="text-xs text-purple-600 text-right">3 days left to enter!</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityLobby;