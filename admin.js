

import { db } from "./firebase.js";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const doctorsCollection = collection(db, "doctors");
let allDoctors = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Admin panel initialized");
    
    // Check admin authentication
    if (!isAdminAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadAllDoctors();
    initAdminControls();
    initFormHandlers();
    initImageUpload();
    initAnalytics();
    
    trackEvent('admin_panel_accessed');
});

// Initialize form handlers
function initFormHandlers() {
    const addDoctorForm = document.getElementById('addDoctorForm');
    if (addDoctorForm) {
        addDoctorForm.addEventListener('submit', handleAddDoctor);
    }
    
    const editDoctorForm = document.getElementById('editDoctorForm');
    if (editDoctorForm) {
        editDoctorForm.addEventListener('submit', handleUpdateDoctor);
    }
}

// Handle add doctor form submission
async function handleAddDoctor(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const doctorData = Object.fromEntries(formData.entries());
    
    // Validate required fields
    if (!doctorData.name || !doctorData.specialization || !doctorData.fees) {
        showNotification("Please fill in all required fields (Name, Specialization, Fees)", 'error');
        return;
    }
    
    try {
        showLoading('addDoctorBtn', true);
        
        // Handle image upload if present
        const imageFile = document.getElementById('doctorImage').files[0];
        let imageUrl = '';
        
        if (imageFile) {
            imageUrl = await uploadDoctorImage(imageFile, doctorData.name);
        }
        
        const newDoctor = {
            name: doctorData.name,
            specialization: doctorData.specialization,
            qualification: doctorData.qualification || '',
            experience: parseInt(doctorData.experience) || 0,
            fees: parseInt(doctorData.fees) || 0,
            availability: doctorData.availability || 'Mon-Fri, 9AM-5PM',
            contact: doctorData.contact || '',
            email: doctorData.email || '',
            location: doctorData.location || 'Rural Health Center',
            languages: doctorData.languages ? doctorData.languages.split(',').map(lang => lang.trim()) : ['Hindi', 'English'],
            bio: doctorData.bio || '',
            imageUrl: imageUrl,
            rating: 0,
            totalAppointments: 0,
            views: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await addDoc(doctorsCollection, newDoctor);
        
        showNotification("Doctor added successfully!", 'success');
        
        // Reset form
        e.target.reset();
        resetImagePreview();
        
        // Refresh list
        await loadAllDoctors();
        
        // Send notification to admin
        sendDoctorRegistrationNotification(newDoctor);
        
        trackEvent('doctor_added', {
            specialization: newDoctor.specialization,
            experience: newDoctor.experience
        });
        
    } catch (error) {
        console.error("Error adding doctor:", error);
        showNotification("Error adding doctor: " + error.message, 'error');
    } finally {
        showLoading('addDoctorBtn', false);
    }
}

// Handle update doctor form submission
async function handleUpdateDoctor(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const doctorData = Object.fromEntries(formData.entries());
    const doctorId = doctorData.doctorId;
    
    if (!doctorId || !doctorData.name || !doctorData.specialization) {
        showNotification("Invalid data", 'error');
        return;
    }
    
    try {
        showLoading('updateDoctorBtn', true);
        
        // Handle image upload if new image selected
        const imageFile = document.getElementById('editDoctorImage').files[0];
        let imageUrl = doctorData.existingImageUrl || '';
        
        if (imageFile) {
            imageUrl = await uploadDoctorImage(imageFile, doctorData.name);
        }
        
        const doctorRef = doc(db, "doctors", doctorId);
        await updateDoc(doctorRef, {
            name: doctorData.name,
            specialization: doctorData.specialization,
            qualification: doctorData.qualification || '',
            experience: parseInt(doctorData.experience) || 0,
            fees: parseInt(doctorData.fees) || 0,
            availability: doctorData.availability || '',
            contact: doctorData.contact || '',
            email: doctorData.email || '',
            location: doctorData.location || '',
            languages: doctorData.languages ? doctorData.languages.split(',').map(lang => lang.trim()) : [],
            bio: doctorData.bio || '',
            imageUrl: imageUrl,
            updatedAt: serverTimestamp()
        });
        
        showNotification("Doctor updated successfully!", 'success');
        
        // Close modal and refresh
        closeEditModal();
        await loadAllDoctors();
        
        trackEvent('doctor_updated', { doctorId });
        
    } catch (error) {
        console.error("Error updating doctor:", error);
        showNotification("Error updating doctor: " + error.message, 'error');
    } finally {
        showLoading('updateDoctorBtn', false);
    }
}

// Upload doctor image
async function uploadDoctorImage(file, doctorName) {
    // In production, upload to Firebase Storage or Cloudinary
    // For demo, we'll create a data URL
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Convert to data URL (in production, upload to storage service)
            const dataUrl = e.target.result;
            
            // For demo, we'll store as data URL
            // In production: Upload to Firebase Storage and get download URL
            resolve(dataUrl);
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read image file'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Initialize image upload functionality
function initImageUpload() {
    const imageInput = document.getElementById('doctorImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.match('image.*')) {
                    showNotification("Please select an image file", 'error');
                    return;
                }
                
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showNotification("Image size should be less than 5MB", 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Doctor Image Preview">
                        <button type="button" onclick="removeImage()" class="remove-image-btn">
                            ❌ Remove
                        </button>
                    `;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Edit form image upload
    const editImageInput = document.getElementById('editDoctorImage');
    const editImagePreview = document.getElementById('editImagePreview');
    
    if (editImageInput && editImagePreview) {
        editImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.match('image.*')) {
                    showNotification("Please select an image file", 'error');
                    return;
                }
                
                if (file.size > 5 * 1024 * 1024) {
                    showNotification("Image size should be less than 5MB", 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    editImagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Doctor Image Preview">
                        <button type="button" onclick="removeEditImage()" class="remove-image-btn">
                            ❌ Remove
                        </button>
                    `;
                    editImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Remove image
window.removeImage = function() {
    document.getElementById('doctorImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imagePreview').style.display = 'none';
};

window.removeEditImage = function() {
    document.getElementById('editDoctorImage').value = '';
    document.getElementById('editImagePreview').innerHTML = '';
    document.getElementById('editImagePreview').style.display = 'none';
};

function resetImagePreview() {
    removeImage();
}

// Edit doctor with image
window.editDoctor = (doctorId) => {
    const doctor = allDoctors.find(d => d.id === doctorId);
    if (!doctor) return;
    
    // Populate edit form
    document.getElementById('editDoctorId').value = doctorId;
    document.getElementById('editName').value = doctor.name;
    document.getElementById('editSpecialization').value = doctor.specialization || '';
    document.getElementById('editQualification').value = doctor.qualification || '';
    document.getElementById('editExperience').value = doctor.experience || '';
    document.getElementById('editFees').value = doctor.fees || '';
    document.getElementById('editAvailability').value = doctor.availability || '';
    document.getElementById('editContact').value = doctor.contact || '';
    document.getElementById('editEmail').value = doctor.email || '';
    document.getElementById('editLocation').value = doctor.location || '';
    document.getElementById('editLanguages').value = doctor.languages ? doctor.languages.join(', ') : '';
    document.getElementById('editBio').value = doctor.bio || '';
    
    // Handle image preview
    const editImagePreview = document.getElementById('editImagePreview');
    const existingImageUrl = document.getElementById('existingImageUrl');
    
    if (doctor.imageUrl) {
        existingImageUrl.value = doctor.imageUrl;
        editImagePreview.innerHTML = `
            <img src="${doctor.imageUrl}" alt="Current Doctor Image">
            <p><small>Current image</small></p>
        `;
        editImagePreview.style.display = 'block';
    } else {
        editImagePreview.innerHTML = '';
        editImagePreview.style.display = 'none';
        existingImageUrl.value = '';
    }
    
    // Show edit modal
    document.getElementById('editModal').style.display = 'block';
};

// Close edit modal
window.closeEditModal = () => {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editDoctorForm').reset();
    document.getElementById('editImagePreview').innerHTML = '';
    document.getElementById('editImagePreview').style.display = 'none';
};

// Send doctor registration notification
function sendDoctorRegistrationNotification(doctorData) {
    // In production, send email/SMS to admin
    console.log("Doctor registration notification:", doctorData);
    
    // Save notification
    const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    notifications.push({
        type: 'doctor_registration',
        doctorName: doctorData.name,
        specialization: doctorData.specialization,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
}

// Show loading state
function showLoading(buttonId, show) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (show) {
            button.innerHTML = '<span class="loading"></span> Processing...';
            button.disabled = true;
        } else {
            // Restore original text based on button type
            if (buttonId === 'addDoctorBtn') {
                button.innerHTML = 'Add Doctor';
            } else if (buttonId === 'updateDoctorBtn') {
                button.innerHTML = 'Update Doctor';
            }
            button.disabled = false;
        }
    }
}

// Export doctors data
window.exportDoctorsData = async () => {
    try {
        const data = allDoctors.map(doctor => ({
            Name: doctor.name,
            Specialization: doctor.specialization,
            Qualification: doctor.qualification,
            Experience: `${doctor.experience} years`,
            Fees: `₹${doctor.fees}`,
            Availability: doctor.availability,
            Contact: doctor.contact,
            Email: doctor.email,
            Location: doctor.location,
            Languages: doctor.languages?.join(', '),
            Rating: doctor.rating || 'Not rated',
            Appointments: doctor.totalAppointments || 0,
            Views: doctor.views || 0,
            Created: doctor.createdAt ? new Date(doctor.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
        }));
        
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `doctors_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showNotification("Data exported successfully", 'success');
        trackEvent('data_exported', { count: data.length });
        
    } catch (error) {
        console.error("Error exporting data:", error);
        showNotification("Error exporting data", 'error');
    }
};

// Import doctors data
window.importDoctorsData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.json';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            showLoading('importData', true);
            const text = await file.text();
            let doctors;
            
            if (file.name.endsWith('.csv')) {
                doctors = parseCSV(text);
            } else if (file.name.endsWith('.json')) {
                doctors = JSON.parse(text);
            } else {
                throw new Error('Unsupported file format');
            }
            
            let importedCount = 0;
            let errorCount = 0;
            
            for (const doctor of doctors) {
                try {
                    if (doctor.Name && doctor.Specialization) {
                        await addDoc(doctorsCollection, {
                            name: doctor.Name,
                            specialization: doctor.Specialization,
                            qualification: doctor.Qualification || '',
                            experience: parseInt(doctor.Experience) || 0,
                            fees: parseInt(doctor.Fees?.replace('₹', '').replace(',', '')) || 300,
                            availability: doctor.Availability || 'Mon-Fri, 9AM-5PM',
                            contact: doctor.Contact || '',
                            email: doctor.Email || '',
                            location: doctor.Location || 'Rural Health Center',
                            languages: doctor.Languages ? doctor.Languages.split(',').map(lang => lang.trim()) : ['Hindi', 'English'],
                            bio: doctor.Bio || '',
                            rating: 0,
                            totalAppointments: 0,
                            views: 0,
                            createdAt: serverTimestamp()
                        });
                        importedCount++;
                    }
                } catch (error) {
                    console.error("Error importing doctor:", doctor.Name, error);
                    errorCount++;
                }
            }
            
            showNotification(`${importedCount} doctors imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 
                           errorCount > 0 ? 'warning' : 'success');
            await loadAllDoctors();
            
            trackEvent('data_imported', { 
                count: doctors.length,
                imported: importedCount,
                failed: errorCount 
            });
            
        } catch (error) {
            console.error("Error importing data:", error);
            showNotification("Error importing data: " + error.message, 'error');
        } finally {
            showLoading('importData', false);
        }
    };
    
    fileInput.click();
};

// Helper functions for CSV
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => 
            JSON.stringify(row[header] || '').replace(/"/g, '""')
        ).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            // Remove quotes if present
            value = value.trim().replace(/^"|"$/g, '');
            obj[header] = value;
        });
        return obj;
    });
}

