import { db, storage, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    setDoc, 
    doc, 
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    ref, 
    uploadBytes,
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// بيانات التطبيق
const dummyData = {
    income: 150000,
    expenses: 85000,
    profit: 65000
};

// التحقق من تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = this.querySelector('button');

    if (!username || !password) {
        showLoginError('الرجاء إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = 'جاري تسجيل الدخول...';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        if (userCredential.user) {
            document.getElementById('loginScreen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loginScreen').classList.add('hidden');
                const mainApp = document.getElementById('mainApp');
                mainApp.classList.remove('hidden');
                mainApp.style.display = 'block';
                initializeDashboard();
            }, 300);
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        let errorMessage = 'حدث خطأ في تسجيل الدخول';
        
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/user-not-found':
                errorMessage = 'المستخدم غير موجود';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'فشل الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت';
                break;
            default:
                errorMessage = 'حدث خطأ غير متوقع في تسجيل الدخول';
        }
        
        showLoginError(errorMessage);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'دخول';
    }
});

function showLoginError(message) {
    let loginError = document.querySelector('.login-error');
    if (!loginError) {
        loginError = document.createElement('div');
        loginError.className = 'login-error';
        document.querySelector('.login-box').appendChild(loginError);
    }
    loginError.textContent = message;
    loginError.style.display = 'block';
    
    document.querySelector('.login-box').classList.add('shake');
    setTimeout(() => {
        document.querySelector('.login-box').classList.remove('shake');
    }, 500);
}
    if (!loginError) {
        loginError = document.createElement('div');
        loginError.className = 'login-error';
        document.querySelector('.login-box').appendChild(loginError);
    }
    loginError.textContent = message;
    loginError.classList.add('visible');
    
    document.querySelector('.login-box').classList.add('shake');
    setTimeout(() => {
        document.querySelector('.login-box').classList.remove('shake');
    }, 500);
}
            // فشل تسجيل الدخول
            if (!loginError) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'login-error';
                errorDiv.textContent = 'بيانات تسجيل الدخول غير صحيحة';
                document.querySelector('.login-box').appendChild(errorDiv);
            } else {
                loginError.classList.add('visible');
            }

            // هز نموذج تسجيل الدخول
            document.querySelector('.login-box').classList.add('shake');
            setTimeout(() => {
                document.querySelector('.login-box').classList.remove('shake');
            }, 500);
        }

        // إعادة تفعيل زر تسجيل الدخول
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'دخول';
    }, 1000);
});

// إضافة تأثير الهز
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
    .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
