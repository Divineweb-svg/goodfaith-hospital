// ============================================
// Goodfaith Hospital Ltd - Admin Panel JS (Safe Hybrid)
// ============================================

const FIREBASE_PROJECT_ID = "goodfaith-hospital";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function getSettings() {
    return JSON.parse(localStorage.getItem('gf_settings')) || {
        name: "Goodfaith Hospital Ltd",
        phone: "+234 800 000 0000",
        whatsapp: "2348000000000",
        address: "Lagos, Nigeria",
        hours: "Mon - Sat: 8:00 AM - 6:00 PM",
        password: "admin123",
        bankName: "Zenith Bank",
        accountName: "Goodfaith Hospital Ltd",
        accountNumber: "1234567890"
    };
}

function saveSettings(settings) {
    localStorage.setItem('gf_settings', JSON.stringify(settings));
}

function getDoctors() {
    return JSON.parse(localStorage.getItem('gf_doctors')) || [];
}

function saveDoctors(doctors) {
    localStorage.setItem('gf_doctors', JSON.stringify(doctors));
}

function getAppointments() {
    return JSON.parse(localStorage.getItem('gf_appointments')) || [];
}

function saveAppointments(appointments) {
    localStorage.setItem('gf_appointments', JSON.stringify(appointments));
}

// Sync incoming online appointments from Firebase Firestore
async function syncOnlineAppointments() {
    try {
        const res = await fetch(`${FIRESTORE_URL}/appointments`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.documents) return;

        const onlineAppointments = data.documents.map(doc => {
            const f = doc.fields || {};
            const docId = doc.name.split('/').pop();
            return {
                id: docId,
                firebaseId: docId,
                name: f.name?.stringValue || 'Unknown',
                phone: f.phone?.stringValue || '',
                email: f.email?.stringValue || '',
                doctor: f.doctor?.stringValue || 'Any Available',
                date: f.date?.stringValue || '',
                time: f.time?.stringValue || '',
                paymentMethod: f.paymentMethod?.stringValue || 'Cash',
                paymentStatus: f.paymentStatus?.stringValue || 'Pending',
                message: f.message?.stringValue || '',
                status: f.status?.stringValue || 'Pending'
            };
        });

        if (onlineAppointments.length > 0) {
            saveAppointments(onlineAppointments);
            loadAppointmentsTable();
            loadOverview();
        }
    } catch (err) {
        console.log("Running with local appointments:", err);
    }
}

async function updateFirebaseAppointment(id, updates) {
    try {
        const fields = {};
        const updateMask = [];
        for (const [key, val] of Object.entries(updates)) {
            fields[key] = { stringValue: String(val) };
            updateMask.push(`updateMask.fieldPaths=${key}`);
        }
        await fetch(`${FIRESTORE_URL}/appointments/${id}?${updateMask.join('&')}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
        });
    } catch (e) {
        console.error("Cloud update error:", e);
    }
}

async function deleteFirebaseAppointment(id) {
    try {
        await fetch(`${FIRESTORE_URL}/appointments/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.error("Cloud delete error:", e);
    }
}

function isLoggedIn() {
    return sessionStorage.getItem('gf_admin_logged') === 'true';
}

function setLoggedIn(value) {
    sessionStorage.setItem('gf_admin_logged', value ? 'true' : 'false');
}

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadOverview();
    loadDoctorsTable();
    loadAppointmentsTable();
    loadSettingsForm();
    syncOnlineAppointments(); // Pull live cloud appointments
}

// Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    const settings = getSettings();
    if (password === settings.password) {
        setLoggedIn(true);
        showDashboard();
        document.getElementById('loginError').classList.add('hidden');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', function() {
    setLoggedIn(false);
    showLogin();
});

// Sidebar navigation
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section');
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
        document.getElementById('section-' + section).classList.remove('hidden');
        const titles = {
            overview: 'Overview',
            doctors: 'Manage Doctors',
            appointments: 'Appointments',
            settings: 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
    });
});

