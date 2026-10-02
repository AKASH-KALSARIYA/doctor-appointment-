import { auth } from "./firebase.js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let confirmationResult = null;
let selectedDoctor = null;
let recaptchaVerifier = null;

// Initialize booking page
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Booking page initialized");
    
    await loadSelectedDoctor();
    initRecaptcha();
    initVoiceInput();
    initFormValidation();
    initDatePicker();
    
    // Track booking start
    trackEvent('booking_started', { doctorId: selectedDoctor?.id });
});

// Load selected doctor
async function loadSelectedDoctor() {
    const doctorId = localStorage.getItem('selectedDoctorId');
    if (!doctorId) {
        showNotification("No doctor selected. Redirecting...", 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    // Try to get doctor from Firebase first, then local data
    selectedDoctor = await getDoctorFromFirebase(doctorId) || 
                     getDoctorById(doctorId);
    
    if (!selectedDoctor) {
        showNotification("Doctor not found", 'error');
        window.location.href = 'index.html';
        return;
    }
    
    // Display doctor info
    const doctorInfo = document.getElementById('doctorInfo');
    if (doctorInfo) {
        doctorInfo.innerHTML = `
            <h3>Booking with ${selectedDoctor.name}</h3>
            <p>${selectedDoctor.specialization} • ₹${selectedDoctor.fees}</p>
        `;
    }
}

// Get doctor from Firebase
async function getDoctorFromFirebase(doctorId) {
    try {
        // This would require a getDoc import
        // For now, we'll use local data
        return getDoctorById(doctorId);
    } catch (error) {
        console.error("Error fetching doctor:", error);
        return null;
    }
}

// Initialize reCAPTCHA
function initRecaptcha() {
    try {
        recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': (response) => {
                console.log("reCAPTCHA solved");
                enableOTPButtons();
            },
            'expired-callback': () => {
                console.log("reCAPTCHA expired");
                disableOTPButtons();
            }
        });
        
        recaptchaVerifier.render();
    } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
        showNotification("reCAPTCHA initialization failed. Please refresh.", 'error');
    }
}

// Send OTP
window.sendOTP = async () => {
    const phoneInput = document.getElementById('phone');
    const phone = phoneInput.value.trim();
    
    if (!validatePhone(phone)) {
        showNotification("Please enter a valid Indian phone number (+91xxxxxxxxxx)", 'error');
        return;
    }
    
    try {
        showLoading('sendOTPBtn', true);
        
        confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
        
        showNotification("OTP sent successfully to " + phone, 'success');
        document.getElementById('otpSection').style.display = 'block';
        document.getElementById('verifyOTPBtn').disabled = false;
        
        trackEvent('otp_sent', { phone: phone.substring(0, 7) + '***' });
        
    } catch (error) {
        console.error("OTP send error:", error);
        showNotification("Failed to send OTP: " + error.message, 'error');
        
        // Reset reCAPTCHA on certain errors
        if (error.code === 'auth/invalid-phone-number' || error.code === 'auth/too-many-requests') {
            recaptchaVerifier.reset();
        }
    } finally {
        showLoading('sendOTPBtn', false);
    }
};

// Verify OTP
window.verifyOTP = async () => {
    const otpInput = document.getElementById('otp');
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showNotification("Please enter a valid 6-digit OTP", 'error');
        return;
    }
    
    try {
        showLoading('verifyOTPBtn', true);
        
        await confirmationResult.confirm(otp);
        
        showNotification("Phone verified successfully!", 'success');
        document.getElementById('patientDetails').style.display = 'block';
        document.getElementById('phone').readOnly = true;
        
        trackEvent('otp_verified');
        
    } catch (error) {
        console.error("OTP verification error:", error);
        showNotification("Invalid OTP. Please try again.", 'error');
        otpInput.value = '';
    } finally {
        showLoading('verifyOTPBtn', false);
    }
};

// Initialize voice input
function initVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.style.display = 'inline-flex';
        }
    }
}

// Voice input for name
window.startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showNotification("Speech recognition not supported in your browser", 'error');
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.start();
    
    showNotification("Listening... Speak your name", 'info');
    
    recognition.onresult = (event) => {
        const nameInput = document.getElementById('patientName');
        if (nameInput) {
            nameInput.value = event.results[0][0].transcript;
            showNotification("Name captured successfully", 'success');
            trackEvent('voice_input_used', { field: 'name' });
        }
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        showNotification("Could not recognize speech. Please try again.", 'error');
    };
};

// Initialize form validation
function initFormValidation() {
    const form = document.getElementById('bookingForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
        });
    }
}

// Validate field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.id || field.name;
    
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldName) {
        case 'patientName':
            isValid = value.length >= 2;
            errorMessage = 'Name must be at least 2 characters';
            break;
        case 'phone':
            isValid = validatePhone(value);
            errorMessage = 'Invalid Indian phone number';
            break;
        case 'patientAge':
            const age = parseInt(value);
            isValid = !isNaN(age) && age >= 1 && age <= 120;
            errorMessage = 'Age must be between 1 and 120';
            break;
        case 'appointmentDate':
            isValid = validateDate(value);
            errorMessage = 'Date must be in the future';
            break;
    }
    
    if (!isValid && value) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