`, styleSheet.cssRules.length);

// تهيئة لوحة التحكم
function initializeDashboard() {
    updateStats();
    createChart();
}

// تحديث الإحصائيات
// تم حذف التعريف المكرر

// إنشاء الرسم البياني
function createChart(data) {
    const canvas = document.getElementById('financialChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (window.currentChart) {
        window.currentChart.destroy();
    }

    window.currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['الإيرادات', 'المصروفات', 'صافي الربح'],
            datasets: [{
                label: 'البيانات المالية (د.ع)',
                data: [dummyData.income, dummyData.expenses, dummyData.profit],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(46, 204, 113, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// التنقل بين الأقسام
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;

            // إزالة الفئة النشطة من جميع الروابط
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            // إضافة الفئة النشطة للرابط المحدد
            this.classList.add('active');

            if (section) {
                // إخفاء جميع الأقسام
                document.querySelectorAll('.section').forEach(s => {
                    s.classList.remove('active');
                    // إعادة تعيين حالة التبويبات الداخلية
                    s.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                    s.querySelector('.tab-content:first-child')?.classList.add('active');
                });
                // إظهار القسم المحدد
                document.getElementById(section).classList.add('active');
            }
        });
    });
});

// تبديل الشريط الجانبي
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('active');
});

// إخفاء الشريط الجانبي عند النقر على الروابط
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.remove('active');
    });
});

// سجل النشاطات
let activities = [];

function logActivity(type, action, details) {
    const activity = {
        id: Date.now(),
        type: type, // transaction, user, project, document
        action: action, // create, update, delete
        details: details,
        timestamp: new Date().toISOString(),
        userId: 'admin' // يمكن تحديثه لاحقاً مع نظام المستخدمين
    };
    activities.push(activity);
    updateActivitiesList();
}

function updateActivitiesList() {
    const container = document.getElementById('activitiesList');
    if (!container) return;

    const typeFilter = document.getElementById('activityTypeFilter').value;
    const startDate = document.getElementById('activityStartDate').value;
    const endDate = document.getElementById('activityEndDate').value;

    let filteredActivities = activities;

    if (typeFilter) {
        filteredActivities = filteredActivities.filter(a => a.type === typeFilter);
    }

    if (startDate && endDate) {
        filteredActivities = filteredActivities.filter(a => {
            const activityDate = new Date(a.timestamp);
            return activityDate >= new Date(startDate) && activityDate <= new Date(endDate);
        });
    }

    container.innerHTML = '';

    filteredActivities.reverse().forEach(activity => {
        const card = document.createElement('div');
        card.className = 'activity-card';

        let actionText = '';
        switch(activity.action) {
            case 'create':
                actionText = 'إضافة';
                break;
            case 'update':
                actionText = 'تحديث';
                break;
            case 'delete':
                actionText = 'حذف';
                break;
        }

        let typeText = '';
        switch(activity.type) {
            case 'transaction':
                typeText = 'عملية مالية';
                break;
            case 'user':
                typeText = 'مستخدم';
                break;
            case 'project':
                typeText = 'مشروع';
                break;
            case 'document':
                typeText = 'مستند';
                break;
        }

        card.innerHTML = `
            <div class="activity-header">
                <span class="activity-type">${typeText}</span>
                <span class="activity-date">${new Date(activity.timestamp).toLocaleString('ar-IQ')}</span>
            </div>
            <div class="activity-content">
                <p><strong>${actionText}:</strong> ${activity.details}</p>
            </div>
        `;
        if (container) {
            container.appendChild(card);
        }
    });
}

// تهيئة سجل النشاطات
document.addEventListener('DOMContentLoaded', function() {
    const filterBtn = document.getElementById('filterActivities');
    if (filterBtn) {
        filterBtn.addEventListener('click', updateActivitiesList);
    }
});

// تسجيل الخروج
// إدارة المعاملات
let transactions = [];

function initializeTransactions() {

    // تحديث قائمة المشاريع في نموذج إدخال العملية
    const transProjectSelect = document.getElementById('transProject');
    const filterProjectSelect = document.getElementById('filterProject');
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    if (transProjectSelect) {
        transProjectSelect.innerHTML = '<option value="">اختر المشروع</option>';
        projects.forEach(project => {
            transProjectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
        });
    }

    const saveTransBtn = document.getElementById('saveTransaction');
    if (saveTransBtn) {
        saveTransBtn.addEventListener('click', saveNewTransaction);
    }

    // إخفاء/إظهار حقل اختيار المشروع حسب صلاحية المستخدم
    const projectSelectContainer = filterProjectSelect?.parentElement;
    if (projectSelectContainer) {
        projectSelectContainer.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
}

// تهيئة قوائم التصفية
function initializeFilters() {
    const projectSelect = document.getElementById('filterProject');
    const userSelect = document.getElementById('filterUser');

    // تحديث قائمة المشاريع
    projects.forEach(project => {
        projectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
    });

    // تحديث قائمة المستخدمين
    users.forEach(user => {
        userSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });
}

// وظيفة لتحديث جميع العناصر المرتبطة
function updateAllRelatedElements() {
    updateTransactionsTable();
    updateProjectsList();
    updateUsersList();
    updateDocumentsList();
    updateStats();
    initializeFilters();
    updateProjectsDropdown();
}


async function saveToDatabase() {
    try {
        await setDoc(doc(db, "data", "transactions"), { transactions });
        await setDoc(doc(db, "data", "projects"), { projects });
        await setDoc(doc(db, "data", "users"), { users });
        await setDoc(doc(db, "data", "documents"), { documents });
    } catch (error) {
        console.error("Error saving data:", error);
        // Fallback to local storage
        saveToLocalStorage();
    }
}

async function loadFromDatabase() {
    try {
        const querySnapshot = await getDocs(collection(db, "data"));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            switch(doc.id) {
                case "transactions": transactions = data.transactions || []; break;
                case "projects": projects = data.projects || []; break;
                case "users": users = data.users || []; break;
                case "documents": documents = data.documents || []; break;
            }
        });
    } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to local storage
        loadFromLocalStorage();
    }
}

// Backup functions for local storage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('documents', JSON.stringify(documents));
}

function loadFromLocalStorage() {
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    projects = JSON.parse(localStorage.getItem('projects')) || [];
    users = JSON.parse(localStorage.getItem('users')) || [];
    documents = JSON.parse(localStorage.getItem('documents')) || [];
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadFromDatabase();
    initializeTransactions();
    initializeFilters();
    updateAllRelatedElements();
});

// تحديث دالة updateTransactionsTable لدعم التصفية
function updateTransactionsTable() {
    const projectFilter = document.getElementById('filterProject').value;
    const userFilter = document.getElementById('filterUser').value;

    let filteredTransactions = [...transactions];

    if (projectFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.projectId === projectFilter);
    }
    if (userFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.userId === userFilter);
    }

    const tbody = document.getElementById('transactionsTableBody');
    const cardsContainer = document.getElementById('transactionsCards');
    if (!tbody || !cardsContainer) return;

    tbody.innerHTML = '';
    cardsContainer.innerHTML = '';

    filteredTransactions.forEach((transaction, index) => {
        const formattedDate = new Date(transaction.date).toLocaleDateString('ar-IQ');
        const typeClass = transaction.type === 'ايراد' ? 'type-income' : 'type-expense';
        const formattedAmount = transaction.amount.toLocaleString('ar-IQ');

        // إضافة صف للجدول
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.description}</td>
            <td class="${typeClass}">${transaction.type}</td>
            <td class="${typeClass}">${formattedAmount} د.ع</td>
            <td>
                <button class="btn-action" onclick="editTransaction(${index})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action" onclick="deleteTransaction(${index})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);

        // إضافة بطاقة
        const card = document.createElement('div');
        card.className = 'transaction-card';
        card.innerHTML = `
            <div class="date">${formattedDate}</div>
            <div class="description">${transaction.description}</div>
            <div class="amount ${typeClass}">${formattedAmount} د.ع</div>
            <div class="type ${typeClass}">${transaction.type}</div>
            <div class="actions">
                <button class="btn-action" onclick="editTransaction(${index})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action" onclick="deleteTransaction(${index})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}

