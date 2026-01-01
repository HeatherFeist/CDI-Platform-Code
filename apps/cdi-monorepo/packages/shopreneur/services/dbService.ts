import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  where,
  Timestamp,
  getDocs,
  increment 
} from "firebase/firestore";
import { db } from "./firebase";
import { Product, ShopSettings, Message, UserProfile, Challenge, ChallengeSubmission, Vote, LeaderboardEntry } from "../types";

const PRODUCTS_COLLECTION = "products";
const SETTINGS_COLLECTION = "settings";
const MESSAGES_COLLECTION = "messages";
const CHALLENGES_COLLECTION = "challenges";
const SUBMISSIONS_COLLECTION = "challenge_submissions";
const VOTES_COLLECTION = "votes";
const LEADERBOARD_COLLECTION = "leaderboard";

export const dbService = {
  // --- Products ---
  subscribeToProducts: (callback: (products: Product[]) => void) => {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("id", "desc"));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      })) as Product[];
      callback(products);
    });
  },

  saveProduct: async (product: Partial<Product>) => {
    if (product.id && product.id.length > 15) { // Assuming generated ID
        const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
        return await setDoc(docRef, product, { merge: true });
    } else {
        return await addDoc(collection(db, PRODUCTS_COLLECTION), {
            ...product,
            createdAt: Timestamp.now()
        });
    }
  },

  deleteProduct: async (productId: string) => {
    return await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  },

  // --- Shop Settings ---
  subscribeToSettings: (callback: (settings: ShopSettings) => void) => {
    return onSnapshot(doc(db, SETTINGS_COLLECTION, "global_settings"), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as ShopSettings);
      }
    });
  },

  updateSettings: async (settings: ShopSettings) => {
    return await setDoc(doc(db, SETTINGS_COLLECTION, "global_settings"), settings);
  },

  // --- Messaging ---
  subscribeToMessages: (callback: (messages: Message[]) => void) => {
    const q = query(collection(db, MESSAGES_COLLECTION), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      })) as Message[];
      callback(messages);
    });
  },

  sendMessage: async (message: Omit<Message, 'id'>) => {
    return await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...message,
      timestamp: Date.now()
    });
  },

  deleteMessage: async (messageId: string) => {
    return await deleteDoc(doc(db, MESSAGES_COLLECTION, messageId));
  },

  // --- Challenges ---
  subscribeToActiveChallenges: (callback: (challenges: Challenge[]) => void) => {
    const q = query(
      collection(db, CHALLENGES_COLLECTION),
      where("isActive", "==", true),
      orderBy("startDate", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const challenges = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      })) as Challenge[];
      callback(challenges);
    });
  },

  createChallenge: async (challenge: Omit<Challenge, 'id'>) => {
    return await addDoc(collection(db, CHALLENGES_COLLECTION), challenge);
  },

  // --- Challenge Submissions ---
  subscribeToSubmissions: (challengeId: string, callback: (submissions: ChallengeSubmission[]) => void) => {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("challengeId", "==", challengeId),
      orderBy("submittedAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      })) as ChallengeSubmission[];
      callback(submissions);
    });
  },

  submitChallenge: async (submission: Omit<ChallengeSubmission, 'id'>) => {
    return await addDoc(collection(db, SUBMISSIONS_COLLECTION), submission);
  },

  // --- Voting ---
  voteForSubmission: async (submissionId: string, userId: string) => {
    // Check if user already voted
    const votesQuery = query(
      collection(db, VOTES_COLLECTION),
      where("submissionId", "==", submissionId),
      where("userId", "==", userId)
    );
    const existingVotes = await getDocs(votesQuery);
    
    if (!existingVotes.empty) {
      throw new Error("You have already voted for this submission");
    }

    // Add vote
    const vote: Omit<Vote, 'id'> = {
      submissionId,
      userId,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, VOTES_COLLECTION), vote);

    // Update submission vote count
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      voteCount: increment(1)
    });
  },

  getUserVotes: async (userId: string): Promise<string[]> => {
    const q = query(
      collection(db, VOTES_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().submissionId as string);
  },

  // --- Leaderboard ---
  subscribeToLeaderboard: (callback: (entries: LeaderboardEntry[]) => void) => {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy("totalXP", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((doc, index) => ({ 
        ...doc.data(), 
        userId: doc.id,
        rank: index + 1 
      })) as LeaderboardEntry[];
      callback(entries);
    });
  },

  updateLeaderboardEntry: async (userId: string, updates: Partial<LeaderboardEntry>) => {
    const docRef = doc(db, LEADERBOARD_COLLECTION, userId);
    return await setDoc(docRef, updates, { merge: true });
  },

  // Award XP and coins to user after challenge completion
  awardChallengeRewards: async (userId: string, xpReward: number, coinReward: number) => {
    const docRef = doc(db, LEADERBOARD_COLLECTION, userId);
    await updateDoc(docRef, {
      totalXP: increment(xpReward),
      totalCoins: increment(coinReward),
      challengesCompleted: increment(1)
    });
  },

  // Update streak when user completes challenge
  updateStreak: async (userId: string, newStreak: number) => {
    const docRef = doc(db, LEADERBOARD_COLLECTION, userId);
    await updateDoc(docRef, {
      streak: newStreak
    });
  },

  // --- Social Media Connections ---
  saveSocialConnection: async (userId: string, platform: string, connectionData: any) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [`socialConnections.${platform}`]: connectionData
    });
  },

  removeSocialConnection: async (userId: string, platform: string) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [`socialConnections.${platform}`]: null
    });
  }
};
