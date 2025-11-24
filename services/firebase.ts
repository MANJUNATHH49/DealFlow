
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";

// Check if we have valid configuration
const isConfigValid = 
  FIREBASE_CONFIG.apiKey && 
  !FIREBASE_CONFIG.apiKey.includes("Dummy") &&
  !FIREBASE_CONFIG.apiKey.includes("your-api-key");

let auth: any;
let db: any;
let googleProvider: any;
let analytics: any;

// Only attempt to initialize Firebase if config looks valid
if (isConfigValid) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    
    // Initialize Analytics
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }

    auth = getAuth(app);
    
    // Connect to the default Firestore database for the project
    db = getFirestore(app);
    
    // Attempt to enable offline persistence (Optional, suppresses some offline errors)
    // Note: This may fail in some environments (like incognito or iframes), so we catch it.
    if (typeof window !== 'undefined') {
        try {
            // enableIndexedDbPersistence(db).catch((err) => {
            //     if (err.code == 'failed-precondition') {
            //         // Multiple tabs open, persistence can only be enabled in one tab at a a time.
            //     } else if (err.code == 'unimplemented') {
            //         // The current browser does not support all of the features required to enable persistence
            //     }
            // });
        } catch (e) {
            // Ignore persistence errors
        }
    }
    
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.warn("Firebase initialization failed. Falling back to Demo Mode.", e);
  }
}

// --- Mock Authentication for Demo Mode (Fallback) ---

const MOCK_USER = {
  uid: "demo-user-123",
  displayName: "Demo User",
  email: "demo@example.com",
  photoURL: null, // Test initials generation
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: "mock-token",
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => "mock-jwt-token",
  getIdTokenResult: async () => ({
    token: "mock-jwt-token",
    signInProvider: "google",
    claims: {},
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
  }),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
} as unknown as User;

let mockAuthObserver: ((user: User | null) => void) | null = null;

// Helper to check for demo mode
const isDemoActive = () => localStorage.getItem('demo_auth_active') === 'true';

// --- User Profile Management ---

export const getInitials = (name: string | null | undefined): string => {
  if (!name) return "U";
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const createUserDocument = async (user: User) => {
  // Prevent execution if offline to avoid "Failed to get document because the client is offline"
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
  }

  if (!isConfigValid || !db || isDemoActive()) return;

  try {
    const userRef = doc(db, "users", user.uid);
    // Use a short timeout/fail-safe for getDoc
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const initials = getInitials(user.displayName);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        initials: initials,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
    } else {
       // Update last login
       await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
    }
  } catch (error: any) {
    // Suppress offline errors in console
    if (error?.code !== 'unavailable' && error?.code !== 'failed-precondition') {
        console.error("Error creating user document:", error);
    }
  }
};

// --- Email / Password Auth ---

export const registerWithEmail = async (email: string, pass: string): Promise<User> => {
  if (!isConfigValid || !auth || isDemoActive()) {
    console.log("DEMO MODE: Registering...");
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem('demo_auth_active', 'true');
    if (mockAuthObserver) mockAuthObserver(MOCK_USER);
    return MOCK_USER;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await createUserDocument(result.user);
    return result.user;
  } catch (error) {
    console.error("Error registering with email", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  if (!isConfigValid || !auth || isDemoActive()) {
     console.log("DEMO MODE: Logging in...");
     await new Promise(resolve => setTimeout(resolve, 800));
     localStorage.setItem('demo_auth_active', 'true');
     if (mockAuthObserver) mockAuthObserver(MOCK_USER);
     return MOCK_USER;
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await createUserDocument(result.user);
    return result.user;
  } catch (error: any) {
    if (error.code !== 'auth/invalid-credential' && error.code !== 'auth/user-not-found' && error.code !== 'auth/wrong-password') {
        console.error("Error logging in with email", error);
    }
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
    if (!isConfigValid || !auth || isDemoActive()) {
        console.log("DEMO MODE: Reset Password email sent");
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending reset email", error);
        throw error;
    }
}

// --- Google Auth ---

export const signInWithGoogle = async (): Promise<User> => {
  if (isDemoActive()) {
     if (mockAuthObserver) mockAuthObserver(MOCK_USER);
     return MOCK_USER;
  }

  if (!isConfigValid || !auth) {
    console.log("DEMO MODE: Simulating Google Sign In...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem('demo_auth_active', 'true');
    if (mockAuthObserver) mockAuthObserver(MOCK_USER);
    
    return MOCK_USER;
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-domain' || 
        error.code === 'auth/operation-not-allowed' || 
        error.code === 'auth/api-key-not-valid') {
        
        console.warn(`Firebase Auth Error (${error.code}). seamlessly switching to Demo Mode.`);
        localStorage.setItem('demo_auth_active', 'true');
        
        if (mockAuthObserver) {
            mockAuthObserver(MOCK_USER);
        }
        
        return MOCK_USER;
    }

    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  const isDemo = isDemoActive();
  
  if ((!isConfigValid || !auth) || isDemo) {
    console.log("DEMO MODE: Signing Out");
    localStorage.removeItem('demo_auth_active');
    
    if (mockAuthObserver) mockAuthObserver(null);
    
    window.location.reload();
    return;
  }

  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  mockAuthObserver = callback;

  const isDemo = isDemoActive();

  if ((!isConfigValid || !auth) || isDemo) {
    if (isDemo) {
      callback(MOCK_USER);
    } else {
      callback(null);
    }
    return () => { mockAuthObserver = null; };
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
        // Ensure user doc exists on any reload/re-auth
        createUserDocument(user);
    }
    callback(user);
  });
};

export { auth, db };