async function saveNewTransaction() {
    const date = document.getElementById('transDate').value;
    const description = sanitizeInput(document.getElementById('transDescription').value);
    const type = document.getElementById('transType').value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    
    // التحقق من صحة المدخلات
    if (!isValidDate(date) || !description || !type || isNaN(amount) || amount <= 0) {
        showNotification('الرجاء التأكد من صحة جميع البيانات المدخلة', 'error');
        return;
    }

    // إضافة رمز CSRF
    const csrfToken = generateCSRFToken();
    if (!validateCSRFToken(csrfToken)) {
        showNotification('خطأ في التحقق من الأمان', 'error');
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const projectId = document.getElementById('transProject')?.value;
    const isAdmin = currentUser.role === 'admin';

    if (!date || !description || !amount || !type) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    // إذا كان المستخدم مديراً، يجب عليه اختيار مشروع
    if (isAdmin && !projectId) {
        alert('يجب على المدير اختيار مشروع');
        return;
    }

    // إذا كان المستخدم عادياً، يتم استخدام المشروع المخصص له
    const effectiveProjectId = isAdmin ? projectId : currentUser.projectId;

    if (!effectiveProjectId) {
        alert('لم يتم تحديد المشروع');
        return;
    }

    const project = projects.find(p => p.id.toString() === projectId);
    if (!project) {
        alert('المشروع غير موجود');
        return;
    }

    if (type === 'ايراد') {
        // التحقق من رصيد المدير
        if (adminBalance < amount) {
            alert('رصيد المدير غير كافي');
            return;
        }
        // خصم من المدير وإضافة للمشروع
        adminBalance -= amount;
        project.balance += amount;
    } else if (type === 'مصروف') {
        // التحقق من رصيد المشروع
        if (project.balance < amount) {
            alert('رصيد المشروع غير كافي');
            return;
        }
        // خصم من المشروع
        project.balance -= amount;
    }

    const transaction = {
        id: Date.now(),
        date: date,
        description: description,
        type: type,
        amount: amount,
        userId: currentUser.id || 'admin',
        projectId: effectiveProjectId,
        createdAt: new Date().toISOString(),
        createdBy: isAdmin ? 'admin' : currentUser.name,
        isAdminAction: isAdmin
    };

    transactions.push(transaction);
    updateTransactionsTable();
    updateStats();
    resetTransactionForm();
    logActivity('transaction', 'create', `تم إضافة ${transaction.type} بقيمة ${transaction.amount} د.ع`);
    await saveToDatabase(); // Save to database after transaction
    updateAllRelatedElements(); // Update all related elements
}

function updateStats() {
    let totalIncome = 0;
    let totalExpenses = 0;
    let projectStats = {};

    // حساب المجاميع حسب المشروع والنوع
    transactions.forEach(trans => {
        if (!projectStats[trans.projectId]) {
            projectStats[trans.projectId] = { income: 0, expenses: 0 };
        }

        if (trans.type === 'ايراد') {
            totalIncome += trans.amount;
            projectStats[trans.projectId].income += trans.amount;
        } else if (trans.type === 'مصروف') {
            totalExpenses += trans.amount;
            projectStats[trans.projectId].expenses += trans.amount;
        }
    });

    const profit = totalIncome - totalExpenses;

    // تحديث الإحصائيات العامة
    document.getElementById('totalIncome').textContent = `${totalIncome.toLocaleString('ar-IQ')} د.ع`;
    document.getElementById('totalExpenses').textContent = `${totalExpenses.toLocaleString('ar-IQ')} د.ع`;
    document.getElementById('netProfit').textContent = `${profit.toLocaleString('ar-IQ')} د.ع`;

    // تحديث إحصائيات المشاريع
    projects.forEach(project => {
        const stats = projectStats[project.id] || { income: 0, expenses: 0 };
        project.totalIncome = stats.income;
        project.totalExpenses = stats.expenses;
        project.netProfit = stats.income - stats.expenses;
    });

    // تحديث الرسم البياني
    createChart({ income: totalIncome, expenses: totalExpenses, profit: profit });
}

function resetTransactionForm() {
    document.getElementById('transDescription').value = '';
    document.getElementById('transAmount').value = '';
    document.getElementById('transType').value = '';
    document.getElementById('transDate').valueAsDate = new Date();
}

// تبديل طريقة العرض
document.querySelectorAll('.view-toggle .tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.view-toggle .tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const view = button.dataset.view;
        document.querySelector('.transactions-cards').classList.toggle('active', view === 'cards');
        document.querySelector('.transactions-table').classList.toggle('active', view === 'table');
    });
});

