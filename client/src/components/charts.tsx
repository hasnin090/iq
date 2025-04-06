import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { 
  getFinancialSummaryOptions, 
  createFinancialSummaryData,
  getExpenseDistributionOptions,
  createExpenseDistributionData
} from '@/lib/chart-utils';

interface ChartsProps {
  income: number;
  expenses: number;
  profit: number;
  displayMode?: 'admin' | 'projects';
}

export function Charts({ income, expenses, profit, displayMode = 'admin' }: ChartsProps) {
  const financialChartRef = useRef<HTMLCanvasElement>(null);
  const expenseChartRef = useRef<HTMLCanvasElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const userString = localStorage.getItem("auth_user");
    if (!userString) return;
    try {
      const user = JSON.parse(userString);
      setIsAdmin(user.role === 'admin');
      console.log("Charts - User role from localStorage:", user.role);
    } catch (e) {
      console.error("Charts - Error parsing user data:", e);
      setIsAdmin(false);
    }
  }, []);
  
  useEffect(() => {
    // تحديد إذا كان العرض الحالي هو الصندوق الرئيسي أم المشاريع للاستخدام في الرسوم البيانية
    const isAdminView = displayMode === 'admin';
    
    // تخزين مرجع للمخططات لاستخدامها في التنظيف
    let chartInstances: Chart[] = [];
    
    // إنشاء وتحديث المخططات
    const createOrUpdateCharts = () => {
      // تدمير المخططات القديمة أولاً إذا وجدت
      chartInstances.forEach(chart => {
        chart.destroy();
      });
      chartInstances = [];
      
      // إنشاء مخطط الملخص المالي
      if (financialChartRef.current) {
        const ctx = financialChartRef.current.getContext('2d');
        if (ctx) {
          // إنشاء مخطط جديد
          const financialChart = new Chart(ctx, {
            type: 'bar',
            data: createFinancialSummaryData(income, expenses, profit),
            options: getFinancialSummaryOptions()
          });
          chartInstances.push(financialChart);
        }
      }
      
      // إنشاء مخطط توزيع المصروفات
      if (expenseChartRef.current) {
        const ctx = expenseChartRef.current.getContext('2d');
        if (ctx) {
          // إنشاء مخطط جديد
          const expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: createExpenseDistributionData(
              ['رواتب', 'مشتريات', 'خدمات', 'إيجار', 'أخرى'],
              [expenses * 0.4, expenses * 0.25, expenses * 0.15, expenses * 0.1, expenses * 0.1]
            ),
            options: getExpenseDistributionOptions()
          });
          chartInstances.push(expenseChart);
        }
      }
    };
    
    // إنشاء المخططات مباشرة
    createOrUpdateCharts();
    
    // إضافة مستمع لتحديث المخططات عند تغيير وضع السمة (مظلم/فاتح)
    const themeChangeHandler = () => {
      createOrUpdateCharts();
    };
    
    // إضافة مستمع للمحتوى الجذري لمراقبة تغييرات السمة
    document.documentElement.addEventListener('classChange', themeChangeHandler);
    
    // تنظيف عند فك تركيب المكون
    return () => {
      // تدمير جميع المخططات
      chartInstances.forEach(chart => {
        chart.destroy();
      });
      
      // إزالة مستمع التغيير
      document.documentElement.removeEventListener('classChange', themeChangeHandler);
    };
  }, [income, expenses, profit, displayMode]);
  
  // تحديد إذا كان العرض الحالي هو الصندوق الرئيسي أم المشاريع
  // للمستخدمين العاديين، دائمًا يكون العرض هو "المشاريع" بغض النظر عن قيمة displayMode
  const isShowingAdmin = isAdmin ? displayMode === 'admin' : false;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mt-4 sm:mt-5 md:mt-6">
      <div className={`rounded-xl shadow-card p-6 ${
        isShowingAdmin 
          ? 'bg-blue-50/50 border border-blue-100' 
          : 'bg-green-50/50 border border-green-100'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${
          isShowingAdmin ? 'text-blue-700' : 'text-green-700'
        }`}>
          {isShowingAdmin 
            ? 'ملخص الصندوق الرئيسي' 
            : 'ملخص أموال المشاريع'
          }
        </h3>
        <div className="h-64">
          <canvas ref={financialChartRef}></canvas>
        </div>
      </div>
      
      <div className={`rounded-xl shadow-card p-6 ${
        isShowingAdmin 
          ? 'bg-blue-50/50 border border-blue-100' 
          : 'bg-green-50/50 border border-green-100'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${
          isShowingAdmin ? 'text-blue-700' : 'text-green-700'
        }`}>
          {isShowingAdmin 
            ? 'توزيع مصروفات الصندوق الرئيسي' 
            : 'توزيع مصروفات المشاريع'
          }
        </h3>
        <div className="h-64">
          <canvas ref={expenseChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