// ========== OVERVIEW ==========
function loadOverview() {
    const doctors = getDoctors();
    const appointments = getAppointments();
    const pending = appointments.filter(a => a.status === 'Pending').length;
    const visits = localStorage.getItem('gf_visits') || '0';
    document.getElementById('statDoctors').textContent = doctors.length;
    document.getElementById('statAppointments').textContent = appointments.length;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statVisitors').textContent = visits;
    const container = document.getElementById('recentAppointments');
    if (appointments.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-sm">No appointments yet.</p>`;
        return;
    }
    container.innerHTML = appointments.slice(0, 5).map(a => `
        <div class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
                <p class="font-medium text-navy-900">${a.name}</p>
                <p class="text-xs text-gray-500">${a.doctor} - ${a.date} - ${a.time}</p>
            </div>
            <div class="text-right">
                <span class="text-xs px-2.5 py-1 rounded-full ${a.status === 'Pending' ? 'bg-amber-50 text-amber-700' : a.status === 'Confirmed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}">${a.status}</span>
                <p class="text-xs text-gray-400 mt-1">${a.paymentStatus || a.paymentMethod || 'N/A'}</p>
            </div>
        </div>
    `).join('');
}

// ========== DOCTORS ==========
function loadDoctorsTable() {
    const doctors = getDoctors();
    const tbody = document.getElementById('doctorsTableBody');
    if (doctors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">No doctors added yet. Click "Add Doctor" to get started.</td></tr>`;
        return;
    }
    tbody.innerHTML = doctors.map(doc => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        ${doc.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                    </div>
                    <span class="font-medium text-navy-900">${doc.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-600">${doc.specialty}</td>
            <td class="px-6 py-4 text-gray-600">${doc.phone || '—'}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="editDoctor(${doc.id})" class="text-teal-600 hover:text-teal-700 mr-3 text-sm font-medium">Edit</button>
                <button onclick="deleteDoctor(${doc.id})" class="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
            </td>
        </tr>
    `).join('');
}

const modal = document.getElementById('doctorModal');
const doctorForm = document.getElementById('doctorForm');
document.getElementById('addDoctorBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add Doctor';
    document.getElementById('doctorId').value = '';
    doctorForm.reset();
    modal.classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('cancelModal').addEventListener('click', () => modal.classList.add('hidden'));

doctorForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('doctorId').value;
    const doctors = getDoctors();
    const doctorData = {
        name: document.getElementById('doctorName').value.trim(),
        specialty: document.getElementById('doctorSpecialty').value.trim(),
        phone: document.getElementById('doctorPhone').value.trim(),
        bio: document.getElementById('doctorBio').value.trim()
    };
    if (id) {
        const index = doctors.findIndex(d => d.id == id);
        if (index !== -1) {
            doctors[index] = { ...doctors[index], ...doctorData };
        }
    } else {
        doctorData.id = Date.now();
        doctors.push(doctorData);
    }
    saveDoctors(doctors);
    loadDoctorsTable();
    loadOverview();
    modal.classList.add('hidden');
});

function editDoctor(id) {
    const doctors = getDoctors();
    const doc = doctors.find(d => d.id == id);
    if (!doc) return;
    document.getElementById('modalTitle').textContent = 'Edit Doctor';
    document.getElementById('doctorId').value = doc.id;
    document.getElementById('doctorName').value = doc.name;
    document.getElementById('doctorSpecialty').value = doc.specialty;
    document.getElementById('doctorPhone').value = doc.phone || '';
    document.getElementById('doctorBio').value = doc.bio || '';
    modal.classList.remove('hidden');
}

function deleteDoctor(id) {
    if (!confirm('Are you sure you want to remove this doctor?')) return;
    let doctors = getDoctors();
    doctors = doctors.filter(d => d.id != id);
    saveDoctors(doctors);
    loadDoctorsTable();
    loadOverview();
}

// ========== APPOINTMENTS ==========
function loadAppointmentsTable() {
    const appointments = getAppointments();
    const tbody = document.getElementById('appointmentsTableBody');
    const empty = document.getElementById('noAppointments');
    if (appointments.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = appointments.map(a => {
        const isAwaiting = a.paymentStatus === 'Transferred - Awaiting Confirmation';
        return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <p class="font-medium text-navy-900">${a.name}</p>
                <p class="text-xs text-gray-400">${a.email || ''}</p>
            </td>
            <td class="px-6 py-4 text-gray-600">${a.phone}</td>
            <td class="px-6 py-4 text-gray-600">${a.doctor}</td>
            <td class="px-6 py-4 text-gray-600">
                <p>${a.date}</p>
                <p class="text-xs text-gray-400">${a.time}</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm font-medium">${a.paymentMethod || 'N/A'}</p>
                <p class="text-xs mt-1 ${isAwaiting ? 'text-amber-600 font-semibold' : 'text-gray-500'}">
                    ${a.paymentStatus || 'N/A'}
                </p>
                ${isAwaiting ? `
                    <button onclick="openPaymentConfirm('${a.id}')" 
                        class="mt-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium transition">
                        Confirm / Reject
                    </button>
                ` : ''}
            </td>
            <td class="px-6 py-4">
                <select onchange="updateStatus('${a.id}', this.value)" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500">
                    <option value="Pending" ${a.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${a.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${a.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="sendReminder('${a.id}')" class="text-green-600 hover:text-green-700 text-sm font-medium">Reminder</button>
                <button onclick="viewAppointment('${a.id}')" class="text-teal-600 hover:text-teal-700 text-sm font-medium">View</button>
                <button onclick="deleteAppointment('${a.id}')" class="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
            </td>
        </tr>
    `}).join('');
}

function updateStatus(id, status) {
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id == id);
    if (index !== -1) {
        appointments[index].status = status;
        saveAppointments(appointments);
        updateFirebaseAppointment(id, { status });
        loadOverview();
    }
}

