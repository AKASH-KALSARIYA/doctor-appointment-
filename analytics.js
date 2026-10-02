// Analytics Service
class AnalyticsService {
    constructor() {
        this.events = [];
        this.doctorStats = {};
        this.userStats = {};
        this.sessionStart = Date.now();
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupAutoSave();
        console.log("Analytics service initialized");
        
        // Track session start
        this.trackEvent('session_start', {
            page: window.location.pathname,
            referrer: document.referrer || 'direct'
        });
    }

    async loadData() {
        try {
            this.events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            this.doctorStats = JSON.parse(localStorage.getItem('analytics_doctor_stats') || '{}');
            this.userStats = JSON.parse(localStorage.getItem('analytics_user_stats') || '{}');
        } catch (error) {
            console.error("Error loading analytics data:", error);
            this.events = [];
            this.doctorStats = {};
            this.userStats = {};
        }
    }

    async saveData() {
        try {
            // Keep only last 1000 events to prevent storage overflow
            if (this.events.length > 1000) {
                this.events = this.events.slice(-1000);
            }
            
            localStorage.setItem('analytics_events', JSON.stringify(this.events));
            localStorage.setItem('analytics_doctor_stats', JSON.stringify(this.doctorStats));
            localStorage.setItem('analytics_user_stats', JSON.stringify(this.userStats));
        } catch (error) {
            console.error("Error saving analytics data:", error);
        }
    }