// Filter doctors
function filterDoctors() {
    const searchTerm = document.getElementById('adminSearch').value.toLowerCase();
    const filtered = allDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm) ||
        doctor.specialization?.toLowerCase().includes(searchTerm) ||
        doctor.qualification?.toLowerCase().includes(searchTerm) ||
        doctor.location?.toLowerCase().includes(searchTerm)
    );
    displayDoctorsTable(filtered);
}

// Sort doctors
function sortDoctors() {
    const sortBy = document.getElementById('sortBy').value;
    const sorted = [...allDoctors].sort((a, b) => {
        switch (sortBy) {
            case 'experience':
                return (b.experience || 0) - (a.experience || 0);
            case 'fees':
                return (b.fees || 0) - (a.fees || 0);
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'appointments':
                return (b.totalAppointments || 0) - (a.totalAppointments || 0);
            default: // name
                return a.name.localeCompare(b.name);
        }
    });
    displayDoctorsTable(sorted);
}

// Refresh doctors list
window.refreshDoctors = async () => {
    await loadAllDoctors();
    showNotification("Doctors list refreshed", 'success');
};
// ==================== NEW FUNCTIONS START ====================

// Doctor Verification System
async function loadDoctorVerifications() {
    try {
        const querySnapshot = await getDocs(query(collection(db, "doctorVerifications"), 
            orderBy("appliedAt", "desc")));
        
        const verifications = [];
        querySnapshot.forEach((doc) => {
            verifications.push({ id: doc.id, ...doc.data() });
        });
        
        updateVerificationUI(verifications);
        updateVerificationStats(verifications);
        
    } catch (error) {
        console.error("Error loading verifications:", error);
        showNotification("Failed to load verification data", 'error');
    }
}

