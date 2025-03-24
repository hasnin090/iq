import { initializeApp, FirebaseApp } from "firebase/app";
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

// تعريف المتغيرات باستخدام أنواع محددة
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let googleProvider: GoogleAuthProvider | undefined;

try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // تهيئة تطبيق Firebase
  app = initializeApp(firebaseConfig);

  // الحصول على خدمة المصادقة
  auth = getAuth(app);

  // الحصول على خدمة التخزين
  storage = getStorage(app);

  // إنشاء مزود المصادقة لجوجل
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase initialization error:", error);
}

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
export { app, auth, storage };