import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, Badge, UserProfile } from '../types';
import { Trophy, Award, Zap, TrendingUp, Medal, Crown, Star, Target, ChevronUp, ChevronDown } from 'lucide-react';

interface LeaderboardProps {
  currentUser: UserProfile;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'xp' | 'challenges' | 'wins'>('xp');

  // Sample leaderboard data - will be loaded from database
  const sampleData: LeaderboardEntry[] = [
    {
      userId: 'u1',
      userName: 'Sarah "The Hustler" Johnson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      totalXP: 2450,
      totalCoins: 580,
      level: 12,
      streak: 15,
      challengesCompleted: 42,
      challengesWon: 8,
      rank: 1,
      badges: [
        { id: 'b1', name: 'Social Butterfly', description: 'Connected all social accounts', iconUrl: '🦋', earnedAt: '2026-01-01', rarity: 'rare' },
        { id: 'b2', name: 'Content King', description: 'Posted 100 times', iconUrl: '👑', earnedAt: '2025-12-15', rarity: 'epic' }
      ]
    },
    {
      userId: 'u2',
      userName: 'Mike "The Closer" Chen',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      totalXP: 2180,
      totalCoins: 490,
      level: 11,
      streak: 12,
      challengesCompleted: 38,
      challengesWon: 7,
      rank: 2,
      badges: [
        { id: 'b3', name: 'Early Bird', description: 'First submission 10 times', iconUrl: '🐦', earnedAt: '2025-12-20', rarity: 'rare' }
      ]
    },
    {
      userId: 'u3',
      userName: 'Emma "Viral Queen" Wilson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      totalXP: 1950,
      totalCoins: 445,
      level: 10,
      streak: 8,
      challengesCompleted: 35,
      challengesWon: 9,
      rank: 3,
      badges: [
        { id: 'b4', name: 'Champion', description: 'Won 5 challenges', iconUrl: '🏆', earnedAt: '2025-12-28', rarity: 'legendary' }
      ]
    },
    {
      userId: 'u4',
      userName: 'Alex Martinez',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      totalXP: 1720,
      totalCoins: 380,
      level: 9,
      streak: 6,
      challengesCompleted: 30,
      challengesWon: 4,
      rank: 4,
      badges: []
    },
    {
      userId: 'u5',
      userName: 'Jessica Lee',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
      totalXP: 1590,
      totalCoins: 350,
      level: 8,
      streak: 10,
      challengesCompleted: 28,
      challengesWon: 5,
      rank: 5,
      badges: [
        { id: 'b5', name: 'Consistency is Key', description: '10 day streak', iconUrl: '⚡', earnedAt: '2025-12-30', rarity: 'common' }
      ]
    }
  ];

