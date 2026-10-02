// SMS Notification Service
class NotificationService {
    constructor() {
        this.notificationQueue = [];
        this.initialized = false;
        this.init();
    }

    async init() {
        await this.loadQueue();
        this.processQueue();
        this.initialized = true;
        console.log("Notification service initialized");
    }

    async loadQueue() {
        try {
            this.notificationQueue = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
        } catch (error) {
            console.error("Error loading notification queue:", error);
            this.notificationQueue = [];
        }
    }

    async saveQueue() {
        try {
            localStorage.setItem('notificationQueue', JSON.stringify(this.notificationQueue));
        } catch (error) {
            console.error("Error saving notification queue:", error);
        }
    }

    // Send SMS notification
    async sendSMS(phone, message, type = 'appointment') {
        const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            phone: phone,
            message: message,
            type: type,
            status: 'pending',
            createdAt: new Date().toISOString(),
            attempts: 0
        };

        this.notificationQueue.push(notification);
        await this.saveQueue();
        
        // Try to send immediately if online
        if (navigator.onLine) {
            await this.processNotification(notification);
        }
        
        return notification.id;
    }

    // Send Email notification
    async sendEmail(email, subject, body, type = 'appointment') {
        const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            email: email,
            subject: subject,
            body: body,
            type: type,
            status: 'pending',
            createdAt: new Date().toISOString(),
            attempts: 0
        };

        this.notificationQueue.push(notification);
        await this.saveQueue();
        
        if (navigator.onLine) {
            await this.processNotification(notification);
        }
        
        return notification.id;
    }

    // Process notification queue
    async processQueue() {
        if (!navigator.onLine || this.notificationQueue.length === 0) {
            return;
        }

        console.log(`Processing ${this.notificationQueue.length} pending notifications`);

        for (let i = 0; i < this.notificationQueue.length; i++) {
            const notification = this.notificationQueue[i];
            if (notification.status === 'pending' && notification.attempts < 3) {
                await this.processNotification(notification);
            }
        }

        // Clean up sent notifications (keep for 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.notificationQueue = this.notificationQueue.filter(n => 
            n.status === 'pending' || 
            new Date(n.createdAt).getTime() > sevenDaysAgo
        );

        await this.saveQueue();
    }

    // Process individual notification
    async processNotification(notification) {
        try {
            notification.attempts++;
            
            if (notification.phone) {
                await this.sendSMSToAPI(notification.phone, notification.message);
            } else if (notification.email) {
                await this.sendEmailToAPI(notification.email, notification.subject, notification.body);
            }
            
            notification.status = 'sent';
            notification.sentAt = new Date().toISOString();
            
            console.log(`Notification ${notification.id} sent successfully`);
            
            // Track successful notification
            trackEvent('notification_sent', {
                type: notification.type,
                medium: notification.phone ? 'sms' : 'email'
            });
            
        } catch (error) {
            console.error(`Failed to send notification ${notification.id}:`, error);
            notification.lastError = error.message;
            
            if (notification.attempts >= 3) {
                notification.status = 'failed';
                console.error(`Notification ${notification.id} failed after 3 attempts`);
                
                trackEvent('notification_failed', {
                    type: notification.type,
                    attempts: notification.attempts
                });
            }
        }
        
        await this.saveQueue();
    }

    // Simulated SMS API call
    async sendSMSToAPI(phone, message) {
        // In production, replace with actual SMS service API call
        console.log(`[SMS] To: ${phone}, Message: ${message}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 90% success rate
        if (Math.random() < 0.9) {
            return { success: true, messageId: 'SIM-' + Date.now() };
        } else {
            throw new Error('Simulated SMS sending failure');
        }
    }

    // Simulated Email API call
    async sendEmailToAPI(email, subject, body) {
        // In production, replace with actual Email service API call
        console.log(`[EMAIL] To: ${email}, Subject: ${subject}`);
        console.log(`Body: ${body.substring(0, 100)}...`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (Math.random() < 0.9) {
            return { success: true, messageId: 'SIM-' + Date.now() };
        } else {
            throw new Error('Simulated Email sending failure');
        }
    }

    // Appointment confirmation notification
    async sendAppointmentConfirmation(appointmentData) {
        const { patientName, doctorName, appointmentDate, appointmentTime, bookingId, phone, email } = appointmentData;
        
        const smsMessage = `Appointment confirmed! Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}. Booking ID: ${bookingId}. RuralCare - Your Health Partner`;
        
        const emailSubject = `Appointment Confirmation - ${bookingId}`;
        const emailBody = `
            Dear ${patientName},
            
            Your appointment has been confirmed!
            
            Appointment Details:
            - Doctor: Dr. ${doctorName}
            - Date: ${appointmentDate}
            - Time: ${appointmentTime}
            - Booking ID: ${bookingId}
            
            Please arrive 15 minutes before your appointment time.
            Carry your ID proof and any previous medical records.
            
            In case of cancellation, please inform us at least 24 hours in advance.
            
            Thank you for choosing RuralCare!
            
            Best regards,
            RuralCare Team
            Contact: +91 1800-123-4567
        `;
        
        const promises = [];
        
        if (phone) {
            promises.push(this.sendSMS(phone, smsMessage, 'appointment_confirmation'));
        }
        
        if (email) {
            promises.push(this.sendEmail(email, emailSubject, emailBody, 'appointment_confirmation'));
        }
        
        await Promise.all(promises);
        
        // Schedule reminder
        await this.scheduleAppointmentReminder(appointmentData);
    }

    // Appointment reminder
    async scheduleAppointmentReminder(appointmentData) {
        const { doctorName, appointmentDate, appointmentTime, bookingId, phone, email } = appointmentData;
        
        // Schedule for 1 day before
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
        const reminderTime = new Date(appointmentDateTime);
        reminderTime.setDate(reminderTime.getDate() - 1);
        
        const delay = reminderTime.getTime() - Date.now();
        
        if (delay > 0) {
            setTimeout(async () => {
                const smsMessage = `Reminder: Your appointment with Dr. ${doctorName} is tomorrow at ${appointmentTime}. Booking ID: ${bookingId}`;
                
                const emailSubject = `Appointment Reminder - ${bookingId}`;
                const emailBody = `
                    Friendly reminder about your appointment tomorrow!
                    
                    Appointment Details:
                    - Doctor: Dr. ${doctorName}
                    - Date: ${appointmentDate}
                    - Time: ${appointmentTime}
                    
                    Please don't forget to bring your ID and medical records.
                    
                    RuralCare Team
                `;
                
                if (phone) {
                    await this.sendSMS(phone, smsMessage, 'appointment_reminder');
                }
                
                if (email) {
                    await this.sendEmail(email, emailSubject, emailBody, 'appointment_reminder');
                }
                
            }, delay);
        }
    }

    // Cancellation notification
    async sendCancellationNotification(appointmentData, reason = '') {
        const { patientName, doctorName, appointmentDate, bookingId, phone, email } = appointmentData;
        
        const smsMessage = `Your appointment with Dr. ${doctorName} on ${appointmentDate} (${bookingId}) has been cancelled.${reason ? ' Reason: ' + reason : ''}`;
        
        const emailSubject = `Appointment Cancelled - ${bookingId}`;
        const emailBody = `
            Dear ${patientName},
            
            Your appointment has been cancelled.
            
            Cancelled Appointment:
            - Doctor: Dr. ${doctorName}
            - Date: ${appointmentDate}
            - Booking ID: ${bookingId}
            ${reason ? '- Reason: ' + reason : ''}
            
            If this was a mistake or you wish to reschedule, please contact us.
            
            RuralCare Team
            Contact: +91 1800-123-4567
        `;
        
        if (phone) {
            await this.sendSMS(phone, smsMessage, 'cancellation');
        }
        
        if (email) {
            await this.sendEmail(email, emailSubject, emailBody, 'cancellation');
        }
    }

    // Doctor registration notification
    async sendDoctorRegistration(doctorData, adminPhone, adminEmail) {
        const { name, specialization, qualification } = doctorData;
        
        const smsMessage = `New doctor registered: Dr. ${name} (${specialization}). Qualification: ${qualification}`;
        
        const emailSubject = `New Doctor Registration - Dr. ${name}`;
        const emailBody = `
            New Doctor Registration
            
            Details:
            - Name: Dr. ${name}
            - Specialization: ${specialization}
            - Qualification: ${qualification}
            - Registration Time: ${new Date().toLocaleString()}
            
            Please review and activate the doctor's profile in the admin panel.
            
            RuralCare Admin
        `;
        
        if (adminPhone) {
            await this.sendSMS(adminPhone, smsMessage, 'doctor_registration');
        }
        
        if (adminEmail) {
            await this.sendEmail(adminEmail, emailSubject, emailBody, 'doctor_registration');
        }
    }

    // Emergency/alert notification
    async sendEmergencyAlert(message, recipients = []) {
        for (const recipient of recipients) {
            if (recipient.phone) {
                await this.sendSMS(recipient.phone, `🚨 EMERGENCY ALERT: ${message}`, 'emergency');
            }
        }
    }

    // Get notification statistics
    getStatistics() {
        const sent = this.notificationQueue.filter(n => n.status === 'sent').length;
        const pending = this.notificationQueue.filter(n => n.status === 'pending').length;
        const failed = this.notificationQueue.filter(n => n.status === 'failed').length;
        
        return {
            total: this.notificationQueue.length,
            sent,
            pending,
            failed,
            successRate: sent > 0 ? (sent / (sent + failed) * 100).toFixed(1) + '%' : '0%'
        };
    }

    // Clear old notifications
    async clearOldNotifications(days = 30) {
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        this.notificationQueue = this.notificationQueue.filter(notification => 
            new Date(notification.createdAt).getTime() > cutoffDate
        );
        
        await this.saveQueue();
        console.log(`Cleared notifications older than ${days} days`);
    }
}

// Create global instance
window.notificationService = new NotificationService();

// Process queue when coming online
window.addEventListener('online', () => {
    if (window.notificationService) {
        window.notificationService.processQueue();
    }
});

// Process queue every 5 minutes
setInterval(() => {
    if (window.notificationService && navigator.onLine) {
        window.notificationService.processQueue();
    }
}, 5 * 60 * 1000);

// Clear old notifications weekly
setInterval(() => {
    if (window.notificationService) {
        window.notificationService.clearOldNotifications(30);
    }
}, 7 * 24 * 60 * 60 * 1000);

// Export functions for other modules
window.sendAppointmentNotification = (appointmentData) => {
    return window.notificationService?.sendAppointmentConfirmation(appointmentData);
};

window.sendCancellationNotification = (appointmentData, reason) => {
    return window.notificationService?.sendCancellationNotification(appointmentData, reason);
};