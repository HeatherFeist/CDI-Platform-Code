import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  pending: boolean;
}

interface SpendingAnalyticsProps {
  transactions: Transaction[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function SpendingAnalytics({ transactions }: SpendingAnalyticsProps) {
  // Group transactions by category
  const spendingByCategory = transactions
    .filter(t => t.amount < 0) // Only expenses
    .reduce((acc, txn) => {
      const category = txn.category;
      acc[category] = (acc[category] || 0) + Math.abs(txn.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(spendingByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value.toFixed(2))
  }));

  // Calculate monthly spending
  const monthlySpending = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, txn) => {
      const month = new Date(txn.date).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + Math.abs(txn.amount);
      return acc;
    }, {} as Record<string, number>);

  const monthlyData = Object.entries(monthlySpending).map(([month, amount]) => ({
    month,
    spending: Number(amount.toFixed(2))
  }));

  const totalSpent = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0);
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const netChange = totalIncome - totalSpent;

  if (transactions.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
        <TrendingUp className="w-16 h-16 text-blue-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Analytics Available</h3>
        <p className="text-blue-200">
          Connect your accounts and let transactions sync to see your spending insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="w-5 h-5 text-red-300" />
            <p className="text-red-200 text-sm">Total Spent</p>
          </div>
          <p className="text-3xl font-bold text-white">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-300" />
            <p className="text-green-200 text-sm">Total Income</p>
          </div>
          <p className="text-3xl font-bold text-white">
            ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`bg-gradient-to-r backdrop-blur-lg rounded-xl p-6 border border-white/20 ${
          netChange >= 0
            ? 'from-blue-500/20 to-purple-500/20'
            : 'from-orange-500/20 to-red-500/20'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-300" />
            <p className="text-blue-200 text-sm">Net Change</p>
          </div>
          <p className={`text-3xl font-bold ${netChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {netChange >= 0 ? '+' : ''}${netChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-blue-200 text-center py-12">No spending data available</p>
          )}
        </div>

        {/* Monthly Spending - Bar Chart */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4">Monthly Spending</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="spending" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-blue-200 text-center py-12">No monthly data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
