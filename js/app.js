// ============================================
// Goodfaith Hospital Ltd - Public Website JS (Safe Hybrid)
// ============================================

const FIREBASE_PROJECT_ID = "goodfaith-hospital";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const DEFAULT_SETTINGS = {
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

const DEFAULT_DOCTORS = [
    { id: 1, name: "Dr. Amara Okeke", specialty: "Consultant Cardiologist", phone: "08012345671", bio: "Expert in heart-related conditions with over 12 years experience." },
    { id: 2, name: "Dr. Chinedu Eze", specialty: "Orthopedic Surgeon", phone: "08012345672", bio: "Specializes in bone, joint and sports injuries." },
    { id: 3, name: "Dr. Fatima Bello", specialty: "Pediatrician", phone: "08012345673", bio: "Dedicated to the health and wellness of children." },
    { id: 4, name: "Dr. Tunde Adebayo", specialty: "Consultant Neurologist", phone: "08012345674", bio: "Expert in brain and nervous system disorders." },
    { id: 5, name: "Dr. Ngozi Nwosu", specialty: "Obstetrician & Gynecologist", phone: "08012345675", bio: "Specialist in women's health and maternity care." },
    { id: 6, name: "Dr. Ibrahim Yusuf", specialty: "General Physician", phone: "08012345676", bio: "First point of care for general health concerns." }
];

function initData() {
    if (!localStorage.getItem('gf_settings')) {
        localStorage.setItem('gf_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem('gf_doctors') || JSON.parse(localStorage.getItem('gf_doctors')).length === 0) {
        localStorage.setItem('gf_doctors', JSON.stringify(DEFAULT_DOCTORS));
    }
    if (!localStorage.getItem('gf_appointments')) {
        localStorage.setItem('gf_appointments', JSON.stringify([]));
    }
    let visits = parseInt(localStorage.getItem('gf_visits') || '0');
    visits++;
    localStorage.setItem('gf_visits', visits.toString());
}

function getSettings() {
    return JSON.parse(localStorage.getItem('gf_settings')) || DEFAULT_SETTINGS;
}

function getDoctors() {
    return JSON.parse(localStorage.getItem('gf_doctors')) || DEFAULT_DOCTORS;
}

function getAppointments() {
    return JSON.parse(localStorage.getItem('gf_appointments')) || [];
}

function saveAppointments(appointments) {
    localStorage.setItem('gf_appointments', JSON.stringify(appointments));
}

async function sendAppointmentToFirebase(appointment) {
    try {
        await fetch(`${FIRESTORE_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    name: { stringValue: appointment.name },
                    phone: { stringValue: appointment.phone },
                    email: { stringValue: appointment.email },
                    doctor: { stringValue: appointment.doctor },
                    date: { stringValue: appointment.date },
                    time: { stringValue: appointment.time },
                    paymentMethod: { stringValue: appointment.paymentMethod },
                    paymentStatus: { stringValue: appointment.paymentStatus },
                    message: { stringValue: appointment.message },
                    status: { stringValue: appointment.status },
                    createdAt: { stringValue: appointment.createdAt }
                }
            })
        });
    } catch (e) {
        console.error("Online sync error:", e);
    }
}

function applySettings() {
    const s = getSettings();
    const nameEls = ['hospitalNameNav', 'hospitalNameHero', 'hospitalNameAbout', 'hospitalNameFooter', 'hospitalNameCopy'];
    nameEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = s.name;
    });

    const phoneEl = document.getElementById('phoneDisplay');
    const whatsappEl = document.getElementById('whatsappDisplay');
    const addressEl = document.getElementById('addressDisplay');
    const hoursEl = document.getElementById('hoursDisplay');
    const footerPhone = document.getElementById('footerPhone');
    const footerWhatsapp = document.getElementById('footerWhatsapp');
    const footerAddress = document.getElementById('footerAddress');

    if (phoneEl) phoneEl.textContent = s.phone;
    if (whatsappEl) whatsappEl.textContent = s.phone;
    if (addressEl) addressEl.textContent = s.address;
    if (hoursEl) hoursEl.textContent = s.hours;
    if (footerPhone) footerPhone.textContent = s.phone;
    if (footerWhatsapp) footerWhatsapp.textContent = s.phone;
    if (footerAddress) footerAddress.textContent = s.address;

    const bankNameEl = document.getElementById('bankName');
    const accountNameEl = document.getElementById('accountName');
    const accountNumberEl = document.getElementById('accountNumber');
    if (bankNameEl) bankNameEl.textContent = s.bankName || 'Zenith Bank';
    if (accountNameEl) accountNameEl.textContent = s.accountName || s.name;
    if (accountNumberEl) accountNumberEl.textContent = s.accountNumber || '1234567890';

    const waFloat = document.getElementById('whatsappFloat');
    if (waFloat) {
        const number = (s.whatsapp || '').replace(/\D/g, '');
        waFloat.href = `https://wa.me/${number}?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20your%20services.`;
    }

    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function renderDoctors() {
    const doctors = getDoctors();
    const grid = document.getElementById('doctorsGrid');
    const select = document.getElementById('preferredDoctor');
    
    if (!grid) return;

    if (doctors.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-12">No doctors available at the moment.</div>`;
        return;
    }

    const colors = ['bg-teal-600', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];

    grid.innerHTML = doctors.map((doc, i) => `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover text-center">
            <div class="w-20 h-20 ${colors[i % colors.length]} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                ${doc.name.split(' ').map(n => n[0]).slice(0,2).join('')}
            </div>
            <h3 class="font-semibold text-navy-900 text-lg">${doc.name}</h3>
            <p class="text-teal-600 text-sm font-medium mt-1">${doc.specialty}</p>
            <p class="text-gray-500 text-sm mt-3 leading-relaxed">${doc.bio || ''}</p>
        </div>
    `).join('');

    if (select) {
        select.innerHTML = `<option value="">Any Available Doctor</option>` + 
            doctors.map(d => `<option value="${d.name}">${d.name} — ${d.specialty}</option>`).join('');
    }
}

function setupPaymentMethod() {
    const paymentSelect = document.getElementById('paymentMethod');
    const bankBox = document.getElementById('bankDetailsBox');

    if (paymentSelect && bankBox) {
        paymentSelect.addEventListener('change', function() {
            if (this.value === 'Bank Transfer') {
                bankBox.classList.remove('hidden');
            } else {
                bankBox.classList.add('hidden');
                const checkbox = document.getElementById('hasTransferred');
                if (checkbox) checkbox.checked = false;
            }
        });
    }
}

function setupAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const paymentMethod = document.getElementById('paymentMethod').value;
        const hasTransferred = document.getElementById('hasTransferred')?.checked || false;

        let paymentStatus = 'Pending';
        if (paymentMethod === 'Cash') {
            paymentStatus = 'Pay at Hospital';
        } else if (paymentMethod === 'Bank Transfer') {
            if (hasTransferred) {
                paymentStatus = 'Transferred - Awaiting Confirmation';
            } else {
                paymentStatus = 'Pending';
            }
        }

        const appointment = {
            id: Date.now(),
            name: document.getElementById('patientName').value.trim(),
            phone: document.getElementById('patientPhone').value.trim(),
            email: document.getElementById('patientEmail').value.trim(),
            doctor: document.getElementById('preferredDoctor').value || 'Any Available',
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus,
            hasTransferred: hasTransferred,
            message: document.getElementById('patientMessage').value.trim(),
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        const appointments = getAppointments();
        appointments.unshift(appointment);
        saveAppointments(appointments);

        // Send to Firebase in the background
        await sendAppointmentToFirebase(appointment);

        const successEl = document.getElementById('formSuccess');
        if (hasTransferred) {
            successEl.textContent = 'Appointment submitted! You marked that you have transferred. We will confirm your payment shortly.';
        } else {
            successEl.textContent = 'Appointment request submitted successfully! We will contact you shortly.';
        }
        successEl.classList.remove('hidden');

        form.reset();
        document.getElementById('bankDetailsBox').classList.add('hidden');

        const s = getSettings();
        const number = (s.whatsapp || '').replace(/\D/g, '');
        const text = encodeURIComponent(
            `Hello, I just booked an appointment:\n\nName: ${appointment.name}\nPhone: ${appointment.phone}\nDoctor: ${appointment.doctor}\nDate: ${appointment.date}\nTime: ${appointment.time}\nPayment: ${appointment.paymentMethod}\nPayment Status: ${appointment.paymentStatus}\nMessage: ${appointment.message}`
        );
        
        setTimeout(() => {
            window.open(`https://wa.me/${number}?text=${text}`, '_blank');
        }, 800);

        setTimeout(() => {
            successEl.classList.add('hidden');
        }, 6000);
    });
}

function setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }
}

function setMinDate() {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initData();
    applySettings();
    renderDoctors();
    setupPaymentMethod();
    setupAppointmentForm();
    setupMobileMenu();
    setMinDate();
});