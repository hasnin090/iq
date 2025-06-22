/**
 * نظام المحاسبة المتقدم - الملف الرئيسي
 * Arabic Accounting System - Main JavaScript File
 * 
 * @version 1.0.0
 * @author Arabic Accounting Team
 */

// ====================================
// المتغيرات العامة
// ====================================
let currentUser = null;
let currentSection = 'dashboard';
let isLoading = false;
let transactions = [];
let projects = [];
let users = [];

// ====================================
// إعداد التطبيق عند التحميل
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تم تحميل نظام المحاسبة المتقدم');
    
    // إخفاء شاشة التحميل
    hideLoadingScreen();
    
    // تهيئة التطبيق
    initializeApp();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // فحص حالة تسجيل الدخول
    checkAuthenticationStatus();
});

// ====================================
// إخفاء شاشة التحميل
// ====================================
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

// ====================================
// تهيئة التطبيق
// ====================================
function initializeApp() {
    // إعداد التاريخ الافتراضي
    setDefaultDates();
    
    // تحديد الشاشة النشطة
    showSection(currentSection);
    
    // تحميل البيانات الأولية
    loadInitialData();
    
    // إعداد الشريط الجانبي
    setupSidebar();
    
    console.log('✅ تم تهيئة التطبيق بنجاح');
}

// ====================================
// إعداد مستمعي الأحداث
// ====================================
function setupEventListeners() {
    // أحداث الشريط الجانبي
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-item[data-section]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', handleSectionChange);
    });
    
    // زر تبديل الشريط الجانبي
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // نماذج الإرسال
    setupFormSubmissions();
    
    // أحداث التصفية والبحث
    setupFiltersAndSearch();
    
    // أحداث التصدير والطباعة
    setupExportEvents();
    
    // أحداث لوحة المفاتيح
    setupKeyboardShortcuts();
    
    console.log('✅ تم إعداد مستمعي الأحداث');
}

// ====================================
// التعامل مع تغيير الأقسام
// ====================================
function handleSectionChange(event) {
    event.preventDefault();
    
    const sectionName = event.currentTarget.dataset.section;
    if (sectionName && sectionName !== currentSection) {
        showSection(sectionName);
    }
}

// ====================================
// عرض قسم محدد
// ====================================
function showSection(sectionName) {
    // إخفاء جميع الأقسام
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // عرض القسم المطلوب
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // تحديث الشريط الجانبي
        updateSidebarActive(sectionName);
        
        // تحديث المتغير العام
        currentSection = sectionName;
        
        // تحميل بيانات القسم
        loadSectionData(sectionName);
        
        console.log(`📄 تم عرض قسم: ${sectionName}`);
    }
}

// ====================================
// تحديث الشريط الجانبي النشط
// ====================================
function updateSidebarActive(sectionName) {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-item');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionName) {
            link.classList.add('active');
        }
    });
}

// ====================================
// تبديل الشريط الجانبي
// ====================================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    
    if (sidebar && content) {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('sidebar-collapsed');
    }
}

// ====================================
// إعداد النماذج
// ====================================
function setupFormSubmissions() {
    // نموذج المعاملات
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
    
    // نموذج المشاريع
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }
    
    // نموذج المستخدمين
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // نموذج المستندات
    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        documentForm.addEventListener('submit', handleDocumentSubmit);
    }
}

// ====================================
// إعداد التصفية والبحث
// ====================================
function setupFiltersAndSearch() {
    // مربع البحث
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleSearch, 300));
    });
    
    // مرشحات المشاريع
    const projectFilters = document.querySelectorAll('.filter-project');
    projectFilters.forEach(filter => {
        filter.addEventListener('change', handleFilterChange);
    });
    
    // مرشحات المستخدمين
    const userFilters = document.querySelectorAll('.filter-user');
    userFilters.forEach(filter => {
        filter.addEventListener('change', handleFilterChange);
    });
    
    // مرشحات التاريخ
    const dateFilters = document.querySelectorAll('.filter-date');
    dateFilters.forEach(filter => {
        filter.addEventListener('change', handleFilterChange);
    });
}

// ====================================
// إعداد أحداث التصدير
// ====================================
function setupExportEvents() {
    // تصدير PDF
    const pdfButtons = document.querySelectorAll('.export-pdf');
    pdfButtons.forEach(button => {
        button.addEventListener('click', handlePDFExport);
    });
    
    // تصدير Excel
    const excelButtons = document.querySelectorAll('.export-excel');
    excelButtons.forEach(button => {
        button.addEventListener('click', handleExcelExport);
    });
    
    // طباعة
    const printButtons = document.querySelectorAll('.print-btn');
    printButtons.forEach(button => {
        button.addEventListener('click', handlePrint);
    });
}

