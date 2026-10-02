// Offline Support Service
class OfflineService {
    constructor() {
        this.dbName = 'ruralcare_offline';
        this.storeName = 'pending_actions';
        this.syncQueue = [];
        this.initialized = false;
        this.init();
    }

    async init() {
        await this.initDatabase();
        await this.loadSyncQueue();
        this.setupNetworkListeners();
        this.setupAutoSync();
        this.initialized = true;
        console.log("Offline service initialized");
    }

    // Initialize IndexedDB
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    
                    // Create indexes for efficient querying
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onerror = (event) => {
                reject('Failed to open IndexedDB: ' + event.target.error);
            };
        });
    }

    // Load sync queue from IndexedDB
    async loadSyncQueue() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                this.syncQueue = event.target.result || [];
                console.log(`Loaded ${this.syncQueue.length} pending actions`);
                resolve(this.syncQueue);
            };
            
            request.onerror = (event) => {
                reject('Failed to load sync queue: ' + event.target.error);
            };
        });
    }

    // Save action for offline processing
    async saveOfflineAction(action) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const offlineAction = {
                ...action,
                status: 'pending',
                timestamp: Date.now(),
                createdAt: new Date().toISOString(),
                attempts: 0
            };
            
            const request = store.add(offlineAction);
            
            request.onsuccess = (event) => {
                const actionId = event.target.result;
                offlineAction.id = actionId;
                this.syncQueue.push(offlineAction);
                
                console.log('Action saved offline:', action.type, actionId);
                
                // Show notification to user
                this.showOfflineNotification('Action saved offline. Will sync when online.');
                
                // Track offline save
                trackEvent('action_saved_offline', { type: action.type });
                
                resolve(actionId);
            };
            
            request.onerror = (event) => {
                reject('Failed to save offline action: ' + event.target.error);
            };
        });
    }

    // Process sync queue when online
    async processSyncQueue() {
        if (!navigator.onLine || this.syncQueue.length === 0) {
            return;
        }
        
        console.log(`Processing ${this.syncQueue.length} pending actions...`);
        
        const pendingActions = this.syncQueue.filter(action => action.status === 'pending');
        
        for (const action of pendingActions) {
            try {
                await this.processAction(action);
                
                // Update status in database
                await this.updateActionStatus(action.id, 'completed');
                
                // Remove from queue
                const index = this.syncQueue.findIndex(a => a.id === action.id);
                if (index !== -1) {
                    this.syncQueue.splice(index, 1);
                }
                
                console.log(`Action ${action.id} synced successfully`);
                
            } catch (error) {
                console.error(`Failed to sync action ${action.id}:`, error);
                
                // Increment attempts
                action.attempts = (action.attempts || 0) + 1;
                
                if (action.attempts >= 3) {
                    // Mark as failed after 3 attempts
                    await this.updateActionStatus(action.id, 'failed', error.message);
                    
                    // Notify user
                    this.showOfflineNotification(`Failed to sync action after 3 attempts: ${action.type}`, 'error');
                }
            }
        }
        
        // Show completion notification
        if (pendingActions.length > 0) {
            this.showOfflineNotification(`${pendingActions.length} actions synced successfully!`, 'success');
        }
    }

    // Process individual action
    async processAction(action) {
        switch (action.type) {
            case 'appointment':
                return await this.syncAppointment(action.data);
            case 'doctor_update':
                return await this.syncDoctorUpdate(action.data);
            case 'review':
                return await this.syncReview(action.data);
            case 'feedback':
                return await this.syncFeedback(action.data);
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }

    // Sync appointment
    async syncAppointment(data) {
        // Simulate API call
        console.log('Syncing appointment:', data.bookingId);
        
        // In production, replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 90% success rate
        if (Math.random() < 0.9) {
            return { success: true, bookingId: data.bookingId };
        } else {
            throw new Error('Failed to sync appointment');
        }
    }

    // Sync doctor update
    async syncDoctorUpdate(data) {
        console.log('Syncing doctor update:', data.doctorId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (Math.random() < 0.9) {
            return { success: true, doctorId: data.doctorId };
        } else {
            throw new Error('Failed to sync doctor update');
        }
    }

    // Sync review
    async syncReview(data) {
        console.log('Syncing review:', data.reviewId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (Math.random() < 0.9) {
            return { success: true, reviewId: data.reviewId };
        } else {
            throw new Error('Failed to sync review');
        }
    }

    // Sync feedback
    async syncFeedback(data) {
        console.log('Syncing feedback:', data.feedbackId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (Math.random() < 0.9) {
            return { success: true, feedbackId: data.feedbackId };
        } else {
            throw new Error('Failed to sync feedback');
        }
    }

    // Update action status in database
    async updateActionStatus(actionId, status, error = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const getRequest = store.get(actionId);
            
            getRequest.onsuccess = (event) => {
                const action = event.target.result;
                if (!action) {
                    reject('Action not found');
                    return;
                }
                
                action.status = status;
                action.updatedAt = new Date().toISOString();
                
                if (error) {
                    action.lastError = error;
                }
                
                if (status === 'completed') {
                    action.completedAt = new Date().toISOString();
                }
                
                const updateRequest = store.put(action);
                
                updateRequest.onsuccess = () => {
                    resolve(action);
                };
                
                updateRequest.onerror = (e) => {
                    reject('Failed to update action: ' + e.target.error);
                };
            };
            
            getRequest.onerror = (event) => {
                reject('Failed to get action: ' + event.target.error);
            };
        });
    }

    // Get pending actions count
    getPendingCount() {
        return this.syncQueue.filter(action => action.status === 'pending').length;
    }

    // Get all actions
    getAllActions(filter = {}) {
        let actions = [...this.syncQueue];
        
        if (filter.type) {
            actions = actions.filter(action => action.type === filter.type);
        }
        
        if (filter.status) {
            actions = actions.filter(action => action.status === filter.status);
        }
        
        if (filter.startDate) {
            const start = new Date(filter.startDate).getTime();
            actions = actions.filter(action => action.timestamp >= start);
        }
        
        if (filter.endDate) {
            const end = new Date(filter.endDate).getTime();
            actions = actions.filter(action => action.timestamp <= end);
        }
        
        return actions.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Clear old completed actions
    async clearOldActions(days = 7) {
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        const oldActions = this.syncQueue.filter(action => 
            action.status === 'completed' && 
            action.timestamp < cutoffTime
        );
        
        if (oldActions.length === 0) return 0;
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        let deletedCount = 0;
        
        for (const action of oldActions) {
            store.delete(action.id);
            const index = this.syncQueue.findIndex(a => a.id === action.id);
            if (index !== -1) {
                this.syncQueue.splice(index, 1);
                deletedCount++;
            }
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log(`Cleared ${deletedCount} old actions`);
                resolve(deletedCount);
            };
            
            transaction.onerror = (event) => {
                reject('Failed to clear old actions: ' + event.target.error);
            };
        });
    }

    // Show offline notification
    showOfflineNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `offline-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">
                ${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
        `;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideUp 0.3s ease;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateX(-50%) translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Add slide down animation
        const slideDownStyle = document.createElement('style');
        slideDownStyle.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(slideDownStyle);
    }

    // Setup network listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('Device is online. Starting sync...');
            this.processSyncQueue();
            
            // Update UI
            this.updateOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('Device is offline');
            this.updateOnlineStatus(false);
        });
        
        // Initial status check
        this.updateOnlineStatus(navigator.onLine);
    }

    // Update online status in UI
    updateOnlineStatus(isOnline) {
        const statusElement = document.getElementById('online-status');
        if (statusElement) {
            if (isOnline) {
                statusElement.innerHTML = '🟢 Online';
                statusElement.style.color = '#27ae60';
            } else {
                statusElement.innerHTML = '🔴 Offline';
                statusElement.style.color = '#e74c3c';
                
                // Show pending actions count
                const pendingCount = this.getPendingCount();
                if (pendingCount > 0) {
                    statusElement.innerHTML += ` (${pendingCount} pending)`;
                }
            }
        }
        
        // Update body class for CSS styling
        if (isOnline) {
            document.body.classList.remove('offline');
        } else {
            document.body.classList.add('offline');
        }
    }

    // Setup auto-sync
    setupAutoSync() {
        // Sync every 5 minutes when online
        setInterval(() => {
            if (navigator.onLine) {
                this.processSyncQueue();
            }
        }, 5 * 60 * 1000);
        
        // Clear old actions weekly
        setInterval(() => {
            this.clearOldActions(7);
        }, 7 * 24 * 60 * 60 * 1000);
    }

    // Get sync statistics
    getStatistics() {
        const total = this.syncQueue.length;
        const pending = this.syncQueue.filter(a => a.status === 'pending').length;
        const completed = this.syncQueue.filter(a => a.status === 'completed').length;
        const failed = this.syncQueue.filter(a => a.status === 'failed').length;
        
        return {
            total,
            pending,
            completed,
            failed,
            successRate: completed > 0 ? ((completed / (completed + failed)) * 100).toFixed(1) + '%' : '0%'
        };
    }
}

// Create global instance
window.offlineService = new OfflineService();

// Global functions for other modules
window.storeOfflineAction = (action) => {
    return window.offlineService?.saveOfflineAction(action);
};

window.syncOfflineData = () => {
    return window.offlineService?.processSyncQueue();
};

window.getOfflineStats = () => {
    return window.offlineService?.getStatistics();
};

// Check if we're online and sync on page load
document.addEventListener('DOMContentLoaded', () => {
    if (navigator.onLine && window.offlineService) {
        // Small delay to let everything initialize
        setTimeout(() => {
            window.offlineService.processSyncQueue();
        }, 3000);
    }
});

// Add CSS for offline mode
const offlineStyles = `
    body.offline {
        opacity: 0.9;
    }
    
    body.offline::before {
        content: "⚠️ You are offline. Some features may be limited.";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: #000;
        text-align: center;
        padding: 10px;
        z-index: 10001;
        font-weight: bold;
    }
    
    body.offline button[type="submit"]:not(.allow-offline) {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .offline-indicator {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #e74c3c;
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 10000;
    }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = offlineStyles;
document.head.appendChild(styleSheet);