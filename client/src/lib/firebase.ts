import { initializeApp, FirebaseApp, getApps, FirebaseOptions } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User,
  Auth
} from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// التحقق من وجود مفاتيح Firebase في متغيرات البيئة
const checkRequiredEnvs = () => {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  for (const key of requiredKeys) {
    if (!import.meta.env[key]) {
      console.log(`Firebase مُعطل - النظام يعمل محلياً بدون Firebase`);
      return false;
    }
  }
  
  return true;
};

// تكوين Firebase - تعطيل Firebase عند عدم وجود مفاتيح صالحة
const firebaseConfig: FirebaseOptions | null = (() => {
  // التحقق من وجود مفاتيح صالحة
  if (!checkRequiredEnvs()) {
    console.log("Firebase غير مُفعل - لا توجد مفاتيح API صالحة");
    return null;
  }
  
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
})();

// تعريف المتغيرات باستخدام أنواع محددة
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

// تعطيل Firebase بالكامل للتشغيل المحلي
console.log("النظام يعمل بالتخزين المحلي - Firebase معطل");

// وظيفة تسجيل الدخول بواسطة جوجل
export const signInWithGoogle = (): Promise<never> | void => {
  if (auth && googleProvider) {
    return signInWithRedirect(auth, googleProvider);
  } else {
    console.error("Firebase auth or provider not initialized");
    throw new Error("Firebase is not properly initialized");
  }
};

// تصدير الكائنات المطلوبة
export { app, auth, storage, analytics, db };