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

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLJb_pYS00-9VMPE9nnH5WyTKv18UGlcA",
  authDomain: "grokapp-5e120.firebaseapp.com",
  projectId: "grokapp-5e120",
  storageBucket: "grokapp-5e120.appspot.com",
  messagingSenderId: "846888480997",
  appId: "1:846888480997:web:971ec7fa47b901e27b640c",
  measurementId: "G-GS4CWFRC9Q"
};

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