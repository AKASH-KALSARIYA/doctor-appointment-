let appointmentDetails = null;
let doctorDetails = null;

// Initialize confirmation page
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Confirmation page initialized");
    
    await loadAppointmentDetails();
    displayConfirmation();
    initShareOptions();
    initReminderSettings();
    
    // Track confirmation view
    trackEvent('appointment_confirmed', {
        bookingId: appointmentDetails?.bookingId,
        doctorId: appointmentDetails?.doctorId
    });
    
    // Schedule reminder
    if (appointmentDetails) {
        scheduleAppointmentReminder(appointmentDetails);
    }
});

// Load appointment details
async function loadAppointmentDetails() {
    // Try to get from session first, then localStorage
    appointmentDetails = JSON.parse(sessionStorage.getItem('currentAppointment') || 
                                    localStorage.getItem('lastBooking') || 'null');
    
    if (!appointmentDetails) {
        showNotification("No appointment found", 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    // Load doctor details
    doctorDetails = getDoctorById(appointmentDetails.doctorId) || 
                   { name: appointmentDetails.doctorName };
}

// Display confirmation
function displayConfirmation() {
    const container = document.getElementById('confirmationContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="confirmation-header">
            <div class="confirmation-icon">✅</div>
            <h1>Appointment Confirmed!</h1>
            <p class="booking-id">Booking ID: ${appointmentDetails.bookingId}</p>
        </div>
        
        <div class="confirmation-card">
            <div class="appointment-details">
                <h2>Appointment Details</h2>
                
                <div class="detail-row">
                    <span class="detail-label">Patient Name:</span>
                    <span class="detail-value">${appointmentDetails.patientName}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Doctor:</span>
                    <span class="detail-value">Dr. ${appointmentDetails.doctorName}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Specialization:</span>
                    <span class="detail-value">${appointmentDetails.doctorSpecialization}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value">
                        ${formatDate(appointmentDetails.appointmentDate)} at ${appointmentDetails.appointmentTime}
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Fees:</span>
                    <span class="detail-value">₹${appointmentDetails.fees}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Contact:</span>
                    <span class="detail-value">${appointmentDetails.phone}</span>
                </div>
                
                ${appointmentDetails.symptoms ? `
                    <div class="detail-row">
                        <span class="detail-label">Symptoms:</span>
                        <span class="detail-value">${appointmentDetails.symptoms}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="instructions">
                <h3>Important Instructions</h3>
                <ul>
                    <li>Please arrive 15 minutes before your appointment</li>
                    <li>Carry your ID proof and previous medical records</li>
                    <li>Consultation fee: ₹${appointmentDetails.fees} (payable at clinic)</li>
                    <li>In case of cancellation, please inform 24 hours in advance</li>
                    <li>Emergency contact: +91 1800-123-4567</li>
                </ul>
            </div>
            
            <div class="clinic-info">
                <h3>Clinic Address</h3>
                <p>${doctorDetails.location || 'Rural Health Center, Main Road, Village'}</p>
                <button onclick="getDirectionsToClinic()" class="directions-btn">
                    🗺️ Get Directions
                </button>
            </div>
        </div>
        
        <div class="confirmation-actions">
            <button onclick="downloadPDF()" class="action-btn">
                📄 Download Receipt
            </button>
            <button onclick="shareAppointment()" class="action-btn">
                📱 Share Details
            </button>
            <button onclick="bookAnother()" class="action-btn">
                🏥 Book Another
            </button>
            <button onclick="cancelAppointment()" class="action-btn cancel-btn">
                ❌ Cancel Appointment
            </button>
        </div>
        
        <div class="reminder-settings">
            <h3>📅 Set Reminder</h3>
            <div class="reminder-options">
                <label>
                    <input type="checkbox" id="smsReminder" checked>
                    SMS Reminder (1 day before)
                </label>
                <label>
                    <input type="checkbox" id="emailReminder">
                    Email Reminder (optional)
                </label>
                <button onclick="saveReminderSettings()" class="save-btn">
                    Save Settings
                </button>
            </div>
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize share options
function initShareOptions() {
    if (navigator.share) {
        document.querySelector('.share-btn')?.style.display = 'inline-block';
    }
}

// Share appointment details
window.shareAppointment = async () => {
    const shareData = {
        title: 'My Doctor Appointment',
        text: `I have an appointment with Dr. ${appointmentDetails.doctorName} on ${appointmentDetails.appointmentDate} at ${appointmentDetails.appointmentTime}. Booking ID: ${appointmentDetails.bookingId}`,
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            trackEvent('appointment_shared');
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareData.text);
            showNotification("Appointment details copied to clipboard!", 'success');
        }
    } catch (error) {
        console.error("Error sharing:", error);
    }
};

// Download PDF receipt
window.downloadPDF = () => {
    showNotification("PDF download feature would be implemented here", 'info');
    
    // In production, generate and download PDF
    // For now, create a printable version
    
    const printContent = document.getElementById('confirmationContainer').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Appointment Receipt - ${appointmentDetails.bookingId}</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .receipt { border: 2px solid #000; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h1>RuralCare Appointment Receipt</h1>
                    <p>Booking ID: ${appointmentDetails.bookingId}</p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                </div>
                ${printContent}
                <div class="footer">
                    <p>Thank you for choosing RuralCare</p>
                    <p>For any queries, contact: +91 1800-123-4567</p>
                </div>
            </div>
            <script>
                window.print();
                setTimeout(() => window.close(), 1000);
            </script>
        </body>
        </html>
    `);
    
    trackEvent('receipt_downloaded');
};

// Book another appointment
window.bookAnother = () => {
    localStorage.removeItem('selectedDoctorId');
    window.location.href = 'index.html';
    
    trackEvent('book_another_clicked');
};

// Cancel appointment
window.cancelAppointment = () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
        return;
    }
    
    // In production, update status in database
    appointmentDetails.status = 'cancelled';
    appointmentDetails.cancelledAt = new Date().toISOString();
    
    // Save to localStorage
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const index = appointments.findIndex(a => a.bookingId === appointmentDetails.bookingId);
    if (index !== -1) {
        appointments[index] = appointmentDetails;
        localStorage.setItem('appointments', JSON.stringify(appointments));
    }
    
    // Send cancellation notification
    sendCancellationNotification();
    
    showNotification("Appointment cancelled successfully", 'success');
    
    trackEvent('appointment_cancelled', { bookingId: appointmentDetails.bookingId });
    
    // Redirect after delay
    setTimeout(() => window.location.href = 'index.html', 2000);
};

// Send cancellation notification
async function sendCancellationNotification() {
    const message = `Your appointment with Dr. ${appointmentDetails.doctorName} (${appointmentDetails.bookingId}) has been cancelled.`;
    
    // Save for notification service
    const notifications = JSON.parse(localStorage.getItem('cancellations') || '[]');
    notifications.push({
        phone: appointmentDetails.phone,
        message: message,
        bookingId: appointmentDetails.bookingId,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('cancellations', JSON.stringify(notifications));
    
    console.log("Cancellation notification prepared:", message);
}

// Get directions to clinic
window.getDirectionsToClinic = () => {
    const address = encodeURIComponent(doctorDetails.location || 'Rural Health Center');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    
    trackEvent('directions_from_confirmation');
};

// Initialize reminder settings
function initReminderSettings() {
    // Load saved settings
    const savedSettings = JSON.parse(localStorage.getItem('reminderSettings') || '{}');
    
    const smsReminder = document.getElementById('smsReminder');
    const emailReminder = document.getElementById('emailReminder');
    
    if (smsReminder) smsReminder.checked = savedSettings.smsReminder !== false;
    if (emailReminder) emailReminder.checked = savedSettings.emailReminder === true;
}

// Save reminder settings
window.saveReminderSettings = () => {
    const smsReminder = document.getElementById('smsReminder')?.checked || false;
    const emailReminder = document.getElementById('emailReminder')?.checked || false;
    
    const settings = {
        smsReminder,
        emailReminder,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
    
    // Schedule/update reminders based on settings
    updateRemindersBasedOnSettings();
    
    showNotification("Reminder settings saved", 'success');
    
    trackEvent('reminder_settings_updated', settings);
};

// Update reminders based on settings
function updateRemindersBasedOnSettings() {
    if (!appointmentDetails) return;
    
    const settings = JSON.parse(localStorage.getItem('reminderSettings') || '{}');
    
    // Remove existing reminders for this appointment
    let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    reminders = reminders.filter(r => r.appointmentId !== appointmentDetails.bookingId);
    
    // Add new reminders if enabled
    if (settings.smsReminder) {
        const appointmentDate = new Date(appointmentDetails.appointmentDate + 'T' + appointmentDetails.appointmentTime);
        const reminderTime = new Date(appointmentDate);
        reminderTime.setDate(reminderTime.getDate() - 1); // 1 day before
        
        reminders.push({
            type: 'appointment_reminder',
            appointmentId: appointmentDetails.bookingId,
            phone: appointmentDetails.phone,
            message: `Reminder: Your appointment with Dr. ${appointmentDetails.doctorName} is tomorrow at ${appointmentDetails.appointmentTime}`,
            scheduledTime: reminderTime.getTime(),
            status: 'scheduled'
        });
    }
    
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Schedule appointment reminder (called from booking.js)
function scheduleAppointmentReminder(appointmentData) {
    const appointmentDate = new Date(appointmentData.appointmentDate + 'T' + appointmentData.appointmentTime);
    const reminderTime = new Date(appointmentDate);
    reminderTime.setDate(reminderTime.getDate() - 1); // 1 day before
    
    const reminder = {
        type: 'appointment_reminder',
        appointmentId: appointmentData.bookingId,
        phone: appointmentData.phone,
        message: `Reminder: Your appointment with Dr. ${appointmentData.doctorName} is tomorrow at ${appointmentData.appointmentTime}`,
        scheduledTime: reminderTime.getTime(),
        status: 'scheduled'
    };
    
    // Save reminder
    let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    reminders.push(reminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    console.log("Reminder scheduled for:", reminderTime);
}