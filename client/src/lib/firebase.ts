import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// تهيئة تطبيق Firebase
const app = initializeApp(firebaseConfig);

// الحصول على خدمة المصادقة
const auth = getAuth(app);

// الحصول على خدمة التخزين
const storage = getStorage(app);

// إنشاء مزود المصادقة لجوجل
const googleProvider = new GoogleAuthProvider();

// وظيفة تسجيل الدخول بواسطة جوجل
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

// تصدير الكائنات المطلوبة
export { app, auth, storage };