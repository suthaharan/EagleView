
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

// Replace these placeholders with your actual project keys from the Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "eagleview-app.firebaseapp.com",
  projectId: "eagleview-app",
  storageBucket: "eagleview-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Authentication Operations
export const signUpUser = async (email: string, pass: string, name: string, role: UserRole): Promise<User> => {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  const userData: User = {
    id: res.user.uid,
    email,
    name,
    role,
    assignedSeniors: role === UserRole.CAREGIVER ? [] : undefined
  };
  await saveUser(userData);
  return userData;
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  const data = await getUser(res.user.uid);
  if (!data) throw new Error("User profile not found.");
  return data as User;
};

export const logoutUser = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const data = await getUser(fbUser.uid);
      callback(data as User);
    } else {
      callback(null);
    }
  });
};

// Firestore Operations
export const saveUser = async (user: User) => {
  await setDoc(doc(db, "users", user.id), user, { merge: true });
};

export const getUser = async (userId: string) => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data() : null;
};

export const savePreferences = async (userId: string, prefs: UserPreferences) => {
  await setDoc(doc(db, "preferences", userId), prefs, { merge: true });
};

export const subscribeToPreferences = (userId: string, callback: (prefs: UserPreferences) => void) => {
  return onSnapshot(doc(db, "preferences", userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserPreferences);
    }
  });
};

export const saveHistory = async (result: AnalysisResult) => {
  await setDoc(doc(db, "history", result.id), result);
};

export const getHistory = async (userId: string): Promise<AnalysisResult[]> => {
  const q = query(
    collection(db, "history"), 
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AnalysisResult);
};

export const getSeniorsForCaregiver = async (seniorIds: string[]): Promise<User[]> => {
  if (seniorIds.length === 0) return [];
  const q = query(collection(db, "users"), where("id", "in", seniorIds));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as User);
};