function openPaymentConfirm(id) {
    const appointments = getAppointments();
    const a = appointments.find(x => x.id == id);
    if (!a) return;
    const confirmed = confirm(`Payment Confirmation\nPatient: ${a.name}\nPhone: ${a.phone}\nHas the patient successfully transferred the money to your account?\nClick OK to CONFIRM payment (mark as Paid)\nClick Cancel to REJECT the transfer`);
    if (confirmed) {
        a.paymentStatus = 'Paid';
        saveAppointments(appointments);
        updateFirebaseAppointment(id, { paymentStatus: 'Paid' });
        alert('Payment has been confirmed as PAID.');
    } else {
        const reject = confirm('Are you sure you want to REJECT this transfer claim?');
        if (reject) {
            a.paymentStatus = 'Rejected';
            saveAppointments(appointments);
            updateFirebaseAppointment(id, { paymentStatus: 'Rejected' });
            alert('Transfer has been marked as REJECTED.');
        }
    }
    loadAppointmentsTable();
    loadOverview();
}

function viewAppointment(id) {
    const appointments = getAppointments();
    const a = appointments.find(x => x.id == id);
    if (!a) return;
    alert(`Patient: ${a.name}\nPhone: ${a.phone}\nEmail: ${a.email || 'N/A'}\nDoctor: ${a.doctor}\nDate: ${a.date}\nTime: ${a.time}\nPayment Method: ${a.paymentMethod || 'N/A'}\nPayment Status: ${a.paymentStatus || 'N/A'}\nMessage: ${a.message || 'None'}Status: ${a.status}`);
}

function sendReminder(id) {
    const appointments = getAppointments();
    const a = appointments.find(x => x.id == id);
    if (!a) return;
    const settings = getSettings();
    const number = (a.phone || '').replace(/\D/g, '');
    const hospitalName = settings.name;
    const message = encodeURIComponent(`Hello ${a.name},\nThis is a reminder from ${hospitalName}.\nYour appointment details:\nDoctor: ${a.doctor}\nDate: ${a.date}\nTime: ${a.time}\nPlease arrive 15 minutes early. Thank you.`);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
}