  useEffect(() => {
    setLeaderboardData(sampleData);
    // TODO: Load from database
    // const data = await leaderboardService.getLeaderboard(timeFilter, categoryFilter);
  }, [timeFilter, categoryFilter]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow-500 fill-current" />;
      case 2: return <Medal className="w-7 h-7 text-gray-400" />;
      case 3: return <Medal className="w-7 h-7 text-orange-500" />;
      default: return <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-600">#{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-orange-400 to-orange-500';
      default: return 'from-purple-100 to-pink-100';
    }
  };

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 border-gray-300';
      case 'rare': return 'bg-blue-100 border-blue-400';
      case 'epic': return 'bg-purple-100 border-purple-400';
      case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const currentUserEntry = leaderboardData.find(entry => entry.userId === currentUser.id);
  const topThree = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-5xl font-bold mb-3 flex items-center gap-3">
          <Trophy className="w-12 h-12" />
          Leaderboard
        </h1>
        <p className="text-purple-100 text-lg">
          Compete with friends, earn rewards, and become the ultimate Shop-reneur!
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <span className="text-gray-700 font-semibold mr-2">Time Period:</span>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeFilter === 'month'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeFilter === 'week'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
          </div>

          <div className="flex gap-2">
            <span className="text-gray-700 font-semibold mr-2">Sort By:</span>
            <button
              onClick={() => setCategoryFilter('xp')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                categoryFilter === 'xp'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Total XP
            </button>
            <button
              onClick={() => setCategoryFilter('challenges')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                categoryFilter === 'challenges'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Challenges
            </button>
            <button
              onClick={() => setCategoryFilter('wins')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                categoryFilter === 'wins'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wins
            </button>
          </div>
        </div>
      </div>

      {/* Your Position Card */}
      {currentUserEntry && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-8 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Your Position</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">#{currentUserEntry.rank}</div>
              <img
                src={currentUserEntry.userAvatar}
                alt={currentUserEntry.userName}
                className="w-16 h-16 rounded-full border-4 border-white"
              />
              <div>
                <div className="font-bold text-xl">{currentUserEntry.userName}</div>
                <div className="text-purple-200">Level {currentUserEntry.level}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold">{currentUserEntry.totalXP}</div>
                <div className="text-sm text-purple-200">XP</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{currentUserEntry.challengesCompleted}</div>
                <div className="text-sm text-purple-200">Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold flex items-center justify-center gap-1">
                  <Zap className="w-6 h-6 text-yellow-300" />
                  {currentUserEntry.streak}
                </div>
                <div className="text-sm text-purple-200">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">🏆 Hall of Fame 🏆</h2>
        <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="transform hover:scale-105 transition-all">
              <div className={`bg-gradient-to-br ${getRankColor(2)} rounded-t-2xl p-6 text-center text-white shadow-xl`}>
                <Medal className="w-12 h-12 mx-auto mb-3 text-white" />
                <div className="text-5xl font-bold mb-2">2nd</div>
              </div>
              <div className="bg-white rounded-b-2xl p-6 shadow-xl border-4 border-gray-300">
                <img
                  src={topThree[1].userAvatar}
                  alt={topThree[1].userName}
                  className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-gray-300"
                />
                <h3 className="font-bold text-center mb-2 line-clamp-1">{topThree[1].userName}</h3>
                <div className="space-y-2 text-center text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="font-bold">{topThree[1].totalXP} XP</span>
                  </div>
                  <div className="text-gray-600">Level {topThree[1].level}</div>
                  <div className="flex items-center justify-center gap-1 text-yellow-600">
                    <Trophy className="w-4 h-4" />
                    {topThree[1].challengesWon} wins
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="transform hover:scale-110 transition-all -mt-8">
              <div className={`bg-gradient-to-br ${getRankColor(1)} rounded-t-2xl p-8 text-center text-white shadow-2xl`}>
                <Crown className="w-16 h-16 mx-auto mb-3 text-white fill-current animate-bounce" />
                <div className="text-6xl font-bold mb-2">1st</div>
                <div className="text-lg font-semibold">👑 CHAMPION 👑</div>
              </div>
              <div className="bg-white rounded-b-2xl p-6 shadow-2xl border-4 border-yellow-400">
                <img
                  src={topThree[0].userAvatar}
                  alt={topThree[0].userName}
                  className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-yellow-400"
                />
                <h3 className="font-bold text-xl text-center mb-3 line-clamp-1">{topThree[0].userName}</h3>
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-lg">{topThree[0].totalXP} XP</span>
                  </div>
                  <div className="text-gray-600 font-semibold">Level {topThree[0].level}</div>
                  <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold">
                    <Trophy className="w-5 h-5" />
                    {topThree[0].challengesWon} wins
                  </div>
                  {topThree[0].badges.length > 0 && (
                    <div className="flex justify-center gap-1 mt-2">
                      {topThree[0].badges.slice(0, 3).map(badge => (
                        <div key={badge.id} title={badge.name} className="text-2xl">
                          {badge.iconUrl}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="transform hover:scale-105 transition-all">
              <div className={`bg-gradient-to-br ${getRankColor(3)} rounded-t-2xl p-6 text-center text-white shadow-xl`}>
                <Medal className="w-12 h-12 mx-auto mb-3 text-white" />
                <div className="text-5xl font-bold mb-2">3rd</div>
              </div>
              <div className="bg-white rounded-b-2xl p-6 shadow-xl border-4 border-orange-400">
                <img
                  src={topThree[2].userAvatar}
                  alt={topThree[2].userName}
                  className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-orange-400"
                />
                <h3 className="font-bold text-center mb-2 line-clamp-1">{topThree[2].userName}</h3>
                <div className="space-y-2 text-center text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="font-bold">{topThree[2].totalXP} XP</span>
                  </div>
                  <div className="text-gray-600">Level {topThree[2].level}</div>
                  <div className="flex items-center justify-center gap-1 text-yellow-600">
                    <Trophy className="w-4 h-4" />
                    {topThree[2].challengesWon} wins
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rest of Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 border-b">
          <h2 className="text-2xl font-bold">Full Rankings</h2>
        </div>
        
        <div className="divide-y">
          {restOfLeaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                entry.userId === currentUser.id ? 'bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 text-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <img
                    src={entry.userAvatar}
                    alt={entry.userName}
                    className="w-14 h-14 rounded-full border-2 border-purple-300"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {entry.userName}
                      {entry.userId === currentUser.id && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">YOU</span>
                      )}
                    </h3>
                    <div className="text-sm text-gray-600">
                      Level {entry.level} • {entry.challengesCompleted} challenges completed
                    </div>
                    {entry.badges.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {entry.badges.map(badge => (
                          <span
                            key={badge.id}
                            title={badge.name}
                            className={`px-2 py-1 rounded-full text-xs border-2 ${getBadgeRarityColor(badge.rarity)}`}
                          >
                            {badge.iconUrl} {badge.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{entry.totalXP}</div>
                    <div className="text-xs text-gray-500">XP</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{entry.totalCoins}</div>
                    <div className="text-xs text-gray-500">Coins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                      <Zap className="w-5 h-5" />
                      {entry.streak}
                    </div>
                    <div className="text-xs text-gray-500">Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{entry.challengesWon}</div>
                    <div className="text-xs text-gray-500">Wins</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Showcase */}
      <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Star className="w-7 h-7" />
          Earn More Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="font-semibold">Fire Streak</div>
            <div className="text-xs text-purple-100">30 day streak</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">💎</div>
            <div className="font-semibold">Diamond Status</div>
            <div className="text-xs text-purple-100">10,000 XP earned</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-semibold">Perfect Aim</div>
            <div className="text-xs text-purple-100">Win 25 challenges</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🚀</div>
            <div className="font-semibold">To The Moon</div>
            <div className="text-xs text-purple-100">Complete 100 challenges</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
