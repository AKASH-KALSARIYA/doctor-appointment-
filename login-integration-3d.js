/**
 * RuralCare 3D Login Integration
 * Add this script to index.html for automatic 3D login system integration
 */

(function() {
    console.log('RuralCare 3D Login Integration loading...');
    
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('Initializing 3D login integration...');
        
        // Step 1: Create 3D login container (hidden)
        create3DLoginContainer();
        
        // Step 2: Add 3D login button to header
        add3DLoginButton();
        
        // Step 3: Setup message listener
        setup3DMessageListener();
        
        // Step 4: Check for existing user
        checkExistingUser3D();
        
        console.log('3D Login integration initialized successfully');
    }
    
    // Create 3D login container
    function create3DLoginContainer() {
        if (document.getElementById('ruralcare3DLoginContainer')) return;
        
        const container = document.createElement('div');
        container.id = 'ruralcare3DLoginContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'ruralcare3DLoginIframe';
        iframe.src = 'login-system-3d.html';
        iframe.style.cssText = `
            width: 100%;
            max-width: 500px;
            height: 90vh;
            max-height: 800px;
            border: none;
            border-radius: 30px;
            box-shadow: 
                0 30px 60px rgba(0,0,0,0.4),
                0 0 100px rgba(120, 85, 255, 0.3);
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 30px;
            right: 30px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 1.8rem;
            cursor: pointer;
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        `;
        closeBtn.onclick = close3DLoginModal;
        closeBtn.onmouseenter = () => {
            closeBtn.style.background = 'rgba(255,255,255,0.3)';
            closeBtn.style.transform = 'rotate(90deg) scale(1.1)';
        };
        closeBtn.onmouseleave = () => {
            closeBtn.style.background = 'rgba(255,255,255,0.2)';
            closeBtn.style.transform = 'rotate(0) scale(1)';
        };
        
        container.appendChild(closeBtn);
        container.appendChild(iframe);
        document.body.appendChild(container);
        
        // Close on outside click
        container.addEventListener('click', function(e) {
            if (e.target === container) {
                close3DLoginModal();
            }
        });
    }
    
    // Add 3D login button to header
    function add3DLoginButton() {
        // Check if button already exists
        if (document.getElementById('ruralcare3DLoginBtn')) return;
        
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) {
            console.warn('Header controls not found. Retrying in 1 second...');
            setTimeout(add3DLoginButton, 1000);
            return;
        }
        
        // Create 3D login button
        const loginBtn = document.createElement('button');
        loginBtn.id = 'ruralcare3DLoginBtn';
        loginBtn.innerHTML = `
            <i class="fas fa-sign-in-alt"></i>
            <span>Login</span>
        `;
        loginBtn.style.cssText = `
            background: linear-gradient(135deg, #2e7d32, #1565c0);
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: 15px;
            font-size: 15px;
            box-shadow: 0 5px 20px rgba(21, 101, 192, 0.3);
            position: relative;
            overflow: hidden;
        `;
        
        // Add hover effect
        loginBtn.onmouseenter = () => {
            loginBtn.style.transform = 'translateY(-3px) scale(1.05)';
            loginBtn.style.boxShadow = '0 10px 30px rgba(21, 101, 192, 0.4)';
        };
        
        loginBtn.onmouseleave = () => {
            loginBtn.style.transform = 'translateY(0) scale(1)';
            loginBtn.style.boxShadow = '0 5px 20px rgba(21, 101, 192, 0.3)';
        };
        
        // Add click handler
        loginBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            open3DLoginModal();
        };
        
        // Insert before admin button
        const adminBtn = headerControls.querySelector('.admin-btn');
        if (adminBtn) {
            headerControls.insertBefore(loginBtn, adminBtn);
        } else {
            headerControls.appendChild(loginBtn);
        }
        
        // Update button based on user status
        update3DLoginButton();
    }
    
    // Update 3D login button
    function update3DLoginButton() {
        const loginBtn = document.getElementById('ruralcare3DLoginBtn');
        const user = getUserFromStorage3D();
        
        if (!loginBtn) return;
        
        if (user) {
            loginBtn.innerHTML = `
                <i class="fas fa-user-check"></i>
                <span>${user.name || 'Account'}</span>
            `;
            loginBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
        } else {
            loginBtn.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                <span>Login</span>
            `;
            loginBtn.style.background = 'linear-gradient(135deg, #2e7d32, #1565c0)';
        }
    }
    
    // Open 3D login modal
    function open3DLoginModal() {
        const container = document.getElementById('ruralcare3DLoginContainer');
        const user = getUserFromStorage3D();
        
        if (user) {
            // User is logged in, show user menu
            show3DUserMenu();
            return;
        }
        
        if (container) {
            container.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Send message to iframe to open login
            setTimeout(() => {
                const iframe = document.getElementById('ruralcare3DLoginIframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage('openLogin', '*');
                }
            }, 500);
        }
    }
    
    // Close 3D login modal
    function close3DLoginModal() {
        const container = document.getElementById('ruralcare3DLoginContainer');
        if (container) {
            container.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Setup message listener
    function setup3DMessageListener() {
        window.addEventListener('message', function(event) {
            console.log('3D Login message received:', event.data);
            
            if (event.data === 'closeLogin' || 
                event.data === 'LOGIN_CLOSED' || 
                (event.data && event.data.type === 'LOGIN_CLOSED')) {
                close3DLoginModal();
            }
            
            if (event.data && event.data.type === 'USER_LOGGED_IN') {
                handleUserLogin3D(event.data.user);
            }
        });
    }
    
    // Handle user login
    function handleUserLogin3D(userData) {
        console.log('3D User logged in:', userData);
        saveUserToStorage3D(userData);
        update3DLoginButton();
        close3DLoginModal();
        show3DNotification('Welcome to RuralCare!', 'success');
    }
    
    // Save user to storage
    function saveUserToStorage3D(user) {
        localStorage.setItem('ruralcareCurrentUser', JSON.stringify(user));
    }
    
    // Get user from storage
    function getUserFromStorage3D() {
        try {
            const userData = localStorage.getItem('ruralcareCurrentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error('Error loading user:', e);
            return null;
        }
    }
    
    // Check existing user
    function checkExistingUser3D() {
        const user = getUserFromStorage3D();
        if (user) {
            update3DLoginButton();
        }
    }
    
    // Show 3D user menu
    function show3DUserMenu() {
        // Remove existing menu
        const existingMenu = document.getElementById('ruralcare3DUserMenu');
        if (existingMenu) existingMenu.remove();
        
        const user = getUserFromStorage3D();
        if (!user) return;
        
        // Create user menu
        const userMenu = document.createElement('div');
        userMenu.id = 'ruralcare3DUserMenu';
        userMenu.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            background: white;
            border-radius: 20px;
            box-shadow: 
                0 20px 40px rgba(0,0,0,0.2),
                0 0 0 1px rgba(255,255,255,0.1);
            min-width: 250px;
            z-index: 1000;
            overflow: hidden;
            border: 1px solid #e0e0e0;
            animation: fadeIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        userMenu.innerHTML = `
            <div style="padding: 25px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-bottom: 1px solid #e0e0e0;">
                <div style="font-weight: bold; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; font-size: 1.1rem;">
                    <i class="fas fa-user-circle" style="color: #1565c0; font-size: 1.3rem;"></i>
                    ${user.name || 'User'}
                </div>
                <div style="font-size: 0.85rem; color: #666; margin-bottom: 5px;">
                    <i class="fas fa-envelope"></i> ${user.email || ''}
                </div>
                <div style="font-size: 0.75rem; color: #888; background: rgba(21, 101, 192, 0.1); padding: 4px 10px; border-radius: 20px; display: inline-block;">
                    <i class="fas fa-user-tag"></i> ${user.type || 'Patient'}
                </div>
            </div>
            <div style="padding: 15px 0;">
                <button class="ruralcare-3d-menu-item" onclick="window.RuralCare3D.openDashboard()">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </button>
                <button class="ruralcare-3d-menu-item" onclick="window.RuralCare3D.openMyAppointments()">
                    <i class="fas fa-calendar-check"></i> My Appointments
                </button>
                <button class="ruralcare-3d-menu-item" onclick="window.RuralCare3D.openProfile()">
                    <i class="fas fa-user-edit"></i> Edit Profile
                </button>
                <button class="ruralcare-3d-menu-item" onclick="window.RuralCare3D.logout()" style="color: #ff4757;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
        
        document.body.appendChild(userMenu);
        
        // Add menu item styles
        if (!document.querySelector('#ruralcare-3d-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'ruralcare-3d-menu-styles';
            style.textContent = `
                .ruralcare-3d-menu-item {
                    width: 100%;
                    padding: 15px 25px;
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #333;
                    transition: all 0.3s;
                    font-size: 15px;
                    font-weight: 500;
                }
                .ruralcare-3d-menu-item:hover {
                    background: linear-gradient(90deg, rgba(21, 101, 192, 0.1), transparent);
                    color: #1565c0;
                    padding-left: 30px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Close menu when clicking outside
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!userMenu.contains(e.target) && !document.getElementById('ruralcare3DLoginBtn').contains(e.target)) {
                    userMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    // Show 3D notification
    function show3DNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotif = document.querySelector('.ruralcare-3d-notification');
        if (existingNotif) existingNotif.remove();
        
        const colors = {
            'success': '#4CAF50',
            'error': '#f44336',
            'info': '#2196F3',
            'warning': '#ff9800'
        };
        
        const notification = document.createElement('div');
        notification.className = 'ruralcare-3d-notification';
        notification.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 100000;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            animation: slideInRight3D 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 15px;
            max-width: 400px;
        `;
        
        const icon = type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}" style="font-size: 1.3rem;"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Add animation styles
        if (!document.querySelector('#ruralcare-3d-notification-animations')) {
            const style = document.createElement('style');
            style.id = 'ruralcare-3d-notification-animations';
            style.textContent = `
                @keyframes slideInRight3D {
                    0% { transform: translateX(100%) rotateY(90deg); opacity: 0; }
                    100% { transform: translateX(0) rotateY(0); opacity: 1; }
                }
                @keyframes slideOutRight3D {
                    0% { transform: translateX(0) rotateY(0); opacity: 1; }
                    100% { transform: translateX(100%) rotateY(90deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight3D 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    // Global 3D functions
    window.RuralCare3D = {
        openDashboard: function() {
            show3DNotification('Welcome to RuralCare Dashboard!', 'success');
            const userMenu = document.getElementById('ruralcare3DUserMenu');
            if (userMenu) userMenu.remove();
        },
        openMyAppointments: function() {
            show3DNotification('My Appointments page loading...', 'info');
            const userMenu = document.getElementById('ruralcare3DUserMenu');
            if (userMenu) userMenu.remove();
        },
        openProfile: function() {
            show3DNotification('Edit Profile page loading...', 'info');
            const userMenu = document.getElementById('ruralcare3DUserMenu');
            if (userMenu) userMenu.remove();
        },
        logout: function() {
            localStorage.removeItem('ruralcareCurrentUser');
            sessionStorage.removeItem('ruralcareCurrentUser');
            update3DLoginButton();
            show3DNotification('Logged out successfully!', 'info');
            const userMenu = document.getElementById('ruralcare3DUserMenu');
            if (userMenu) userMenu.remove();
        }
    };
    
    // Make functions globally available
    window.open3DLoginModal = open3DLoginModal;
    window.close3DLoginModal = close3DLoginModal;
    
    console.log('RuralCare 3D Login Integration loaded successfully');
})();