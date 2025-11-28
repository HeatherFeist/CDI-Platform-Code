import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';

export interface PaymentRecord {
    id?: string;
    userId: string;
    amount: number;
    currency: string;
    description: string;
    provider: 'paypal' | 'cashapp';
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}

const PAYMENTS_COLLECTION = 'payments';

export const createPaymentRecord = async (payment: Omit<PaymentRecord, 'createdAt' | 'updatedAt'>) => {
    try {
        const timestamp = new Date();
        const paymentDoc = await addDoc(collection(db, PAYMENTS_COLLECTION), {
            ...payment,
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        return paymentDoc.id;
    } catch (error) {
        console.error('Error creating payment record:', error);
        throw error;
    }
};

export const updatePaymentStatus = async (
    paymentId: string,
    status: PaymentRecord['status'],
    transactionId?: string,
    metadata?: Record<string, any>
) => {
    try {
        const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
        await updateDoc(paymentRef, {
            status,
            ...(transactionId && { transactionId }),
            ...(metadata && { metadata }),
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

export const getPaymentRecord = async (paymentId: string): Promise<PaymentRecord | null> => {
    try {
        const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
        const paymentSnap = await getDoc(paymentRef);
        
        if (!paymentSnap.exists()) {
            return null;
        }

        return {
            id: paymentSnap.id,
            ...paymentSnap.data(),
        } as PaymentRecord;
    } catch (error) {
        console.error('Error fetching payment record:', error);
        throw error;
    }
};