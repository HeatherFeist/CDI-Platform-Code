import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeSubmission, Vote, UserProfile } from '../types';
import { Heart, Eye, Award, Instagram, Facebook, Youtube, ExternalLink, Trophy, Clock } from 'lucide-react';

interface ChallengeVotingProps {
  challenge: Challenge;
  currentUser: UserProfile;
  onVote: (submissionId: string) => Promise<void>;
  onClose: () => void;
}

const ChallengeVoting: React.FC<ChallengeVotingProps> = ({
  challenge,
  currentUser,
  onVote,
  onClose
}) => {
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('popular');
  const [selectedSubmission, setSelectedSubmission] = useState<ChallengeSubmission | null>(null);

  // Sample submissions - will be loaded from database
  const sampleSubmissions: ChallengeSubmission[] = [
    {
      id: 'sub1',
      challengeId: challenge.id,
      userId: 'u1',
      userName: 'Sarah Johnson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
      mediaType: 'image',
      caption: '✨ Showing off my favorite skincare product! This has transformed my skin routine. 💕 #ShopLocal #BeautyEssentials',
      platform: 'instagram',
      platformPostUrl: 'https://instagram.com/p/example',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      voteCount: 24
    },
    {
      id: 'sub2',
      challengeId: challenge.id,
      userId: 'u2',
      userName: 'Mike Chen',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      mediaType: 'image',
      caption: '🎁 Check out this amazing watch from my collection! Perfect for any occasion. DM for details! #Accessories #StyleGoals',
      platform: 'facebook',
      submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      voteCount: 18
    },
    {
      id: 'sub3',
      challengeId: challenge.id,
      userId: 'u3',
      userName: 'Emma Wilson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      mediaUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      mediaType: 'image',
      caption: '🎧 These headphones are a game-changer! Crystal clear sound quality. Link in bio! 🎶 #TechGadgets #MusicLovers',
      platform: 'instagram',
      submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      voteCount: 31
    }
  ];

  useEffect(() => {
    // Load submissions from database
    setSubmissions(sampleSubmissions);
    // TODO: Load from challengeService.getSubmissions(challenge.id)
    
    // Load user's votes
    const votedIds = new Set(['sub1']); // Sample: user already voted for sub1
    setUserVotes(votedIds);
  }, [challenge.id]);

  const handleVote = async (submissionId: string) => {
    if (userVotes.has(submissionId)) {
      // Already voted, show message
      alert('You already voted for this submission!');
      return;
    }

    try {
      await onVote(submissionId);
      
      // Update local state
      setUserVotes(prev => new Set(prev).add(submissionId));
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, voteCount: sub.voteCount + 1 }
            : sub
        )
      );
    } catch (error) {
      console.error('Vote error:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const getSortedSubmissions = () => {
    const sorted = [...submissions];
    if (sortBy === 'popular') {
      return sorted.sort((a, b) => b.voteCount - a.voteCount);
    }
    return sorted.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const topSubmissions = getSortedSubmissions().slice(0, 3);
  const sortedSubmissions = getSortedSubmissions();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onClose}
              className="text-purple-100 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back to Challenges
            </button>
            <h1 className="text-4xl font-bold mb-2">{challenge.title}</h1>
            <p className="text-purple-100">Vote for your favorite submission!</p>
          </div>
          <div className="text-center bg-white/20 backdrop-blur-md rounded-xl p-4">
            <div className="text-3xl font-bold">{submissions.length}</div>
            <div className="text-sm">Total Entries</div>
          </div>
        </div>
      </div>

      {/* Top 3 Winners Podium */}
      {topSubmissions.length >= 3 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Top Submissions
          </h2>
          <div className="grid grid-cols-3 gap-6 items-end">
            {/* 2nd Place */}
            <div className="transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-xl p-4 text-center text-white">
                <div className="text-4xl mb-2">🥈</div>
                <div className="text-xl font-bold">2nd Place</div>
              </div>
              <div className="bg-white border-2 border-gray-300 rounded-b-xl p-4">
                <img
                  src={topSubmissions[1].mediaUrl}
                  alt={topSubmissions[1].userName}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={topSubmissions[1].userAvatar}
                    alt={topSubmissions[1].userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold text-sm">{topSubmissions[1].userName}</span>
                </div>
                <div className="flex items-center gap-2 text-pink-600 font-bold">
                  <Heart className="w-5 h-5 fill-current" />
                  {topSubmissions[1].voteCount} votes
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="transform hover:scale-105 transition-all -mt-4">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-t-xl p-6 text-center text-white shadow-lg">
                <div className="text-5xl mb-2">👑</div>
                <div className="text-2xl font-bold">1st Place</div>
              </div>
              <div className="bg-white border-4 border-yellow-400 rounded-b-xl p-4 shadow-lg">
                <img
                  src={topSubmissions[0].mediaUrl}
                  alt={topSubmissions[0].userName}
                  className="w-full h-56 object-cover rounded-lg mb-3"
                />
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={topSubmissions[0].userAvatar}
                    alt={topSubmissions[0].userName}
                    className="w-10 h-10 rounded-full border-2 border-yellow-400"
                  />
                  <span className="font-bold">{topSubmissions[0].userName}</span>
                </div>
                <div className="flex items-center gap-2 text-pink-600 font-bold text-lg">
                  <Heart className="w-6 h-6 fill-current" />
                  {topSubmissions[0].voteCount} votes
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-t-xl p-4 text-center text-white">
                <div className="text-4xl mb-2">🥉</div>
                <div className="text-xl font-bold">3rd Place</div>
              </div>
              <div className="bg-white border-2 border-orange-400 rounded-b-xl p-4">
                <img
                  src={topSubmissions[2].mediaUrl}
                  alt={topSubmissions[2].userName}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={topSubmissions[2].userAvatar}
                    alt={topSubmissions[2].userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold text-sm">{topSubmissions[2].userName}</span>
                </div>
                <div className="flex items-center gap-2 text-pink-600 font-bold">
                  <Heart className="w-5 h-5 fill-current" />
                  {topSubmissions[2].voteCount} votes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All Submissions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              sortBy === 'popular'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Most Popular
          </button>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              sortBy === 'latest'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {sortedSubmissions.map((submission, index) => {
          const hasVoted = userVotes.has(submission.id);
          const isTopThree = index < 3 && sortBy === 'popular';

          return (
            <div
              key={submission.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all ${
                isTopThree ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {/* User Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={submission.userAvatar}
                    alt={submission.userName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {submission.userName}
                      {isTopThree && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(submission.submittedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  {getPlatformIcon(submission.platform)}
                </div>
              </div>

              {/* Media */}
              <div 
                className="relative cursor-pointer"
                onClick={() => setSelectedSubmission(submission)}
              >
                {submission.mediaType === 'video' ? (
                  <video
                    src={submission.mediaUrl}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <img
                    src={submission.mediaUrl}
                    alt="Submission"
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Caption */}
              <div className="p-4">
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {submission.caption}
                </p>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Heart className={`w-5 h-5 ${hasVoted ? 'fill-pink-600 text-pink-600' : ''}`} />
                      <span className="font-semibold">{submission.voteCount}</span>
                    </div>
                    {submission.platformPostUrl && (
                      <a
                        href={submission.platformPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleVote(submission.id)}
                    disabled={hasVoted || submission.userId === currentUser.id}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      hasVoted
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : submission.userId === currentUser.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                    }`}
                  >
                    {hasVoted ? '✓ Voted' : submission.userId === currentUser.id ? 'Your Entry' : 'Vote'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <ExternalLink className="w-6 h-6" />
              </button>
              
              {selectedSubmission.mediaType === 'video' ? (
                <video
                  src={selectedSubmission.mediaUrl}
                  controls
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              ) : (
                <img
                  src={selectedSubmission.mediaUrl}
                  alt="Full submission"
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedSubmission.userAvatar}
                    alt={selectedSubmission.userName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-bold text-lg">{selectedSubmission.userName}</div>
                    <div className="text-sm text-gray-500">
                      {getTimeAgo(selectedSubmission.submittedAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-pink-600 text-xl font-bold">
                  <Heart className="w-6 h-6 fill-current" />
                  {selectedSubmission.voteCount} votes
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{selectedSubmission.caption}</p>
              
              <button
                onClick={() => {
                  handleVote(selectedSubmission.id);
                  setSelectedSubmission(null);
                }}
                disabled={userVotes.has(selectedSubmission.id) || selectedSubmission.userId === currentUser.id}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                  userVotes.has(selectedSubmission.id) || selectedSubmission.userId === currentUser.id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                }`}
              >
                {userVotes.has(selectedSubmission.id) ? '✓ Already Voted' : 
                 selectedSubmission.userId === currentUser.id ? 'This is Your Entry' : 
                 'Vote for This Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeVoting;
