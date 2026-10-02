// medicine-delivery.js - Advanced Medicine Delivery Service
class MedicineDeliveryService {
    constructor() {
        this.partners = [
            { 
                id: '1', 
                name: 'MediQuick', 
                deliveryTime: '1-2 hours', 
                fee: 50,
                rating: 4.8,
                minOrder: 100,
                image: '🚚',
                description: 'Fastest medicine delivery with live tracking',
                features: ['Live Tracking', '24/7 Support', 'Cash on Delivery']
            },
            { 
                id: '2', 
                name: 'PharmaFast', 
                deliveryTime: '2-3 hours', 
                fee: 40,
                rating: 4.5,
                minOrder: 150,
                image: '💊',
                description: 'Affordable and reliable medicine delivery',
                features: ['Prescription Check', 'SMS Alerts', 'Easy Returns']
            },
            { 
                id: '3', 
                name: 'HealthExpress', 
                deliveryTime: '3-4 hours', 
                fee: 30,
                rating: 4.3,
                minOrder: 200,
                image: '🏥',
                description: 'Trusted pharmacy network across cities',
                features: ['Generic Alternatives', 'Discount Offers', 'Bulk Orders']
            }
        ];
        
        this.orders = [];
        this.prescriptions = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupAutoTracking();
        console.log('💊 Medicine Delivery Service Initialized');
    }

    async loadData() {
        // Load orders from localStorage
        const savedOrders = localStorage.getItem('medicineOrders');
        if (savedOrders) {
            this.orders = JSON.parse(savedOrders);
        }
        
        // Load prescriptions
        const savedPrescriptions = localStorage.getItem('medicinePrescriptions');
        if (savedPrescriptions) {
            this.prescriptions = JSON.parse(savedPrescriptions);
        }
        
        // Load user preferences
        this.userPreferences = JSON.parse(localStorage.getItem('deliveryPreferences') || '{}');
    }

    async saveData() {
        localStorage.setItem('medicineOrders', JSON.stringify(this.orders));
        localStorage.setItem('medicinePrescriptions', JSON.stringify(this.prescriptions));
    }

    // ========== CORE FEATURES ==========

    // 1. PRESCRIPTION MANAGEMENT
    async uploadPrescription(file, patientId) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const prescription = {
                    id: `PRES-${Date.now()}`,
                    patientId: patientId,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    dataUrl: e.target.result,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification',
                    verifiedBy: null,
                    verifiedAt: null
                };

                this.prescriptions.push(prescription);
                await this.saveData();
                
                // Auto-verify for demo (in real app, pharmacist would verify)
                setTimeout(() => this.verifyPrescription(prescription.id, true), 3000);
                
                resolve(prescription);
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async verifyPrescription(prescriptionId, isValid) {
        const prescription = this.prescriptions.find(p => p.id === prescriptionId);
        if (!prescription) return;

        prescription.status = isValid ? 'verified' : 'rejected';
        prescription.verifiedAt = new Date().toISOString();
        prescription.verifiedBy = 'System Auto-Verify'; // In real app, pharmacist ID
        
        await this.saveData();
        
        // Notify patient
        this.sendPrescriptionVerificationNotification(prescription, isValid);
        
        return prescription;
    }

    sendPrescriptionVerificationNotification(prescription, isValid) {
        const message = isValid ? 
            `✅ Your prescription ${prescription.fileName} has been verified and is ready for ordering.` :
            `❌ Your prescription ${prescription.fileName} was rejected. Please upload a clear prescription.`;
        
        showNotification(message, isValid ? 'success' : 'error');
        
        // Send SMS if notification service available
        if (window.notificationService) {
            const patientPhone = localStorage.getItem('userPhone');
            if (patientPhone) {
                window.notificationService.sendSMS(
                    patientPhone,
                    message,
                    'prescription_verification'
                );
            }
        }
    }