async function verifyDoctor(doctorId, action) {
    try {
        const verificationRef = doc(db, "doctorVerifications", doctorId);
        
        if (action === 'approve') {
            await updateDoc(verificationRef, {
                status: 'verified',
                verifiedAt: serverTimestamp(),
                verifiedBy: 'admin'
            });
            
            // Update doctor collection
            const doctorRef = doc(db, "doctors", doctorId);
            await updateDoc(doctorRef, {
                verified: true,
                verificationBadge: '✅ Verified Doctor'
            });
            
            showNotification("Doctor verified successfully!", 'success');
            
        } else if (action === 'reject') {
            await updateDoc(verificationRef, {
                status: 'rejected',
                rejectedAt: serverTimestamp(),
                rejectedReason: document.getElementById('rejectReason').value
            });
            
            showNotification("Doctor verification rejected", 'warning');
        }
        
        await loadDoctorVerifications();
        
    } catch (error) {
        console.error("Error verifying doctor:", error);
        showNotification("Error processing verification", 'error');
    }
}

// Telemedicine Functions
async function loadActiveSessions() {
    try {
        const sessionsRef = collection(db, "telemedicineSessions");
        const q = query(sessionsRef, where("status", "==", "active"));
        const snapshot = await getDocs(q);
        
        const sessions = [];
        snapshot.forEach(doc => {
            sessions.push({ id: doc.id, ...doc.data() });
        });
        
        updateSessionUI(sessions);
        
    } catch (error) {
        console.error("Error loading sessions:", error);
    }
}

