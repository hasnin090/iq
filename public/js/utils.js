/**
 * نظام المحاسبة المتقدم - الدوال المساعدة
 * Arabic Accounting System - Utility Functions
 */

// ====================================
// دوال التنسيق
// ====================================
const formatUtils = {
    // تنسيق العملة
    currency(amount, currency = 'IQD') {
        const numberFormat = new Intl.NumberFormat('ar-IQ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return numberFormat.format(amount) + ' دينار عراقي';
    },

    // تنسيق الأرقام
    number(num, decimals = 0) {
        return new Intl.NumberFormat('ar-IQ', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    // تنسيق التاريخ
    date(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const finalOptions = { ...defaultOptions, ...options };
        return new Intl.DateTimeFormat('ar-IQ', finalOptions).format(new Date(date));
    },

    // تنسيق الوقت
    time(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };
        const finalOptions = { ...defaultOptions, ...options };
        return new Intl.DateTimeFormat('ar-IQ', finalOptions).format(new Date(date));
    },

    // تنسيق التاريخ والوقت
    datetime(date) {
        return `${this.date(date)} - ${this.time(date)}`;
    },

    // تنسيق حجم الملف
    fileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        
        const k = 1024;
        const sizes = ['بايت', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// ====================================
// دوال التحقق من صحة البيانات
// ====================================
const validationUtils = {
    // التحقق من البريد الإلكتروني
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // التحقق من رقم الهاتف العراقي
    phone(phone) {
        const regex = /^(\+964|964|0)?7[0-9]{9}$/;
        return regex.test(phone);
    },

    // التحقق من كلمة المرور
    password(password) {
        return password && password.length >= 6;
    },

    // التحقق من الأرقام
    number(value) {
        return !isNaN(value) && isFinite(value);
    },

    // التحقق من النص المطلوب
    required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    // التحقق من التاريخ
    date(date) {
        return date instanceof Date && !isNaN(date);
    },

    // التحقق من امتداد الملف
    fileExtension(filename, allowedExtensions) {
        const extension = filename.split('.').pop().toLowerCase();
        return allowedExtensions.includes(extension);
    }
};

// ====================================
// دوال التلاعب بـ DOM
// ====================================
const domUtils = {
    // إنشاء عنصر HTML
    createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },

    // البحث عن عنصر
    find(selector) {
        return document.querySelector(selector);
    },

    // البحث عن عدة عناصر
    findAll(selector) {
        return document.querySelectorAll(selector);
    },

    // إضافة فئة CSS
    addClass(element, className) {
        if (element) element.classList.add(className);
    },

    // إزالة فئة CSS
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },

    // تبديل فئة CSS
    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    },

    // إظهار عنصر
    show(element) {
        if (element) {
            element.style.display = 'block';
            element.classList.remove('hidden');
        }
    },

    // إخفاء عنصر
    hide(element) {
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    },

    // تفريغ محتوى عنصر
    empty(element) {
        if (element) element.innerHTML = '';
    }
};

// ====================================
// دوال التخزين المحلي
// ====================================
const storageUtils = {
    // حفظ في localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    },

    // استرجاع من localStorage
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return defaultValue;
        }
    },

    // حذف من localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('خطأ في حذف البيانات:', error);
            return false;
        }
    },

    // مسح جميع البيانات
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('خطأ في مسح البيانات:', error);
            return false;
        }
    }
};

// ====================================
// دوال الملفات
// ====================================
const fileUtils = {
    // قراءة ملف كـ Text
    readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    // قراءة ملف كـ DataURL
    readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // تحميل ملف
    download(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // تحويل Base64 إلى Blob
    base64ToBlob(base64, contentType = '') {
        const byteCharacters = atob(base64);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        return new Blob(byteArrays, { type: contentType });
    }
};

// ====================================
// دوال النسخ والطباعة
// ====================================
const exportUtils = {
    // تصدير PDF
    async toPDF(element, filename = 'document.pdf') {
        if (typeof html2pdf === 'undefined') {
            throw new Error('مكتبة html2pdf غير محملة');
        }
        
        const options = {
            margin: 1,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        return html2pdf().from(element).set(options).save();
    },

    // تصدير Excel
    toExcel(data, filename = 'data.xlsx') {
        if (typeof XLSX === 'undefined') {
            throw new Error('مكتبة XLSX غير محملة');
        }
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
        XLSX.writeFile(workbook, filename);
    },

    // طباعة
    print(element) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>طباعة</title>
                    <link rel="stylesheet" href="/css/main.css">
                    <link rel="stylesheet" href="/css/components.css">
                    <style>
                        body { font-family: 'Cairo', sans-serif; direction: rtl; }
                        @media print { .no-print { display: none !important; } }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    ${element.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
    }
};

// ====================================
// دوال الرسوم البيانية
// ====================================
const chartUtils = {
    // ألوان افتراضية
    colors: [
        '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ],

    // إنشاء رسم بياني دائري
    createPieChart(canvas, data, options = {}) {
        if (typeof Chart === 'undefined') {
            throw new Error('مكتبة Chart.js غير محملة');
        }
        
        const defaultOptions = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    rtl: true
                }
            }
        };
        
        return new Chart(canvas, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.colors
                }]
            },
            options: { ...defaultOptions, ...options }
        });
    },

    // إنشاء رسم بياني شريطي
    createBarChart(canvas, data, options = {}) {
        if (typeof Chart === 'undefined') {
            throw new Error('مكتبة Chart.js غير محملة');
        }
        
        const defaultOptions = {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };
        
        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label || 'البيانات',
                    data: data.values,
                    backgroundColor: this.colors[0]
                }]
            },
            options: { ...defaultOptions, ...options }
        });
    }
};

// ====================================
// دوال مساعدة عامة
// ====================================
const generalUtils = {
    // تأخير تنفيذ دالة
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // نسخ نص إلى الحافظة
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('فشل في النسخ:', error);
            return false;
        }
    },

    // توليد معرف فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // تحويل النص لـ URL صديق
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    },

    // فحص إذا كان الجهاز موبايل
    isMobile() {
        return window.innerWidth <= 768;
    },

    // فحص إذا كان المتصفح يدعم ميزة
    supportsFeature(feature) {
        return feature in window;
    }
};

// ====================================
// تصدير الدوال للاستخدام العام
// ====================================
window.Utils = {
    format: formatUtils,
    validation: validationUtils,
    dom: domUtils,
    storage: storageUtils,
    file: fileUtils,
    export: exportUtils,
    chart: chartUtils,
    general: generalUtils
};