// تم حذف التعريف المكرر

function editTransaction(index) {
    // سيتم إضافة وظيفة التعديل لاحقاً
    console.log('تعديل المعاملة:', index);
}

async function deleteTransaction(index) {
    if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
        transactions.splice(index, 1);
        updateTransactionsTable();
        await saveToDatabase(); // Save to database after deletion
        updateAllRelatedElements(); // Update all related elements
    }
}

// إدارة التبويبات
// وظائف الطباعة والتنزيل
function generatePDF(download = false) {
    const element = document.createElement('div');
    element.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 20px;">تقرير العمليات المالية</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="border: 1px solid #ddd; padding: 8px;">التاريخ</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">الوصف</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">النوع</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">المبلغ</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(trans => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(trans.date).toLocaleDateString('ar-IQ')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${trans.description}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${trans.type}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${trans.amount.toLocaleString('ar-IQ')} د.ع</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const opt = {
        margin: 1,
        filename: 'تقرير_العمليات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    if (download) {
        html2pdf().set(opt).from(element).save();
    } else {
        html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
            window.open(pdf.output('bloburl'), '_blank');
        });
    }
}

// إدارة المشاريع
let projects = [];
const ADMIN_DEFAULT_BALANCE = 1000000; // رصيد افتراضي للمدير
let adminBalance = ADMIN_DEFAULT_BALANCE;
const PROJECT_DEFAULT_BALANCE = 0; // رصيد افتراضي للمشروع

async function saveNewProject() {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDesc').value;
    const date = document.getElementById('projectDate').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    if (!name || !description || !date) {
        showAlert('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // التحقق من صحة التاريخ
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) {
        showAlert('الرجاء إدخال تاريخ صحيح', 'error');
        return;
    }

    // التحقق من عدم تكرار اسم المشروع
    if (projects.some(p => p.name === name)) {
        alert('اسم المشروع موجود مسبقاً');
        return;
    }

    const project = {
        id: Date.now(),
        name: name,
        description: description,
        date: date,
        status: 'جديد',
        balance: PROJECT_DEFAULT_BALANCE,
        createdBy: currentUser.id || 'admin',
        createdAt: new Date().toISOString(),
        transactions: [],
        users: []
    };

    projects.push(project);
    updateProjectsList();
    resetProjectForm();
    updateProjectsDropdown();//added to update dropdown after new project added.
    await saveToDatabase();//save to local storage after adding a project
    updateAllRelatedElements();//update all related elements after adding a project
}

function resetProjectForm() {
    document.getElementById('projectName').value = '';
    document.getElementById('projectDesc').value = '';
    document.getElementById('projectDate').valueAsDate = new Date();
}

function updateProjectsList() {
    const container = document.getElementById('projectsList');
    container.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';

        const statusClass = project.status === 'جديد' ? 'status-new' : 'status-completed';
        const transactions = project.transactions || [];
        const totalIncome = transactions.reduce((sum, t) => t.type === 'ايراد' ? sum + t.amount : sum, 0);
        const totalExpenses = transactions.reduce((sum, t) => t.type === 'مصروف' ? sum + t.amount : sum, 0);

        card.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <div class="project-details">
                <div>
                    <span class="project-status ${statusClass}">${project.status}</span>
                    <span>تاريخ البدء: ${new Date(project.date).toLocaleDateString('ar-IQ')}</span>
                </div>
                <div class="project-balance">
                    الرصيد: ${project.balance.toLocaleString('ar-IQ')} د.ع
                </div>
                <div>
                    <div>إجمالي الإيرادات: ${totalIncome.toLocaleString('ar-IQ')} د.ع</div>
                    <div>إجمالي المصروفات: ${totalExpenses.toLocaleString('ar-IQ')} د.ع</div>
                </div>
            </div>
            <div class="project-actions">
                <button onclick="editProject(${project.id})" class="btn-primary">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button onclick="deleteProject(${project.id})" class="btn-secondary">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        if (container) {
            container.appendChild(card);
        }
    });
}

