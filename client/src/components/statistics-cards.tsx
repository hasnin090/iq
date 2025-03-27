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
    <div className="space-y-4">
      {isAdmin && (
        <div className="bg-gradient-to-l from-blue-600 to-blue-800 rounded-xl shadow-lg overflow-hidden relative">
          <div className="p-4 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-white text-base font-bold mb-1">رصيد صندوق المدير</h3>
              <p className="text-2xl font-bold text-white" id="adminFundBalance">
                {formatCurrency(adminFundBalance || 0)}
              </p>
              <p className="text-xs text-blue-100 mt-1">
                الرصيد المتاح في الصندوق الرئيسي للمدير
              </p>
            </div>
            <div className="bg-white p-3 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M3 5H21"></path>
                <path d="M3 9H21"></path>
                <path d="M3 5V19c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5c-1.1 0-2 .9-2 2z"></path>
                <path d="M9 11h6"></path>
                <path d="M9 15h6"></path>
              </svg>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-700 text-sm font-semibold mb-1">إجمالي الإيرادات</h3>
              <p className="text-xl font-bold text-green-600" id="totalIncome">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="w-full h-1 bg-green-100 rounded-full mt-3 mb-1">
            <div 
              className="h-1 bg-green-600 rounded-full" 
              style={{ width: income > 0 ? '75%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {isAdmin ? 'إجمالي إيراد صندوق المدير' : 'إجمالي الإيرادات للمشاريع المعينة لك'}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-700 text-sm font-semibold mb-1">إجمالي المصروفات</h3>
              <p className="text-xl font-bold text-red-600" id="totalExpenses">
                {formatCurrency(expenses)}
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="w-full h-1 bg-red-100 rounded-full mt-3 mb-1">
            <div 
              className="h-1 bg-red-600 rounded-full" 
              style={{ width: expenses > 0 ? '60%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {isAdmin ? 'إجمالي مصروفات صندوق المدير' : 'إجمالي المصروفات للمشاريع المعينة لك'}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-700 text-sm font-semibold mb-1">صافي الربح</h3>
              <p className="text-xl font-bold text-blue-600" id="netProfit">
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
          <div className="w-full h-1 bg-blue-100 rounded-full mt-3 mb-1">
            <div 
              className="h-1 bg-blue-600 rounded-full" 
              style={{ width: profit > 0 ? '45%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {isAdmin ? 'الفرق بين إيرادات ومصروفات صندوق المدير' : 'الفرق بين الإيرادات والمصروفات للمشاريع المعينة لك'}
          </p>
        </div>
      </div>
    </div>
  );
}
