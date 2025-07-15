import React from 'react';
import PermissionSystemTest from './components/PermissionSystemTest';

// 🚀 تطبيق اختبار نظام الصلاحيات
// ==================================

function TestApp() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto">
        <PermissionSystemTest />
      </div>
    </div>
  );
}

export default TestApp;
