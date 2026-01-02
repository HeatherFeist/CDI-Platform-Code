import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeSubmission, UserProfile } from '../types';
import { Trophy, Calendar, Target, Zap, TrendingUp, Award, ChevronRight, Clock, Users, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { scanTrendsAndGenerateChallenges } from '../services/geminiService';

interface DailyChallengesProps {
  currentUser: UserProfile;
  onSubmitChallenge: (challengeId: string) => void;
  onViewSubmissions: (challengeId: string) => void;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({ 
  currentUser, 
  onSubmitChallenge,
  onViewSubmissions 
}) => {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [userStreak, setUserStreak] = useState(0);
  const [todaysCompletion, setTodaysCompletion] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);

  const handleScanTrends = async () => {
    setIsScanning(true);
    try {
      const trendChallenges = await scanTrendsAndGenerateChallenges();
      
      // Convert to Challenge format
      const formattedChallenges: Challenge[] = trendChallenges.map((tc: any, index: number) => ({
        id: `trend-${Date.now()}-${index}`,
        title: tc.title,
        description: tc.description,
        type: tc.type || 'post',
        category: 'trending',
        difficulty: tc.difficulty?.toLowerCase() || 'beginner',
        xpReward: tc.xpReward || 100,
        coinReward: tc.coinReward || 20,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        prompt: tc.description,
        tips: tc.tips || [],
        requiredPlatforms: [tc.platform?.toLowerCase()],
        trendSource: tc.trendSource,
        sources: tc.sources || []
      }));
      
      setActiveChallenges(formattedChallenges);
      setLastScanDate(new Date().toISOString());
      localStorage.setItem('lastTrendScan', new Date().toISOString());
      localStorage.setItem('trendChallenges', JSON.stringify(formattedChallenges));
    } catch (error) {
      console.error('Error scanning trends:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Sample challenges - will be loaded from database
  const sampleChallenges: Challenge[] = [
    {
      id: 'c1',
      title: '📸 Product Spotlight Saturday',
      description: 'Showcase your best-selling product in a creative way',
      type: 'post',
      category: 'product_showcase',
      difficulty: 'beginner',
      xpReward: 50,
      coinReward: 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      prompt: 'Create a post featuring your top product with an eye-catching image and a compelling caption that highlights its unique value.',
      tips: [
        'Use natural lighting for photos',
        'Include a call-to-action in your caption',
        'Tag relevant hashtags (#ShopLocal, #SmallBusiness)',
        'Show the product in use or styled beautifully'
      ],
      requiredPlatforms: ['instagram', 'facebook']
    },
    {
      id: 'c2',
      title: '🎬 Behind-the-Scenes Video',
      description: 'Share your process: packing orders, sourcing, or daily routine',
      type: 'video',
      category: 'behind_scenes',
      difficulty: 'intermediate',
      xpReward: 100,
      coinReward: 20,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      prompt: 'Film a 30-60 second video showing what goes on behind the scenes of your shop. Make it authentic and engaging!',
      tips: [
        'Keep it under 60 seconds',
        'Add upbeat background music',
        'Show your personality',
        'Explain what viewers are seeing'
      ],
      requiredPlatforms: ['instagram', 'facebook', 'tiktok']
    },
    {
      id: 'c3',
      title: '✨ Customer Testimonial Tuesday',
      description: 'Share a happy customer review or create one yourself',
      type: 'story',
      category: 'testimonial',
      difficulty: 'beginner',
      xpReward: 30,
      coinReward: 5,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      prompt: 'Post a customer review or testimonial (or create a mock one to practice). Make it visual and engaging!',
      tips: [
        'Screenshot positive feedback',
        'Add decorative elements or frames',
        'Include the product image',
        'Thank the customer'
      ],
      requiredPlatforms: ['instagram', 'facebook']
    }
  ];

  useEffect(() => {
    // Check for saved trend challenges
    const saved = localStorage.getItem('trendChallenges');
    const lastScan = localStorage.getItem('lastTrendScan');
    
    if (saved && lastScan) {
      const scanDate = new Date(lastScan);
      const now = new Date();
      // If scanned today, use saved challenges
      if (scanDate.toDateString() === now.toDateString()) {
        setActiveChallenges(JSON.parse(saved));
        setLastScanDate(lastScan);
        return;
      }
    }
    
    // Otherwise load sample challenges
    setActiveChallenges(sampleChallenges);
    // TODO: Load from database
    // const challenges = await challengeService.getActiveChallenges();
    
    // Load user streak
    setUserStreak(3); // Sample data
    setTodaysCompletion(false);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product_showcase': return '📦';
      case 'behind_scenes': return '🎬';
      case 'tutorial': return '📚';
      case 'testimonial': return '⭐';
      case 'promotion': return '🎉';
      default: return '📱';
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h remaining` : 'Ending soon!';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10" />
              Daily Challenges
            </h1>
            <p className="text-purple-100 text-lg">
              Complete challenges to earn XP, coins, and grow your skills!
            </p>
          </div>
          
          {/* Streak Counter & Scan Button */}
          <div className="flex items-center gap-4">
            {/* Trend Scan Button */}
            <button
              onClick={handleScanTrends}
              disabled={isScanning}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl px-6 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">Scanning Trends...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                  <span className="font-semibold">Scan Today's Trends</span>
                </>
              )}
            </button>
            
            {/* Streak Counter */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-8 h-8 text-yellow-300" />
                <span className="text-5xl font-bold">{userStreak}</span>
            </div>
            <p className="text-sm uppercase tracking-wide">Day Streak</p>
            {todaysCompletion ? (
              <div className="mt-2 flex items-center gap-1 text-green-300 text-sm">
                <Award className="w-4 h-4" />
                Completed Today!
              </div>
            ) : (
              <div className="mt-2 text-orange-200 text-sm">
                Complete one today!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Challenges Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Today's Challenges
          </h2>
          <div className="text-sm text-gray-600">
            {activeChallenges.length} active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeChallenges.map((challenge) => (
            <div 
              key={challenge.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-400"
            >
              {/* Challenge Header */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 border-b">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{getCategoryIcon(challenge.category)}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{challenge.title}</h3>
                <p className="text-sm text-gray-600">{challenge.description}</p>
              </div>

              {/* Challenge Body */}
              <div className="p-4">
                {/* Platform Badges */}
                {challenge.requiredPlatforms && challenge.requiredPlatforms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {challenge.requiredPlatforms.map((platform) => (
                      <span 
                        key={platform}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg capitalize"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Trend Source */}
                {challenge.trendSource && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-semibold">Trending:</span> {challenge.trendSource}
                    </p>
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {challenge.prompt}
                  </p>
                  
                  {/* Rewards */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-purple-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold text-sm">{challenge.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <span className="text-lg">🪙</span>
                      <span className="font-semibold text-sm">{challenge.coinReward} Coins</span>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="flex gap-2 mb-3">
                    {challenge.requiredPlatforms.map(platform => (
                      <span key={platform} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {platform}
                      </span>
                    ))}
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    {getTimeRemaining(challenge.endDate)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedChallenge(challenge)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onSubmitChallenge(challenge.id)}
                    className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-700 transition-colors text-sm"
                  >
                    Submit Entry
                  </button>
                </div>
                
                <button
                  onClick={() => onViewSubmissions(challenge.id)}
                  className="w-full mt-2 border-2 border-purple-200 text-purple-700 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  View Submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge Details Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedChallenge.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                    {selectedChallenge.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Challenge Prompt</h3>
                  <p className="text-gray-700 bg-purple-50 p-4 rounded-lg">
                    {selectedChallenge.prompt}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Tips for Success</h3>
                  <ul className="space-y-2">
                    {selectedChallenge.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      onSubmitChallenge(selectedChallenge.id);
                      setSelectedChallenge(null);
                    }}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Submit Your Entry
                  </button>
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4">Your Challenge Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">12</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600">3</div>
            <div className="text-sm text-gray-600">Won</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">850</div>
            <div className="text-sm text-gray-600">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">240</div>
            <div className="text-sm text-gray-600">Coins Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenges;
