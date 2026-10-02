// Accessibility Service
class AccessibilityService {
    constructor() {
        this.settings = {
            highContrast: false,
            textSize: 'medium',
            colorBlindMode: 'none',
            reducedMotion: false,
            voiceNavigation: false,
            screenReader: false
        };
        this.speechSynthesis = window.speechSynthesis;
        this.voiceRecognition = null;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupScreenReader();
        console.log("Accessibility service initialized");
    }

    // Load settings from localStorage
    async loadSettings() {
        try {
            const saved = localStorage.getItem('accessibility_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error("Error loading accessibility settings:", error);
        }
    }

    // Save settings to localStorage
    async saveSettings() {
        try {
            localStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error("Error saving accessibility settings:", error);
        }
    }

    // Apply all accessibility settings
    applySettings() {
        this.applyHighContrast();
        this.applyTextSize();
        this.applyColorBlindMode();
        this.applyReducedMotion();
        
        // Track accessibility settings usage
        trackEvent('accessibility_settings_applied', this.settings);
    }

    // High contrast mode
    applyHighContrast() {
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
            
            // Add high contrast styles
            const styles = `
                .high-contrast {
                    background: #000 !important;
                    color: #fff !important;
                }
                
                .high-contrast .card,
                .high-contrast header,
                .high-contrast .stats-bar {
                    background: #111 !important;
                    color: #fff !important;
                    border: 2px solid #fff;
                }
                
                .high-contrast button {
                    background: #fff !important;
                    color: #000 !important;
                    border: 2px solid #fff;
                }
                
                .high-contrast input,
                .high-contrast select,
                .high-contrast textarea {
                    background: #000 !important;
                    color: #fff !important;
                    border: 2px solid #fff;
                }
                
                .high-contrast a {
                    color: #ffff00 !important;
                    text-decoration: underline;
                }
                
                .high-contrast a:visited {
                    color: #ff00ff !important;
                }
                
                .high-contrast a:hover,
                .high-contrast a:focus {
                    color: #00ffff !important;
                    outline: 3px solid #00ffff;
                }
            `;
            
            this.addStyles('high-contrast-styles', styles);
        } else {
            document.body.classList.remove('high-contrast');
            this.removeStyles('high-contrast-styles');
        }
    }

    // Text size adjustment
    applyTextSize() {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px',
            xlarge: '20px'
        };
        