async function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDesc').value = project.description;
    document.getElementById('projectDate').value = project.date;

    // تحويل زر الحفظ إلى زر تحديث
    const saveBtn = document.getElementById('saveProject');
    saveBtn.textContent = 'تحديث المشروع';
    saveBtn.onclick = async () => { await updateProject(id);};
}

async function updateProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDesc').value;
    const date = document.getElementById('projectDate').value;

    if (!name || !description || !date) {
        showAlert('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // التحقق من صحة التاريخ
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) {
        showAlert('الرجاء إدخال تاريخ صحيح', 'error');
        return;
    }


    // تحديث بيانات المشروع
    project.name = name;
    project.description = description;
    project.date = date;

    updateProjectsList();
    resetProjectForm();

    // إعادة زر الحفظ إلى حالته الأصلية
    const saveBtn = document.getElementById('saveProject');
    saveBtn.textContent = 'حفظ المشروع';
    saveBtn.onclick = saveNewProject;
    await saveToDatabase();//save to local storage after updating a project
    updateAllRelatedElements();//update all related elements after updating a project

}

async function deleteProject(id) {
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
        projects = projects.filter(p => p.id !== id);
        updateProjectsList();
        updateProjectsDropdown();//added to update dropdown after project deleted.
        await saveToDatabase();//save to local storage after deleting a project
        updateAllRelatedElements();//update all related elements after deleting a project
    }
}

// إدارة المستخدمين
let users = [];

function updateProjectsDropdown() {
    const userProjectSelect = document.getElementById('userProject');
    const transProjectSelect = document.getElementById('transProject');
    
    const updateSelect = (select) => {
        if (select) {
            select.innerHTML = '<option value="">اختر المشروع</option>';
            projects.forEach(project => {
                select.innerHTML += `<option value="${project.id}">${project.name}</option>`;
            });
        }
    };

    updateSelect(userProjectSelect);
    updateSelect(transProjectSelect);
}

// إظهار/إخفاء خيارات الصلاحيات بناءً على نوع المستخدم
document.getElementById('userRole').addEventListener('change', function() {
    const permissionsGroup = document.getElementById('permissionsGroup');
    permissionsGroup.style.display = this.value === 'user' ? 'block' : 'none';
});

async function saveNewUser() {
    const name = document.getElementById('userName').value;
    const role = document.getElementById('userRole').value;
    const project = document.getElementById('userProject').value;
    const password = document.getElementById('userPassword').value;

    if (!name || !role || !project || !password) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    // التحقق من عدم تكرار اسم المستخدم
    if (users.some(u => u.name === name)) {
        alert('اسم المستخدم موجود مسبقاً');
        return;
    }

    let permissions = {};
    if (role === 'user') {
        permissions = {
            viewReports: document.getElementById('viewReports').checked,
            manageUsers: document.getElementById('manageUsers').checked,
            manageProjects: document.getElementById('manageProjects').checked,
            manageTransactions: document.getElementById('manageTransactions').checked
        };
    } else if (role === 'admin') {
        permissions = {
            viewReports: true,
            manageUsers: true,
            manageProjects: true,
            manageTransactions: true
        };
    }

    const user = {
        id: Date.now(),
        name: name,
        role: role,
        projectId: project,
        permissions: permissions,
        status: 'نشط'
    };

    users.push(user);
    updateUsersList();
    resetUserForm();
    await saveToDatabase();//save to local storage after adding a user
    updateAllRelatedElements();//update all related elements after adding a user
}

function resetUserForm() {
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userRole').value = '';
    document.getElementById('userPassword').value = '';
}

function updateUsersList() {
    const container = document.getElementById('usersList');
    container.innerHTML = '';

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <h3>${user.name}</h3>
            <p>${user.email}</p>
            <div class="user-details">
                <span>الصلاحية: ${user.role === 'admin' ? 'مدير' : 'مستخدم'}</span>
                <span>الحالة: ${user.status}</span>
                <span>المشروع: ${projects.find(p => p.id == user.projectId)?.name || 'غير محدد'}</span>
            </div>
            <div class="user-actions">
                <button onclick="deleteUser(${user.id})" class="btn-action">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        if (container) {
            container.appendChild(card);
        }
    });
}

