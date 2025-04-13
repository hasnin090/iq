rn transDate >= startDate && transDate <= endDate;
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