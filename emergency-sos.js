// Emergency SOS with location sharing
class EmergencySOS {
    constructor() {
        this.emergencyContacts = [];
        this.watchId = null;
        this.isEmergencyActive = false;
        this.init();
    }

    async init() {
        await this.loadEmergencyContacts();
        this.setupSOSButton();
        this.requestLocationPermission();
        console.log("🚨 Emergency SOS System Initialized");
    }

    async loadEmergencyContacts() {
        // Load from localStorage or use defaults
        const savedContacts = localStorage.getItem('emergencyContacts');
        if (savedContacts) {
            this.emergencyContacts = JSON.parse(savedContacts);
        } else {
            // Default emergency contacts
            this.emergencyContacts = [
                { name: 'Emergency Services', phone: '112', email: '', isDefault: true },
                { name: 'Family Member', phone: '', email: '', isDefault: true }
            ];
            localStorage.setItem('emergencyContacts', JSON.stringify(this.emergencyContacts));
        }
    }

    setupSOSButton() {
        // Check if button already exists
        if (document.getElementById('sosButton')) return;

        // Create SOS button
        const sosButton = document.createElement('button');
        sosButton.id = 'sosButton';
        sosButton.innerHTML = '🚨 SOS';
        sosButton.title = 'Press and hold for 3 seconds for emergency';
        sosButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            border: none;
            font-size: 28px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(231, 76, 60, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            animation: pulse 2s infinite;
        `;

        // Add pulse animation
        const pulseStyle = document.createElement('style');
        pulseStyle.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 4px 20px rgba(231, 76, 60, 0.6); }
                50% { transform: scale(1.1); box-shadow: 0 6px 30px rgba(231, 76, 60, 0.8); }
                100% { transform: scale(1); box-shadow: 0 4px 20px rgba(231, 76, 60, 0.6); }
            }
            
            #sosButton:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(231, 76, 60, 0.7);
            }
            
            #sosButton:active {
                transform: scale(0.95);
                background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
            }
            
            .emergency-active {
                animation: emergencyPulse 1s infinite !important;
            }
            
            @keyframes emergencyPulse {
                0% { background: #e74c3c; }
                50% { background: #ff0000; }
                100% { background: #e74c3c; }
            }
        `;
        document.head.appendChild(pulseStyle);

        // Long press detection
        let pressTimer;
        let isPressed = false;

        // Mouse events
        sosButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isPressed = true;
            sosButton.style.animation = 'none';
            sosButton.style.transform = 'scale(0.9)';
            
            pressTimer = setTimeout(() => {
                if (isPressed) {
                    this.triggerEmergency();
                }
            }, 3000); // 3 second hold
        });

        sosButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            isPressed = false;
            clearTimeout(pressTimer);
            sosButton.style.animation = 'pulse 2s infinite';
            sosButton.style.transform = 'scale(1)';
        });

        sosButton.addEventListener('mouseleave', () => {
            if (isPressed) {
                isPressed = false;
                clearTimeout(pressTimer);
                sosButton.style.animation = 'pulse 2s infinite';
                sosButton.style.transform = 'scale(1)';
            }
        });

        // Touch events for mobile
        sosButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isPressed = true;
            sosButton.style.animation = 'none';
            sosButton.style.transform = 'scale(0.9)';
            
            pressTimer = setTimeout(() => {
                if (isPressed) {
                    this.triggerEmergency();
                }
            }, 3000);
        });

        sosButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            isPressed = false;
            clearTimeout(pressTimer);
            sosButton.style.animation = 'pulse 2s infinite';
            sosButton.style.transform = 'scale(1)';
        });

        sosButton.addEventListener('touchcancel', () => {
            if (isPressed) {
                isPressed = false;
                clearTimeout(pressTimer);
                sosButton.style.animation = 'pulse 2s infinite';
                sosButton.style.transform = 'scale(1)';
            }
        });

        // Add to document
        document.body.appendChild(sosButton);
        
        // Add instructions tooltip
        this.addSOSInstructions();
    }

    addSOSInstructions() {
        const tooltip = document.createElement('div');
        tooltip.id = 'sosTooltip';
        tooltip.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9998;
            max-width: 250px;
            display: none;
        `;
        tooltip.textContent = 'Press and hold for 3 seconds to trigger emergency alert';
        
        const sosButton = document.getElementById('sosButton');
        if (sosButton) {
            sosButton.addEventListener('mouseenter', () => {
                tooltip.style.display = 'block';
            });
            
            sosButton.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
        
        document.body.appendChild(tooltip);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 10000);
    }

    requestLocationPermission() {
        if ('geolocation' in navigator) {
            // Just check permission, don't get location yet
            navigator.permissions?.query({ name: 'geolocation' })
                .then(permissionStatus => {
                    console.log('Location permission status:', permissionStatus.state);
                    
                    if (permissionStatus.state === 'prompt') {
                        // Show permission hint
                        this.showLocationPermissionHint();
                    }
                })
                .catch(console.error);
        }
    }

    showLocationPermissionHint() {
        const hint = document.createElement('div');
        hint.id = 'locationPermissionHint';
        hint.style.cssText = `
            position: fixed;
            bottom: 160px;
            left: 20px;
            background: #3498db;
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 9997;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            animation: slideUp 0.5s ease;
        `;
        
        hint.innerHTML = `
            <strong>📍 Location Access Required</strong>
            <p style="margin: 10px 0; font-size: 14px;">
                For emergency SOS feature, please allow location access when prompted.
            </p>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #3498db;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                font-size: 12px;
                cursor: pointer;
            ">
                OK, Got it
            </button>
        `;
        
        // Add animation
        const slideStyle = document.createElement('style');
        slideStyle.textContent = `
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(slideStyle);
        
        document.body.appendChild(hint);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (hint.parentNode) {
                hint.remove();
            }
        }, 15000);
    }

    async triggerEmergency() {
        if (this.isEmergencyActive) {
            console.log('Emergency already active');
            return;
        }
        
        this.isEmergencyActive = true;
        console.log('🚨 Emergency triggered!');
        
        // Update SOS button
        const sosButton = document.getElementById('sosButton');
        if (sosButton) {
            sosButton.classList.add('emergency-active');
            sosButton.innerHTML = '🆘';
            sosButton.style.animation = 'emergencyPulse 1s infinite';
        }
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // Play emergency sound
        this.playEmergencySound();
        
        try {
            // Get current location
            const location = await this.getCurrentLocation();
            
            // Show emergency UI
            this.showEmergencyUI(location);
            
            // Send emergency alerts
            await this.sendEmergencyAlerts(location);
            
            // Call emergency services
            await this.callEmergencyServices();
            
            // Notify nearby hospitals
            await this.notifyNearbyHospitals(location);
            
            // Start continuous location tracking
            this.startLocationTracking();
            
            // Track event
            if (window.trackEvent) {
                trackEvent('emergency_sos_triggered', { 
                    latitude: location.latitude,
                    longitude: location.longitude 
                });
            }
            
        } catch (error) {
            console.error('Error in emergency trigger:', error);
            this.showErrorUI(error);
        }
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(position.timestamp).toLocaleTimeString()
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Fallback to IP-based location
                    this.getIPLocation()
                        .then(resolve)
                        .catch(reject);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    async getIPLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            return {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 50000, // IP location is less accurate
                timestamp: new Date().toLocaleTimeString(),
                city: data.city,
                country: data.country_name,
                method: 'ip'
            };
        } catch (error) {
            throw new Error('Could not get location');
        }
    }

    async sendEmergencyAlerts(location) {
        const message = `🚨 EMERGENCY ALERT! 
User needs immediate medical assistance.
📍 Location: ${location.latitude}, ${location.longitude}
🕐 Time: ${new Date().toLocaleTimeString()}
📱 Accuracy: ${location.accuracy} meters
${location.city ? `🏙️ City: ${location.city}, ${location.country}` : ''}

This is an automated emergency alert from RuralCare App.`;

        // Send to emergency contacts
        for (const contact of this.emergencyContacts) {
            if (contact.phone && contact.phone.trim()) {
                console.log(`Sending SMS to: ${contact.name} - ${contact.phone}`);
                
                // Use notification service if available
                if (window.notificationService) {
                    await window.notificationService.sendSMS(
                        contact.phone,
                        message,
                        'emergency'
                    );
                } else {
                    // Fallback: log or use SMS API
                    console.log('SMS would be sent:', message);
                }
            }
            
            if (contact.email && contact.email.trim()) {
                console.log(`Sending email to: ${contact.name} - ${contact.email}`);
                
                if (window.notificationService) {
                    await window.notificationService.sendEmail(
                        contact.email,
                        '🚨 EMERGENCY ALERT - Medical Assistance Needed',
                        message,
                        'emergency'
                    );
                } else {
                    console.log('Email would be sent:', message);
                }
            }
        }
        
        // Show confirmation
        if (window.showNotification) {
            showNotification(`Emergency alerts sent to ${this.emergencyContacts.length} contacts`, 'success');
        }
    }

    async callEmergencyServices() {
        // Detect country for appropriate emergency number
        let country = 'IN'; // Default to India
        try {
            const response = await fetch('https://ipapi.co/country/');
            country = await response.text();
        } catch (error) {
            console.log('Using default country code');
        }
        
        const emergencyNumbers = {
            'IN': { number: '112', name: 'Emergency Services (India)' },
            'US': { number: '911', name: 'Emergency (USA)' },
            'GB': { number: '999', name: 'Emergency (UK)' },
            'AU': { number: '000', name: 'Emergency (Australia)' },
            'CA': { number: '911', name: 'Emergency (Canada)' }
        };
        
        const emergency = emergencyNumbers[country] || emergencyNumbers['IN'];
        
        // Create call interface
        this.showCallInterface(emergency);
        
        // Make the phone call (for mobile devices)
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // On mobile, we can use tel: protocol
            window.location.href = `tel:${emergency.number}`;
        } else {
            // On desktop, show instructions
            console.log(`Call ${emergency.number} - ${emergency.name}`);
        }
    }

    showCallInterface(emergency) {
        const callDiv = document.createElement('div');
        callDiv.id = 'emergencyCallInterface';
        callDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10001;
            text-align: center;
            animation: slideInRight 0.5s ease;
        `;
        
        callDiv.innerHTML = `
            <h3 style="color: #e74c3c; margin-bottom: 15px;">📞 Call Emergency</h3>
            <div style="font-size: 2.5rem; font-weight: bold; color: #2c3e50; margin: 20px 0;">
                ${emergency.number}
            </div>
            <p style="color: #7f8c8d; margin-bottom: 20px;">
                ${emergency.name}
            </p>
            ${/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 
                `<a href="tel:${emergency.number}" style="
                    display: inline-block;
                    background: #27ae60;
                    color: white;
                    padding: 15px 30px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 18px;
                    margin-bottom: 15px;
                ">
                    Tap to Call
                </a>` : 
                `<p style="background: #f8f9fa; padding: 15px; border-radius: 8px; color: #e74c3c;">
                    📱 Dial <strong>${emergency.number}</strong> on your phone
                </p>`
            }
            <button onclick="this.parentElement.remove()" style="
                background: #95a5a6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            ">
                Close
            </button>
        `;
        
        // Add animation
        const slideStyle = document.createElement('style');
        slideStyle.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(slideStyle);
        
        document.body.appendChild(callDiv);
    }

    async notifyNearbyHospitals(location) {
        // In a real app, this would use Google Places API or similar
        // For demo, we'll simulate finding nearby hospitals
        
        const simulatedHospitals = [
            { name: 'City General Hospital', distance: '2.5', phone: '+91-XXX-XXX-XXXX' },
            { name: 'Rural Health Center', distance: '5.8', phone: '+91-XXX-XXX-XXXX' },
            { name: 'Community Medical Clinic', distance: '8.2', phone: '+91-XXX-XXX-XXXX' }
        ];
        
        console.log('Nearby hospitals notified:', simulatedHospitals);
        
        // Show hospital list in UI
        this.showHospitalList(simulatedHospitals);
    }

    showHospitalList(hospitals) {
        const hospitalDiv = document.createElement('div');
        hospitalDiv.id = 'nearbyHospitals';
        hospitalDiv.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 300px;
            animation: slideInRight 0.5s ease 0.3s both;
        `;
        
        let hospitalHTML = '<h4 style="color: #3498db; margin-bottom: 15px;">🏥 Nearby Hospitals</h4>';
        
        hospitals.forEach(hospital => {
            hospitalHTML += `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <strong>${hospital.name}</strong>
                    <p style="margin: 5px 0; color: #7f8c8d;">
                        Distance: ${hospital.distance} km
                    </p>
                    <p style="margin: 5px 0; color: #27ae60;">
                        📞 ${hospital.phone}
                    </p>
                </div>
            `;
        });
        
        hospitalHTML += `
            <button onclick="this.parentElement.remove()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                width: 100%;
                margin-top: 10px;
            ">
                Close
            </button>
        `;
        
        hospitalDiv.innerHTML = hospitalHTML;
        document.body.appendChild(hospitalDiv);
    }

    startLocationTracking() {
        if ('geolocation' in navigator) {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.updateEmergencyLocation(position);
                },
                (error) => {
                    console.error('Location tracking error:', error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 10000
                }
            );
        }
    }

    updateEmergencyLocation(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleTimeString(),
            speed: position.coords.speed || 0
        };
        
        console.log('Location update:', location);
        
        // Update emergency UI with new location
        this.updateLocationInUI(location);
        
        // Save location history
        this.saveLocationHistory(location);
    }

    updateLocationInUI(location) {
        const locationElement = document.getElementById('currentLocation');
        if (locationElement) {
            locationElement.innerHTML = `
                📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
                <br><small>Accuracy: ${location.accuracy.toFixed(0)}m | Speed: ${(location.speed * 3.6).toFixed(1)} km/h</small>
            `;
        }
    }

    saveLocationHistory(location) {
        let history = JSON.parse(localStorage.getItem('emergencyLocationHistory') || '[]');
        history.push({
            ...location,
            savedAt: new Date().toISOString()
        });
        
        // Keep only last 50 locations
        if (history.length > 50) {
            history = history.slice(-50);
        }
        
        localStorage.setItem('emergencyLocationHistory', JSON.stringify(history));
    }

    playEmergencySound() {
        // Create emergency sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
            oscillator.frequency.setValueAtTime(587, audioContext.currentTime + 0.5); // D5 note
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
            
        } catch (error) {
            console.log('Audio not supported, using fallback');
            // Fallback: use HTML5 audio if available
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        }
    }

    showEmergencyUI(location) {
        // Create emergency overlay
        const overlay = document.createElement('div');
        overlay.id = 'emergencyOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
            font-family: Arial, sans-serif;
            animation: fadeIn 0.5s ease;
        `;
        
        overlay.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; max-width: 500px; width: 90%;">
                <h1 style="font-size: 3rem; margin-bottom: 20px; animation: pulse 2s infinite;">🚨 EMERGENCY</h1>
                
                <div style="background: rgba(255,255,255,0.2); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: left;">
                    <p style="margin-bottom: 15px; font-size: 1.2rem;">
                        <strong>✅ Help is on the way!</strong>
                    </p>
                    <p style="margin-bottom: 20px;">
                        Emergency services have been notified with your location.
                    </p>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                        <p style="margin-bottom: 10px; font-size: 0.9rem; opacity: 0.9;">Your current location:</p>
                        <p id="currentLocation" style="font-family: monospace; font-size: 1.1rem; font-weight: bold;">
                            📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
                            <br><small>Accuracy: ${location.accuracy.toFixed(0)} meters</small>
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; min-width: 120px;">
                            <div style="font-size: 2rem;">📞</div>
                            <div>Emergency Called</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; min-width: 120px;">
                            <div style="font-size: 2rem;">📍</div>
                            <div>Location Shared</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; min-width: 120px;">
                            <div style="font-size: 2rem;">🏥</div>
                            <div>Hospitals Alerted</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;">
                    <button onclick="window.cancelEmergency()" style="
                        background: white;
                        color: #e74c3c;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        min-width: 180px;
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ✅ Cancel Emergency
                    </button>
                    
                    <button onclick="window.shareEmergencyLocation()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        min-width: 180px;
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        📍 Share Location
                    </button>
                </div>
                
                <div style="font-size: 14px; opacity: 0.8; max-width: 400px; margin: 0 auto;">
                    <p>⏳ Stay on this screen. Your location is being continuously shared.</p>
                    <p>📱 Keep your phone accessible for emergency calls.</p>
                    <p>👥 ${this.emergencyContacts.length} contacts have been notified.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add fadeIn animation
        const fadeStyle = document.createElement('style');
        fadeStyle.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(fadeStyle);
        
        // Make page fullscreen if supported
        this.enterFullscreen();
    }

    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(console.error);
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    showErrorUI(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10002;
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        errorDiv.innerHTML = `
            <h3 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Emergency Setup Required</h3>
            <p style="margin-bottom: 20px; color: #7f8c8d;">
                Please set up emergency contacts and enable location services.
            </p>
            <button onclick="window.setupEmergencyContacts()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                margin: 10px;
                cursor: pointer;
            ">
                ⚙️ Setup Emergency Contacts
            </button>
            <button onclick="this.parentElement.remove()" style="
                background: #95a5a6;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                margin: 10px;
                cursor: pointer;
            ">
                Close
            </button>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

// Global emergency functions
window.cancelEmergency = function() {
    const overlay = document.getElementById('emergencyOverlay');
    if (overlay) {
        overlay.remove();
    }
    
    const callInterface = document.getElementById('emergencyCallInterface');
    if (callInterface) callInterface.remove();
    
    const hospitals = document.getElementById('nearbyHospitals');
    if (hospitals) hospitals.remove();
    
    // Reset SOS button
    const sosButton = document.getElementById('sosButton');
    if (sosButton) {
        sosButton.classList.remove('emergency-active');
        sosButton.innerHTML = '🚨 SOS';
        sosButton.style.animation = 'pulse 2s infinite';
    }
    
    // Stop location tracking
    if (window.emergencySOS && window.emergencySOS.watchId) {
        navigator.geolocation.clearWatch(window.emergencySOS.watchId);
    }
    
    // Exit fullscreen
    if (window.emergencySOS) {
        window.emergencySOS.exitFullscreen();
    }
    
    if (window.showNotification) {
        showNotification('Emergency cancelled. Stay safe!', 'info');
    }
    
    if (window.trackEvent) {
        trackEvent('emergency_cancelled');
    }
};

window.shareEmergencyLocation = async function() {
    try {
        const location = await window.emergencySOS?.getCurrentLocation() || {
            latitude: 'Unknown',
            longitude: 'Unknown'
        };
        
        const shareText = `🚨 EMERGENCY LOCATION: ${location.latitude}, ${location.longitude} - Sent via RuralCare App`;
        
        if (navigator.share) {
            await navigator.share({
                title: 'Emergency Location',
                text: shareText,
                url: window.location.href
            });
        } else {
            await navigator.clipboard.writeText(shareText);
            if (window.showNotification) {
                showNotification('Emergency location copied to clipboard', 'success');
            }
        }
        
        if (window.trackEvent) {
            trackEvent('emergency_location_shared');
        }
    } catch (error) {
        console.error('Error sharing location:', error);
    }
};

window.setupEmergencyContacts = function() {
    // Open emergency contacts setup modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10003;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 100%;">
            <h3 style="color: #2c3e50; margin-bottom: 25px;">⚙️ Emergency Contacts Setup</h3>
            <p style="margin-bottom: 20px; color: #7f8c8d;">
                Add emergency contacts who will be notified during SOS.
            </p>
            
            <div id="emergencyContactsList" style="margin-bottom: 25px;">
                <!-- Contacts will be loaded here -->
                <p>Loading contacts...</p>
            </div>
            
            <button onclick="window.addEmergencyContact()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                cursor: pointer;
                margin-bottom: 20px;
                width: 100%;
            ">
                ➕ Add Emergency Contact
            </button>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    flex: 1;
                ">
                    ✅ Save & Close
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    flex: 1;
                ">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Initialize Emergency SOS when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other components to load
    setTimeout(() => {
        window.emergencySOS = new EmergencySOS();
        console.log('Emergency SOS system ready');
    }, 2000);
});