async function deleteUser(id) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        users = users.filter(u => u.id !== id);
        updateUsersList();
        await saveToDatabase();//save to local storage after deleting a user
        updateAllRelatedElements();//update all related elements after deleting a user
    }
}

// إدارة المستندات
let documents = [];
let privateDocuments = [];

async function saveNewDocument() {
    const isPrivate = document.querySelector('.documents-tabs .tab-btn[data-doctab="private-docs"]').classList.contains('active');
    const title = document.getElementById('documentTitle').value;
    const description = document.getElementById('documentDesc').value;
    const project = document.getElementById('documentProject').value;
    const fileInput = document.getElementById('documentFile');

    if (!title || !description || !project || !fileInput.files[0]) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        const file = fileInput.files[0];
        const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const document = {
            id: Date.now(),
            title: title,
            description: description,
            projectId: project,
            fileName: fileInput.files[0].name,
            fileUrl: downloadURL,
            uploadDate: new Date().toISOString(),
            status: 'نشط'
        };

        if (isPrivate) {
            privateDocuments.push(document);
            updatePrivateDocumentsList();
        } else {
            documents.push(document);
            updateDocumentsList();
        }
        resetDocumentForm();
        await saveToDatabase(); // save to local storage after adding a document
        updateAllRelatedElements(); // update all related elements after adding a document
    } catch (error) {
        console.error("Error saving document:", error);
        alert('حدث خطأ أثناء حفظ المستند');
    }
}

function resetDocumentForm() {
    document.getElementById('documentTitle').value = '';
    document.getElementById('documentDesc').value = '';
    document.getElementById('documentProject').value = '';
    document.getElementById('documentFile').value = '';
}

function updateDocumentsList() {
    const container = document.getElementById('documentsList');
    container.innerHTML = '';

    documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.innerHTML = `
            <h3>${doc.title}</h3>
            <p>${doc.description}</p>
            <div class="document-details">
                <span>تاريخ الرفع: ${new Date(doc.uploadDate).toLocaleDateString('ar-IQ')}</span>
                <span>الملف: ${doc.fileName}</span>
                <span>المشروع: ${projects.find(p => p.id == doc.projectId)?.name || 'غير محدد'}</span>
            </div>
            <div class="document-actions">
                <button onclick="deleteDocument(${doc.id})" class="btn-action">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="downloadDocument(${doc.id})" class="btn-action">
                    <i class="fas fa-download"></i>
                </button            </div>
        `;
        if (container) {
            container.appendChild(card);
        }
    });
}

async function deleteDocument(id) {
    if (confirm('هل أنت متأكد من حذف هذا المستند؟')) {
        documents = documents.filter(d => d.id !== id);
        updateDocumentsList();
        await saveToDatabase();//save to local storage after deleting a document
        updateAllRelatedElements();//update all related elements after deleting a document
    }
}

function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        // فتح نافذة عرض المستند
        const viewer = window.open('', '_blank');
        viewer.document.write(`
            <html>
                <head>
                    <title>${doc.title}</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css">
                </head>
                <body>
                    <div id="viewerContainer">
                        <div id="viewer" class="pdfViewer"></div>
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
                    <script>
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        // هنا سيتم إضافة كود عرض المستند
                    </script>
                </body>
            </html>
        `);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // تهيئة قسم المستخدمين
    const saveUserBtn = document.getElementById('saveUser');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveNewUser);
    }

    // تهيئة قسم المشاريع
    const saveProjectBtn = document.getElementById('saveProject');
    if (saveProjectBtn) {

// إضافة مستمعي الأحداث للتبديل بين المستندات العامة والخاصة
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.documents-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.documents-tabs .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            if (button.dataset.doctab === 'private-docs') {
                updatePrivateDocumentsList();
            } else {
                updateDocumentsList();
            }
        });
    });
});

