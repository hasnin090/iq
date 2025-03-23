import { formatCurrency } from '@/lib/chart-utils';

interface StatisticsCardsProps {
  income: number;
  expenses: number;
  profit: number;
}

export function StatisticsCards({ income, expenses, profit }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          إجمالي الإيرادات لجميع المشاريع
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
          إجمالي المصروفات لجميع المشاريع
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
          الفرق بين الإيرادات والمصروفات
        </p>
      </div>
    </div>
  );
}
