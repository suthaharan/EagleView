
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { User, UserRole, UserPreferences, AnalysisResult } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyC7-sdxpE0no-Y_aXjIQh9WHmLgZqwHtR0",
  authDomain: "eagleview-c2bbd.firebaseapp.com",
  projectId: "eagleview-c2bbd",
  storageBucket: "eagleview-c2bbd.firebasestorage.app",
  messagingSenderId: "303649558136",
  appId: "1:303649558136:web:9a8f571816724f7b26a78d",
  measurementId: "G-NZYJ64ZZEM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

// Authentication Operations
export const signUpUser = async (email: string, pass: string, name: string, role: UserRole): Promise<User> => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    
    const userData: User = {
      id: res.user.uid,
      email,
      name,
      role
    };
    
    if (role === UserRole.CAREGIVER) {
      userData.assignedSeniors = [];
    }

    // Force wait for the document to be saved
    await saveUser(userData);
    
    // Double check the write
    const verified = await getUserWithRetry(res.user.uid, 3);
    if (!verified) throw new Error("Database verification failed. Please try again.");
    
    return userData;
  } catch (error: any) {
    console.error("Signup Error:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("This email is already in use. Please log in instead.");
    }
    throw new Error(error.message || "Could not complete registration.");
  }
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    let data = await getUserWithRetry(res.user.uid);
    
    // Self-healing: If profile is missing on login, create a default one
    if (!data) {
      console.warn("Profile missing on login, healing...");
      const fallback: User = {
        id: res.user.uid,
        email: email,
        name: email.split('@')[0],
        role: UserRole.SENIOR
      };
      await saveUser(fallback);
      data = fallback;
    }
    return data as User;
  } catch (error: any) {
    if (error.code?.includes('auth/')) {
      throw new Error("Invalid email or password. Please try again.");
    }
    throw error;
  }
};

export const logoutUser = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      let data = await getUserWithRetry(fbUser.uid);
      
      // Self-healing for session restoration
      if (!data && fbUser.email) {
        const fallback: User = {
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          role: UserRole.SENIOR
        };
        await saveUser(fallback);
        data = fallback;
      }
      callback(data as User);
    } else {
      callback(null);
    }
  });
};

// Firestore Operations
export const saveUser = async (user: User) => {
  try {
    const data = JSON.parse(JSON.stringify(user));
    await setDoc(doc(db, "users", user.id), data, { merge: true });
  } catch (err) {
    console.error("Firestore Save User Error:", err);
    throw new Error("We couldn't save your profile to the database. Check your internet.");
  }
};

export const getUser = async (userId: string) => {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Firestore Get User Error:", err);
    return null;
  }
};

export const getUserWithRetry = async (userId: string, retries = 5): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    const data = await getUser(userId);
    if (data) return data;
    if (i < retries - 1) await wait(800); 
  }
  return null;
};

export const savePreferences = async (userId: string, prefs: UserPreferences) => {
  const data = JSON.parse(JSON.stringify(prefs));
  await setDoc(doc(db, "preferences", userId), data, { merge: true });
};

export const subscribeToPreferences = (userId: string, callback: (prefs: UserPreferences) => void) => {
  return onSnapshot(doc(db, "preferences", userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserPreferences);
    }
  });
};

export const saveHistory = async (result: AnalysisResult) => {
  const data = JSON.parse(JSON.stringify(result));
  await setDoc(doc(db, "history", result.id), data);
};

export const getHistory = async (userId: string): Promise<AnalysisResult[]> => {
  try {
    // To avoid the 'missing composite index' error, we remove the 'orderBy' 
    // from the Firestore query and perform the sort on the client side.
    const q = query(
      collection(db, "history"), 
      where("userId", "==", userId),
      limit(100) // Fetch a slightly larger batch to sort locally
    );
    
    const snap = await getDocs(q);
    const results = snap.docs.map(d => d.data() as AnalysisResult);
    
    // Sort descending by timestamp (newest first)
    return results
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Return top 50
      
  } catch (err: any) {
    console.error("Firestore getHistory Error:", err);
    // If you ever want to use server-side sorting for millions of records,
    // you MUST click the link in the error console to create the composite index.
    return [];
  }
};

export const getSeniorsForCaregiver = async (seniorIds: string[]): Promise<User[]> => {
  if (seniorIds.length === 0) return [];
  try {
    const q = query(collection(db, "users"), where("id", "in", seniorIds));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  } catch (err) {
    console.error("Error getting seniors:", err);
    return [];
  }
};
