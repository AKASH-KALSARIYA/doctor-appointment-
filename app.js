import { db } from "./firebase.js";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const doctorsCollection = collection(db, "doctors");
let doctors = [];

// EMERGENCY: Force load local doctors
window.loadEmergencyDoctors = function() {
    console.log("🆘 EMERGENCY: Loading local doctors");
    
    if (window.doctorsData && Array.isArray(window.doctorsData)) {
        doctors = [...window.doctorsData];
        console.log(`✅ Loaded ${doctors.length} local doctors`);
        
        showDoctors(doctors);
        updateDoctorCount();
        showNotification(`Loaded ${doctors.length} demo doctors`, 'success');
        
        // Hide emergency button if exists
        const emergencyBtn = document.getElementById('emergencyBtn');
        if (emergencyBtn) emergencyBtn.style.display = 'none';
    } else {
        console.error("❌ No doctorsData found!");
        showNotification("Doctor data not available. Please check console.", 'error');
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 App initialized");
    
    // FIRST: Try to load doctors immediately
    await loadDoctors();
    
    // If still no doctors, show emergency button
    if (doctors.length === 0) {
        showNoDoctorsMessage();
    }
    
    // Initialize other features
    initLanguage();
    initSearch();
    
    // Track page view
    trackEvent('page_view', { page: 'home' });
    
    // Check online status
    updateOnlineStatus();
    
    // Listen for network changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

// Load doctors from Firebase with fallback
async function loadDoctors() {
    try {
        console.log("🌐 Trying to load doctors from Firebase...");
        
        const q = query(doctorsCollection, orderBy("name"));
        const snapshot = await getDocs(q);
        
        doctors = [];
        snapshot.forEach(doc => {
            doctors.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`🔥 Doctors from Firebase: ${doctors.length}`);
        
        // If no doctors in Firebase, use local data
        if (doctors.length === 0) {
            console.log("📭 No doctors in Firebase, trying local data...");
            if (window.doctorsData && window.doctorsData.length > 0) {
                doctors = [...window.doctorsData];
                console.log(`📁 Local doctors loaded: ${doctors.length}`);
                showNotification(`Loaded ${doctors.length} demo doctors`, 'info');
            }
        }
        
        updateDoctorCount();
        showDoctors(doctors);
        
        // Track doctor load
        trackEvent('doctors_loaded', { count: doctors.length });
        
    } catch (error) {
        console.error("❌ Error loading doctors from Firebase:", error);
        
        // Fallback to local data
        if (window.doctorsData && window.doctorsData.length > 0) {
            console.log("📁 Using local doctors data instead");
            doctors = [...window.doctorsData];
            console.log(`📁 Local doctors (fallback): ${doctors.length}`);
            showDoctors(doctors);
            updateDoctorCount();
            showNotification(`Loaded ${doctors.length} demo doctors (offline mode)`, 'info');
        } else {
            console.error("❌ No local doctors data found!");
            showNotification("Could not load doctors. Click 'Load Demo Data' button.", "error");
            showNoDoctorsMessage();
        }
    }
}

// Show "No Doctors" message with emergency button
function showNoDoctorsMessage() {
    const doctorList = document.getElementById('doctorList');
    if (!doctorList) return;
    
    doctorList.innerHTML = `
        <div class="no-doctors" style="text-align:center; padding:50px; grid-column:1/-1; background:white; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size:4rem; margin-bottom:20px;">👨‍⚕️</div>
            <h3>No Doctors Available</h3>
            <p style="color:#7f8c8d; margin-bottom:30px;">Try loading demo data or check your connection</p>
            <button onclick="loadEmergencyDoctors()" 
                    style="background:#3498db; color:white; padding:15px 30px; border:none; border-radius:8px; font-size:16px; cursor:pointer; display:inline-flex; align-items:center; gap:10px;">
                🔄 Load Demo Doctors
            </button>
            <p style="margin-top:20px; font-size:14px; color:#95a5a6;">
                Or use Admin panel to add doctors
            </p>
        </div>
    `;
    
    // Also add emergency button to header
    addEmergencyButtonToHeader();
}

// Add emergency button to header
function addEmergencyButtonToHeader() {
    const headerControls = document.querySelector('.header-controls');
    if (headerControls && !document.getElementById('emergencyBtn')) {
        const emergencyBtn = document.createElement('button');
        emergencyBtn.id = 'emergencyBtn';
        emergencyBtn.innerHTML = '🆘 Load Demo Data';
        emergencyBtn.style.background = '#e74c3c';
        emergencyBtn.style.marginLeft = '10px';
        emergencyBtn.onclick = loadEmergencyDoctors;
        headerControls.appendChild(emergencyBtn);
    }
}

// Display doctors in the grid
function showDoctors(doctorsArray) {
    const doctorList = document.getElementById('doctorList');
    if (!doctorList) {
        console.error("❌ doctorList element not found!");
        return;
    }
    
    console.log(`🩺 Displaying ${doctorsArray.length} doctors`);
    
    doctorList.innerHTML = '';
    
    if (doctorsArray.length === 0) {
        showNoDoctorsMessage();
        return;
    }
    
    doctorsArray.forEach(doctor => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Create doctor image or avatar
        const initials = doctor.name.split(' ').map(n => n[0]).join('');
        const doctorImage = doctor.imageUrl ? 
            `<img src="${doctor.imageUrl}" alt="${doctor.name}" class="doctor-image">` :
            `<div class="doctor-avatar">${initials}</div>`;
        
        card.innerHTML = `
            <div class="doctor-image-container">
                ${doctorImage}
            </div>
            <h3>${doctor.name}</h3>
            <p class="specialization">${doctor.specialization || 'General Physician'}</p>
            <p class="experience">${doctor.experience || 5} years experience</p>
            <p class="fees">₹${doctor.fees || 300} consultation fee</p>
            <p><small>📍 ${doctor.location || 'Rural Health Center'}</small></p>
            <div class="card-actions">
                <button onclick="viewDoctor('${doctor.id}')" class="view-btn">
                    👨‍⚕️ View Details
                </button>
                <button onclick="bookAppointment('${doctor.id}')" class="book-btn">
                    📅 Book Appointment
                </button>
            </div>
        `;
        doctorList.appendChild(card);
        
        // Track doctor view impression
        setTimeout(() => trackDoctorView(doctor.id), 100);
    });
}

// View doctor details
window.viewDoctor = (doctorId) => {
    // Find doctor in array
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) {
        showNotification("Doctor not found. Please try again.", "error");
        return;
    }
    
    localStorage.setItem('selectedDoctorId', doctorId);
    localStorage.setItem('selectedDoctorName', doctor.name);
    localStorage.setItem('selectedDoctorSpecialization', doctor.specialization || '');
    
    console.log(`🔍 Viewing doctor: ${doctor.name}`);
    window.location.href = 'doctor.html';
    
    trackEvent('doctor_view', { doctorId });
};

// Book appointment
window.bookAppointment = (doctorId) => {
    // Find doctor in array
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) {
        showNotification("Doctor not found. Please try again.", "error");
        return;
    }
    
    localStorage.setItem('selectedDoctorId', doctorId);
    localStorage.setItem('selectedDoctorName', doctor.name);
    localStorage.setItem('selectedDoctorFees', doctor.fees || 300);
    
    console.log(`📅 Booking appointment with: ${doctor.name}`);
    window.location.href = 'booking.html';
    
    trackEvent('appointment_start', { doctorId });
};