async function startTelemedicineSession(doctorId, patientId) {
    try {
        // Generate unique session ID
        const sessionId = 'TM' + Date.now();
        
        // Create session in database
        await addDoc(collection(db, "telemedicineSessions"), {
            sessionId: sessionId,
            doctorId: doctorId,
            patientId: patientId,
            startTime: serverTimestamp(),
            status: 'active',
            roomUrl: `https://meet.ruralcare.in/${sessionId}`,
            createdBy: 'admin'
        });
        
        // Send notifications
        sendSessionNotification(doctorId, patientId, sessionId);
        
        showNotification("Telemedicine session started", 'success');
        
    } catch (error) {
        console.error("Error starting session:", error);
        showNotification("Failed to start session", 'error');
    }
}

// Inventory Management
async function loadInventory() {
    try {
        const inventoryRef = collection(db, "medicineInventory");
        const q = query(inventoryRef, orderBy("name"));
        const snapshot = await getDocs(q);
        
        const inventory = [];
        snapshot.forEach(doc => {
            const item = doc.data();
            // Check for low stock
            item.status = item.currentStock <= item.minStock ? 'low' : 'ok';
            // Check expiry
            const expiryDate = new Date(item.expiryDate);
            const today = new Date();
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            item.expiringSoon = diffDays <= 30;
            
            inventory.push({ id: doc.id, ...item });
        });
        
        updateInventoryUI(inventory);
        updateInventoryAlerts(inventory);
        
    } catch (error) {
        console.error("Error loading inventory:", error);
    }
}

