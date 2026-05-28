

// Storage Keys
const STORAGE_USERS = "stream_users";
const STORAGE_PROJECTS = "stream_projects";
const STORAGE_SESSION = "stream_session";
const STORAGE_NOTIFICATIONS = "stream_notifications";

// Default admin account
const defaultAdmin = {
username: "MTA2931",
password: "Mani@1392",
role: "management"
};

// Helper functions
function loadUsers() {
let users = localStorage.getItem(STORAGE_USERS);
if (!users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
}
return JSON.parse(users);
}

function saveUsers(users) {
localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function loadProjects() {
let proj = localStorage.getItem(STORAGE_PROJECTS);
if (!proj) return [];
return JSON.parse(proj);
}

function saveProjects(projects) {
localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects));
}

function loadNotifications() {
let notif = localStorage.getItem(STORAGE_NOTIFICATIONS);
if (!notif) return [];
return JSON.parse(notif);
}

function saveNotifications(notifications) {
localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(notifications));
}

function addNotification(type, title, message) {
let notifications = loadNotifications();
const newNotif = {
    id: Date.now(),
    type: type, // 'success', 'warning', 'danger', 'info'
    title: title,
    message: message,
    timestamp: new Date().toISOString(),
    read: false
};
notifications.unshift(newNotif);
// نگه داشتن حداکثر 50 اعلان
if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
}
saveNotifications(notifications);
updateNotificationBadge();
if (!notificationsTabDiv.classList.contains('hidden')) {
    renderNotifications();
}
}

function updateNotificationBadge() {
const notifications = loadNotifications();
const unreadCount = notifications.filter(n => !n.read).length;
const badge = document.getElementById('notificationBadge');
if (badge) {
    if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove('hidden');
    } else {
    badge.classList.add('hidden');
    }
}
}

let currentUser = null;
let projectsArray = [];

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginBtn = document.getElementById('doLoginBtn');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const sidebarUsernameSpan = document.getElementById('sidebarUsername');
const sidebarRoleBadge = document.getElementById('sidebarRoleBadge');
const projectsListEl = document.getElementById('projectsList');
const totalProjectsSpan = document.getElementById('totalProjectsCount');
const addProjectBtn = document.getElementById('addProjectBtn');
const usersTabDiv = document.getElementById('usersTab');
const settingsTabDiv = document.getElementById('settingsTab');
const projectsTabDiv = document.getElementById('projectsTab');
const notificationsTabDiv = document.getElementById('notificationsTab');
const usersTabBtn = document.getElementById('usersTabBtn');
const settingsTabBtn = document.getElementById('settingsTabBtn');
const notificationsTabBtn = document.getElementById('notificationsTabBtn');
const sidebarLogout = document.getElementById('sidebarLogout');
const usersListBody = document.getElementById('usersListBody');
const createUserBtn = document.getElementById('createUserBtn');
const clearAllProjectsBtn = document.getElementById('clearAllProjectsBtn');

function refreshUIByRole() {
if (!currentUser) return;
const role = currentUser.role;

if (role === "management") {
    usersTabBtn.classList.remove('hidden');
    settingsTabBtn.classList.remove('hidden');
    notificationsTabBtn.classList.remove('hidden');
    if(addProjectBtn) addProjectBtn.style.display = "flex";
} 
else if (role === "admin") {
    usersTabBtn.classList.add('hidden');
    settingsTabBtn.classList.add('hidden');
    notificationsTabBtn.classList.remove('hidden');
    if(addProjectBtn) addProjectBtn.style.display = "flex";
} 
else {
    usersTabBtn.classList.add('hidden');
    settingsTabBtn.classList.add('hidden');
    notificationsTabBtn.classList.add('hidden');
    if(addProjectBtn) addProjectBtn.style.display = "none";
}

if (!settingsTabDiv.classList.contains('hidden') && role !== "management") {
    switchTab('projects');
}
if (!usersTabDiv.classList.contains('hidden') && role !== "management") {
    switchTab('projects');
}
renderProjectsTable();
renderUsersTable();
updateStats();
updateNotificationBadge();
}

function updateStats() {
totalProjectsSpan.innerText = projectsArray.length;
}

