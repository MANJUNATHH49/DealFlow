
import { AnalysisResult, ChatSession, GenerationHistory } from '../types';
import { db, auth } from './firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const ANALYSIS_KEY = 'dealflow_history';
const CHAT_KEY = 'dealflow_chats';
const TOOLS_KEY = 'dealflow_tools';

// Helper to check if we are in "Real" mode vs "Demo" mode
const isRealBackendAvailable = () => {
  return db && auth?.currentUser && !localStorage.getItem('demo_auth_active');
};

// --- Helper: Sanitize Data for Firestore ---
// Firestore throws an error if a field is 'undefined'. We must remove them or convert to null.
const sanitizeForFirestore = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeForFirestore(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value === undefined) {
        return acc; // Skip undefined keys
      }
      acc[key] = sanitizeForFirestore(value);
      return acc;
    }, {} as any);
  }
  return obj;
};

// --- Generic Helpers ---

const saveToDatabase = async (collectionName: string, data: any) => {
  if (isRealBackendAvailable() && auth.currentUser) {
    try {
      // Clean data before sending to Firestore
      const cleanData = sanitizeForFirestore(data);

      // Use setDoc with a specific ID if provided, otherwise addDoc
      if (cleanData.id) {
         await setDoc(doc(db, 'users', auth.currentUser.uid, collectionName, cleanData.id), cleanData);
      } else {
         await addDoc(collection(db, 'users', auth.currentUser.uid, collectionName), cleanData);
      }
    } catch (err) {
      console.error(`Firestore save error (${collectionName}):`, err);
    }
  }
};

const getFromDatabase = async <T>(collectionName: string, limitCount: number = 20): Promise<T[]> => {
  if (isRealBackendAvailable() && auth.currentUser) {
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, collectionName),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (err) {
      // Don't spam console if it's just a permission/offline issue
      if ((err as any)?.code !== 'failed-precondition') {
          console.error(`Firestore fetch error (${collectionName}):`, err);
      }
      return [];
    }
  }
  return [];
};

// --- Analysis History ---

export const getHistory = async (): Promise<AnalysisResult[]> => {
  // Try DB first
  const dbData = await getFromDatabase<AnalysisResult>('analyses');
  if (dbData.length > 0) return dbData;

  // Fallback to Local
  const stored = localStorage.getItem(ANALYSIS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveToHistory = async (result: AnalysisResult) => {
  const newEntry: AnalysisResult = {
    ...result,
    id: result.id || crypto.randomUUID(),
    timestamp: result.timestamp || Date.now(),
  };

  await saveToDatabase('analyses', newEntry);

  // Local Storage Sync (Backup)
  const currentLocal = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || '[]');
  const updated = [newEntry, ...currentLocal].slice(0, 10);
  localStorage.setItem(ANALYSIS_KEY, JSON.stringify(updated));
};

// --- Chat History ---

export const getChatHistory = async (): Promise<ChatSession[]> => {
  const dbData = await getFromDatabase<ChatSession>('chats');
  if (dbData.length > 0) return dbData;

  const stored = localStorage.getItem(CHAT_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveChatSession = async (session: ChatSession) => {
    await saveToDatabase('chats', session);

    // Local Storage
    const currentLocal = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    // Update existing session if ID matches, else add new
    const existingIndex = currentLocal.findIndex((s: ChatSession) => s.id === session.id);
    let updated;
    if (existingIndex >= 0) {
        updated = [...currentLocal];
        updated[existingIndex] = session;
    } else {
        updated = [session, ...currentLocal].slice(0, 5); // Keep last 5 sessions locally
    }
    localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
};

// --- Tools/Generation History ---

export const getGenerationHistory = async (): Promise<GenerationHistory[]> => {
    const dbData = await getFromDatabase<GenerationHistory>('generations');
    if (dbData.length > 0) return dbData;

    const stored = localStorage.getItem(TOOLS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export const saveGeneration = async (gen: GenerationHistory) => {
    await saveToDatabase('generations', gen);

    const currentLocal = JSON.parse(localStorage.getItem(TOOLS_KEY) || '[]');
    const updated = [gen, ...currentLocal].slice(0, 10);
    localStorage.setItem(TOOLS_KEY, JSON.stringify(updated));
}

export const clearLocalHistory = () => {
  localStorage.removeItem(ANALYSIS_KEY);
  localStorage.removeItem(CHAT_KEY);
  localStorage.removeItem(TOOLS_KEY);
};

export const clearAllUserData = async () => {
  // Clear Local Storage
  clearLocalHistory();

  // Clear Firestore
  if (isRealBackendAvailable() && auth.currentUser) {
    const collections = ['analyses', 'chats', 'generations'];
    
    for (const colName of collections) {
      try {
        const q = query(collection(db, 'users', auth.currentUser.uid, colName));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(docSnapshot => 
           deleteDoc(doc(db, 'users', auth.currentUser.uid, colName, docSnapshot.id))
        );
        
        await Promise.all(deletePromises);
      } catch (err) {
        console.error(`Error clearing collection ${colName}:`, err);
      }
    }
  }
};
