import { db } from "./firebase.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentDoctor = null;

// Initialize doctor details page
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Doctor page initialized");
    
    await loadDoctorDetails();
    initMap();
    initBookingForm();
    initReviews();
    
    // Track doctor view
    if (currentDoctor) {
        trackDoctorView(currentDoctor.id);
    }
});

// Load doctor details
async function loadDoctorDetails() {
    const doctorId = localStorage.getItem('selectedDoctorId');
    if (!doctorId) {
        showNotification("No doctor selected", 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    try {
        // Try Firebase first
        const doctorRef = doc(db, "doctors", doctorId);
        const doctorSnap = await getDoc(doctorRef);
        
        if (doctorSnap.exists()) {
            currentDoctor = {
                id: doctorSnap.id,
                ...doctorSnap.data()
            };
            
            // Increment view count
            await updateDoc(doctorRef, {
                views: increment(1)
            });
        } else {
            // Fallback to local data
            currentDoctor = getDoctorById(doctorId);
        }
        
        if (!currentDoctor) {
            throw new Error("Doctor not found");
        }
        
        displayDoctorDetails();
        displayAvailability();
        
    } catch (error) {
        console.error("Error loading doctor:", error);
        showNotification("Error loading doctor details", 'error');
        window.location.href = 'index.html';
    }
}

// Display doctor details
function displayDoctorDetails() {
    const detailContainer = document.getElementById('doctorDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = `
        <div class="doctor-header">
            <div class="doctor-avatar">
                ${currentDoctor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div class="doctor-info">
                <h1>${currentDoctor.name}</h1>
                <p class="specialization">${currentDoctor.specialization}</p>
                <p class="qualification">${currentDoctor.qualification || 'MBBS'}</p>
                
                <div class="doctor-stats">
                    <span class="stat">
                        <strong>${currentDoctor.experience || 5}</strong> years
                    </span>
                    <span class="stat">
                        <strong>₹${currentDoctor.fees || 300}</strong> fee
                    </span>
                    <span class="stat">
                        <strong>${currentDoctor.rating || 4.5}</strong> ⭐ rating
                    </span>
                    <span class="stat">
                        <strong>${currentDoctor.totalAppointments || 0}</strong> appointments
                    </span>
                </div>
            </div>
        </div>
        
        <div class="doctor-details">
            <div class="detail-section">
                <h3>📋 About</h3>
                <p>${currentDoctor.bio || 'Experienced doctor serving rural community.'}</p>
            </div>
            
            <div class="detail-section">
                <h3>📍 Location</h3>
                <p>${currentDoctor.location || 'Rural Health Center'}</p>
                <div id="mapContainer" class="map-container"></div>
            </div>
            
            <div class="detail-section">
                <h3>🗣️ Languages</h3>
                <div class="languages">
                    ${(currentDoctor.languages || ['Hindi', 'English']).map(lang => 
                        `<span class="language-tag">${lang}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h3>📞 Contact</h3>
                <p>${currentDoctor.contact || 'Not provided'}</p>
            </div>
        </div>
    `;
}

// Display availability
function displayAvailability() {
    const availabilityContainer = document.getElementById('availability');
    if (!availabilityContainer) return;
    
    const availability = currentDoctor.availability || 'Mon-Fri, 9AM-5PM';
    
    availabilityContainer.innerHTML = `
        <h3>🕒 Availability</h3>
        <p>${availability}</p>
        
        <div class="time-slots">
            ${generateTimeSlots().map(slot => `
                <button class="time-slot" onclick="selectTimeSlot('${slot}')">
                    ${slot}
                </button>
            `).join('')}
        </div>
    `;
}

// Generate time slots
function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 17; hour += 2) {
        const time = `${hour}:00 - ${hour + 2}:00`;
        slots.push(time);
    }
    return slots;
}

// Select time slot
window.selectTimeSlot = (slot) => {
    const slots = document.querySelectorAll('.time-slot');
    slots.forEach(s => s.classList.remove('selected'));
    
    event.target.classList.add('selected');
    localStorage.setItem('selectedTimeSlot', slot);
    
    showNotification(`Selected time: ${slot}`, 'info');
};

// Initialize map
function initMap() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    // For demo, show static map
    // In production, integrate Google Maps API
    
    mapContainer.innerHTML = `
        <div class="static-map">
            <p>📍 ${currentDoctor?.location || 'Rural Health Center'}</p>
            <div class="map-placeholder">
                <p>Map would show here with directions</p>
                <small>(Google Maps integration required)</small>
            </div>
            <button onclick="getDirections()" class="directions-btn">
                🗺️ Get Directions
            </button>
        </div>
    `;
}

// Get directions
window.getDirections = () => {
    const address = encodeURIComponent(currentDoctor?.location || 'Rural Health Center');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    
    trackEvent('get_directions', { doctorId: currentDoctor?.id });
};

// Initialize booking form
function initBookingForm() {
    const form = document.getElementById('quickBooking');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const dateInput = document.getElementById('bookingDate');
        const timeSlot = localStorage.getItem('selectedTimeSlot');
        
        if (!dateInput.value || !timeSlot) {
            showNotification("Please select both date and time", 'error');
            return;
        }
        
        // Save selection and redirect to booking page
        localStorage.setItem('prefilledDate', dateInput.value);
        localStorage.setItem('prefilledTime', timeSlot);
        
        trackEvent('quick_booking_started', { 
            doctorId: currentDoctor?.id,
            date: dateInput.value,
            time: timeSlot
        });
        
        window.location.href = 'booking.html';
    });
}

// Initialize reviews
function initReviews() {
    const reviewsContainer = document.getElementById('reviews');
    if (!reviewsContainer) return;
    
    // Load reviews from localStorage or Firebase
    const reviews = JSON.parse(localStorage.getItem(`reviews_${currentDoctor?.id}`) || '[]');
    
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="no-reviews">
                <p>No reviews yet. Be the first to review!</p>
            </div>
        `;
    } else {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        reviewsContainer.innerHTML = `
            <div class="reviews-summary">
                <h3>⭐ ${averageRating.toFixed(1)} (${reviews.length} reviews)</h3>
                <button onclick="showReviewForm()" class="add-review-btn">
                    ✍️ Add Review
                </button>
            </div>
            
            <div class="reviews-list">
                ${reviews.slice(0, 5).map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="reviewer">${review.name}</span>
                            <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                            <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                        </div>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Show review form
window.showReviewForm = () => {
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Leave a Review</h3>
            <form onsubmit="submitReview(event)">
                <div class="rating-input">
                    <label>Rating:</label>
                    <div class="stars">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <span class="star" data-rating="${star}" onclick="setRating(${star})">☆</span>
                        `).join('')}
                    </div>
                </div>
                <input type="text" id="reviewerName" placeholder="Your Name" required>
                <textarea id="reviewComment" placeholder="Your review..." rows="4" required></textarea>
                <div class="modal-buttons">
                    <button type="button" onclick="closeReviewModal()">Cancel</button>
                    <button type="submit">Submit Review</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('reviewerName').focus();
};

// Set rating
window.setRating = (rating) => {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.style.color = '#f39c12';
        } else {
            star.textContent = '☆';
            star.style.color = '#ccc';
        }
    });
    
    window.currentRating = rating;
};

// Submit review
window.submitReview = (e) => {
    e.preventDefault();
    
    if (!window.currentRating) {
        showNotification("Please select a rating", 'error');
        return;
    }
    
    const name = document.getElementById('reviewerName').value.trim();
    const comment = document.getElementById('reviewComment').value.trim();
    
    if (!name || !comment) {
        showNotification("Please fill all fields", 'error');
        return;
    }
    
    const review = {
        id: Date.now().toString(),
        name: name,
        rating: window.currentRating,
        comment: comment,
        date: new Date().toISOString(),
        doctorId: currentDoctor.id
    };
    
    // Save review
    const reviews = JSON.parse(localStorage.getItem(`reviews_${currentDoctor.id}`) || '[]');
    reviews.unshift(review);
    localStorage.setItem(`reviews_${currentDoctor.id}`, JSON.stringify(reviews));
    
    // Update doctor rating (average)
    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings / reviews.length;
    
    // Update in Firebase if possible
    updateDoctorRating(currentDoctor.id, averageRating, reviews.length);
    
    // Close modal
    closeReviewModal();
    
    // Refresh reviews
    initReviews();
    
    showNotification("Thank you for your review!", 'success');
    
    trackEvent('review_submitted', { 
        doctorId: currentDoctor.id,
        rating: window.currentRating 
    });
};

// Update doctor rating
async function updateDoctorRating(doctorId, rating, reviewCount) {
    try {
        const doctorRef = doc(db, "doctors", doctorId);
        await updateDoc(doctorRef, {
            rating: parseFloat(rating.toFixed(1)),
            reviewCount: reviewCount,
            lastReview: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating rating:", error);
        // Continue without Firebase update
    }
}

// Close review modal
window.closeReviewModal = () => {
    const modal = document.querySelector('.review-modal');
    if (modal) {
        modal.remove();
    }
    window.currentRating = null;
};

// Book appointment from doctor page
window.bookNow = () => {
    if (!currentDoctor) return;
    
    trackEvent('doctor_page_book_now', { doctorId: currentDoctor.id });
    window.location.href = 'booking.html';
};