function renderProjectsTable() {
if (!projectsListEl) return;
projectsListEl.innerHTML = "";
projectsArray.forEach((proj, idx) => {
    const row = document.createElement('tr');
    
    let statusClass = 'status-orange';
    let statusText = 'در حال انجام';
    
    if (proj.status === 'green') {
    statusClass = 'status-green';
    statusText = 'تحویل داده شده';
    } else if (proj.status === 'red') {
    statusClass = 'status-red';
    statusText = 'لغو شده';
    }
    
    row.innerHTML = `
    <td>
        <div style="display: flex; align-items: center; gap: 8px;">
        <span class="status-indicator ${statusClass}" data-index="${idx}">
            <span class="status-tooltip">${statusText}</span>
        </span>
        ${escapeHtml(proj.name)}
        </div>
    </td>
    <td>${escapeHtml(proj.desc)}</td>
    <td>${proj.startDate}</td>
    <td>${proj.endDate}</td>
    <td>${proj.amount.toLocaleString()} تومان</td>
    <td>${escapeHtml(proj.clientName)}</td>
    <td>${proj.clientPhone}</td>
    <td>
        ${ (currentUser.role === "management" || currentUser.role === "admin") ? `<button class="delete-project-btn btn btn-danger" data-index="${idx}"><i class="fas fa-trash"></i> حذف</button>` : '<span class="text-muted">فقط مشاهده</span>'}
        </td>
    `;
    projectsListEl.appendChild(row);
});

document.querySelectorAll('.status-indicator').forEach(indicator => {
    indicator.addEventListener('click', (e) => {
    e.stopPropagation();
    const idx = parseInt(indicator.getAttribute('data-index'));
    
    if (currentUser.role === "user") {
        alert("شما دسترسی تغییر وضعیت پروژه را ندارید");
        return;
    }
    
    const currentStatus = projectsArray[idx].status || 'orange';
    let newStatus;
    let newText;
    
    if (currentStatus === 'green') {
        newStatus = 'orange';
        newText = 'در حال انجام';
    } else if (currentStatus === 'orange') {
        newStatus = 'red';
        newText = 'لغو شده';
    } else {
        newStatus = 'green';
        newText = 'تحویل داده شده';
    }
    
    projectsArray[idx].status = newStatus;
    saveProjects(projectsArray);
    
    // Add notification for status change
    addNotification(
        newStatus === 'green' ? 'success' : newStatus === 'red' ? 'danger' : 'warning',
        'تغییر وضعیت پروژه',
        `وضعیت پروژه "${projectsArray[idx].name}" به "${newText}" تغییر کرد`
    );
    
    indicator.className = `status-indicator status-${newStatus}`;
    const tooltip = indicator.querySelector('.status-tooltip');
    if (tooltip) {
        tooltip.textContent = newText;
    }
    });
});

if(currentUser.role === "management" || currentUser.role === "admin") {
    document.querySelectorAll('.delete-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const idx = btn.getAttribute('data-index');
        showConfirmDialog("آیا از حذف این پروژه اطمینان دارید؟", () => {
        const deletedProject = projectsArray[idx];
        projectsArray.splice(idx, 1);
        saveProjects(projectsArray);
        
        // Add notification for project deletion
        addNotification('danger', 'حذف پروژه', `پروژه "${deletedProject.name}" حذف شد`);
        
        renderProjectsTable();
        updateStats();
        });
    });
    });
}
}