    setupAutoSave() {
        // Save every 30 seconds
        setInterval(() => this.saveData(), 30000);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => this.saveData());
    }

    // Track event
    trackEvent(eventName, properties = {}) {
        const event = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: eventName,
            timestamp: new Date().toISOString(),
            properties: properties,
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            screen: {
                width: window.screen.width,
                height: window.screen.height
            },
            language: navigator.language,
            online: navigator.onLine
        };

        this.events.push(event);
        
        // Update user stats
        this.updateUserStats(event);
        
        // Log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[Analytics] ${eventName}:`, properties);
        }
        
        return event.id;
    }

    // Update user statistics
    updateUserStats(event) {
        const userId = localStorage.getItem('user_id') || 'anonymous';
        
        if (!this.userStats[userId]) {
            this.userStats[userId] = {
                userId: userId,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                events: 0,
                pages: new Set(),
                eventsByType: {},
                totalSessionTime: 0
            };
        }
        
        const user = this.userStats[userId];
        user.lastSeen = new Date().toISOString();
        user.events++;
        user.pages.add(window.location.pathname);
        
        if (!user.eventsByType[event.name]) {
            user.eventsByType[event.name] = 0;
        }
        user.eventsByType[event.name]++;
        
        // Calculate session time
        const sessionTime = Date.now() - this.sessionStart;
        user.totalSessionTime += sessionTime;
        this.sessionStart = Date.now();
    }

    // Track doctor view
    trackDoctorView(doctorId) {
        if (!doctorId) return;
        
        if (!this.doctorStats[doctorId]) {
            this.doctorStats[doctorId] = {
                doctorId: doctorId,
                views: 0,
                bookings: 0,
                lastViewed: null,
                viewTimes: []
            };
        }
        
        const doctor = this.doctorStats[doctorId];
        doctor.views++;
        doctor.lastViewed = new Date().toISOString();
        doctor.viewTimes.push(new Date().toISOString());
        
        // Keep only last 100 view times
        if (doctor.viewTimes.length > 100) {
            doctor.viewTimes = doctor.viewTimes.slice(-100);
        }
        
        this.trackEvent('doctor_viewed', { doctorId });
    }

    // Track appointment booking
    trackAppointmentBooking(doctorId) {
        if (!doctorId) return;
        
        if (!this.doctorStats[doctorId]) {
            this.doctorStats[doctorId] = {
                doctorId: doctorId,
                views: 0,
                bookings: 0,
                lastViewed: null,
                viewTimes: []
            };
        }
        
        const doctor = this.doctorStats[doctorId];
        doctor.bookings++;
        
        this.trackEvent('appointment_booked', { doctorId });
    }

    // Get analytics report
    getReport(timeRange = 'day') {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case 'hour':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0); // All time
        }
        
        const filteredEvents = this.events.filter(event => 
            new Date(event.timestamp) >= startDate
        );
        
        // Calculate metrics
        const totalEvents = filteredEvents.length;
        const uniqueUsers = new Set(filteredEvents.map(e => e.properties.userId || 'anonymous')).size;
        
        const eventsByType = {};
        filteredEvents.forEach(event => {
            eventsByType[event.name] = (eventsByType[event.name] || 0) + 1;
        });
        
        // Doctor statistics
        const topDoctors = Object.values(this.doctorStats)
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)
            .map(doctor => ({
                doctorId: doctor.doctorId,
                views: doctor.views,
                bookings: doctor.bookings,
                conversionRate: doctor.views > 0 ? ((doctor.bookings / doctor.views) * 100).toFixed(1) + '%' : '0%',
                lastViewed: doctor.lastViewed
            }));
        
        // User engagement
        const sessionTimes = Object.values(this.userStats).map(user => user.totalSessionTime);
        const avgSessionTime = sessionTimes.length > 0 
            ? Math.round(sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length / 1000)
            : 0;
        
        // Peak hours
        const eventsByHour = {};
        filteredEvents.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
        });
        
        const peakHours = Object.entries(eventsByHour)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
        
        return {
            timeRange: timeRange,
            period: {
                start: startDate.toISOString(),
                end: now.toISOString()
            },
            overview: {
                totalEvents,
                uniqueUsers,
                avgSessionTime: `${avgSessionTime}s`,
                eventsByType
            },
            doctors: {
                topDoctors,
                totalDoctorsTracked: Object.keys(this.doctorStats).length
            },
            peakHours,
            userEngagement: {
                totalUsers: Object.keys(this.userStats).length,
                returningUsers: Object.values(this.userStats).filter(user => user.events > 10).length,
                avgPagesPerSession: this.calculateAvgPagesPerSession()
            }
        };
    }

    // Calculate average pages per session
    calculateAvgPagesPerSession() {
        const users = Object.values(this.userStats);
        if (users.length === 0) return 0;
        
        const totalPages = users.reduce((sum, user) => sum + user.pages.size, 0);
        return (totalPages / users.length).toFixed(1);
    }

    // Generate charts data
    getChartData(type = 'events_over_time') {
        const now = new Date();
        const data = [];
        
        switch (type) {
            case 'events_over_time':
                // Last 24 hours in 1-hour intervals
                for (let i = 23; i >= 0; i--) {
                    const hourStart = new Date(now);
                    hourStart.setHours(now.getHours() - i, 0, 0, 0);
                    const hourEnd = new Date(hourStart);
                    hourEnd.setHours(hourStart.getHours() + 1);
                    
                    const eventsInHour = this.events.filter(event => {
                        const eventTime = new Date(event.timestamp);
                        return eventTime >= hourStart && eventTime < hourEnd;
                    }).length;
                    
                    data.push({
                        time: hourStart.toLocaleTimeString([], { hour: '2-digit' }),
                        value: eventsInHour
                    });
                }
                break;
                
            case 'doctor_popularity':
                const topDoctors = Object.values(this.doctorStats)
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5);
                
                topDoctors.forEach(doctor => {
                    data.push({
                        name: `Dr. ${doctor.doctorId.substring(0, 8)}`,
                        views: doctor.views,
                        bookings: doctor.bookings
                    });
                });
                break;
                
            case 'event_types':
                const eventsByType = {};
                this.events.forEach(event => {
                    eventsByType[event.name] = (eventsByType[event.name] || 0) + 1;
                });
                
                Object.entries(eventsByType).forEach(([name, count]) => {
                    data.push({ name, value: count });
                });
                break;
        }
        
        return data;
    }

    // Export analytics data
    exportData(format = 'json') {
        const data = {
            events: this.events,
            doctorStats: this.doctorStats,
            userStats: this.userStats,
            exportedAt: new Date().toISOString()
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data.events);
        }
        
        return data;
    }

    // Convert to CSV
    convertToCSV(events) {
        if (events.length === 0) return '';
        
        const headers = ['timestamp', 'event_name', 'page', 'user_id', 'online'];
        const rows = events.map(event => [
            event.timestamp,
            event.name,
            event.page,
            event.properties.userId || 'anonymous',
            event.online ? 'yes' : 'no'
        ]);
        
        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        return csv;
    }

    // Clear analytics data
    clearData(confirm = false) {
        if (!confirm) {
            return false;
        }
        
        this.events = [];
        this.doctorStats = {};
        this.userStats = {};
        
        localStorage.removeItem('analytics_events');
        localStorage.removeItem('analytics_doctor_stats');
        localStorage.removeItem('analytics_user_stats');
        
        console.log("Analytics data cleared");
        return true;
    }
}

// Create global instance
window.analytics = new AnalyticsService();

// Global tracking functions
window.trackEvent = (eventName, properties = {}) => {
    return window.analytics?.trackEvent(eventName, properties);
};

window.trackDoctorView = (doctorId) => {
    return window.analytics?.trackDoctorView(doctorId);
};

window.trackAppointmentBooking = (doctorId) => {
    return window.analytics?.trackAppointmentBooking(doctorId);
};

window.getAnalyticsReport = (timeRange = 'day') => {
    return window.analytics?.getReport(timeRange);
};

// Page view tracking
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view', {
        page: window.location.pathname,
        title: document.title
    });
});

// Track clicks on external links
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.includes(window.location.hostname)) {
        trackEvent('external_link_click', {
            url: link.href,
            text: link.textContent.substring(0, 100)
        });
    }
});

// Track form submissions
document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id || form.name) {
        trackEvent('form_submit', {
            formId: form.id || form.name,
            action: form.action || 'unknown'
        });
    }
});

// Track errors
window.addEventListener('error', (e) => {
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// Track offline/online status
window.addEventListener('online', () => {
    trackEvent('connection_online');
});

window.addEventListener('offline', () => {
    trackEvent('connection_offline');
});

// Track visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        trackEvent('page_hidden');
    } else {
        trackEvent('page_visible');
    }
});