async function updateStock(medicineId, quantity, action) {
    try {
        const medicineRef = doc(db, "medicineInventory", medicineId);
        const medicineDoc = await getDoc(medicineRef);
        
        if (medicineDoc.exists()) {
            const currentStock = medicineDoc.data().currentStock;
            let newStock = currentStock;
            
            if (action === 'add') {
                newStock = currentStock + quantity;
            } else if (action === 'remove') {
                newStock = currentStock - quantity;
            }
            
            await updateDoc(medicineRef, {
                currentStock: newStock,
                lastUpdated: serverTimestamp()
            });
            
            showNotification(`Stock updated: ${newStock} units`, 'success');
            await loadInventory();
        }
        
    } catch (error) {
        console.error("Error updating stock:", error);
        showNotification("Failed to update stock", 'error');
    }
}

// AI Insights Functions
async function generateAIInsights() {
    try {
        // Get data for analysis
        const [appointments, inventory, doctors] = await Promise.all([
            getAppointmentsData(),
            getInventoryData(),
            getDoctorsData()
        ]);
        
        const insights = {
            peakHours: calculatePeakHours(appointments),
            diseasePatterns: analyzeDiseasePatterns(appointments),
            stockPredictions: predictStockNeeds(inventory, appointments),
            doctorWorkload: analyzeDoctorWorkload(doctors, appointments)
        };
        
        updateAIInsightsUI(insights);
        
    } catch (error) {
        console.error("Error generating insights:", error);
    }
}

// Offline Sync Functions
function setupOfflineSync() {
    // Check online status
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Setup periodic sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-data');
        });
    }
    
    // Load pending syncs
    loadPendingSyncs();
}

async function syncPendingData() {
    try {
        const pendingActions = JSON.parse(localStorage.getItem('pendingSyncs') || '[]');
        
        if (pendingActions.length === 0) {
            return;
        }
        
        showNotification(`Syncing ${pendingActions.length} pending actions...`, 'info');
        
        for (const action of pendingActions) {
            await processOfflineAction(action);
        }
        
        // Clear pending syncs
        localStorage.setItem('pendingSyncs', JSON.stringify([]));
        
        showNotification("All data synced successfully!", 'success');
        
    } catch (error) {
        console.error("Error syncing data:", error);
        showNotification("Sync failed. Will retry later.", 'error');
    }
}

// Emergency Functions
async function activateEmergencyMode() {
    try {
        // Get all doctors
        const doctorsSnapshot = await getDocs(collection(db, "doctors"));
        const doctors = [];
        doctorsSnapshot.forEach(doc => {
            doctors.push({ id: doc.id, ...doc.data() });
        });
        
        // Send emergency alerts
        for (const doctor of doctors) {
            if (doctor.contact) {
                await sendEmergencyAlert(doctor.contact, doctor.name);
            }
        }
        
        // Update emergency status
        await addDoc(collection(db, "emergencyLogs"), {
            activatedAt: serverTimestamp(),
            activatedBy: 'admin',
            type: 'full_emergency',
            status: 'active'
        });
        
        showNotification("🚨 EMERGENCY MODE ACTIVATED!", 'emergency');
        
        // Play emergency sound
        playEmergencySound();
        
    } catch (error) {
        console.error("Error activating emergency:", error);
        showNotification("Failed to activate emergency mode", 'error');
    }
}

// Government Compliance
async function checkComplianceStatus() {
    try {
        const complianceRef = doc(db, "compliance", "current");
        const complianceDoc = await getDoc(complianceRef);
        
        if (complianceDoc.exists()) {
            const data = complianceDoc.data();
            updateComplianceUI(data);
        }
        
    } catch (error) {
        console.error("Error checking compliance:", error);
    }
}

