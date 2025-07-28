import React, { useState } from 'react';
import { User } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // يمكن إضافة حفظ في localStorage لاحقاً
    console.log('تم تسجيل الدخول:', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // يمكن إضافة حذف من localStorage لاحقاً
    console.log('تم تسجيل الخروج');
  };

  // عرض صفحة تسجيل الدخول إذا لم يكن المستخدم مسجلاً
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // عرض لوحة التحكم إذا كان المستخدم مسجلاً
  return <Dashboard user={currentUser} onLogout={handleLogout} />;
};

export default App;
