import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  increment,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

export interface MerchantCoin {
  merchantId: string;
  merchantName: string;
  coinName: string;
  coinSymbol: string;
  brandColor: string;
  logoUrl?: string;
  balance: number;
  earnRate: number;
  redemptionRate: number;
  minimumRedemption: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  addedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'awarded' | 'expired';
  merchantId: string;
  merchantName: string;
  amount: number;
  balanceAfter: number;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface Wallet {
  userId: string;
  merchantCoins: MerchantCoin[];
  transactions: WalletTransaction[];
  totalValue: number;
  totalCoinsEarned: number;
  totalCoinsRedeemed: number;
  createdAt: string;
  updatedAt: string;
}

export const walletService = {
  /**
   * Get or create user wallet
   */
  async getWallet(userId: string): Promise<Wallet> {
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await getDoc(walletRef);
    
    if (!walletSnap.exists()) {
      // Create new wallet
      const newWallet: Wallet = {
        userId,
        merchantCoins: [],
        transactions: [],
        totalValue: 0,
        totalCoinsEarned: 0,
        totalCoinsRedeemed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(walletRef, newWallet);
      return newWallet;
    }
    
    return walletSnap.data() as Wallet;
  },

  /**
   * Add or update merchant coin in wallet
   */
  async addMerchantCoin(userId: string, coinData: Partial<MerchantCoin>): Promise<void> {
    const walletRef = doc(db, 'wallets', userId);
    const wallet = await this.getWallet(userId);
    
    const existingCoinIndex = wallet.merchantCoins.findIndex(
      c => c.merchantId === coinData.merchantId
    );
    
    if (existingCoinIndex >= 0) {
      // Update existing coin
      wallet.merchantCoins[existingCoinIndex] = {
        ...wallet.merchantCoins[existingCoinIndex],
        ...coinData,
        balance: wallet.merchantCoins[existingCoinIndex].balance + (coinData.balance || 0)
      };
    } else {
      // Add new coin
      wallet.merchantCoins.push({
        merchantId: coinData.merchantId!,
        merchantName: coinData.merchantName!,
        coinName: coinData.coinName!,
        coinSymbol: coinData.coinSymbol!,
        brandColor: coinData.brandColor!,
        logoUrl: coinData.logoUrl,
        balance: coinData.balance || 0,
        earnRate: coinData.earnRate!,
        redemptionRate: coinData.redemptionRate!,
        minimumRedemption: coinData.minimumRedemption!,
        tier: 'bronze',
        addedAt: new Date().toISOString()
      });
    }
    
    await updateDoc(walletRef, {
      merchantCoins: wallet.merchantCoins,
      totalValue: this.calculateTotalValue(wallet.merchantCoins),
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Award coins to user after purchase
   */
  async awardCoins(
    userId: string,
    merchantId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<void> {
    const walletRef = doc(db, 'wallets', userId);
    const wallet = await this.getWallet(userId);
    
    const coinIndex = wallet.merchantCoins.findIndex(
      c => c.merchantId === merchantId
    );
    
    if (coinIndex < 0) {
      throw new Error('Merchant coin not found in wallet');
    }
    
    // Update balance
    wallet.merchantCoins[coinIndex].balance += amount;
    
    // Update tier based on balance
    wallet.merchantCoins[coinIndex].tier = this.calculateTier(
      wallet.merchantCoins[coinIndex].balance
    );
    
    // Create transaction
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'earned',
      merchantId,
      merchantName: wallet.merchantCoins[coinIndex].merchantName,
      amount,
      balanceAfter: wallet.merchantCoins[coinIndex].balance,
      description,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    wallet.transactions.unshift(transaction); // Add to beginning
    
    // Update wallet
    await updateDoc(walletRef, {
      merchantCoins: wallet.merchantCoins,
      transactions: wallet.transactions.slice(0, 100), // Keep last 100 transactions
      totalCoinsEarned: increment(amount),
      totalValue: this.calculateTotalValue(wallet.merchantCoins),
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Redeem coins for discount
   */
  async redeemCoins(
    userId: string,
    merchantId: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    const walletRef = doc(db, 'wallets', userId);
    const wallet = await this.getWallet(userId);
    
    const coinIndex = wallet.merchantCoins.findIndex(
      c => c.merchantId === merchantId
    );
    
    if (coinIndex < 0) {
      throw new Error('Merchant coin not found in wallet');
    }
    
    const coin = wallet.merchantCoins[coinIndex];
    
    // Validate redemption
    if (coin.balance < amount) {
      throw new Error('Insufficient coin balance');
    }
    
    if (amount < coin.minimumRedemption) {
      throw new Error(`Minimum redemption is ${coin.minimumRedemption} coins`);
    }
    
    // Deduct coins
    wallet.merchantCoins[coinIndex].balance -= amount;
    
    // Update tier
    wallet.merchantCoins[coinIndex].tier = this.calculateTier(
      wallet.merchantCoins[coinIndex].balance
    );
    
    // Create transaction
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'redeemed',
      merchantId,
      merchantName: coin.merchantName,
      amount,
      balanceAfter: wallet.merchantCoins[coinIndex].balance,
      description,
      timestamp: new Date().toISOString()
    };
    
    wallet.transactions.unshift(transaction);
    
    // Update wallet
    await updateDoc(walletRef, {
      merchantCoins: wallet.merchantCoins,
      transactions: wallet.transactions.slice(0, 100),
      totalCoinsRedeemed: increment(amount),
      totalValue: this.calculateTotalValue(wallet.merchantCoins),
      updatedAt: new Date().toISOString()
    });
    
    return true;
  },

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, limitCount: number = 50): Promise<WalletTransaction[]> {
    const wallet = await this.getWallet(userId);
    return wallet.transactions.slice(0, limitCount);
  },

  /**
   * Get merchant coin balance
   */
  async getCoinBalance(userId: string, merchantId: string): Promise<number> {
    const wallet = await this.getWallet(userId);
    const coin = wallet.merchantCoins.find(c => c.merchantId === merchantId);
    return coin?.balance || 0;
  },

  /**
   * Calculate total wallet value in USD
   */
  calculateTotalValue(merchantCoins: MerchantCoin[]): number {
    return merchantCoins.reduce((total, coin) => {
      return total + (coin.balance / coin.redemptionRate);
    }, 0);
  },

  /**
   * Calculate tier based on coin balance
   */
  calculateTier(balance: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (balance >= 10000) return 'platinum';
    if (balance >= 5000) return 'gold';
    if (balance >= 1000) return 'silver';
    return 'bronze';
  },

  /**
   * Get wallet stats
   */
  async getWalletStats(userId: string) {
    const wallet = await this.getWallet(userId);
    
    return {
      totalCoins: wallet.merchantCoins.reduce((sum, coin) => sum + coin.balance, 0),
      totalValue: wallet.totalValue,
      totalMerchants: wallet.merchantCoins.length,
      totalEarned: wallet.totalCoinsEarned,
      totalRedeemed: wallet.totalCoinsRedeemed,
      recentTransactions: wallet.transactions.slice(0, 10)
    };
  },

  /**
   * Subscribe to wallet changes (real-time)
   */
  subscribeToWallet(userId: string, callback: (wallet: Wallet) => void) {
    const walletRef = doc(db, 'wallets', userId);
    
    // Using Firestore's onSnapshot for real-time updates
    const unsubscribe = (async () => {
      const { onSnapshot } = await import('firebase/firestore');
      return onSnapshot(walletRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as Wallet);
        }
      });
    })();
    
    return unsubscribe;
  }
};
