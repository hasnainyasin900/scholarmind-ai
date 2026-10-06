import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gps-camera-496511",
  appId: "1:346550685258:web:662bf90e7bbcd470a060b3",
  apiKey: "AIzaSyCXKQ-sZscxyKu8E_kelB0S0_72uKjm8sM",
  authDomain: "gps-camera-496511.firebaseapp.com",
  storageBucket: "gps-camera-496511.firebasestorage.app",
  messagingSenderId: "346550685258",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-scholarmind-fc2f5d1e-9a56-409a-b25a-761f9e999128");
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        // ensure user is created in firestore
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            createdAt: new Date().toISOString()
        }, { merge: true });
        return result.user;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const loginWithEmail = async (email: string, pass: string) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            name: name,
            createdAt: new Date().toISOString()
        }, { merge: true });
        return result.user;
    } catch (error) {
        console.error("Registration failed", error);
        throw error;
    }
};

export const logout = () => signOut(auth);