function updatePrivateDocumentsList() {
    const container = document.getElementById('documentsList');
    container.innerHTML = '';

    privateDocuments.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.innerHTML = `
            <h3>${doc.title}</h3>
            <p>${doc.description}</p>
            <div class="document-details">
                <span>تاريخ الرفع: ${new Date(doc.uploadDate).toLocaleDateString('ar-IQ')}</span>
                <span>الملف: ${doc.fileName}</span>
                <span>المشروع: ${projects.find(p => p.id == doc.projectId)?.name || 'غير محدد'}</span>
                <span class="document-type">نوع المستند: خاص</span>
            </div>
            <div class="document-actions">
                <button onclick="deletePrivateDocument(${doc.id})" class="btn-action">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="downloadDocument(${doc.id})" class="btn-action">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        if (container) {
            container.appendChild(card);
        }
    });
}

async function deletePrivateDocument(id) {
    if (confirm('هل أنت متأكد من حذف هذا المستند؟')) {
        privateDocuments = privateDocuments.filter(d => d.id !== id);
        updatePrivateDocumentsList();
        await saveToDatabase();//save to local storage after deleting a private document
        updateAllRelatedElements();//update all related elements after deleting a private document
    }
}

        saveProjectBtn.addEventListener('click', saveNewProject);
    }

    // تهيئةأزرار الطباعة والتنزيل
    document.getElementById('printTransactions')?.addEventListener('click', () => generatePDF(false));
    document.getElementById('downloadTransactions')?.addEventListener('click', () => generatePDF(true));

    // إدارة التبويبات الرئيسية
    // تم إزالة منطق التبديل بين التبويبات لأن المحتوى سيظهر مباشرة

    // إدارة تبديل طريقة العرض
    document.querySelectorAll('.view-toggle .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const viewBtns = document.querySelectorAll('.view-toggle .tab-btn');
            viewBtns.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const view = button.dataset.view;
            const cardsView = document.querySelector('.transactions-cards');
            const tableView = document.querySelector('.transactions-table');

            if (cardsView && tableView) {
                cardsView.classList.toggle('active', view === 'cards');
                tableView.classList.toggle('active', view === 'table');
            }
        });
    });
    updateProjectsDropdown();//added to populate dropdown on load.
});

// وظائف التقارير
function initializeReports() {
    // تهيئة التواريخ الافتراضية
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    document.getElementById('financialStartDate').valueAsDate = firstDay;
    document.getElementById('financialEndDate').valueAsDate = today;

    // إضافة مستمعي الأحداث
    document.getElementById('generateFinancialReport').addEventListener('click', generateFinancialReport);
    document.getElementById('generateProjectReport').addEventListener('click', generateProjectReport);

    // تهيئة التبديل بين التقارير
    document.querySelectorAll('.reports-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.reports-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.querySelectorAll('.report-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${button.dataset.report}-report`).classList.add('active');

            updateReportView(button.dataset.report);
        });
    });

    // عرض التقرير المالي مباشرة
    generateFinancialReport();
}