        document.documentElement.style.fontSize = sizes[this.settings.textSize] || sizes.medium;
    }

    // Color blind mode
    applyColorBlindMode() {
        const filters = {
            none: '',
            protanopia: 'url(#protanopia)',
            deuteranopia: 'url(#deuteranopia)',
            tritanopia: 'url(#tritanopia)'
        };
        
        document.documentElement.style.filter = filters[this.settings.colorBlindMode] || '';
        
        // Create SVG filters if needed
        if (this.settings.colorBlindMode !== 'none' && !document.getElementById('color-blind-filters')) {
            this.createColorBlindFilters();
        }
    }

    // Create SVG filters for color blindness
    createColorBlindFilters() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.id = 'color-blind-filters';
        
        const filters = [
            {
                id: 'protanopia',
                matrix: '0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0'
            },
            {
                id: 'deuteranopia',
                matrix: '0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0'
            },
            {
                id: 'tritanopia',
                matrix: '0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0'
            }
        ];
        
        filters.forEach(filter => {
            const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
            feColorMatrix.setAttribute('type', 'matrix');
            feColorMatrix.setAttribute('values', filter.matrix);
            
            const filterElement = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filterElement.id = filter.id;
            filterElement.appendChild(feColorMatrix);
            
            svg.appendChild(filterElement);
        });
        
        document.body.appendChild(svg);
    }

    // Reduced motion
    applyReducedMotion() {
        if (this.settings.reducedMotion) {
            const styles = `
                * {
                    animation-duration: 0.001s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0.001s !important;
                    transition-delay: 0s !important;
                }
            `;
            this.addStyles('reduced-motion-styles', styles);
        } else {
            this.removeStyles('reduced-motion-styles');
        }
    }

    // Add CSS styles
    addStyles(id, css) {
        this.removeStyles(id);
        
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Remove CSS styles
    removeStyles(id) {
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // High contrast toggle
        document.addEventListener('keydown', (e) => {
            // Alt + H for high contrast
            if (e.altKey && e.key === 'h') {
                this.toggleHighContrast();
            }
            // Alt + T for text size
            else if (e.altKey && e.key === 't') {
                this.cycleTextSize();
            }
            // Alt + V for voice navigation
            else if (e.altKey && e.key === 'v') {
                this.toggleVoiceNavigation();
            }
        });
    }

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        // Add tabindex to all interactive elements
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex], [role="button"]'
        );
        
        interactiveElements.forEach((element, index) => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            // Add focus styles
            element.addEventListener('focus', () => {
                element.classList.add('keyboard-focus');
                this.announceToScreenReader(`Focused on ${this.getElementDescription(element)}`);
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('keyboard-focus');
            });
            
            // Enter key support for divs with role="button"
            if (element.getAttribute('role') === 'button') {
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        element.click();
                    }
                });
            }
        });
        
        // Skip to main content link
        this.addSkipToContentLink();
    }

    // Add skip to content link
    addSkipToContentLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: #3498db;
            color: white;
            padding: 10px;
            z-index: 10000;
            text-decoration: none;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '0';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Ensure main content has id
        const mainContent = document.querySelector('main') || 
                           document.querySelector('.grid') || 
                           document.querySelector('.container') ||
                           document.body;
        
        if (!mainContent.id) {
            mainContent.id = 'main-content';
            mainContent.setAttribute('tabindex', '-1');
        }
    }

    // Setup screen reader
    setupScreenReader() {
        // Create screen reader announcement area
        const announcementArea = document.createElement('div');
        announcementArea.id = 'screen-reader-announcement';
        announcementArea.className = 'sr-only';
        announcementArea.setAttribute('aria-live', 'polite');
        announcementArea.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcementArea);
        
        // Add screen reader only styles
        const srStyles = `
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            .visually-hidden {
                position: absolute !important;
                height: 1px;
                width: 1px;
                overflow: hidden;
                clip: rect(1px, 1px, 1px, 1px);
            }
        `;
        
        this.addStyles('screen-reader-styles', srStyles);
    }

    // Announce to screen reader
    announceToScreenReader(message, priority = 'polite') {
        const announcementArea = document.getElementById('screen-reader-announcement');
        if (!announcementArea) return;
        
        announcementArea.setAttribute('aria-live', priority);
        announcementArea.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            announcementArea.textContent = '';
        }, 1000);
    }

    // Speak text
    speakText(text, rate = 1, pitch = 1) {
        if (!this.speechSynthesis || !this.settings.voiceNavigation) {
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1;
        
        // Select a voice
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prefer English voices
            const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            utterance.voice = englishVoice;
        }
        
        this.speechSynthesis.speak(utterance);
    }

    // Start voice recognition
    startVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.announceToScreenReader('Speech recognition not supported in your browser');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();
        
        this.voiceRecognition.continuous = true;
        this.voiceRecognition.interimResults = true;
        this.voiceRecognition.lang = 'en-US';
        
        this.voiceRecognition.onstart = () => {
            this.announceToScreenReader('Voice recognition started. Speak commands.');
            this.speakText('Voice recognition started. You can now speak commands.');
        };
        
        this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            this.processVoiceCommand(transcript);
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.announceToScreenReader(`Speech recognition error: ${event.error}`);
        };
        
        this.voiceRecognition.onend = () => {
            this.announceToScreenReader('Voice recognition ended');
        };
        
        this.voiceRecognition.start();
    }

    // Stop voice recognition
    stopVoiceRecognition() {
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
            this.voiceRecognition = null;
            this.announceToScreenReader('Voice recognition stopped');
        }
    }

    // Process voice commands
    processVoiceCommand(command) {
        console.log('Voice command:', command);
        
        if (command.includes('go to home') || command.includes('home page')) {
            window.location.href = 'index.html';
        }
        else if (command.includes('book appointment') || command.includes('book doctor')) {
            window.location.href = 'booking.html';
        }
        else if (command.includes('search doctor') || command.includes('find doctor')) {
            const searchTerm = command.replace('search doctor', '').replace('find doctor', '').trim();
            const searchInput = document.getElementById('search');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.focus();
                this.announceToScreenReader(`Searching for ${searchTerm}`);
            }
        }
        else if (command.includes('high contrast') || command.includes('contrast mode')) {
            this.toggleHighContrast();
        }
        else if (command.includes('larger text') || command.includes('increase text size')) {
            this.increaseTextSize();
        }
        else if (command.includes('smaller text') || command.includes('decrease text size')) {
            this.decreaseTextSize();
        }
        else if (command.includes('stop voice') || command.includes('stop listening')) {
            this.stopVoiceRecognition();
        }
        else if (command.includes('help') || command.includes('what can i say')) {
            this.speakText('You can say: Go to home, Book appointment, Search doctor, High contrast, Larger text, or Stop voice.');
        }
        
        // Track voice command usage
        trackEvent('voice_command_used', { command: command.substring(0, 100) });
    }

    // Toggle high contrast
    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        this.applyHighContrast();
        this.saveSettings();
        
        const message = this.settings.highContrast ? 
            'High contrast mode enabled' : 'High contrast mode disabled';
        
        this.announceToScreenReader(message);
        this.speakText(message);
    }

    // Cycle text size
    cycleTextSize() {
        const sizes = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.settings.textSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        
        this.settings.textSize = sizes[nextIndex];
        this.applyTextSize();
        this.saveSettings();
        
        this.announceToScreenReader(`Text size set to ${this.settings.textSize}`);
    }

    // Increase text size
    increaseTextSize() {
        const sizes = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.settings.textSize);
        if (currentIndex < sizes.length - 1) {
            this.settings.textSize = sizes[currentIndex + 1];
            this.applyTextSize();
            this.saveSettings();
            this.announceToScreenReader(`Text size increased to ${this.settings.textSize}`);
        }
    }

    // Decrease text size
    decreaseTextSize() {
        const sizes = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.settings.textSize);
        if (currentIndex > 0) {
            this.settings.textSize = sizes[currentIndex - 1];
            this.applyTextSize();
            this.saveSettings();
            this.announceToScreenReader(`Text size decreased to ${this.settings.textSize}`);
        }
    }

    // Toggle voice navigation
    toggleVoiceNavigation() {
        this.settings.voiceNavigation = !this.settings.voiceNavigation;
        this.saveSettings();
        
        if (this.settings.voiceNavigation) {
            this.startVoiceRecognition();
        } else {
            this.stopVoiceRecognition();
        }
    }

    // Set color blind mode
    setColorBlindMode(mode) {
        const validModes = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
        if (validModes.includes(mode)) {
            this.settings.colorBlindMode = mode;
            this.applyColorBlindMode();
            this.saveSettings();
            
            const modeNames = {
                none: 'Normal color mode',
                protanopia: 'Protanopia color blindness mode',
                deuteranopia: 'Deuteranopia color blindness mode',
                tritanopia: 'Tritanopia color blindness mode'
            };
            
            this.announceToScreenReader(modeNames[mode]);
        }
    }

    // Toggle reduced motion
    toggleReducedMotion() {
        this.settings.reducedMotion = !this.settings.reducedMotion;
        this.applyReducedMotion();
        this.saveSettings();
        
        const message = this.settings.reducedMotion ?
            'Reduced motion enabled' : 'Reduced motion disabled';
        
        this.announceToScreenReader(message);
    }

    // Get element description for screen readers
    getElementDescription(element) {
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }
        
        if (element.textContent.trim()) {
            return element.textContent.trim();
        }
        
        if (element.placeholder) {
            return `Input field: ${element.placeholder}`;
        }
        
        if (element.type === 'submit' || element.type === 'button') {
            return 'Button';
        }
        
        if (element.tagName === 'A') {
            return `Link: ${element.href}`;
        }
        
        return 'Interactive element';
    }

    // Add accessible labels to images
    addImageDescriptions() {
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            if (!img.alt) {
                // Try to get description from data attributes or filename
                const filename = img.src.split('/').pop().split('.')[0];
                img.alt = `Image: ${filename.replace(/[-_]/g, ' ')}`;
                img.setAttribute('role', 'presentation');
            }
        });
    }

    // Make tables accessible
    makeTablesAccessible() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (!table.getAttribute('role')) {
                table.setAttribute('role', 'table');
            }
            
            const headers = table.querySelectorAll('th');
            headers.forEach(header => {
                if (!header.getAttribute('scope')) {
                    header.setAttribute('scope', 'col');
                }
            });
            
            // Add caption if missing
            if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
                const caption = document.createElement('caption');
                caption.textContent = 'Data table';
                caption.className = 'sr-only';
                table.insertBefore(caption, table.firstChild);
            }
        });
    }
}

