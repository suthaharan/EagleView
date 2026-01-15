
import { initializeApp, getApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { User, UserRole, UserPreferences, AnalysisResult } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyC7-sdxpE0no-Y_aXjIQh9WHmLgZqwHtR0",
  authDomain: "eagleview-c2bbd.firebaseapp.com",
  projectId: "eagleview-c2bbd",
  storageBucket: "eagleview-c2bbd.firebasestorage.app",
  messagingSenderId: "303649558136",
  appId: "1:303649558136:web:9a8f571816724f7b26a78d",
  measurementId: "G-NZYJ64ZZEM"
};

// Main App instance
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj));

export const signUpUser = async (email: string, pass: string, name: string, role: UserRole): Promise<User> => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await wait(500);
    const userData: User = { id: res.user.uid, email, name, role };
    await saveUser(userData);
    return userData;
  } catch (error: any) {
    throw new Error(error.message || "Registration failed.");
  }
};

/**
 * Creates a senior account in Firebase Auth and Firestore without logging out the caregiver.
 * Uses a secondary temporary Firebase App instance to perform the registration.
 */
export const registerSeniorByCaregiver = async (caregiverId: string, name: string, email: string, pass: string): Promise<string> => {
  const secondaryAppName = `secondary-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const res = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const seniorUid = res.user.uid;
    
    // Create the senior's user document in the main database
    const seniorData: User = {
      id: seniorUid,
      name,
      email,
      role: UserRole.SENIOR,
      caregiverId: caregiverId // Link to the caregiver
    };
    
    await setDoc(doc(db, "users", seniorUid), sanitize(seniorData));
    
    // Sign out the secondary instance and delete the app
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    
    return seniorUid;
  } catch (error: any) {
    await deleteApp(secondaryApp);
    throw new Error(error.message || "Failed to register senior account.");
  }
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    let data = await getUserWithRetry(res.user.uid);
    if (!data) {
      const fallback: User = { id: res.user.uid, email, name: email.split('@')[0], role: UserRole.SENIOR };
      await saveUser(fallback);
      data = fallback;
    }
    return data as User;
  } catch (error: any) {
    throw new Error("Invalid email or password.");
  }
};

export const logoutUser = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const data = await getUserWithRetry(fbUser.uid);
      callback(data as User);
    } else {
      callback(null);
    }
  });
};

export const saveUser = async (user: User) => {
  if (!auth.currentUser) return;
  // Caregivers are allowed to modify the seniors they manage (linking via caregiverId)
  // For simplicity in MVP, we attempt the write and catch errors.
  try {
    await setDoc(doc(db, "users", user.id), sanitize(user), { merge: true });
  } catch (err) {
    console.error("Firestore saveUser error:", err);
  }
};

export const getManagedSeniors = async (caregiverId: string): Promise<User[]> => {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, "users"), where("caregiverId", "==", caregiverId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
  } catch (err) {
    console.error("Firestore getManagedSeniors error:", err);
    return [];
  }
};

export const getUserWithRetry = async (userId: string, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) return snap.data();
    } catch (err) {
      console.warn(`Retry ${i+1} for getUser failed`, err);
    }
    await wait(800);
  }
  return null;
};

export const savePreferences = async (targetId: string, prefs: UserPreferences) => {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, "preferences", targetId), sanitize(prefs), { merge: true });
  } catch (err) {
    console.error("Firestore savePreferences error:", err);
  }
};

export const subscribeToPreferences = (targetId: string, callback: (prefs: UserPreferences) => void) => {
  if (!targetId || !auth.currentUser) return () => {};
  return onSnapshot(doc(db, "preferences", targetId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserPreferences);
    }
  }, (err) => {
    console.warn("Preferences subscription restricted:", err);
  });
};

export const saveHistory = async (result: AnalysisResult) => {
  if (!auth.currentUser) return;
  try {
    const historyData = sanitize(result);
    delete historyData.id;
    await addDoc(collection(db, "history"), historyData);
  } catch (err) {
    console.error("Firestore saveHistory error:", err);
  }
};

export const getHistory = async (targetId: string): Promise<AnalysisResult[]> => {
  if (!targetId || !auth.currentUser) return [];
  try {
    const q = query(collection(db, "history"), where("userId", "==", targetId), limit(50));
    const snap = await getDocs(q);
    const results = snap.docs.map(d => ({ ...d.data(), id: d.id } as AnalysisResult));
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) { 
    console.error("Firestore getHistory error:", err);
    return []; 
  }
};
