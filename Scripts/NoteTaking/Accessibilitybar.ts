import { v4 as uuidv4 } from "uuid";

// ===== OPEN/CLOSE ACCESSIBILITY TOOLBAR =====
function openAccessNav() {
    const sidebar = document.getElementById("accessSidebar");
    if (sidebar) sidebar.style.width = "220px";
}

function closeAccessNav() {
    const sidebar = document.getElementById("accessSidebar");
    if (sidebar) sidebar.style.width = "0";
}

// ===== ACCESSIBILITY FEATURES =====
function removeFontSizeClasses() {
    const fontSizes = ['font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge'];
    fontSizes.forEach(size => document.body?.classList.remove(size));
}

// Load saved preferences
const savedDyslexia = localStorage.getItem('dyslexiaMode');
const savedFontSize = localStorage.getItem('fontSize');
const savedHighContrast = localStorage.getItem('highContrast');

if (savedDyslexia === 'true') {
    document.body?.classList.add('dyslexia-mode');
}
if (savedHighContrast === 'true') {
    document.body?.classList.add('high-contrast');
}
if (savedFontSize) {
    document.body?.classList.add(savedFontSize);
}

// Dyslexia Toggle
const dyslexiaBtn = document.getElementById('dyslexia-toggle');
if (dyslexiaBtn) {
    dyslexiaBtn.addEventListener('click', function() {
        document.body?.classList.toggle('dyslexia-mode');
        const isActive = document.body?.classList.contains('dyslexia-mode') || false;
        dyslexiaBtn.classList.toggle('active', isActive);
        // Ensure we save a string, not a boolean
        localStorage.setItem('dyslexiaMode', String(isActive));
    });
}

// Font Decrease
const decreaseBtn = document.getElementById('font-decrease');
if (decreaseBtn) {
    decreaseBtn.addEventListener('click', function() {
        removeFontSizeClasses();
        document.body?.classList.add('font-size-small');
        localStorage.setItem('fontSize', 'font-size-small');
    });
}

// Font Reset
const resetBtn = document.getElementById('font-reset');
if (resetBtn) {
    resetBtn.addEventListener('click', function() {
        removeFontSizeClasses();
        document.body?.classList.add('font-size-medium');
        localStorage.setItem('fontSize', 'font-size-medium');
    });
}

// Font Increase
const increaseBtn = document.getElementById('font-increase');
if (increaseBtn) {
    increaseBtn.addEventListener('click', function() {
        removeFontSizeClasses();
        document.body?.classList.add('font-size-large');
        localStorage.setItem('fontSize', 'font-size-large');
    });
}

// Reset All (Zoom Reset)
const zoomResetBtn = document.getElementById('zoom-reset');
if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', function() {
        removeFontSizeClasses();
        document.body?.classList.add('font-size-medium');
        localStorage.setItem('fontSize', 'font-size-medium');

        if (document.body?.classList.contains('high-contrast')) {
            document.body.classList.remove('high-contrast');
            const highBtn = document.getElementById('high-contrast-toggle');
            if (highBtn) highBtn.classList.remove('active');
            localStorage.setItem('highContrast', 'false');
        }

        if (document.body?.classList.contains('dyslexia-mode')) {
            document.body.classList.remove('dyslexia-mode');
            const dysBtn = document.getElementById('dyslexia-toggle');
            if (dysBtn) dysBtn.classList.remove('active');
            localStorage.setItem('dyslexiaMode', 'false');
        }
    });
}

// High Contrast Toggle
const highContrastBtn = document.getElementById('high-contrast-toggle');
if (highContrastBtn) {
    highContrastBtn.addEventListener('click', function() {
        document.body?.classList.toggle('high-contrast');
        const isActive = document.body?.classList.contains('high-contrast') || false;
        highContrastBtn.classList.toggle('active', isActive);
        localStorage.setItem('highContrast', String(isActive));
    });
}

// Keyboard shortcuts (Ctrl +, Ctrl -, Ctrl 0)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === '+') {
        e.preventDefault();
        const currentSize = document.body?.classList.contains('font-size-small') ? 'small' :
            document.body?.classList.contains('font-size-large') ? 'large' :
                document.body?.classList.contains('font-size-xlarge') ? 'xlarge' : 'medium';

        if (currentSize === 'small') {
            removeFontSizeClasses();
            document.body?.classList.add('font-size-medium');
            localStorage.setItem('fontSize', 'font-size-medium');
        } else if (currentSize === 'medium') {
            removeFontSizeClasses();
            document.body?.classList.add('font-size-large');
            localStorage.setItem('fontSize', 'font-size-large');
        } else if (currentSize === 'large') {
            removeFontSizeClasses();
            document.body?.classList.add('font-size-xlarge');
            localStorage.setItem('fontSize', 'font-size-xlarge');
        }
    }

    if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        const currentSize = document.body?.classList.contains('font-size-small') ? 'small' :
            document.body?.classList.contains('font-size-large') ? 'large' :
                document.body?.classList.contains('font-size-xlarge') ? 'xlarge' : 'medium';

        if (currentSize === 'xlarge') {
            removeFontSizeClasses();
            document.body?.classList.add('font-size-large');
            localStorage.setItem('fontSize', 'font-size-large');
        } else if (currentSize === 'large') {
            removeFontSizeClasses();
            document.body?.classList.add('font-size-medium');
            localStorage.setItem('fontSize', 'font-size-medium');
        } else if (currentSize === 'medium') {
            removeFontSizeClasses();
            document.body?.classList.add('font-size-small');
            localStorage.setItem('fontSize', 'font-size-small');
        }
    }

    if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        removeFontSizeClasses();
        document.body?.classList.add('font-size-medium');
        localStorage.setItem('fontSize', 'font-size-medium');

        if (document.body?.classList.contains('high-contrast')) {
            document.body.classList.remove('high-contrast');
            const highBtn = document.getElementById('high-contrast-toggle');
            if (highBtn) highBtn.classList.remove('active');
            localStorage.setItem('highContrast', 'false');
        }
    }
});

const openBtn = document.getElementById('open-access-btn');
if (openBtn) {
    openBtn.addEventListener('click', openAccessNav);
}

const closeBtn = document.getElementById('close-access-btn');
if (closeBtn) {
    closeBtn.addEventListener('click', closeAccessNav);
}