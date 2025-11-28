import React from 'react';
import { CreditCard, Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution: string;
}

interface AccountsOverviewProps {
  accounts: Account[];
}

export default function AccountsOverview({ accounts }: AccountsOverviewProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (accounts.length === 0) {
    return (
      <div className="card-glass p-12 text-center">
        <CreditCard className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Accounts Connected</h3>
        <p className="text-slate-400 mb-6">
          Connect your bank accounts, credit cards, and debit cards to start tracking your finances
        </p>
        <div className="bg-indigo-500/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20 max-w-md mx-auto">
          <h4 className="text-lg font-bold text-indigo-300 mb-3">📋 Getting Started:</h4>
          <ol className="text-left text-indigo-200 space-y-2 text-sm">
            <li>1. Add your Plaid API key in Settings (or use demo mode)</li>
            <li>2. Click "Connect Bank Account" above</li>
            <li>3. Select your bank and sign in securely</li>
            <li>4. Your accounts will appear here automatically!</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-8 border border-indigo-500/20">
        <p className="text-indigo-200 text-sm mb-2">Total Balance</p>
        <h2 className="text-4xl font-bold text-white mb-4">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <div className="flex items-center space-x-2 text-emerald-400">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm">Across {accounts.length} accounts</span>
        </div>
      </div>

      {/* Individual Accounts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="card-glass p-6 hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  {account.type === 'credit' ? (
                    <CreditCard className="w-5 h-5 text-blue-300" />
                  ) : (
                    <Building2 className="w-5 h-5 text-blue-300" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{account.name}</p>
                  <p className="text-blue-300 text-xs">{account.institution}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-blue-200 text-xs mb-1">{account.type.toUpperCase()}</p>
              <p className="text-2xl font-bold text-white">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