    // 2. ADVANCED ORDER PLACEMENT
    async orderMedicines(prescriptionId, address, phone, paymentMethod = 'cod') {
        const prescription = this.prescriptions.find(p => p.id === prescriptionId);
        
        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status !== 'verified') {
            throw new Error('Prescription not verified');
        }

        // Select best delivery partner
        const partner = this.selectBestDeliveryPartner(address);
        
        // Calculate total
        const orderTotal = this.calculateOrderTotal(partner);
        
        const order = {
            id: `MED-ORD-${Date.now().toString(36).toUpperCase()}`,
            prescriptionId: prescriptionId,
            patientId: prescription.patientId,
            deliveryPartner: partner,
            deliveryAddress: address,
            contactPhone: phone,
            orderTotal: orderTotal,
            deliveryFee: partner.fee,
            status: 'pending',
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            orderedAt: new Date().toISOString(),
            estimatedDelivery: this.calculateDeliveryTime(address, partner),
            trackingNumber: this.generateTrackingNumber(),
            items: await this.extractMedicinesFromPrescription(prescription)
        };

        // Save order
        this.orders.push(order);
        await this.saveData();

        // Send to delivery partner (simulated)
        await this.notifyDeliveryPartner(partner, order);
        
        // Send confirmation to patient
        this.sendOrderConfirmation(order);
        
        // Track event
        if (window.trackEvent) {
            trackEvent('medicine_order_placed', {
                orderId: order.id,
                partner: partner.name,
                amount: orderTotal,
                paymentMethod: paymentMethod
            });
        }