// ====================================
// إعداد اختصارات لوحة المفاتيح
// ====================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl+S لحفظ سريع
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            handleQuickSave();
        }
        
        // Ctrl+N لإضافة جديد
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            handleQuickAdd();
        }
        
        // Escape لإغلاق النماذج المنبثقة
        if (event.key === 'Escape') {
            closeAllModals();
        }
        
        // F1 للمساعدة
        if (event.key === 'F1') {
            event.preventDefault();
            showHelp();
        }
    });
}

// ====================================
// تحميل البيانات الأولية
// ====================================
async function loadInitialData() {
    try {
        showLoadingIndicator();
        
        // تحميل إعدادات النظام
        await loadSystemSettings();
        
        // تحميل بيانات المشاريع
        await loadProjects();
        
        // تحميل بيانات المستخدمين
        await loadUsers();
        
        // تحميل أحدث المعاملات
        await loadRecentTransactions();
        
        hideLoadingIndicator();
        console.log('✅ تم تحميل البيانات الأولية');
        
    } catch (error) {
        hideLoadingIndicator();
        console.error('❌ خطأ في تحميل البيانات:', error);
        showErrorMessage('فشل في تحميل البيانات الأولية');
    }
}

// ====================================
// تحميل بيانات قسم محدد
// ====================================
async function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'transactions':
                await loadTransactionsData();
                break;
            case 'projects':
                await loadProjectsData();
                break;
            case 'users':
                await loadUsersData();
                break;
            case 'documents':
                await loadDocumentsData();
                break;
            case 'reports':
                await loadReportsData();
                break;
            case 'activities':
                await loadActivitiesData();
                break;
            case 'settings':
                await loadSettingsData();
                break;
            default:
                console.warn(`⚠️ قسم غير معروف: ${sectionName}`);
        }
    } catch (error) {
        console.error(`❌ خطأ في تحميل بيانات ${sectionName}:`, error);
        showErrorMessage(`فشل في تحميل بيانات ${sectionName}`);
    }
}

// ====================================
// فحص حالة المصادقة
// ====================================
async function checkAuthenticationStatus() {
    try {
        const response = await apiRequest('/api/auth/session');
        if (response.ok) {
            currentUser = await response.json();
            showMainApp();
            console.log('✅ المستخدم مسجل الدخول:', currentUser.name);
        } else {
            showLoginScreen();
            console.log('📝 المستخدم غير مسجل الدخول');
        }
    } catch (error) {
        console.error('❌ خطأ في فحص المصادقة:', error);
        showLoginScreen();
    }
}

// ====================================
// عرض الشاشة الرئيسية
// ====================================
function showMainApp() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'flex';
}

// ====================================
// عرض شاشة تسجيل الدخول
// ====================================
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (mainApp) mainApp.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
}

// ====================================
// عرض مؤشر التحميل
// ====================================
function showLoadingIndicator() {
    isLoading = true;
    // يمكن إضافة مؤشر تحميل هنا
}

// ====================================
// إخفاء مؤشر التحميل
// ====================================
function hideLoadingIndicator() {
    isLoading = false;
    // يمكن إخفاء مؤشر التحميل هنا
}

// ====================================
// عرض رسالة خطأ
// ====================================
function showErrorMessage(message) {
    // يمكن استخدام نظام التنبيهات هنا
    console.error('❌ خطأ:', message);
    alert(message); // مؤقت - يجب استبداله بنظام تنبيهات أفضل
}

// ====================================
// عرض رسالة نجاح
// ====================================
function showSuccessMessage(message) {
    // يمكن استخدام نظام التنبيهات هنا
    console.log('✅ نجح:', message);
    // مؤقت - يجب استبداله بنظام تنبيهات أفضل
}

// ====================================
// تعيين التواريخ الافتراضية
// ====================================
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// ====================================
// إعداد الشريط الجانبي
// ====================================
function setupSidebar() {
    // إضافة تأثيرات التفاعل
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

// ====================================
// دالة مساعدة للتأخير
// ====================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ====================================
// تصدير الدوال للاستخدام العام
// ====================================
window.AccountingSystem = {
    showSection,
    toggleSidebar,
    checkAuthenticationStatus,
    showMainApp,
    showLoginScreen,
    showSuccessMessage,
    showErrorMessage
};

console.log('📜 تم تحميل الملف الرئيسي للنظام');