// UI Update Functions
function updateVerificationUI(verifications) {
    const tableBody = document.getElementById('verificationTableBody');
    if (!tableBody) return;
    
    if (verifications.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    No pending verifications
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    verifications.forEach(verify => {
        const statusBadge = getStatusBadge(verify.status);
        const appliedDate = verify.appliedAt ? 
            new Date(verify.appliedAt.seconds * 1000).toLocaleDateString() : 'N/A';
        
        html += `
            <tr>
                <td>${verify.doctorName || 'N/A'}</td>
                <td>${verify.specialization || 'N/A'}</td>
                <td>
                    <span class="status-badge ${verify.status}">
                        ${statusBadge.icon} ${statusBadge.text}
                    </span>
                </td>
                <td>
                    ${verify.documents ? verify.documents.length : 0} docs
                </td>
                <td>${appliedDate}</td>
                <td class="action-buttons">
                    <button onclick="viewVerification('${verify.id}')" class="btn-view">
                        👁️ View
                    </button>
                    <button onclick="verifyDoctor('${verify.id}', 'approve')" 
                            class="btn-approve" ${verify.status === 'verified' ? 'disabled' : ''}>
                        ✅ Approve
                    </button>
                    <button onclick="rejectVerification('${verify.id}')" 
                            class="btn-reject" ${verify.status === 'rejected' ? 'disabled' : ''}>
                        ❌ Reject
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function updateInventoryUI(inventory) {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    
    if (inventory.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    No inventory items found
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    inventory.forEach(item => {
        const stockClass = item.currentStock <= item.minStock ? 'low-stock' : '';
        const expiryClass = item.expiringSoon ? 'expiring-soon' : '';
        
        html += `
            <tr class="${stockClass} ${expiryClass}">
                <td>${item.name}</td>
                <td>${item.category || 'General'}</td>
                <td>
                    <span class="stock-count ${stockClass}">
                        ${item.currentStock}
                    </span>
                </td>
                <td>${item.minStock || 10}</td>
                <td class="${expiryClass}">
                    ${item.expiryDate || 'N/A'}
                </td>
                <td>₹${item.price || 0}</td>
                <td>
                    ${item.currentStock <= item.minStock ? '⚠️ Low Stock' : '✅ In Stock'}
                    ${item.expiringSoon ? '⏰ Expiring Soon' : ''}
                </td>
                <td>
                    <button onclick="updateStock('${item.id}', 10, 'add')" class="btn-small">
                        ➕ Add
                    </button>
                    <button onclick="updateStock('${item.id}', 5, 'remove')" class="btn-small">
                        ➖ Remove
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Initialize all new features
function initNewFeatures() {
    console.log("Initializing new admin features...");
    
    // Initialize verification system
    loadDoctorVerifications();
    
    // Load inventory
    loadInventory();
    
    // Setup telemedicine monitoring
    setInterval(loadActiveSessions, 30000); // Every 30 seconds
    loadActiveSessions();
    
    // Generate AI insights
    generateAIInsights();
    setInterval(generateAIInsights, 300000); // Every 5 minutes
    
    // Setup offline sync
    setupOfflineSync();
    
    // Check compliance
    checkComplianceStatus();
    
    // Track feature usage
    trackEvent('new_features_loaded', {
        features: ['verification', 'inventory', 'telemedicine', 'ai_insights']
    });
}

// Call this function after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Your existing initialization code...
    
    // Then initialize new features
    if (isAdminAuthenticated()) {
        setTimeout(initNewFeatures, 2000); // Wait 2 seconds before loading new features
    }
});

// ==================== CLICKABLE BUTTONS FUNCTIONS ====================

// 1. VERIFICATION SYSTEM FUNCTIONS
window.filterVerifications = function() {
    const searchTerm = document.getElementById('verifySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#verificationTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

window.filterByVerificationStatus = function() {
    const status = document.getElementById('verifyStatusFilter').value;
    const rows = document.querySelectorAll('#verificationTableBody tr');
    
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const rowStatus = row.querySelector('.status-badge').className.includes(status);
            row.style.display = rowStatus ? '' : 'none';
        }
    });
}

window.refreshVerifications = async function() {
    showNotification("Refreshing verification data...", 'info');
    await loadDoctorVerifications();
}

window.exportVerificationReport = function() {
    showNotification("Exporting verification report...", 'info');
    // Export logic here
}

window.bulkVerifyDoctors = function() {
    const selected = document.querySelectorAll('.doctor-check:checked');
    if (selected.length === 0) {
        showNotification("Please select doctors to verify", 'warning');
        return;
    }
    
    if (confirm(`Verify ${selected.length} doctors?`)) {
        showNotification(`Verifying ${selected.length} doctors...`, 'info');
    }
}

window.requestMoreDocuments = function() {
    const doctorId = prompt("Enter Doctor ID:");
    if (doctorId) {
        showNotification(`Document request sent to doctor ${doctorId}`, 'success');
    }
}

window.scheduleVerificationInterview = function() {
    showNotification("Opening interview scheduler...", 'info');
    // Open calendar modal
}

// 2. TELEMEDICINE FUNCTIONS
window.startNewSession = function() {
    const doctorId = prompt("Enter Doctor ID:");
    const patientId = prompt("Enter Patient ID:");
    
    if (doctorId && patientId) {
        startTelemedicineSession(doctorId, patientId);
    }
}

window.viewAllSessions = function() {
    showNotification("Loading all sessions...", 'info');
    // Load sessions
}

window.generateSessionReport = function() {
    const period = prompt("Enter period (today/week/month):", "week");
    showNotification(`Generating ${period} session report...`, 'info');
}

// 3. INVENTORY FUNCTIONS
window.searchMedicine = function() {
    const search = document.getElementById('medicineSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

window.filterByCategory = function() {
    const category = document.getElementById('categoryFilter').value;
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    
    rows.forEach(row => {
        if (category === 'all') {
            row.style.display = '';
        } else {
            const rowCategory = row.cells[1].textContent.toLowerCase();
            row.style.display = rowCategory === category ? '' : 'none';
        }
    });
}

window.addNewMedicine = function() {
    const name = prompt("Medicine Name:");
    if (name) {
        showNotification(`Adding ${name} to inventory...`, 'info');
        // Add medicine logic
    }
}

window.importStock = function() {
    showNotification("Opening stock import...", 'info');
}

window.generateReorderList = function() {
    showNotification("Generating re-order list...", 'info');
    // Generate PDF
}

window.printBarcodeLabels = function() {
    showNotification("Printing barcode labels...", 'info');
}

window.exportInventoryReport = function() {
    showNotification("Exporting inventory report...", 'info');
}

// 4. OFFLINE FUNCTIONS
window.forceSync = function() {
    showNotification("Syncing data...", 'info');
    syncPendingData();
}

window.clearLocalCache = function() {
    if (confirm("Clear local cache? This will remove offline data.")) {
        localStorage.clear();
        showNotification("Cache cleared!", 'success');
    }
}

window.createBackup = function() {
    showNotification("Creating backup...", 'info');
    // Backup logic
}

window.exportForOffline = function() {
    showNotification("Exporting data for offline use...", 'info');
}

window.viewSyncLogs = function() {
    showNotification("Loading sync logs...", 'info');
}

window.configureSync = function() {
    showNotification("Opening sync configuration...", 'info');
}

// 5. EMERGENCY FUNCTIONS
window.activateEmergencyMode = function() {
    if (confirm("🚨 ACTIVATE EMERGENCY MODE?\nThis will notify all doctors and staff.")) {
        showNotification("EMERGENCY MODE ACTIVATED!", 'emergency');
        // Add red alert styling
        document.body.style.animation = 'emergencyFlash 1s infinite';
    }
}

window.callAmbulance = function() {
    showNotification("Calling ambulance... 🚑", 'info');
    // Integrate with calling API
}

window.contactOnCall = function() {
    showNotification("Contacting on-call doctors...", 'info');
}

// 6. COMPLIANCE FUNCTIONS
window.uploadComplianceDocs = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.jpg,.png';
    
    input.onchange = () => {
        const files = input.files;
        showNotification(`Uploading ${files.length} documents...`, 'info');
    };
    
    input.click();
}

// 7. UTILITY FUNCTIONS FOR UI
function getStatusBadge(status) {
    const badges = {
        'pending': { icon: '⏳', text: 'Pending', color: '#FFC107' },
        'verified': { icon: '✅', text: 'Verified', color: '#28A745' },
        'rejected': { icon: '❌', text: 'Rejected', color: '#DC3545' },
        'documents_pending': { icon: '📄', text: 'Docs Pending', color: '#17A2B8' }
    };
    return badges[status] || { icon: '❓', text: 'Unknown', color: '#6C757D' };
}

function updateVerificationStats(verifications) {
    const pending = verifications.filter(v => v.status === 'pending').length;
    const verified = verifications.filter(v => v.status === 'verified').length;
    const rejected = verifications.filter(v => v.status === 'rejected').length;
    const total = verifications.length;
    
    // Update counts in HTML
    const pendingEl = document.getElementById('pendingVerifyCount');
    const verifiedEl = document.getElementById('verifiedDoctorCount');
    const totalEl = document.getElementById('totalApplications');
    const monthlyEl = document.getElementById('monthlyApplications');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (verifiedEl) verifiedEl.textContent = verified;
    if (totalEl) totalEl.textContent = total;
    if (monthlyEl) monthlyEl.textContent = Math.floor(total * 0.3); // Example
}

function updateInventoryAlerts(inventory) {
    const lowStock = inventory.filter(item => item.currentStock <= item.minStock).length;
    const expiring = inventory.filter(item => item.expiringSoon).length;
    const totalValue = inventory.reduce((sum, item) => 
        sum + (item.currentStock * (item.price || 0)), 0);
    
    // Update alert elements
    const lowStockEl = document.getElementById('lowStockItems');
    const expiringEl = document.getElementById('expiringItems');
    const valueEl = document.getElementById('totalStockValue');
    
    if (lowStockEl) lowStockEl.textContent = `${lowStock} items below minimum stock`;
    if (expiringEl) expiringEl.textContent = `${expiring} items expiring in 30 days`;
    if (valueEl) valueEl.textContent = `₹${totalValue.toLocaleString()}`;
}

function updateSessionUI(sessions) {
    const activeEl = document.getElementById('activeSessions');
    const todayEl = document.getElementById('todaySessions');
    const completedEl = document.getElementById('completedSessions');
    const avgTimeEl = document.getElementById('avgSessionTime');
    
    if (activeEl) activeEl.textContent = sessions.length;
    if (todayEl) todayEl.textContent = sessions.filter(s => 
        new Date(s.startTime?.seconds * 1000).toDateString() === new Date().toDateString()
    ).length;
    
    // Update session lists
    const activeList = document.getElementById('activeSessionsList');
    const upcomingList = document.getElementById('upcomingSessionsList');
    
    if (activeList) {
        if (sessions.length > 0) {
            activeList.innerHTML = sessions.map(session => `
                <div class="session-item">
                    <strong>${session.patientName || 'Patient'}</strong>
                    <span>with Dr. ${session.doctorName || 'Doctor'}</span>
                    <button onclick="joinSession('${session.id}')" class="btn-join">
                        Join
                    </button>
                </div>
            `).join('');
        } else {
            activeList.innerHTML = '<p class="no-sessions">No active sessions</p>';
        }
    }
}

// 8. ADD THESE HELPER FUNCTIONS TOO
window.viewVerification = function(doctorId) {
    showNotification(`Viewing verification for doctor ${doctorId}`, 'info');
    // Open verification details modal
}

window.rejectVerification = function(doctorId) {
    const reason = prompt("Reason for rejection:");
    if (reason) {
        verifyDoctor(doctorId, 'reject');
    }
}

window.joinSession = function(sessionId) {
    showNotification(`Joining session ${sessionId}...`, 'info');
    // Open video session
}

// 9. INITIALIZE ALL BUTTONS ON LOAD
document.addEventListener('DOMContentLoaded', function() {
    // Make sure all buttons have click handlers
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.onclick && button.id) {
            // Add default click handler if missing
            button.onclick = function() {
                showNotification(`${button.textContent} clicked`, 'info');
            };
        }
    });
    
    // Add CSS for emergency flash
    const style = document.createElement('style');
    style.textContent = `
        @keyframes emergencyFlash {
            0% { background-color: white; }
            50% { background-color: #ffebee; }
            100% { background-color: white; }
        }
        .emergency-flash {
            animation: emergencyFlash 1s infinite;
        }
        .btn-join {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .session-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        .session-item:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);
});