import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs, 
    orderBy,
    increment,
    arrayUnion,
    QueryConstraint,
    limit as limitQuery
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Customer, Address } from '../../types/business';

export class CustomerService {
    private get customersCollection() {
        if (!db) throw new Error('Firebase is not initialized');
        return collection(db, 'customers');
    }

    async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const timestamp = new Date();
        const docRef = await addDoc(this.customersCollection, {
            ...customerData,
            totalSpent: 0,
            projectCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        return docRef.id;
    }

    async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
        const customerRef = doc(this.customersCollection, customerId);
        await updateDoc(customerRef, {
            ...updates,
            updatedAt: new Date()
        });
    }

    async deleteCustomer(customerId: string): Promise<void> {
        await deleteDoc(doc(this.customersCollection, customerId));
    }

    async getCustomer(customerId: string): Promise<Customer | null> {
        const docRef = doc(this.customersCollection, customerId);
        const docSnap = await getDocs(query(this.customersCollection, where('id', '==', customerId)));
        if (docSnap.empty) return null;
        return docSnap.docs[0].data() as Customer;
    }

    async searchCustomers(searchTerm: string): Promise<Customer[]> {
        // Search in firstName, lastName, email, and phone
        const q = query(
            this.customersCollection,
            where('searchableText', '>=', searchTerm.toLowerCase()),
            where('searchableText', '<=', searchTerm.toLowerCase() + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    }

    async getRecentCustomers(limit: number = 10): Promise<Customer[]> {
        const q = query(
            this.customersCollection,
            orderBy('createdAt', 'desc'),
            limitQuery(limit)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    }

    async updateCustomerStats(customerId: string, amount: number): Promise<void> {
        const customerRef = doc(this.customersCollection, customerId);
        await updateDoc(customerRef, {
            totalSpent: amount,
            projectCount: increment(1),
            updatedAt: new Date()
        });
    }

    async getCustomersByTag(tag: string): Promise<Customer[]> {
        const q = query(
            this.customersCollection,
            where('tags', 'array-contains', tag)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    }

    async addCustomerNote(customerId: string, note: string): Promise<void> {
        const customerRef = doc(this.customersCollection, customerId);
        await updateDoc(customerRef, {
            notes: arrayUnion(note),
            updatedAt: new Date()
        });
    }
}