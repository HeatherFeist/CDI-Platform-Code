import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  pending: boolean;
}

interface TransactionsListProps {
  transactions: Transaction[];
}

export default function TransactionsList({ transactions }: TransactionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'food', 'transport', 'shopping', 'bills', 'income', 'other'];

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || txn.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (transactions.length === 0) {
    return (
      <div className="card-glass p-12 text-center">
        <Search className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Transactions Yet</h3>
        <p className="text-slate-400">
          Once you connect your accounts, your transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-slate-800">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <button className="flex items-center space-x-2 px-6 py-3 btn-secondary">
          <Download className="w-5 h-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="card-glass overflow-hidden">
        <div className="divide-y divide-slate-700">
          {filteredTransactions.map((txn) => (
            <div
              key={txn.id}
              className="p-4 hover:bg-slate-700/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${txn.amount > 0
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                    }`}>
                    {txn.amount > 0 ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{txn.description}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-slate-400 text-sm">{format(new Date(txn.date), 'MMM d, yyyy')}</p>
                      <span className="text-slate-600 text-xs">•</span>
                      <p className="text-slate-400 text-sm">{txn.account}</p>
                      {txn.pending && (
                        <>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-yellow-500 text-xs">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${txn.amount > 0 ? 'text-green-300' : 'text-white'
                    }`}>
                    {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-400 text-sm capitalize">{txn.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