function deleteAppointment(id) {
    if (!confirm('Delete this appointment request?')) return;
    let appointments = getAppointments();
    appointments = appointments.filter(a => a.id != id);
    saveAppointments(appointments);
    deleteFirebaseAppointment(id);
    loadAppointmentsTable();
    loadOverview();
}

// ========== SETTINGS ==========
function loadSettingsForm() {
    const s = getSettings();
    document.getElementById('settingName').value = s.name || '';
    document.getElementById('settingPhone').value = s.phone || '';
    document.getElementById('settingWhatsapp').value = s.whatsapp || '';
    document.getElementById('settingAddress').value = s.address || '';
    document.getElementById('settingHours').value = s.hours || '';
    document.getElementById('settingBankName').value = s.bankName || '';
    document.getElementById('settingAccountName').value = s.accountName || '';
    document.getElementById('settingAccountNumber').value = s.accountNumber || '';
    document.getElementById('settingPassword').value = s.password || '';
    const sidebarName = document.getElementById('sidebarHospitalName');
    if (sidebarName) sidebarName.textContent = s.name;
    const loginName = document.getElementById('loginHospitalName');
    if (loginName) loginName.textContent = s.name;
}

document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const settings = {
        name: document.getElementById('settingName').value.trim(),
        phone: document.getElementById('settingPhone').value.trim(),
        whatsapp: document.getElementById('settingWhatsapp').value.trim(),
        address: document.getElementById('settingAddress').value.trim(),
        hours: document.getElementById('settingHours').value.trim(),
        bankName: document.getElementById('settingBankName').value.trim(),
        accountName: document.getElementById('settingAccountName').value.trim(),
        accountNumber: document.getElementById('settingAccountNumber').value.trim(),
        password: document.getElementById('settingPassword').value.trim()
    };
    saveSettings(settings);
    const success = document.getElementById('settingsSuccess');
    success.classList.remove('hidden');
    setTimeout(() => success.classList.add('hidden'), 3000);
    loadSettingsForm();
});

// Init
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('gf_settings')) {
        localStorage.setItem('gf_settings', JSON.stringify({
            name: "Goodfaith Hospital Ltd",
            phone: "+234 800 000 0000",
            whatsapp: "2348000000000",
            address: "Lagos, Nigeria",
            hours: "Mon - Sat: 8:00 AM - 6:00 PM",
            password: "admin123",
            bankName: "Zenith Bank",
            accountName: "Goodfaith Hospital Ltd",
            accountNumber: "1234567890"
        }));
    }
    if (!localStorage.getItem('gf_doctors') || JSON.parse(localStorage.getItem('gf_doctors')).length === 0) {
        const defaultDoctors = [
            { id: 1, name: "Dr. Amara Okeke", specialty: "Consultant Cardiologist", phone: "08012345671", bio: "Expert in heart-related conditions with over 12 years experience." },
            { id: 2, name: "Dr. Chinedu Eze", specialty: "Orthopedic Surgeon", phone: "08012345672", bio: "Specializes in bone, joint and sports injuries." },
            { id: 3, name: "Dr. Fatima Bello", specialty: "Pediatrician", phone: "08012345673", bio: "Dedicated to the health and wellness of children." },
            { id: 4, name: "Dr. Tunde Adebayo", specialty: "Consultant Neurologist", phone: "08012345674", bio: "Expert in brain and nervous system disorders." },
            { id: 5, name: "Dr. Ngozi Nwosu", specialty: "Obstetrician & Gynecologist", phone: "08012345675", bio: "Specialist in women's health and maternity care." },
            { id: 6, name: "Dr. Ibrahim Yusuf", specialty: "General Physician", phone: "08012345676", bio: "First point of care for general health concerns." }
        ];
        localStorage.setItem('gf_doctors', JSON.stringify(defaultDoctors));
    }
    if (!localStorage.getItem('gf_appointments')) {
        localStorage.setItem('gf_appointments', JSON.stringify([]));
    }
    if (isLoggedIn()) {
        showDashboard();
    } else {
        showLogin();
    }
});