        return order;
    }

    selectBestDeliveryPartner(address) {
        const distance = this.calculateDistance(address);
        const userRating = this.userPreferences.ratingPreference || 'balanced';
        
        return this.partners.reduce((best, partner) => {
            const score = this.calculateAdvancedPartnerScore(partner, distance, userRating);
            return score > best.score ? { partner, score } : best;
        }, { partner: this.partners[0], score: 0 }).partner;
    }

    calculateAdvancedPartnerScore(partner, distance, userPreference) {
        const weights = {
            'fast': { time: 0.6, fee: 0.2, rating: 0.1, distance: 0.1 },
            'cheap': { time: 0.1, fee: 0.6, rating: 0.2, distance: 0.1 },
            'balanced': { time: 0.3, fee: 0.3, rating: 0.2, distance: 0.2 }
        };

        const weight = weights[userPreference] || weights.balanced;
        
        const timeScore = 100 - (parseInt(partner.deliveryTime) * 15);
        const feeScore = 100 - (partner.fee * 1.5);
        const ratingScore = partner.rating * 20;
        const distanceScore = distance < 5 ? 100 : 100 - (distance * 8);
        
        return (
            timeScore * weight.time +
            feeScore * weight.fee +
            ratingScore * weight.rating +
            distanceScore * weight.distance
        );
    }

    calculateOrderTotal(partner) {
        // Mock calculation - in real app, sum of medicine prices
        const baseAmount = 500; // Mock medicine cost
        return baseAmount + partner.fee;
    }

    generateTrackingNumber() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let tracking = '';
        for (let i = 0; i < 10; i++) {
            tracking += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return tracking;
    }

    async extractMedicinesFromPrescription(prescription) {
        // In real app, use OCR to extract medicines
        // For demo, return mock data
        return [
            { name: 'Paracetamol 500mg', quantity: 10, type: 'Tablet' },
            { name: 'Azithromycin 250mg', quantity: 6, type: 'Tablet' },
            { name: 'Vitamin C 500mg', quantity: 30, type: 'Tablet' }
        ];
    }

    // 3. REAL-TIME TRACKING
    async trackDelivery(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        
        if (!order) {
            throw new Error('Order not found');
        }

        // Simulate real-time tracking updates
        const trackingUpdate = {
            orderId: order.id,
            status: order.status,
            currentLocation: await this.getSimulatedLocation(),
            lastUpdated: new Date().toISOString(),
            estimatedTimeRemaining: this.calculateRemainingTime(order.estimatedDelivery),
            deliveryPerson: {
                name: 'Rahul Kumar',
                phone: '+91 98765XXXXX',
                vehicle: 'Bike',
                photo: '🚴'
            },
            milestones: this.generateTrackingMilestones(order)
        };

        // Update order if needed
        await this.autoUpdateOrderStatus(order);

        return trackingUpdate;
    }

    getSimulatedLocation() {
        const locations = [
            { lat: 28.6139, lng: 77.2090, address: 'Near Connaught Place, Delhi' },
            { lat: 19.0760, lng: 72.8777, address: 'Bandra West, Mumbai' },
            { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bangalore' },
            { lat: 22.5726, lng: 88.3639, address: 'Park Street, Kolkata' }
        ];
        
        return locations[Math.floor(Math.random() * locations.length)];
    }

    generateTrackingMilestones(order) {
        const statusOrder = ['pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered'];
        const currentIndex = statusOrder.indexOf(order.status);
        
        return statusOrder.map((status, index) => ({
            status: status,
            completed: index <= currentIndex,
            timestamp: index <= currentIndex ? 
                new Date(Date.now() - (currentIndex - index) * 30 * 60 * 1000).toISOString() : null,
            description: this.getStatusDescription(status)
        }));
    }

    getStatusDescription(status) {
        const descriptions = {
            'pending': 'Order received',
            'confirmed': 'Order confirmed by pharmacy',
            'processing': 'Medicines being prepared',
            'dispatched': 'Picked up by delivery partner',
            'out_for_delivery': 'On the way to your location',
            'delivered': 'Successfully delivered'
        };
        return descriptions[status] || status;
    }

    // 4. AUTO STATUS UPDATES
    async autoUpdateOrderStatus(order) {
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return;
        }

        const statusOrder = ['pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered'];
        const currentIndex = statusOrder.indexOf(order.status);
        
        // Auto-progress every 30 seconds for demo
        if (currentIndex < statusOrder.length - 1) {
            const timeSinceLastUpdate = Date.now() - new Date(order.orderedAt).getTime();
            const updateInterval = 30 * 1000; // 30 seconds
            
            if (timeSinceLastUpdate > (currentIndex + 1) * updateInterval) {
                order.status = statusOrder[currentIndex + 1];
                order.statusUpdatedAt = new Date().toISOString();
                
                // Update delivery time when dispatched
                if (order.status === 'dispatched') {
                    order.estimatedDelivery = new Date(Date.now() + 45 * 60 * 1000).toISOString();
                }
                
                await this.saveData();
                this.sendDeliveryUpdate(order);
                
                // If delivered, send delivery confirmation
                if (order.status === 'delivered') {
                    this.sendDeliveryConfirmation(order);
                }
            }
        }
    }

    sendDeliveryUpdate(order) {
        const messages = {
            'confirmed': `✅ Order #${order.id} confirmed by pharmacy. Preparing your medicines.`,
            'processing': `🔄 Your medicines are being prepared at the pharmacy.`,
            'dispatched': `📦 Order #${order.id} has been picked up by ${order.deliveryPartner.name}.`,
            'out_for_delivery': `🚚 Your order is out for delivery! Track live location.`,
            'delivered': `🎉 Order #${order.id} delivered successfully! Thank you.`
        };

        const message = messages[order.status];
        if (message) {
            showNotification(message, 'info');
            
            // Send SMS
            if (window.notificationService && order.contactPhone) {
                window.notificationService.sendSMS(
                    order.contactPhone,
                    message + ` Tracking: ${order.trackingNumber}`,
                    'delivery_update'
                );
            }
        }
    }

    sendDeliveryConfirmation(order) {
        // Send delivery proof request
        setTimeout(() => {
            showNotification('📸 Please take a photo of delivered medicines for proof', 'info');
        }, 5000);

        // Request feedback
        setTimeout(() => {
            this.requestFeedback(order);
        }, 10000);
    }

    // 5. SMART FEATURES

    // Price Comparison
    async comparePrices(medicineName) {
        // Mock price comparison from different partners
        return this.partners.map(partner => ({
            partner: partner.name,
            price: Math.floor(Math.random() * 100) + 50, // Mock price
            deliveryTime: partner.deliveryTime,
            total: Math.floor(Math.random() * 100) + 50 + partner.fee
        })).sort((a, b) => a.total - b.total);
    }

    // Medicine Availability Check
    async checkAvailability(medicines, pincode) {
        // Mock availability check
        return medicines.map(medicine => ({
            medicine: medicine,
            available: Math.random() > 0.3, // 70% available
            alternative: Math.random() > 0.7 ? 'Generic version available' : null,
            estimatedRestock: Math.random() > 0.5 ? '24 hours' : 'In stock'
        }));
    }

    // Reorder from History
    async reorderFromHistory(orderId) {
        const originalOrder = this.orders.find(o => o.id === orderId);
        if (!originalOrder) {
            throw new Error('Order not found in history');
        }

        const newOrder = {
            ...originalOrder,
            id: `MED-RE-${Date.now().toString(36).toUpperCase()}`,
            orderedAt: new Date().toISOString(),
            status: 'pending',
            estimatedDelivery: this.calculateDeliveryTime(originalOrder.deliveryAddress, originalOrder.deliveryPartner),
            trackingNumber: this.generateTrackingNumber(),
            isReorder: true,
            originalOrderId: orderId
        };

        delete newOrder.statusUpdatedAt;
        delete newOrder.deliveredAt;

        this.orders.push(newOrder);
        await this.saveData();

        showNotification(`Reorder placed! New Order ID: ${newOrder.id}`, 'success');
        return newOrder;
    }

    // 6. DELIVERY SCHEDULING
    async scheduleDelivery(orderId, deliveryTime) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'pending' && order.status !== 'confirmed') {
            throw new Error('Cannot schedule delivery at this stage');
        }

        order.scheduledDelivery = deliveryTime;
        order.isScheduled = true;
        await this.saveData();

        showNotification(`Delivery scheduled for ${new Date(deliveryTime).toLocaleString()}`, 'success');
        return order;
    }

    // 7. FEEDBACK SYSTEM
    async submitFeedback(orderId, rating, comments, photos = []) {
        const feedback = {
            orderId: orderId,
            rating: rating,
            comments: comments,
            photos: photos,
            submittedAt: new Date().toISOString(),
            reviewed: false
        };

        let feedbacks = JSON.parse(localStorage.getItem('deliveryFeedbacks') || '[]');
        feedbacks.push(feedback);
        localStorage.setItem('deliveryFeedbacks', JSON.stringify(feedbacks));

        // Update partner rating
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            await this.updatePartnerRating(order.deliveryPartner.id, rating);
        }

        showNotification('Thank you for your feedback!', 'success');
        
        if (window.trackEvent) {
            trackEvent('delivery_feedback_submitted', { orderId, rating });
        }
        
        return feedback;
    }

    async updatePartnerRating(partnerId, newRating) {
        const partner = this.partners.find(p => p.id === partnerId);
        if (!partner) return;

        // Update rating (weighted average)
        const currentRating = partner.rating || 4.5;
        const totalRatings = partner.totalRatings || 100;
        partner.rating = ((currentRating * totalRatings) + newRating) / (totalRatings + 1);
        partner.totalRatings = (partner.totalRatings || 100) + 1;
    }

    requestFeedback(order) {
        setTimeout(() => {
            if (confirm('How was your medicine delivery experience?')) {
                const rating = prompt('Rate from 1-5 stars:');
                if (rating && rating >= 1 && rating <= 5) {
                    this.submitFeedback(order.id, parseInt(rating), '');
                }
            }
        }, 30000); // Ask after 30 seconds of delivery
    }

    // 8. CANCELLATION & REFUNDS
    async cancelOrder(orderId, reason) {
        const order = this.orders.find(o => o.id === orderId);
        
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status === 'delivered' || order.status === 'cancelled') {
            throw new Error('Cannot cancel this order');
        }

        const cancellableStatuses = ['pending', 'confirmed', 'processing'];
        if (!cancellableStatuses.includes(order.status)) {
            throw new Error('Order is already being processed');
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        order.cancellationReason = reason;
        
        // Process refund if paid online
        if (order.paymentMethod !== 'cod' && order.paymentStatus === 'paid') {
            order.refundStatus = 'pending';
            order.refundAmount = order.orderTotal;
            order.refundInitiatedAt = new Date().toISOString();
            
            // Simulate refund processing
            setTimeout(() => {
                order.refundStatus = 'processed';
                order.refundProcessedAt = new Date().toISOString();
                this.saveData();
                showNotification(`Refund of ₹${order.refundAmount} processed`, 'success');
            }, 5000);
        }

        await this.saveData();
        
        // Notify delivery partner
        await this.notifyCancellation(order.deliveryPartner, orderId, reason);
        
        // Send cancellation notification
        this.sendCancellationNotification(order);
        
        if (window.trackEvent) {
            trackEvent('medicine_order_cancelled', { orderId, reason, refundAmount: order.refundAmount });
        }
        
        return order;
    }

    sendCancellationNotification(order) {
        const message = `❌ Order #${order.id} has been cancelled. ${order.refundAmount ? `Refund of ₹${order.refundAmount} initiated.` : ''}`;
        
        showNotification(message, 'info');
        
        if (window.notificationService && order.contactPhone) {
            window.notificationService.sendSMS(
                order.contactPhone,
                message,
                'order_cancellation'
            );
        }
    }

    // 9. DELIVERY HISTORY & ANALYTICS
    async getDeliveryHistory(patientId, filters = {}) {
        let filteredOrders = this.orders.filter(order => 
            order.patientId === patientId
        );

        // Apply filters
        if (filters.status) {
            filteredOrders = filteredOrders.filter(order => order.status === filters.status);
        }
        
        if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            filteredOrders = filteredOrders.filter(order => 
                new Date(order.orderedAt) >= startDate && 
                new Date(order.orderedAt) <= endDate
            );
        }
        
        if (filters.partner) {
            filteredOrders = filteredOrders.filter(order => 
                order.deliveryPartner.name === filters.partner
            );
        }

        // Calculate statistics
        const stats = {
            totalOrders: filteredOrders.length,
            totalSpent: filteredOrders.reduce((sum, order) => sum + (order.orderTotal || 0), 0),
            deliveredOrders: filteredOrders.filter(o => o.status === 'delivered').length,
            cancelledOrders: filteredOrders.filter(o => o.status === 'cancelled').length,
            favoritePartner: this.getFavoritePartner(filteredOrders),
            averageDeliveryTime: this.calculateAverageDeliveryTime(filteredOrders)
        };

        return {
            orders: filteredOrders.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt)),
            statistics: stats
        };
    }

    getFavoritePartner(orders) {
        const partnerCount = {};
        orders.forEach(order => {
            if (order.deliveryPartner && order.deliveryPartner.name) {
                partnerCount[order.deliveryPartner.name] = (partnerCount[order.deliveryPartner.name] || 0) + 1;
            }
        });
        
        return Object.entries(partnerCount)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }))[0];
    }

    calculateAverageDeliveryTime(orders) {
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        if (deliveredOrders.length === 0) return 'N/A';
        
        const totalTime = deliveredOrders.reduce((sum, order) => {
            const ordered = new Date(order.orderedAt);
            const delivered = new Date(order.deliveredAt || order.estimatedDelivery);
            return sum + (delivered - ordered);
        }, 0);
        
        const avgMinutes = Math.floor(totalTime / deliveredOrders.length / 60000);
        return `${avgMinutes} minutes`;
    }

    // 10. NOTIFICATION SYSTEM
    setupAutoTracking() {
        // Check for status updates every minute
        setInterval(async () => {
            const pendingOrders = this.orders.filter(o => 
                !['delivered', 'cancelled'].includes(o.status)
            );
            
            for (const order of pendingOrders) {
                await this.autoUpdateOrderStatus(order);
            }
        }, 60000); // Every minute

        // Check for scheduled deliveries
        setInterval(() => {
            const scheduledOrders = this.orders.filter(o => 
                o.isScheduled && 
                o.status === 'confirmed' &&
                new Date(o.scheduledDelivery) <= new Date(Date.now() + 30 * 60 * 1000) // 30 minutes before
            );
            
            scheduledOrders.forEach(order => {
                showNotification(`Scheduled delivery for ${new Date(order.scheduledDelivery).toLocaleTimeString()}`, 'info');
            });
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    // ========== HELPER METHODS ==========
    async notifyDeliveryPartner(partner, order) {
        console.log(`Notifying ${partner.name} about order ${order.id}`);
        // In real app, API call to delivery partner
        return Promise.resolve();
    }

    async notifyCancellation(partner, orderId, reason) {
        console.log(`Notifying ${partner.name} about cancellation of ${orderId}: ${reason}`);
        // In real app, API call to delivery partner
        return Promise.resolve();
    }

    sendOrderConfirmation(order) {
        const message = `✅ Order #${order.id} placed successfully with ${order.deliveryPartner.name}. Total: ₹${order.orderTotal}. Tracking: ${order.trackingNumber}`;
        
        showNotification(message, 'success');
        
        if (window.notificationService && order.contactPhone) {
            window.notificationService.sendSMS(
                order.contactPhone,
                message,
                'order_confirmation'
            );
        }
    }

    calculateDeliveryTime(address, partner) {
        const baseHours = parseInt(partner.deliveryTime);
        const distance = this.calculateDistance(address);
        const deliveryTime = new Date(Date.now() + (baseHours * 60 + distance * 5) * 60 * 1000);
        return deliveryTime.toISOString();
    }

    calculateDistance(address) {
        // Mock distance calculation
        return Math.floor(Math.random() * 20) + 1; // 1-20 km
    }

    calculateRemainingTime(estimatedDelivery) {
        const remaining = new Date(estimatedDelivery) - Date.now();
        if (remaining <= 0) return 'Arriving soon';
        
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        
        return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
    }

    // ========== PUBLIC API ==========
    
    // Get all delivery partners
    getDeliveryPartners() {
        return this.partners;
    }

    // Get order by ID
    getOrder(orderId) {
        return this.orders.find(o => o.id === orderId);
    }

    // Get prescription by ID
    getPrescription(prescriptionId) {
        return this.prescriptions.find(p => p.id === prescriptionId);
    }

    // Get all orders for current user
    getMyOrders() {
        const userId = localStorage.getItem('userId') || 'demo-user';
        return this.orders.filter(o => o.patientId === userId);
    }

    // Get order status
    getOrderStatus(orderId) {
        const order = this.getOrder(orderId);
        return order ? order.status : 'not_found';
    }

    // Update user preferences
    updatePreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        localStorage.setItem('deliveryPreferences', JSON.stringify(this.userPreferences));
    }
}

// ========== GLOBAL INSTANCE ==========
let medicineDeliveryService = null;

function initMedicineDelivery() {
    if (!medicineDeliveryService) {
        medicineDeliveryService = new MedicineDeliveryService();
        console.log('💊 Medicine Delivery Service Ready');
    }
    return medicineDeliveryService;
}

// Auto-initialize when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initMedicineDelivery();
        }, 1000);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MedicineDeliveryService, initMedicineDelivery };
}