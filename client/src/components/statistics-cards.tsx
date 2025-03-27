import { formatCurrency } from '@/lib/chart-utils';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface StatisticsCardsProps {
  income: number;
  expenses: number;
  profit: number;
  adminFundBalance?: number;
  displayMode?: 'admin' | 'projects';
}

export function StatisticsCards({ income, expenses, profit, adminFundBalance, displayMode = 'admin' }: StatisticsCardsProps) {
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

  // تحديد إذا كان العرض الحالي يعرض صندوق المدير أم المشاريع
  const isShowingAdmin = displayMode === 'admin';

  return (
    <div className="space-y-6">
      {/* بطاقة صندوق المدير (تظهر فقط للمدير وفي وضع الصندوق الرئيسي) */}
      {isAdmin && isShowingAdmin && (
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
      
      {/* بطاقة عرض المشاريع (تظهر فقط للمدير وفي وضع المشاريع) */}
      {isAdmin && !isShowingAdmin && (
        <div className="bg-gradient-to-l from-green-700 to-green-900 rounded-xl shadow-xl overflow-hidden relative">
          <div className="p-5 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-white text-lg font-bold mb-2">المشاريع النشطة</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">
                  أرصدة المشاريع
                </p>
                <span className="text-white text-lg opacity-90">
                  {formatCurrency(income - expenses)}
                </span>
              </div>
              <p className="text-sm text-green-100 mt-2">
                إجمالي أرصدة المشاريع الإدارية
              </p>
            </div>
            <div className="bg-white p-4 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-green-400 to-green-600"></div>
        </div>
      )}
      
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl shadow-md p-5 overflow-hidden relative ${
          isShowingAdmin 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200' 
            : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-800 text-lg font-bold mb-3">إجمالي الإيرادات</h3>
              <p className={`text-3xl font-bold ${isShowingAdmin ? 'text-green-600' : 'text-blue-600'}`} id="totalIncome">
                {formatCurrency(income)}
              </p>
            </div>
            <div className={`${isShowingAdmin ? 'bg-green-100' : 'bg-blue-100'} p-4 rounded-lg shadow-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isShowingAdmin ? 'text-green-600' : 'text-blue-600'}`}>
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          </div>
          <div className={`w-full h-2 ${isShowingAdmin ? 'bg-green-100' : 'bg-blue-100'} rounded-full mt-5 mb-3`}>
            <div 
              className={`h-2 ${isShowingAdmin ? 'bg-green-600' : 'bg-blue-600'} rounded-full`}
              style={{ width: income > 0 ? '75%' : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {isShowingAdmin 
              ? 'إجمالي إيرادات الصندوق الرئيسي' 
              : 'إجمالي إيرادات المشاريع'
            }
          </p>
        </div>
        
        <div className={`rounded-xl shadow-md p-5 overflow-hidden relative ${
          isShowingAdmin 
            ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200' 
            : 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-800 text-lg font-bold mb-3">إجمالي المصروفات</h3>
              <p className={`text-3xl font-bold ${isShowingAdmin ? 'text-red-600' : 'text-orange-600'}`} id="totalExpenses">
                {formatCurrency(expenses)}
              </p>
            </div>
            <div className={`${isShowingAdmin ? 'bg-red-100' : 'bg-orange-100'} p-4 rounded-lg shadow-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isShowingAdmin ? 'text-red-600' : 'text-orange-600'}`}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
          </div>
          <div className={`w-full h-2 ${isShowingAdmin ? 'bg-red-100' : 'bg-orange-100'} rounded-full mt-5 mb-3`}>
            <div 
              className={`h-2 ${isShowingAdmin ? 'bg-red-600' : 'bg-orange-600'} rounded-full`}
              style={{ width: expenses > 0 ? '60%' : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {isShowingAdmin 
              ? 'إجمالي مصروفات الصندوق الرئيسي' 
              : 'إجمالي مصروفات المشاريع'
            }
          </p>
        </div>
        
        <div className={`rounded-xl shadow-md p-5 overflow-hidden relative ${
          isShowingAdmin 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' 
            : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-800 text-lg font-bold mb-3">صافي الربح</h3>
              <p className={`text-3xl font-bold ${isShowingAdmin ? 'text-blue-600' : 'text-purple-600'}`} id="netProfit">
                {formatCurrency(profit)}
              </p>
            </div>
            <div className={`${isShowingAdmin ? 'bg-blue-100' : 'bg-purple-100'} p-4 rounded-lg shadow-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isShowingAdmin ? 'text-blue-600' : 'text-purple-600'}`}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
          </div>
          <div className={`w-full h-2 ${isShowingAdmin ? 'bg-blue-100' : 'bg-purple-100'} rounded-full mt-5 mb-3`}>
            <div 
              className={`h-2 ${isShowingAdmin ? 'bg-blue-600' : 'bg-purple-600'} rounded-full`}
              style={{ width: profit > 0 ? '45%' : '0%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {isShowingAdmin 
              ? 'الفرق بين إيرادات ومصروفات الصندوق الرئيسي' 
              : 'الفرق بين إيرادات ومصروفات المشاريع'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