function renderNotifications() {
const notifList = document.getElementById('notificationList');
if (!notifList) return;

const notifications = loadNotifications();

if (notifications.length === 0) {
    notifList.innerHTML = `
    <div class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>هیچ اعلانی وجود ندارد</p>
    </div>
    `;
    return;
}

notifList.innerHTML = "";
notifications.forEach((notif, idx) => {
    const iconClass = notif.type === 'success' ? 'fa-check-circle success' : 
                    notif.type === 'warning' ? 'fa-exclamation-triangle warning' :
                    notif.type === 'danger' ? 'fa-times-circle danger' : 'fa-info-circle info';
    
    const time = new Date(notif.timestamp);
    const timeStr = time.toLocaleDateString('fa-IR') + ' ' + time.toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'});
    
    const div = document.createElement('div');
    div.className = `notification-item ${notif.read ? '' : 'unread'}`;
    div.innerHTML = `
    <div class="notification-icon ${notif.type}">
        <i class="fas ${iconClass.split(' ')[0]}"></i>
    </div>
    <div class="notification-content">
        <div class="notif-title">${escapeHtml(notif.title)}</div>
        <div class="notif-message">${escapeHtml(notif.message)}</div>
        <div class="notif-time">${timeStr}</div>
    </div>
    <div class="notification-actions">
        ${!notif.read ? `<button class="mark-read-btn" data-id="${notif.id}" title="خوانده شده"><i class="fas fa-check"></i></button>` : ''}
        <button class="delete-notif-btn" data-id="${notif.id}" title="حذف"><i class="fas fa-times"></i></button>
    </div>
    `;
    notifList.appendChild(div);
});

// Event listeners
document.querySelectorAll('.mark-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
    const id = parseInt(btn.getAttribute('data-id'));
    let notifications = loadNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications(notifications);
        renderNotifications();
        updateNotificationBadge();
    }
    });
});

document.querySelectorAll('.delete-notif-btn').forEach(btn => {
    btn.addEventListener('click', () => {
    const id = parseInt(btn.getAttribute('data-id'));
    let notifications = loadNotifications();
    notifications = notifications.filter(n => n.id !== id);
    saveNotifications(notifications);
    renderNotifications();
    updateNotificationBadge();
    });
});
}

function showConfirmDialog(message, onConfirm) {
const modalDiv = document.createElement('div');
modalDiv.className = 'modal';
modalDiv.innerHTML = `
    <div class="modal-content">
    <div class="modal-header"><h3>⚠️ تأیید حذف</h3><button class="close-modal">&times;</button></div>
    <p>${message}</p>
    <div class="modal-actions">
        <button id="confirmYesBtn" class="btn btn-danger">بله، حذف شود</button>
        <button id="confirmNoBtn" class="btn">لغو</button>
    </div>
    </div>
`;
document.body.appendChild(modalDiv);
const closeModal = () => modalDiv.remove();
modalDiv.querySelector('.close-modal').addEventListener('click', closeModal);
modalDiv.querySelector('#confirmNoBtn').addEventListener('click', closeModal);
modalDiv.querySelector('#confirmYesBtn').addEventListener('click', () => {
    onConfirm();
    closeModal();
});
}

function escapeHtml(str) { 
return String(str).replace(/[&<>]/g, function(m){
    if(m==='&') return '&amp;'; 
    if(m==='<') return '&lt;'; 
    if(m==='>') return '&gt;'; 
    return m;
}); 
}