function generateFinancialReport() {
    const startDate = new Date(document.getElementById('financialStartDate').value);
    const endDate = new Date(document.getElementById('financialEndDate').value);

    const filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= startDate && transDate <= endDate;
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach(trans => {
        if (trans.type === 'ايراد') {
            totalIncome += trans.amount;
        } else {
            totalExpenses += trans.amount;
        }
    });

    const netProfit = totalIncome - totalExpenses;

    // تحديث الملخص
    document.getElementById('reportTotalIncome').textContent = `${totalIncome.toLocaleString('ar-IQ')} د.ع`;
    document.getElementById('reportTotalExpenses').textContent = `${totalExpenses.toLocaleString('ar-IQ')} د.ع`;
    document.getElementById('reportNetProfit').textContent = `${netProfit.toLocaleString('ar-IQ')} د.ع`;

    // تحديث الرسم البياني
    const ctx = document.getElementById('reportFinancialChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredTransactions.map(t => new Date(t.date).toLocaleDateString('ar-IQ')),
            datasets: [{
                label: 'الإيرادات',
                data: filteredTransactions.filter(t => t.type === 'ايراد').map(t => t.amount),
                borderColor: '#28c76f',
                fill: false
            }, {
                label: 'المصروفات',
                data: filteredTransactions.filter(t => t.type === 'مصروف').map(t => t.amount),
                borderColor: '#ea5455',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateProjectReport() {
    const status = document.getElementById('projectStatusFilter').value;
    const filteredProjects = status ? projects.filter(p => p.status === status) : projects;

    const ctx = document.getElementById('reportProjectsChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['مشاريع جديدة', 'مشاريع مكتملة'],
            datasets: [{
                data: [
                    filteredProjects.filter(p => p.status === 'جديد').length,
                    filteredProjects.filter(p => p.status === 'مكتمل').length
                ],
                backgroundColor: ['#7367f0', '#28c76f']
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateUsersReport() {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'نشط').length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;

    const ctx = document.getElementById('reportUsersChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['مدراء', 'مستخدمين'],
            datasets: [{
                data: [
                    users.filter(u => u.role === 'admin').length,
                    users.filter(u => u.role === 'user').length
                ],
                backgroundColor: ['#7367f0', '#28c76f']
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateReportView(type) {
    switch(type) {
        case 'financial':
            generateFinancialReport();
            break;
        case 'projects':
            generateProjectReport();
            break;
        case 'users':
            updateUsersReport();
            break;
    }
}

// إضافة تهيئة التقارير عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeReports();
});

// إعدادات النظام
let systemSettings = {
    companyName: 'نظام المحاسبة',
    theme: 'default'
};

// تحميل الإعدادات عند بدء التطبيق
function loadSettings() {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
        systemSettings = JSON.parse(savedSettings);
        applySettings();
    }

    // تحديث عنوان شاشة تسجيل الدخول
    const loginTitle = document.querySelector('.login-box h2');
    if (loginTitle) {
        loginTitle.textContent = systemSettings.companyName || 'نظام المحاسبة';
    }
}

// تطبيق الإعدادات
function applySettings() {
    // تطبيق اسم المؤسسة
    const logoElement = document.querySelector('.logo');
    const loginTitle = document.querySelector('.login-box h2');
    if (logoElement) logoElement.textContent = systemSettings.companyName;
    if (loginTitle) loginTitle.textContent = systemSettings.companyName;

    // إضافة زر حفظ الإعدادات
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (!saveSettingsBtn) {
        const settingsContainer = document.querySelector('.settings-section');
        if (settingsContainer) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'saveSettings';
            saveBtn.className = 'btn-primary';
            saveBtn.textContent = 'حفظ الإعدادات';
            saveBtn.onclick = function() {
                const companyNameInput = document.getElementById('companyName');
                if (companyNameInput) {
                    systemSettings.companyName = companyNameInput.value;
                    applySettings();
                    alert('تم حفظ الإعدادات بنجاح');
                }
            };
            settingsContainer.appendChild(saveBtn);
        }
    }

    // تطبيق النمط
    document.body.className = `theme-${systemSettings.theme}`;

    // حفظ الإعدادات
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
}

// تغيير كلمة المرور
document.getElementById('changePassword')?.addEventListener('click', function() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('كلمة المرور الجديدة غير متطابقة');
        return;
    }

    // هنا يمكن إضافة المنطق الخاص بتغيير كلمة المرور
    alert('تم تغيير كلمة المرور بنجاح');

    // إعادة تعيين الحقول
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
});

// تغيير النمط
document.getElementById('themeSelect')?.addEventListener('change', function() {
    systemSettings.theme = this.value;
    applySettings();
});

// حفظ اسم المؤسسة
document.getElementById('companyName')?.addEventListener('change', function() {
    systemSettings.companyName = this.value;
    applySettings();
});

// النسخ الاحتياطي
document.getElementById('backupSystem')?.addEventListener('click', function() {
    const backup = {
        settings: systemSettings,
        transactions: transactions,
        projects: projects,
        users: users,
        documents: documents,
        privateDocuments: privateDocuments
    };

    const dataStr = JSON.stringify(backup);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', `backup_${new Date().toISOString()}.json`);
    exportLink.click();
});

// استعادة النسخة الاحتياطية
document.getElementById('restoreSystem')?.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const backup = JSON.parse(e.target.result);
                systemSettings = backup.settings;
                transactions = backup.transactions;
                projects = backup.projects;
                users = backup.users;
                documents = backup.documents;
                privateDocuments = backup.privateDocuments;

                applySettings();
                updateTransactionsTable();
                updateProjectsList();
                updateUsersList();
                updateDocumentsList();

                alert('تم استعادة النسخة الاحتياطية بنجاح');
            } catch (error) {
                alert('حدث خطأ أثناء استعادة النسخة الاحتياطية');
            }
        };

        reader.readAsText(file);
    };

    input.click();
});

// تنزيل ملفات المشروع
document.getElementById('downloadProjectFiles')?.addEventListener('click', function() {
    const zip = new JSZip();

    // إضافة الملفات للأرشيف
    fetch('index.html').then(response => response.text())
        .then(content => zip.file('index.html', content));
    fetch('style.css').then(response => response.text())
        .then(content => zip.file('style.css', content));
    fetch('script.js').then(response => response.text())
        .then(content => zip.file('script.js', content));
    fetch('firebase-config.js').then(response => response.text())
        .then(content => zip.file('firebase-config.js', content));

    // إنشاء وتنزيل الملف المضغوط
    zip.generateAsync({type: "blob"}).then(function(content) {
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    });
});

// تحميل الإعدادات عند بدء التطبيق
document.addEventListener('DOMContentLoaded', loadSettings);

document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
});

function showAlert(message, type) {
    // Add your alert logic here.  This is a placeholder.
    alert(message);
}