// Create global instance
window.accessibility = new AccessibilityService();

// Global functions
window.toggleHighContrast = () => {
    window.accessibility?.toggleHighContrast();
};

window.adjustTextSize = (size) => {
    if (window.accessibility) {
        window.accessibility.settings.textSize = size;
        window.accessibility.applyTextSize();
        window.accessibility.saveSettings();
    }
};

window.startVoiceCommands = () => {
    window.accessibility?.startVoiceRecognition();
};

window.stopVoiceCommands = () => {
    window.accessibility?.stopVoiceRecognition();
};

window.announceToScreenReader = (message, priority) => {
    window.accessibility?.announceToScreenReader(message, priority);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add image descriptions
    window.accessibility?.addImageDescriptions();
    
    // Make tables accessible
    window.accessibility?.makeTablesAccessible();
    
    // Announce page load to screen readers
    setTimeout(() => {
        announceToScreenReader(`Page loaded: ${document.title}`);
    }, 1000);
});

// Add keyboard shortcut help
const helpDialog = document.createElement('div');
helpDialog.id = 'accessibility-help';
helpDialog.className = 'sr-only';
helpDialog.innerHTML = `
    <h2>Accessibility Shortcuts</h2>
    <ul>
        <li>Alt + H: Toggle high contrast mode</li>
        <li>Alt + T: Cycle text size</li>
        <li>Alt + V: Toggle voice navigation</li>
        <li>Tab: Navigate through interactive elements</li>
        <li>Enter/Space: Activate buttons and links</li>
    </ul>
`;

document.body.appendChild(helpDialog);