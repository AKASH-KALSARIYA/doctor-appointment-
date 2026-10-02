// Enhanced Analytics with more insights
class EnhancedAnalytics {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupRealTimeAnalytics();
    }

    setupRealTimeAnalytics() {
        // Real-time doctor popularity tracking
        setInterval(() => this.updateLiveStats(), 30000);
        
        // User behavior tracking
        this.trackUserBehavior();
        
        // Performance monitoring
        this.monitorPerformance();
    }

    trackUserBehavior() {
        // Track time spent on each page
        let pageStartTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - pageStartTime;
            this.savePageTime(timeSpent);
        });

        // Track clicks and interactions
        document.addEventListener('click', (e) => {
            const element = e.target;
            this.trackInteraction(element);
        });

        // Track scroll behavior
        let scrollStart = Date.now();
        window.addEventListener('scroll', () => {
            const scrollDepth = (window.scrollY / document.body.scrollHeight) * 100;
            if (scrollDepth > 25 && scrollDepth <= 75) {
                this.trackScrollDepth(scrollDepth);
            }
        });
    }

    async getPredictiveInsights() {
        // Predict busy hours based on historical data
        const appointments = await this.getAppointmentHistory();
        
        const busyHours = {};
        appointments.forEach(apt => {
            const hour = new Date(apt.date).getHours();
            busyHours[hour] = (busyHours[hour] || 0) + 1;
        });

        return {
            peakHours: Object.entries(busyHours)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([hour, count]) => ({ hour, count })),
            
            recommendedSlots: this.suggestOptimalSlots(busyHours),
            
            doctorPerformance: await this.calculateDoctorPerformance()
        };
    }

    suggestOptimalSlots(busyHours) {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            if (!busyHours[hour] || busyHours[hour] < 5) {
                slots.push({
                    hour: `${hour}:00`,
                    recommendation: 'Low demand - Good for booking',
                    demand: busyHours[hour] || 0
                });
            }
        }
        return slots.slice(0, 5);
    }

    async calculateDoctorPerformance() {
        const doctors = await this.getAllDoctors();
        
        return doctors.map(doctor => ({
            name: doctor.name,
            specialization: doctor.specialization,
            rating: doctor.rating,
            appointments: doctor.totalAppointments || 0,
            conversionRate: doctor.views > 0 ? 
                ((doctor.totalAppointments || 0) / doctor.views * 100).toFixed(1) + '%' : '0%',
            revenue: (doctor.totalAppointments || 0) * (doctor.fees || 0),
            efficiency: this.calculateEfficiencyScore(doctor)
        })).sort((a, b) => b.efficiency - a.efficiency);
    }

    calculateEfficiencyScore(doctor) {
        const ratingWeight = 0.4;
        const conversionWeight = 0.3;
        const revenueWeight = 0.3;
        
        const ratingScore = (doctor.rating || 0) / 5 * 100;
        const conversionScore = doctor.views > 0 ? 
            ((doctor.totalAppointments || 0) / doctor.views * 100) : 0;
        const revenueScore = Math.min((doctor.totalAppointments || 0) * (doctor.fees || 0) / 10000 * 100, 100);
        
        return (ratingScore * ratingWeight + 
                conversionScore * conversionWeight + 
                revenueScore * revenueWeight).toFixed(1);
    }
}