// Initialize language switcher
function initLanguage() {
    const languageSelect = document.getElementById('language');
    const title = document.getElementById('title');
    
    if (!languageSelect || !title) return;
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    languageSelect.value = savedLanguage;
    
    // Update title based on language
    updateTitle(savedLanguage);
    
    // Handle language change
    languageSelect.addEventListener('change', (e) => {
        const language = e.target.value;
        localStorage.setItem('preferredLanguage', language);
        updateTitle(language);
        
        // Update all text based on language
        updatePageText(language);
        
        trackEvent('language_changed', { language });
    });
}

function updateTitle(language) {
    const title = document.getElementById('title');
    if (!title) return;
    
    if (language === 'hi') {
        title.textContent = 'ग्रामीण डॉक्टर अपॉइंटमेंट सिस्टम';
        const searchInput = document.getElementById('search');
        if (searchInput) searchInput.placeholder = 'डॉक्टर खोजें...';
    } else {
        title.textContent = 'RuralCare Doctor Appointment System';
        const searchInput = document.getElementById('search');
        if (searchInput) searchInput.placeholder = 'Search Doctor...';
    }
}

function updatePageText(language) {
    // Update button texts
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        const text = button.textContent;
        if (text.includes('View Details') || text.includes('विवरण देखें')) {
            button.textContent = language === 'hi' ? 'विवरण देखें' : 'View Details';
        }
        if (text.includes('Book Appointment') || text.includes('अपॉइंटमेंट बुक करें')) {
            button.textContent = language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment';
        }
        if (text.includes('Load Demo Data') || text.includes('डेमो डेटा लोड करें')) {
            button.textContent = language === 'hi' ? 'डेमो डेटा लोड करें' : 'Load Demo Data';
        }
        if (text.includes('Load Demo Doctors') || text.includes('डेमो डॉक्टर लोड करें')) {
            button.textContent = language === 'hi' ? 'डेमो डॉक्टर लोड करें' : 'Load Demo Doctors';
        }
    });
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            showDoctors(doctors);
            return;
        }
        
        const filteredDoctors = doctors.filter(doctor => 
            doctor.name.toLowerCase().includes(searchTerm) ||
            (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm)) ||
            (doctor.qualification && doctor.qualification.toLowerCase().includes(searchTerm)) ||
            (doctor.location && doctor.location.toLowerCase().includes(searchTerm))
        );
        
        showDoctors(filteredDoctors);
        
        // Track search
        if (searchTerm.length > 1) {
            trackEvent('doctor_search', { 
                searchTerm, 
                results: filteredDoctors.length 
            });
        }
    });
}

