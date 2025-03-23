import { ChartData, ChartOptions } from 'chart.js';

// Financial summary chart options
export const getFinancialSummaryOptions = (): ChartOptions<'bar'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Cairo',
          },
          color: '#E0E1DD',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(13, 27, 42, 0.8)',
        titleFont: {
          family: 'Cairo',
          size: 14,
        },
        bodyFont: {
          family: 'Cairo',
          size: 12,
        },
        padding: 10,
        boxPadding: 5
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          font: {
            family: 'Cairo',
          },
          color: '#B0BEC5',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          font: {
            family: 'Cairo',
          },
          color: '#B0BEC5',
        },
      },
    },
  };
};

// Financial summary chart data
export const createFinancialSummaryData = (
  income: number,
  expenses: number,
  profit: number
): ChartData<'bar'> => {
  return {
    labels: ['الإيرادات', 'المصروفات', 'صافي الربح'],
    datasets: [
      {
        label: 'البيانات المالية (د.ع)',
        data: [income, expenses, profit],
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(231, 76, 60, 0.8)',
          'rgba(46, 204, 113, 0.8)',
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(231, 76, 60, 1)',
          'rgba(46, 204, 113, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

// Expense distribution chart options
export const getExpenseDistributionOptions = (): ChartOptions<'doughnut'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Cairo',
          },
          color: '#E0E1DD',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(13, 27, 42, 0.8)',
        titleFont: {
          family: 'Cairo',
          size: 14,
        },
        bodyFont: {
          family: 'Cairo',
          size: 12,
        },
        padding: 10,
        boxPadding: 5
      },
    },
  };
};

// Expense distribution chart data
export const createExpenseDistributionData = (
  categories: string[],
  amounts: number[]
): ChartData<'doughnut'> => {
  return {
    labels: categories,
    datasets: [
      {
        label: 'المصروفات حسب الفئة',
        data: amounts,
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(231, 76, 60, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(241, 196, 15, 0.8)',
          'rgba(155, 89, 182, 0.8)',
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(231, 76, 60, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(241, 196, 15, 1)',
          'rgba(155, 89, 182, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' د.ع';
};
