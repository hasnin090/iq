import { useEffect, useRef } from 'react';
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
}

export function Charts({ income, expenses, profit }: ChartsProps) {
  const financialChartRef = useRef<HTMLCanvasElement>(null);
  const expenseChartRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    let financialChart: Chart | null = null;
    let expenseChart: Chart | null = null;
    
    // Create the financial summary chart
    if (financialChartRef.current) {
      const ctx = financialChartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if it exists
        if (financialChart) {
          financialChart.destroy();
        }
        
        // Create new chart
        financialChart = new Chart(ctx, {
          type: 'bar',
          data: createFinancialSummaryData(income, expenses, profit),
          options: getFinancialSummaryOptions()
        });
      }
    }
    
    // Create the expense distribution chart
    if (expenseChartRef.current) {
      const ctx = expenseChartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if it exists
        if (expenseChart) {
          expenseChart.destroy();
        }
        
        // Create new chart
        expenseChart = new Chart(ctx, {
          type: 'doughnut',
          data: createExpenseDistributionData(
            ['رواتب', 'مشتريات', 'خدمات', 'إيجار', 'أخرى'],
            [expenses * 0.4, expenses * 0.25, expenses * 0.15, expenses * 0.1, expenses * 0.1]
          ),
          options: getExpenseDistributionOptions()
        });
      }
    }
    
    // Cleanup on component unmount
    return () => {
      if (financialChart) {
        financialChart.destroy();
      }
      if (expenseChart) {
        expenseChart.destroy();
      }
    };
  }, [income, expenses, profit]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-secondary-light rounded-xl shadow-card p-6">
        <h3 className="text-lg font-bold text-primary-light mb-4">ملخص الوضع المالي</h3>
        <div className="h-64">
          <canvas ref={financialChartRef}></canvas>
        </div>
      </div>
      
      <div className="bg-secondary-light rounded-xl shadow-card p-6">
        <h3 className="text-lg font-bold text-primary-light mb-4">توزيع المصروفات</h3>
        <div className="h-64">
          <canvas ref={expenseChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