// Update doctor count
function updateDoctorCount() {
    const doctorCount = document.getElementById('doctor-count');
    if (doctorCount) {
        doctorCount.textContent = `Doctors: ${doctors.length}`;
    }
}

// Update online status
function updateOnlineStatus() {
    const onlineStatus = document.getElementById('online-status');
    const offlineNotification = document.getElementById('offlineNotification');
    
    if (onlineStatus) {
        if (navigator.onLine) {
            onlineStatus.innerHTML = '🟢 Online';
            onlineStatus.style.color = '#27ae60';
        } else {
            onlineStatus.innerHTML = '🔴 Offline';
            onlineStatus.style.color = '#e74c3c';
            
            // Show offline actions count
            if (window.getOfflineStats) {
                const stats = window.getOfflineStats();
                if (stats && stats.pending > 0) {
                    onlineStatus.innerHTML += ` (${stats.pending} pending)`;
                }
            }
        }
    }
    
    if (offlineNotification) {
        offlineNotification.style.display = navigator.onLine ? 'none' : 'block';
    }
    
    // Sync data if coming online
    if (navigator.onLine && window.syncOfflineData) {
        syncOfflineData();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <strong>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</strong>
        <span>${message}</span>
    `;
    
    notificationArea.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Announce to screen reader
    if (window.announceToScreenReader) {
        announceToScreenReader(message);
    }
}

// Analytics functions
window.showAnalytics = () => {
    const dashboard = document.getElementById('analyticsDashboard');
    if (dashboard) {
        dashboard.style.display = 'block';
        if (window.generateAnalyticsReport) {
            generateAnalyticsReport();
        }
        trackEvent('analytics_viewed');
    }
};

window.hideAnalytics = () => {
    const dashboard = document.getElementById('analyticsDashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
};

// Export functions for other files
window.showNotification = showNotification;
window.doctors = doctors;

// Add CSS for doctor images
const doctorImageStyles = `
.doctor-image-container {
    width: 100%;
    height: 180px;
    overflow: hidden;
    border-radius: 10px;
    margin-bottom: 15px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.doctor-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.doctor-avatar {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    font-weight: bold;
}

.card-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.card-actions button {
    flex: 1;
    padding: 10px;
    font-size: 14px;
}

.view-btn {
    background: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s;
}

.view-btn:hover {
    background: #2980b9;
}

.book-btn {
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s;
}

.book-btn:hover {
    background: #219653;
}

.no-doctors {
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = doctorImageStyles;
document.head.appendChild(styleSheet);

// Debug function to check data
window.debugDoctors = function() {
    console.group('👨‍⚕️ DOCTORS DEBUG INFO');
    console.log('doctors array:', doctors);
    console.log('doctors length:', doctors.length);
    console.log('window.doctorsData:', window.doctorsData);
    console.log('Firebase config:', window.firebaseConfig);
    console.groupEnd();
    
    alert(`Doctors in memory: ${doctors.length}\nLocal doctors data: ${window.doctorsData?.length || 0}`);
};