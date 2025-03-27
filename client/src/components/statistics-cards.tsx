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
              <i className="fas fa-wallet text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">إجمالي الإيرادات</p>
              <p className="text-xl font-bold text-green-600" id="totalIncome">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <i className="fas fa-hand-holding-usd text-green-600 text-lg"></i>
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
              <p className="text-gray-600 text-sm mb-1">إجمالي المصروفات</p>
              <p className="text-xl font-bold text-red-600" id="totalExpenses">
                {formatCurrency(expenses)}
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <i className="fas fa-file-invoice-dollar text-red-600 text-lg"></i>
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
              <p className="text-gray-600 text-sm mb-1">صافي الربح</p>
              <p className="text-xl font-bold text-blue-600" id="netProfit">
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <i className="fas fa-chart-line text-blue-600 text-lg"></i>
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
