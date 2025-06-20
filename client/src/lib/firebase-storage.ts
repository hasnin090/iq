import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// Types for Firebase collections
export interface FirebaseUser {
  id?: string;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  createdAt: string;
}

export interface FirebaseProject {
  id?: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface FirebaseTransaction {
  id?: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  projectId: number;
  userId: number;
  expenseTypeId?: number;
  attachments?: string[];
  createdAt: string;
}

export interface FirebaseDeferredPayment {
  id?: string;
  amount: number;
  paidAmount: number;
  description: string;
  dueDate: string;
  status: string;
  projectId: number;
  userId: number;
  createdAt: string;
}

// Firebase Storage Service
export class FirebaseStorageService {
  // Users
  async getUsers(): Promise<FirebaseUser[]> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseUser));
  }

  async createUser(user: Omit<FirebaseUser, 'id'>): Promise<FirebaseUser> {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...user,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...user };
  }

  async updateUser(id: string, userData: Partial<FirebaseUser>): Promise<void> {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, userData);
  }

  // Projects
  async getProjects(): Promise<FirebaseProject[]> {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseProject));
  }

  async createProject(project: Omit<FirebaseProject, 'id'>): Promise<FirebaseProject> {
    const projectsRef = collection(db, 'projects');
    const docRef = await addDoc(projectsRef, {
      ...project,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...project };
  }

  async updateProject(id: string, projectData: Partial<FirebaseProject>): Promise<void> {
    const projectRef = doc(db, 'projects', id);
    await updateDoc(projectRef, projectData);
  }

  async deleteProject(id: string): Promise<void> {
    const projectRef = doc(db, 'projects', id);
    await deleteDoc(projectRef);
  }

  // Transactions
  async getTransactions(): Promise<FirebaseTransaction[]> {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseTransaction));
  }

  async createTransaction(transaction: Omit<FirebaseTransaction, 'id'>): Promise<FirebaseTransaction> {
    const transactionsRef = collection(db, 'transactions');
    const docRef = await addDoc(transactionsRef, {
      ...transaction,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...transaction };
  }

  async updateTransaction(id: string, transactionData: Partial<FirebaseTransaction>): Promise<void> {
    const transactionRef = doc(db, 'transactions', id);
    await updateDoc(transactionRef, transactionData);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactionRef = doc(db, 'transactions', id);
    await deleteDoc(transactionRef);
  }

  // Deferred Payments
  async getDeferredPayments(): Promise<FirebaseDeferredPayment[]> {
    const paymentsRef = collection(db, 'deferred_payments');
    const q = query(paymentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseDeferredPayment));
  }

  async createDeferredPayment(payment: Omit<FirebaseDeferredPayment, 'id'>): Promise<FirebaseDeferredPayment> {
    const paymentsRef = collection(db, 'deferred_payments');
    const docRef = await addDoc(paymentsRef, {
      ...payment,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...payment };
  }

  async updateDeferredPayment(id: string, paymentData: Partial<FirebaseDeferredPayment>): Promise<void> {
    const paymentRef = doc(db, 'deferred_payments', id);
    await updateDoc(paymentRef, paymentData);
  }

  async deleteDeferredPayment(id: string): Promise<void> {
    const paymentRef = doc(db, 'deferred_payments', id);
    await deleteDoc(paymentRef);
  }

  // Settings
  async getSettings(): Promise<any[]> {
    const settingsRef = collection(db, 'settings');
    const snapshot = await getDocs(settingsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const settingsRef = collection(db, 'settings');
    const q = query(settingsRef, where('key', '==', key));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(settingsRef, { key, value });
    } else {
      const settingRef = doc(db, 'settings', snapshot.docs[0].id);
      await updateDoc(settingRef, { value });
    }
  }
}

export const firebaseStorage = new FirebaseStorageService();

// Utility functions for file handling
export const getFileType = (fileType: string): string => {
  return fileType.split('/')[0] || 'unknown';
};

export const getReadableFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} بايت`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${Math.round(sizeInBytes / 1024 * 10) / 10} كيلوبايت`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${Math.round(sizeInBytes / (1024 * 1024) * 10) / 10} ميجابايت`;
  } else {
    return `${Math.round(sizeInBytes / (1024 * 1024 * 1024) * 10) / 10} جيجابايت`;
  }
};