import { formatCurrency } from '@/lib/chart-utils';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface StatisticsCardsProps {
  income: number;
  expenses: number;
  profit: number;
  adminFundBalance?: number;
}

export function StatisticsCards({ income, expenses, profit, adminFundBalance }: StatisticsCardsProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) return;
    try {
      const user = JSON.parse(userString);
      setIsAdmin(user.role === 'admin');
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-gradient-to-l from-blue-700 to-blue-900 rounded-xl shadow-xl overflow-hidden relative">
          <div className="p-5 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-white text-lg font-bold mb-2">رصيد صندوق المدير</h3>
              <p className="text-3xl font-bold text-white" id="adminFundBalance">
                {formatCurrency(adminFundBalance || 0)}
              </p>
              <p className="text-sm text-blue-100 mt-2">
                الرصيد المتاح في الصندوق الرئيسي للمدير
              </p>
            </div>
            <div className="bg-white p-4 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                <path d="M3 5H21"></path>
                <path d="M3 9H21"></path>
                <path d="M3 5V19c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5c-1.1 0-2 .9-2 2z"></path>
                <path d="M9 11h6"></path>
                <path d="M9 15h6"></path>
              </svg>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-blue-400 to-blue-600"></div>
        </div>
      )}
      
      {/* تعديل حجم بطاقات الإحصائيات لتكون أكبر بعد إزالة أرصدة المشاريع */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl shadow-md p-5 overflow-hidden relative ${isAdmin ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200' : 'bg-white border border-gray-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-800 text-lg font-bold mb-3">إجمالي الإيرادات</h3>
              <p className="text-3xl font-bold text-green-600" id="totalIncome">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="w-full h-2 bg-green-100 rounded-full mt-5 mb-3">
            <div 
              className="h-2 bg-green-600 rounded-full" 
              style={{ width: income > 0 ? '75%' : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {isAdmin ? 'إجمالي إيرادات صندوق المدير' : 'إجمالي الإيرادات للمشاريع المعينة لك'}
          </p>
        </div>
        
        <div className={`rounded-xl shadow-md p-5 overflow-hidden relative ${isAdmin ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200' : 'bg-white border border-gray-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-800 text-lg font-bold mb-3">إجمالي المصروفات</h3>
              <p className="text-3xl font-bold text-red-600" id="totalExpenses">
                {formatCurrency(expenses)}
              </p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="w-full h-2 bg-red-100 rounded-full mt-5 mb-3">
            <div 
              className="h-2 bg-red-600 rounded-full" 
              style={{ width: expenses > 0 ? '60%' : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {isAdmin ? 'إجمالي مصروفات صندوق المدير' : 'إجمالي المصروفات للمشاريع المعينة لك'}
          </p>
        </div>
        
        <div className={`rounded-xl shadow-md p-5 overflow-hidden relative ${isAdmin ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' : 'bg-white border border-gray-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-800 text-lg font-bold mb-3">صافي الربح</h3>
              <p className="text-3xl font-bold text-blue-600" id="netProfit">
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full mt-5 mb-3">
            <div 
              className="h-2 bg-blue-600 rounded-full" 
              style={{ width: profit > 0 ? '45%' : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {isAdmin ? 'الفرق بين إيرادات ومصروفات صندوق المدير' : 'الفرق بين الإيرادات والمصروفات للمشاريع المعينة لك'}
          </p>
        </div>
      </div>
    </div>
  );
}
