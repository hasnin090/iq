import { initializeApp, FirebaseApp, getApps } from "firebase/app";
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

// التحقق من وجود مفاتيح Firebase في متغيرات البيئة
const checkRequiredEnvs = () => {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  for (const key of requiredKeys) {
    if (!import.meta.env[key]) {
      console.error(`مفتاح Firebase مفقود: ${key}`);
      return false;
    }
  }
  
  return true;
};

// تكوين Firebase باستخدام المتغيرات البيئية
const firebaseConfig = (() => {
  if (!checkRequiredEnvs()) {
    console.error("بعض مفاتيح Firebase مفقودة. استخدام التكوين الاحتياطي للتطوير فقط.");
  }
  
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
})();

// تعريف المتغيرات باستخدام أنواع محددة
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

try {
  // التحقق مما إذا كان التطبيق مهيأ بالفعل لتجنب التهيئة المزدوجة
  if (getApps().length === 0) {
    // تهيئة تطبيق Firebase إذا لم يكن مهيأ بالفعل
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    // استخدام التطبيق المهيأ بالفعل
    app = getApps()[0];
    console.log("Using existing Firebase app");
  }

  // الحصول على خدمة المصادقة
  auth = getAuth(app);

  // الحصول على خدمة التخزين
  storage = getStorage(app);

  // إنشاء مزود المصادقة لجوجل
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Firebase initialization failed");
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