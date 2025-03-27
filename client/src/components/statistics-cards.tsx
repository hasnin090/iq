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
    <>
      {isAdmin && (
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 overflow-hidden relative">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-white text-lg font-bold mb-1">رصيد صندوق المدير</h3>
              <p className="text-3xl font-bold text-white" id="adminFundBalance">
                {formatCurrency(adminFundBalance || 0)}
              </p>
              <p className="text-xs text-blue-100 mt-2">
                الرصيد المتاح حالياً في الصندوق الرئيسي للمدير
              </p>
            </div>
            <div className="bg-white p-4 rounded-full shadow-md">
              <i className="fas fa-wallet text-blue-600 text-2xl"></i>
            </div>
          </div>
        </div>
      )}
      
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-3'} gap-6`}>
        <div className="bg-secondary-light rounded-xl shadow-card p-6 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-DEFAULT text-sm mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-primary-light" id="totalIncome">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="bg-primary bg-opacity-20 p-3 rounded-lg">
              <i className="fas fa-hand-holding-usd text-primary-light text-xl"></i>
            </div>
          </div>
          <div className="w-full h-1 bg-primary-light bg-opacity-30 rounded-full mt-4 mb-2">
            <div 
              className="h-1 bg-primary-light rounded-full" 
              style={{ width: income > 0 ? '75%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-neutral-DEFAULT">
            {isAdmin ? 'إجمالي إيراد صندوق المدير' : 'إجمالي الإيرادات للمشاريع المعينة لك'}
          </p>
        </div>
        
        <div className="bg-secondary-light rounded-xl shadow-card p-6 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-DEFAULT text-sm mb-1">إجمالي المصروفات</p>
              <p className="text-2xl font-bold text-destructive" id="totalExpenses">
                {formatCurrency(expenses)}
              </p>
            </div>
            <div className="bg-destructive bg-opacity-20 p-3 rounded-lg">
              <i className="fas fa-file-invoice-dollar text-destructive text-xl"></i>
            </div>
          </div>
          <div className="w-full h-1 bg-destructive bg-opacity-30 rounded-full mt-4 mb-2">
            <div 
              className="h-1 bg-destructive rounded-full" 
              style={{ width: expenses > 0 ? '60%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-neutral-DEFAULT">
            {isAdmin ? 'إجمالي مصروفات صندوق المدير' : 'إجمالي المصروفات للمشاريع المعينة لك'}
          </p>
        </div>
        
        <div className="bg-secondary-light rounded-xl shadow-card p-6 overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-DEFAULT text-sm mb-1">صافي الربح</p>
              <p className="text-2xl font-bold text-success" id="netProfit">
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="bg-success bg-opacity-20 p-3 rounded-lg">
              <i className="fas fa-chart-line text-success text-xl"></i>
            </div>
          </div>
          <div className="w-full h-1 bg-success bg-opacity-30 rounded-full mt-4 mb-2">
            <div 
              className="h-1 bg-success rounded-full" 
              style={{ width: profit > 0 ? '45%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-neutral-DEFAULT">
            {isAdmin ? 'الفرق بين إيرادات ومصروفات صندوق المدير' : 'الفرق بين الإيرادات والمصروفات للمشاريع المعينة لك'}
          </p>
        </div>
      </div>
    </>
  );
}
