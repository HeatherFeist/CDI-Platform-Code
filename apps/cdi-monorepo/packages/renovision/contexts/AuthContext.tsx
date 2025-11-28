import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    User,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type UserRole = 'admin' | 'manager' | 'technician' | 'sales';

interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    businessId: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, profile: Omit<UserProfile, 'uid' | 'email'>) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    hasRole: (roles: UserRole[]) => boolean;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            // Firebase not configured, skip auth setup
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser && db) {
                // Load user profile from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUserProfile(userDoc.data() as UserProfile);
                    } else {
                        // Create default profile if it doesn't exist
                        const defaultProfile: UserProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            role: 'technician',
                            businessId: 'default',
                            firstName: '',
                            lastName: '',
                        };
                        await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
                        setUserProfile(defaultProfile);
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                }
            } else {
                setUserProfile(null);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error('Sign in error:', error);
            throw new Error(error.message || 'Failed to sign in');
        }
    };

    const signUp = async (
        email: string, 
        password: string, 
        profile: Omit<UserProfile, 'uid' | 'email'>
    ) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newProfile: UserProfile = {
                uid: userCredential.user.uid,
                email: userCredential.user.email || email,
                ...profile,
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
        } catch (error: any) {
            console.error('Sign up error:', error);
            throw new Error(error.message || 'Failed to sign up');
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error: any) {
            console.error('Sign out error:', error);
            throw new Error(error.message || 'Failed to sign out');
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            console.error('Password reset error:', error);
            throw new Error(error.message || 'Failed to send password reset email');
        }
    };

    const hasRole = (roles: UserRole[]): boolean => {
        if (!userProfile) return false;
        return roles.includes(userProfile.role);
    };

    const isAdmin = (): boolean => {
        return userProfile?.role === 'admin';
    };

    const value: AuthContextType = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        hasRole,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