function renderUsersTable() {
if (!usersListBody) return;
const allUsers = loadUsers();
usersListBody.innerHTML = "";
allUsers.forEach((user, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${escapeHtml(user.username)}</td>
    <td>${user.role === 'management' ? 'مدیر کل' : (user.role === 'admin' ? 'ادمین' : 'کاربر معمولی')}</td>
    <td>
        ${currentUser.role === "management" ? `<select class="role-select" data-username="${user.username}">
        <option value="management" ${user.role === 'management' ? 'selected' : ''}>مدیریت</option>
        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ادمین</option>
        <option value="user" ${user.role === 'user' ? 'selected' : ''}>کاربر معمولی</option>
        </select>` : '---'}
        </td>
    <td>${currentUser.role === "management" && user.username !== currentUser?.username ? `<button class="delete-user-btn btn-danger btn" data-username="${user.username}">حذف</button>` : 'غیرقابل حذف'}</td>
    `;
    usersListBody.appendChild(tr);
});

if(currentUser.role === "management") {
    document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', (e) => {
        const targetUsername = select.getAttribute('data-username');
        const newRole = select.value;
        let usersArr = loadUsers();
        const userIndex = usersArr.findIndex(u => u.username === targetUsername);
        if(userIndex !== -1 && usersArr[userIndex].username !== defaultAdmin.username) {
        const oldRole = usersArr[userIndex].role;
        usersArr[userIndex].role = newRole;
        saveUsers(usersArr);
        
        addNotification('info', 'تغییر نقش کاربر', `نقش کاربر "${targetUsername}" از "${oldRole}" به "${newRole}" تغییر کرد`);
        
        renderUsersTable();
        } else if(usersArr[userIndex]?.username === defaultAdmin.username) {
        alert("نقش مدیر اصلی قابل تغییر نیست");
        renderUsersTable();
        }
    });
    });
    
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const username = btn.getAttribute('data-username');
        if(username === defaultAdmin.username) { 
        alert("اکانت مدیریت اصلی قابل حذف نیست"); 
        return; 
        }
        showConfirmDialog(`حذف کاربر "${username}" قطعی است؟`, () => {
        let usersArr = loadUsers();
        usersArr = usersArr.filter(u => u.username !== username);
        saveUsers(usersArr);
        
        addNotification('danger', 'حذف کاربر', `کاربر "${username}" از سیستم حذف شد`);
        
        renderUsersTable();
        });
    });
    });
}
}

function openAddProjectModal() {
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `
    <div class="modal-content">
    <div class="modal-header">
        <h3><i class="fas fa-code-branch"></i> ثبت پروژه جدید</h3>
        <button class="close-modal">&times;</button>
    </div>
    <div class="form-grid">
        <div class="form-group">
        <label><i class="fas fa-tag"></i> نام پروژه</label>
        <input id="projName" placeholder="مثال: فروشگاه آنلاین">
        </div>
        <div class="form-group">
        <label><i class="fas fa-calendar-alt"></i> تاریخ شروع</label>
        <input type="date" id="projStart">
        </div>
        <div class="form-group">
        <label><i class="fas fa-calendar-check"></i> تاریخ تحویل</label>
        <input type="date" id="projEnd">
        </div>
        <div class="form-group">
        <label><i class="fas fa-money-bill"></i> مبلغ (تومان)</label>
        <input type="number" id="projAmount" placeholder="مبلغ به تومان">
        </div>
        <div class="form-group">
        <label><i class="fas fa-user-tie"></i> نام کارفرما</label>
        <input id="projClient" placeholder="نام کارفرما">
        </div>
        <div class="form-group">
        <label><i class="fas fa-phone"></i> شماره کارفرما</label>
        <input id="projPhone" placeholder="شماره تماس">
        </div>
        <div class="form-group-full">
        <label><i class="fas fa-align-right"></i> توضیحات پروژه</label>
        <textarea id="projDesc" rows="4" placeholder="توضیحات کامل پروژه، تکنولوژی‌ها، نیازمندی‌ها..."></textarea>
        </div>
    </div>
    <div class="modal-actions">
        <button id="submitProjectBtn" class="btn-primary"><i class="fas fa-save"></i> ذخیره پروژه</button>
        <button id="cancelModalBtn" class="btn">انصراف</button>
    </div>
    </div>
`;
document.body.appendChild(modal);

const close = () => modal.remove();
modal.querySelector('.close-modal').addEventListener('click', close);
modal.querySelector('#cancelModalBtn').addEventListener('click', close);

modal.querySelector('#submitProjectBtn').addEventListener('click', () => {
    const name = modal.querySelector('#projName').value.trim();
    const desc = modal.querySelector('#projDesc').value.trim();
    const start = modal.querySelector('#projStart').value;
    const end = modal.querySelector('#projEnd').value;
    const amount = parseFloat(modal.querySelector('#projAmount').value);
    const client = modal.querySelector('#projClient').value.trim();
    const phone = modal.querySelector('#projPhone').value.trim();
    
    if(!name || !desc || !start || !end || isNaN(amount) || !client || !phone) {
    alert("تمامی فیلدها الزامی است");
    return;
    }
    
    projectsArray.push({ 
    name, 
    desc, 
    startDate: start, 
    endDate: end, 
    amount, 
    clientName: client, 
    clientPhone: phone,
    status: 'orange'
    });
    saveProjects(projectsArray);
    
    addNotification('success', 'پروژه جدید', `پروژه "${name}" با موفقیت ثبت شد`);
    
    renderProjectsTable();
    updateStats();
    close();
});
}

function openAddUserModal() {
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `
    <div class="modal-content">
    <div class="modal-header">
        <h3><i class="fas fa-user-plus"></i> ایجاد حساب کاربری جدید</h3>
        <button class="close-modal">&times;</button>
    </div>
    <div class="form-grid">
        <div class="form-group">
        <label><i class="fas fa-user"></i> نام کاربری</label>
        <input id="newUsername" placeholder="نام کاربری (منحصر به فرد)">
        </div>
        <div class="form-group">
        <label><i class="fas fa-lock"></i> رمز عبور</label>
        <input type="password" id="newPassword" placeholder="رمز عبور قوی">
        </div>
        <div class="form-group">
        <label><i class="fas fa-user-shield"></i> تأیید رمز عبور</label>
        <input type="password" id="confirmPassword" placeholder="تکرار رمز عبور">
        </div>
        <div class="form-group">
        <label><i class="fas fa-id-badge"></i> سطح دسترسی</label>
        <select id="userRole">
            <option value="user">کاربر معمولی (فقط مشاهده)</option>
            <option value="admin">ادمین (مدیریت پروژه‌ها)</option>
            <option value="management">مدیر کل (دسترسی کامل)</option>
        </select>
        </div>
    </div>
    <div class="modal-actions">
        <button id="submitUserBtn" class="btn-primary"><i class="fas fa-check-circle"></i> ایجاد حساب</button>
        <button id="cancelUserModalBtn" class="btn">انصراف</button>
    </div>
    </div>
`;
document.body.appendChild(modal);

const close = () => modal.remove();
modal.querySelector('.close-modal').addEventListener('click', close);
modal.querySelector('#cancelUserModalBtn').addEventListener('click', close);

modal.querySelector('#submitUserBtn').addEventListener('click', () => {
    const username = modal.querySelector('#newUsername').value.trim();
    const password = modal.querySelector('#newPassword').value;
    const confirm = modal.querySelector('#confirmPassword').value;
    const role = modal.querySelector('#userRole').value;
    
    if(!username || !password) {
    alert("نام کاربری و رمز عبور الزامی است");
    return;
    }
    
    if(password !== confirm) {
    alert("رمز عبور و تکرار آن مطابقت ندارند");
    return;
    }
    
    let usersArr = loadUsers();
    if(usersArr.find(u => u.username === username)) {
    alert("این نام کاربری قبلاً ثبت شده است");
    return;
    }
    
    usersArr.push({ username, password, role });
    saveUsers(usersArr);
    
    addNotification('success', 'کاربر جدید', `کاربر "${username}" با نقش ${role} ایجاد شد`);
    
    renderUsersTable();
    alert(`کاربر "${username}" با نقش ${role === 'management' ? 'مدیر کل' : (role === 'admin' ? 'ادمین' : 'کاربر عادی')} ایجاد شد`);
    close();
});
}

function switchTab(tabId) {
projectsTabDiv.classList.add('hidden');
usersTabDiv.classList.add('hidden');
settingsTabDiv.classList.add('hidden');
notificationsTabDiv.classList.add('hidden');
if(tabId === 'projects') projectsTabDiv.classList.remove('hidden');
if(tabId === 'users') usersTabDiv.classList.remove('hidden');
if(tabId === 'settings') settingsTabDiv.classList.remove('hidden');
if(tabId === 'notifications') {
    notificationsTabDiv.classList.remove('hidden');
    renderNotifications();
}

document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
if(tabId === 'projects') document.querySelector('[data-tab="projects"]')?.classList.add('active');
if(tabId === 'users') usersTabBtn.classList.add('active');
if(tabId === 'settings') settingsTabBtn.classList.add('active');
if(tabId === 'notifications') notificationsTabBtn.classList.add('active');
if(tabId === 'users') renderUsersTable();
}

function initDashboard() {
projectsArray = loadProjects();

let needsUpdate = false;
projectsArray.forEach(proj => {
    if (!proj.status) {
    proj.status = 'orange';
    needsUpdate = true;
    }
});
if (needsUpdate) {
    saveProjects(projectsArray);
}

renderProjectsTable();
updateStats();
refreshUIByRole();

// Add welcome notification on first load
const notifications = loadNotifications();
if (notifications.length === 0) {
    addNotification('info', 'خوش آمدید', `به پنل مدیریت خوش آمدید، ${currentUser.username} عزیز!`);
}
}

// Login handler
loginBtn.addEventListener('click', () => {
const username = loginUsername.value.trim();
const password = loginPassword.value.trim();
const users = loadUsers();
const found = users.find(u => u.username === username && u.password === password);
if(found) {
    currentUser = { username: found.username, role: found.role };
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({ username: found.username, role: found.role }));
    sidebarUsernameSpan.innerText = found.username;
    let roleText = found.role === 'management' ? 'مدیر کل' : (found.role === 'admin' ? 'ادمین' : 'کاربر عادی');
    sidebarRoleBadge.innerText = roleText;
    sidebarRoleBadge.className = `role-badge role-${found.role === 'management' ? 'admin' : (found.role === 'admin' ? 'manager' : 'user')}`;
    loginPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
    initDashboard();
} else {
    alert("نام کاربری یا رمز عبور اشتباه است.");
}
});

createUserBtn?.addEventListener('click', () => {
if(currentUser?.role !== "management") {
    alert("فقط مدیر کل امکان ساخت کاربر جدید را دارد");
    return;
}
openAddUserModal();
});

// Notifications controls
const markAllReadBtn = document.getElementById('markAllReadBtn');
if(markAllReadBtn) {
markAllReadBtn.addEventListener('click', () => {
    let notifications = loadNotifications();
    notifications = notifications.map(n => ({...n, read: true}));
    saveNotifications(notifications);
    renderNotifications();
    updateNotificationBadge();
});
}

const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
if(clearNotificationsBtn) {
clearNotificationsBtn.addEventListener('click', () => {
    showConfirmDialog("همه اعلان‌ها پاک شوند؟", () => {
    saveNotifications([]);
    renderNotifications();
    updateNotificationBadge();
    });
});
}

if(clearAllProjectsBtn) {
clearAllProjectsBtn.addEventListener('click', () => {
    if(currentUser.role !== "management") return alert("دسترسی ندارید");
    showConfirmDialog("هشدار: تمام پروژه‌ها برای همیشه حذف می‌شوند. ادامه می‌دهید؟", () => {
    projectsArray = [];
    saveProjects(projectsArray);
    
    addNotification('danger', 'حذف همه پروژه‌ها', 'تمام پروژه‌ها از سیستم پاک شدند');
    
    renderProjectsTable();
    updateStats();
    });
});
}

addProjectBtn?.addEventListener('click', () => {
if(currentUser.role === "user") { 
    alert("شما دسترسی افزودن پروژه ندارید"); 
    return; 
}
openAddProjectModal();
});

document.querySelectorAll('[data-tab]').forEach(btn => {
btn.addEventListener('click', (e) => {
    const tab = btn.getAttribute('data-tab');
    if(tab === 'users' && currentUser.role !== "management") { 
    alert("فقط مدیرکل به کاربران دسترسی دارد"); 
    return; 
    }
    if(tab === 'settings' && currentUser.role !== "management") { 
    alert("تنظیمات فقط برای مدیرکل است"); 
    return; 
    }
    switchTab(tab);
});
});

sidebarLogout.addEventListener('click', () => {
localStorage.removeItem(STORAGE_SESSION);
currentUser = null;
dashboardPage.classList.add('hidden');
loginPage.classList.remove('hidden');
loginUsername.value = '';
loginPassword.value = '';
});

// Auto Session Check
(function checkSession() {
const session = localStorage.getItem(STORAGE_SESSION);
if(session && loginPage && dashboardPage) {
    try {
    const sess = JSON.parse(session);
    const users = loadUsers();
    const valid = users.find(u=> u.username === sess.username);
    if(valid) {
        currentUser = { username: valid.username, role: valid.role };
        sidebarUsernameSpan.innerText = valid.username;
        sidebarRoleBadge.innerText = valid.role === 'management' ? 'مدیر کل' : (valid.role === 'admin' ? 'ادمین' : 'کاربر');
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        initDashboard();
    } else {
        localStorage.removeItem(STORAGE_SESSION);
    }
    } catch(e){}
}
})();

