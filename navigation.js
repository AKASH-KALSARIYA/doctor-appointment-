// navigation.js - Complete navigation features WITHOUT changing other files

// ========== NAVIGATION FUNCTIONS ==========
function showDoctors() {
    const doctorSection = document.getElementById('doctorList');
    if (doctorSection) {
        doctorSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function openMedicineDelivery() {
    const panel = document.getElementById('medicinePanel');
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="panel-header">
            <h3>💊 Medicine Delivery</h3>
            <button onclick="closeMedicinePanel()" class="close-btn">&times;</button>
        </div>
        <div class="panel-content">
            <div class="delivery-options">
                <h4>Upload Prescription</h4>
                <div class="upload-area" onclick="document.getElementById('prescriptionUpload').click()">
                    <div class="upload-icon">📄</div>
                    <p>Tap to upload prescription</p>
                    <small>JPG, PNG, PDF supported</small>
                </div>
                <input type="file" id="prescriptionUpload" accept="image/*,.pdf" style="display:none;">
                
                <h4>Delivery Partners</h4>
                <div class="partners-grid">
                    <div class="partner-card" onclick="selectPartner('MediQuick')">
                        <div class="partner-name">MediQuick</div>
                        <div class="partner-details">🚚 1-2 hours • ₹50</div>
                        <button class="order-btn">Order Now</button>
                    </div>
                    <div class="partner-card" onclick="selectPartner('PharmaFast')">
                        <div class="partner-name">PharmaFast</div>
                        <div class="partner-details">🚚 2-3 hours • ₹40</div>
                        <button class="order-btn">Order Now</button>
                    </div>
                    <div class="partner-card" onclick="selectPartner('HealthExpress')">
                        <div class="partner-name">HealthExpress</div>
                        <div class="partner-details">🚚 3-4 hours • ₹30</div>
                        <button class="order-btn">Order Now</button>
                    </div>
                </div>
                
                <h4>Track Your Order</h4>
                <div class="track-section">
                    <input type="text" id="trackOrderId" placeholder="Enter Order ID">
                    <button class="track-btn" onclick="trackMedicineOrder()">📍 Track</button>
                </div>
                
                <div class="order-history">
                    <h4>Recent Orders</h4>
                    <div id="recentOrders">
                        <p class="no-orders">No orders yet</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    panel.style.display = 'block';
    loadRecentOrders();
    
    // File upload handler
    document.getElementById('prescriptionUpload').onchange = function(e) {
        handlePrescriptionUpload(e.target.files[0]);
    };
}

function closeMedicinePanel() {
    const panel = document.getElementById('medicinePanel');
    if (panel) panel.style.display = 'none';
}

function selectPartner(partnerName) {
    document.querySelectorAll('.partner-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    localStorage.setItem('selectedPartner', partnerName);
}

function handlePrescriptionUpload(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.innerHTML = `
            <div class="file-preview">
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <strong>${file.name}</strong>
                    <small>${(file.size/1024).toFixed(1)} KB</small>
                </div>
                <button onclick="removePrescription()" class="remove-file">&times;</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removePrescription() {
    const uploadArea = document.querySelector('.upload-area');
    uploadArea.innerHTML = `
        <div class="upload-icon">📄</div>
        <p>Tap to upload prescription</p>
        <small>JPG, PNG, PDF supported</small>
    `;
    document.getElementById('prescriptionUpload').value = '';
}

function orderMedicines() {
    const selectedPartner = localStorage.getItem('selectedPartner');
    if (!selectedPartner) {
        alert('Please select a delivery partner');
        return;
    }
    
    const address = prompt('Enter delivery address:');
    if (!address) return;
    
    const orderId = 'MED' + Date.now().toString().slice(-6);
    const order = {
        id: orderId,
        partner: selectedPartner,
        address: address,
        status: 'confirmed',
        date: new Date().toLocaleString(),
        estimated: '2 hours'
    };
    
    // Save order
    let orders = JSON.parse(localStorage.getItem('medicineOrders') || '[]');
    orders.push(order);
    localStorage.setItem('medicineOrders', JSON.stringify(orders));
    
    alert(`Order placed successfully!\nOrder ID: ${orderId}\nPartner: ${selectedPartner}`);
    closeMedicinePanel();
    loadRecentOrders();
}

function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('medicineOrders') || '[]');
    const recentOrders = document.getElementById('recentOrders');
    
    if (!recentOrders) return;
    
    if (orders.length === 0) {
        recentOrders.innerHTML = '<p class="no-orders">No orders yet</p>';
        return;
    }
    
    recentOrders.innerHTML = orders.slice(-3).map(order => `
        <div class="order-item">
            <div class="order-id">${order.id}</div>
            <div class="order-status ${order.status}">${order.status}</div>
            <div class="order-partner">${order.partner}</div>
            <div class="order-date">${order.date}</div>
        </div>
    `).join('');
}

function trackMedicineOrder() {
    const orderId = document.getElementById('trackOrderId')?.value.trim();
    if (!orderId) {
        alert('Please enter Order ID');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('medicineOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    const panel = document.getElementById('medicinePanel');
    panel.innerHTML = `
        <div class="panel-header">
            <h3>📍 Order Tracking</h3>
            <button onclick="openMedicineDelivery()" class="close-btn">&times;</button>
        </div>
        <div class="panel-content">
            <div class="tracking-info">
                <div class="tracking-id">Order ID: ${order.id}</div>
                <div class="tracking-status">Status: <span class="status-${order.status}">${order.status}</span></div>
                <div class="tracking-partner">Partner: ${order.partner}</div>
                <div class="tracking-address">Address: ${order.address}</div>
                <div class="tracking-estimated">Estimated: ${order.estimated}</div>
                
                <div class="tracking-timeline">
                    <div class="timeline-step ${order.status === 'confirmed' ? 'active' : ''}">
                        <div class="step-dot"></div>
                        <div class="step-label">Order Confirmed</div>
                    </div>
                    <div class="timeline-step ${order.status === 'processing' ? 'active' : ''}">
                        <div class="step-dot"></div>
                        <div class="step-label">Processing</div>
                    </div>
                    <div class="timeline-step ${order.status === 'dispatched' ? 'active' : ''}">
                        <div class="step-dot"></div>
                        <div class="step-label">Dispatched</div>
                    </div>
                    <div class="timeline-step ${order.status === 'delivered' ? 'active' : ''}">
                        <div class="step-dot"></div>
                        <div class="step-label">Delivered</div>
                    </div>
                </div>
                
                <button class="update-status" onclick="updateOrderStatus('${order.id}')">
                    Update Status (Demo)
                </button>
            </div>
        </div>
    `;
}

function updateOrderStatus(orderId) {
    const orders = JSON.parse(localStorage.getItem('medicineOrders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return;
    
    const statuses = ['confirmed', 'processing', 'dispatched', 'delivered'];
    const currentStatus = orders[orderIndex].status;
    const currentIndex = statuses.indexOf(currentStatus);
    
    if (currentIndex < statuses.length - 1) {
        orders[orderIndex].status = statuses[currentIndex + 1];
        localStorage.setItem('medicineOrders', JSON.stringify(orders));
        trackMedicineOrder();
    }
}

function openEmergencySOS() {
    const modal = document.createElement('div');
    modal.className = 'emergency-modal';
    modal.innerHTML = `
        <div class="emergency-content">
            <div class="emergency-header">
                <h2>🚨 Emergency SOS</h2>
                <button onclick="closeEmergencyModal()" class="close-btn">&times;</button>
            </div>
            <div class="emergency-info">
                <p><strong>Instructions:</strong></p>
                <ol>
                    <li>Look for the red SOS button at bottom-left</li>
                    <li>Press and hold for 3 seconds</li>
                    <li>Emergency services will be notified</li>
                    <li>Your location will be shared automatically</li>
                </ol>
                
                <div class="emergency-numbers">
                    <p><strong>Emergency Numbers:</strong></p>
                    <div class="number-item">🚑 Ambulance: 102 / 108</div>
                    <div class="number-item">🚓 Police: 100</div>
                    <div class="number-item">🚒 Fire: 101</div>
                    <div class="number-item">🇮🇳 National: 112</div>
                </div>
                
                <div class="emergency-contacts">
                    <p><strong>Your Emergency Contacts:</strong></p>
                    <div id="emergencyContactsList">
                        <p class="no-contacts">No contacts saved. Add in Settings.</p>
                    </div>
                    <button class="add-contact" onclick="addEmergencyContact()">
                        ➕ Add Contact
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadEmergencyContacts();
}

function closeEmergencyModal() {
    const modal = document.querySelector('.emergency-modal');
    if (modal) modal.remove();
}

function loadEmergencyContacts() {
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
    const container = document.getElementById('emergencyContactsList');
    
    if (!container) return;
    
    if (contacts.length === 0) {
        container.innerHTML = '<p class="no-contacts">No contacts saved. Add in Settings.</p>';
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-item">
            <span class="contact-name">${contact.name}</span>
            <span class="contact-phone">${contact.phone}</span>
            <button class="remove-contact" onclick="removeEmergencyContact('${contact.id}')">×</button>
        </div>
    `).join('');
}

function addEmergencyContact() {
    const name = prompt('Enter contact name:');
    if (!name) return;
    
    const phone = prompt('Enter phone number:');
    if (!phone) return;
    
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
    contacts.push({
        id: Date.now().toString(),
        name: name,
        phone: phone
    });
    
    localStorage.setItem('emergencyContacts', JSON.stringify(contacts));
    loadEmergencyContacts();
}

function removeEmergencyContact(contactId) {
    let contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
    contacts = contacts.filter(c => c.id !== contactId);
    localStorage.setItem('emergencyContacts', JSON.stringify(contacts));
    loadEmergencyContacts();
}

function toggleMoreMenu() {
    const menu = document.getElementById('moreMenu');
    if (!menu) return;
    
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
        positionMoreMenu();
    }
}

function positionMoreMenu() {
    const menu = document.getElementById('moreMenu');
    const moreBtn = document.querySelector('.nav-btn:last-child');
    
    if (!menu || !moreBtn) return;
    
    const btnRect = moreBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.bottom = (window.innerHeight - btnRect.top + 10) + 'px';
    menu.style.left = btnRect.left + 'px';
}

function openHealthTips() {
    alert('Health Tips feature coming soon!');
}

function openFirstAid() {
    alert('First Aid Guide feature coming soon!');
}

function openVaccination() {
    alert('Vaccination Schedule feature coming soon!');
}

function openBloodBank() {
    alert('Blood Bank Locator feature coming soon!');
}

function openFeedback() {
    const feedback = prompt('Please enter your feedback:');
    if (feedback) {
        alert('Thank you for your feedback!');
    }
}

function openSettings() {
    alert('Settings feature coming soon!');
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS styles
    addNavigationStyles();
    
    // Set active nav based on current page
    setActiveNav();
    
    // Close panels when clicking outside
    document.addEventListener('click', function(e) {
        const medicinePanel = document.getElementById('medicinePanel');
        const moreMenu = document.getElementById('moreMenu');
        
        if (medicinePanel && !medicinePanel.contains(e.target) && 
            !e.target.closest('.nav-btn')) {
            medicinePanel.style.display = 'none';
        }
        
        if (moreMenu && !moreMenu.contains(e.target) && 
            !e.target.closest('.nav-btn:last-child')) {
            moreMenu.style.display = 'none';
        }
    });
    
    // Close emergency modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEmergencyModal();
        }
    });
});

function setActiveNav() {
    const currentPage = window.location.pathname;
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach((btn, index) => {
        btn.classList.remove('active');
        
        if (currentPage.includes('index.html') && index === 0) {
            btn.classList.add('active');
        } else if (currentPage.includes('appointments.html') && index === 4) {
            btn.classList.add('active');
        }
    });
}

function addNavigationStyles() {
    const styles = `
        /* ========== NAVIGATION BAR ========== */
        .main-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            padding: 8px 0;
            border-top: 1px solid #e0e0e0;
        }
        
        .nav-items {
            display: flex;
            justify-content: space-around;
            align-items: center;
        }
        
        .nav-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: none;
            border: none;
            color: #7f8c8d;
            padding: 6px 3px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            width: 16.66%;
            min-height: 55px;
        }
        
        .nav-btn:hover {
            background: #f8f9fa;
            color: #3498db;
        }
        
        .nav-btn.active {
            color: #3498db;
            background: #ebf5fb;
        }
        
        .nav-btn span {
            font-size: 18px;
            margin-bottom: 3px;
        }
        
        .nav-btn small {
            font-size: 10px;
            font-weight: 500;
        }
        
        /* Body padding for fixed nav */
        body {
            padding-bottom: 65px !important;
        }
        
        /* ========== MEDICINE PANEL ========== */
        .floating-panel {
            position: fixed;
            bottom: 65px;
            left: 10px;
            right: 10px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 999;
            max-height: 70vh;
            overflow-y: auto;
            display: none;
            animation: slideUp 0.3s ease;
        }
        
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #eee;
            position: sticky;
            top: 0;
            background: white;
            z-index: 1;
        }
        
        .panel-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 18px;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            color: #7f8c8d;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .panel-content {
            padding: 15px;
        }
        
        .delivery-options h4 {
            margin: 20px 0 10px 0;
            color: #2c3e50;
            font-size: 16px;
        }
        
        .upload-area {
            background: #f8f9fa;
            border: 2px dashed #3498db;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            margin-bottom: 20px;
        }
        
        .upload-icon {
            font-size: 40px;
            color: #3498db;
            margin-bottom: 10px;
        }
        
        .upload-area p {
            margin: 0 0 5px 0;
            color: #2c3e50;
        }
        
        .upload-area small {
            color: #7f8c8d;
            font-size: 12px;
        }
        
        .file-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .file-icon {
            font-size: 24px;
            margin-right: 10px;
        }
        
        .file-info {
            flex: 1;
        }
        
        .file-info strong {
            display: block;
            color: #2c3e50;
        }
        
        .file-info small {
            color: #7f8c8d;
        }
        
        .remove-file {
            background: none;
            border: none;
            font-size: 20px;
            color: #e74c3c;
            cursor: pointer;
            padding: 5px;
        }
        
        .partners-grid {
            display: grid;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .partner-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .partner-card:hover {
            border-color: #3498db;
        }
        
        .partner-card.selected {
            border-color: #27ae60;
            background: #e8f6f3;
        }
        
        .partner-name {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .partner-details {
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .order-btn {
            background: #27ae60;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
        }
        
        .track-section {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        #trackOrderId {
            flex: 1;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .track-btn {
            background: #9b59b6;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .order-history {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
        }
        
        .order-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .order-id {
            font-weight: bold;
            color: #2c3e50;
            flex: 1;
        }
        
        .order-status {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            margin: 0 5px;
        }
        
        .order-status.confirmed {
            background: #d4edda;
            color: #155724;
        }
        
        .order-status.processing {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .order-status.dispatched {
            background: #fff3cd;
            color: #856404;
        }
        
        .order-status.delivered {
            background: #d4edda;
            color: #155724;
        }
        
        .no-orders {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 20px;
        }
        
        /* ========== EMERGENCY MODAL ========== */
        .emergency-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        }
        
        .emergency-content {
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        }
        
        .emergency-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
            background: #e74c3c;
            color: white;
            border-radius: 15px 15px 0 0;
        }
        
        .emergency-header h2 {
            margin: 0;
        }
        
        .emergency-info {
            padding: 20px;
        }
        
        .emergency-info ol {
            padding-left: 20px;
            margin: 15px 0;
        }
        
        .emergency-info li {
            margin-bottom: 8px;
        }
        
        .emergency-numbers {
            background: #fff8e1;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .number-item {
            padding: 8px 0;
            border-bottom: 1px solid #ffeaa7;
        }
        
        .number-item:last-child {
            border-bottom: none;
        }
        
        .emergency-contacts {
            margin-top: 20px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .contact-name {
            flex: 1;
            font-weight: bold;
        }
        
        .contact-phone {
            margin: 0 10px;
            color: #3498db;
        }
        
        .remove-contact {
            background: #e74c3c;
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .add-contact {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        
        /* ========== MORE MENU ========== */
        .floating-menu {
            position: fixed;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            padding: 10px;
            animation: fadeIn 0.2s ease;
            display: none;
            min-width: 180px;
        }
        
        .menu-content {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .menu-content button {
            display: flex;
            align-items: center;
            gap: 10px;
            background: none;
            border: none;
            padding: 10px;
            text-align: left;
            cursor: pointer;
            border-radius: 6px;
            color: #2c3e50;
            font-size: 14px;
            transition: background 0.2s;
        }
        
        .menu-content button:hover {
            background: #f8f9fa;
        }
        
        /* ========== ANIMATIONS ========== */
        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* ========== RESPONSIVE ========== */
        @media (min-width: 768px) {
            .main-nav {
                position: sticky;
                top: 0;
                bottom: auto;
                padding: 12px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-top: none;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .nav-btn {
                min-height: 65px;
            }
            
            .nav-btn span {
                font-size: 20px;
            }
            
            .nav-btn small {
                font-size: 11px;
            }
            
            .floating-panel {
                bottom: auto;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
            }
            
            .floating-menu {
                bottom: auto;
                top: 80px;
                right: 20px;
            }
            
            body {
                padding-bottom: 20px !important;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