// Validate phone number
function validatePhone(phone) {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// Validate date
function validateDate(dateString) {
    const selectedDate = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return selectedDate >= tomorrow;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.9em';
    errorDiv.style.marginTop = '5px';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#e74c3c';
}

// Clear field error
function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.style.borderColor = '';
}

// Initialize date picker
function initDatePicker() {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        // Set min date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        
        // Set max date to 3 months from now
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        // Set default to tomorrow
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const isValid = validateAllFields();
    if (!isValid) {
        showNotification("Please fix all errors before submitting", 'error');
        return;
    }
    
    // Collect form data
    const formData = {
        patientName: document.getElementById('patientName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        patientAge: document.getElementById('patientAge').value,
        gender: document.getElementById('gender').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        symptoms: document.getElementById('symptoms').value.trim(),
        previousHistory: document.getElementById('previousHistory').value.trim(),
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization,
        fees: selectedDoctor.fees,
        bookingTime: new Date().toISOString(),
        status: 'confirmed',
        bookingId: generateBookingId()
    };
    
    try {
        showLoading('submitBtn', true);
        
        // Save to localStorage (and Firebase in production)
        await saveAppointment(formData);
        
        // Send confirmation
        await sendAppointmentConfirmation(formData);
        
        // Track successful booking
        trackEvent('appointment_booked', {
            bookingId: formData.bookingId,
            doctorId: selectedDoctor.id
        });
        
        trackAppointmentBooking(selectedDoctor.id);
        
        // Redirect to confirmation
        localStorage.setItem('lastBooking', JSON.stringify(formData));
        window.location.href = 'confirmation.html';
        
    } catch (error) {
        console.error("Booking error:", error);
        showNotification("Failed to book appointment: " + error.message, 'error');
        
        // Save offline if needed
        if (!navigator.onLine) {
            await storeOfflineAction({
                type: 'appointment',
                data: formData,
                timestamp: Date.now()
            });
            showNotification("Appointment saved offline. Will sync when online.", 'info');
        }
    } finally {
        showLoading('submitBtn', false);
    }
}

// Validate all fields
function validateAllFields() {
    const fields = [
        'patientName',
        'phone',
        'patientAge',
        'gender',
        'appointmentDate',
        'appointmentTime'
    ];
    
    let allValid = true;
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !validateField({ target: field })) {
            allValid = false;
        }
    });
    
    return allValid;
}

// Save appointment
async function saveAppointment(appointmentData) {
    // In production, save to Firebase
    // For now, save to localStorage
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointmentData);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Also save to session for confirmation page
    sessionStorage.setItem('currentAppointment', JSON.stringify(appointmentData));
    
    return Promise.resolve(appointmentData);
}

// Send appointment confirmation
async function sendAppointmentConfirmation(appointmentData) {
    // In production, send SMS/Email
    // For demo, simulate sending
    
    const message = `Appointment confirmed with Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}. Booking ID: ${appointmentData.bookingId}`;
    
    // Save for notification
    localStorage.setItem('lastNotification', JSON.stringify({
        phone: appointmentData.phone,
        message: message,
        type: 'appointment_confirmation'
    }));
    
    console.log("Would send SMS:", message);
    
    // Schedule reminder
    scheduleAppointmentReminder(appointmentData);
    
    return Promise.resolve();
}

// Schedule appointment reminder
function scheduleAppointmentReminder(appointmentData) {
    const appointmentDate = new Date(appointmentData.appointmentDate + 'T' + appointmentData.appointmentTime);
    const reminderTime = new Date(appointmentDate);
    reminderTime.setDate(reminderTime.getDate() - 1); // 1 day before
    
    const reminder = {
        type: 'appointment_reminder',
        appointmentId: appointmentData.bookingId,
        phone: appointmentData.phone,
        message: `Reminder: Your appointment with Dr. ${appointmentData.doctorName} is tomorrow at ${appointmentData.appointmentTime}`,
        scheduledTime: reminderTime.getTime()
    };
    
    // Save reminder
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    reminders.push(reminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    console.log("Reminder scheduled for:", reminderTime);
}

// Generate booking ID
function generateBookingId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `BOOK-${timestamp}-${random}`.toUpperCase();
}

// Show/hide loading
function showLoading(buttonId, show) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (show) {
            button.innerHTML = '<span class="loading"></span> Processing...';
            button.disabled = true;
        } else {
            button.innerHTML = button.getAttribute('data-original-text') || button.textContent;
            button.disabled = false;
        }
    }
}

// Enable/disable OTP buttons
function enableOTPButtons() {
    const sendBtn = document.getElementById('sendOTPBtn');
    if (sendBtn) sendBtn.disabled = false;
}

function disableOTPButtons() {
    const sendBtn = document.getElementById('sendOTPBtn');
    if (sendBtn) sendBtn.disabled = true;
}