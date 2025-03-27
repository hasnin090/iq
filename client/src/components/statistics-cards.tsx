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
  const isAdmin = useState(() => {
    const userString = localStorage.getItem("user");
    if (!userString) return false;
    try {
      const user = JSON.parse(userString);
      return user.role === 'admin';
    } catch (e) {
      return false;
    }
  })[0];

  return (
    <div className={`grid grid-cols-1 ${isAdmin ? 'xl:grid-cols-4' : 'md:grid-cols-3'} md:grid-cols-2 gap-6`}>
      {isAdmin && (
        <div className="bg-secondary-light rounded-xl shadow-card p-6 overflow-hidden relative order-first md:order-last">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-DEFAULT text-sm mb-1">رصيد صندوق المدير</p>
              <p className="text-2xl font-bold text-blue-600" id="adminFundBalance">
                {formatCurrency(adminFundBalance || 0)}
              </p>
            </div>
            <div className="bg-blue-600 bg-opacity-20 p-3 rounded-lg">
              <i className="fas fa-wallet text-blue-600 text-xl"></i>
            </div>
          </div>
          <div className="w-full h-1 bg-blue-600 bg-opacity-30 rounded-full mt-4 mb-2">
            <div 
              className="h-1 bg-blue-600 rounded-full" 
              style={{ width: (adminFundBalance || 0) > 0 ? '85%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-neutral-DEFAULT">
            الرصيد الحالي في صندوق المدير
          </p>
        </div>
      )}
      
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
  );
}
