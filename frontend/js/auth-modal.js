/**
 * Auth Modal Module
 * Handles login and sign-up modal
 */

let currentView = 'login'; // 'login' or 'signup'

/**
 * Initialize auth modal
 */
export function initAuthModal() {
    const userIcon = document.getElementById('user-icon');
    const overlay = document.getElementById('auth-overlay');
    const closeBtn = document.getElementById('auth-close');
    const toggleLinks = document.querySelectorAll('.auth-toggle-link');
    
    // Open modal or logout on user icon click
    if (userIcon) {
        userIcon.addEventListener('click', () => {
            // Check if user is logged in
            const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
            
            if (isLoggedIn) {
                // Show logout confirmation
                showLogoutConfirmation();
            } else {
                // Open login modal
                openAuthModal('login');
            }
        });
    }
    
    // Close modal on overlay click
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAuthModal();
            }
        });
    }
    
    // Close modal on close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAuthModal);
    }
    
    // Toggle between login and signup
    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.view;
            switchView(targetView);
        });
    });
    
    // Handle form submissions
    initForms();
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeAuthModal();
        }
    });
}

/**
 * Open auth modal
 */
export function openAuthModal(view = 'login') {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    
    // Set initial view
    switchView(view);
    
    // Show modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close auth modal
 */
export function closeAuthModal() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear forms and messages after animation
    setTimeout(() => {
        clearForms();
        hideAllMessages();
    }, 300);
}

/**
 * Switch between login and signup views
 */
function switchView(view) {
    currentView = view;
    
    const loginView = document.getElementById('auth-login-view');
    const signupView = document.getElementById('auth-signup-view');
    
    if (view === 'login') {
        loginView.classList.remove('hidden');
        signupView.classList.add('hidden');
    } else {
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
    }
    
    // Clear messages when switching
    hideAllMessages();
}

/**
 * Initialize form handlers
 */
function initForms() {
    const loginForm = document.getElementById('auth-login-form');
    const signupForm = document.getElementById('auth-signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

/**
 * Handle login submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('.auth-submit');
    
    // Clear previous messages
    hideMessage('login-message');
    
    // Validation
    if (!email || !password) {
        showMessage('login-message', 'Bitte fülle alle Felder aus', 'error');
        return;
    }
    
    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // TODO: Replace with actual API call
        await simulateAPICall();
        
        // Simulate success/error for demo
        const success = Math.random() > 0.5; // Random for demo
        
        if (success) {
            showMessage('login-message', 'Login erfolgreich!', 'info');
            
            // Update user icon state
            updateUserIconState(true, email);
            
            // Refresh favorites view to show user's saved items
            import('./fav-engine.js').then(module => {
                module.refreshFavoritesView();
            });
            
            // Close modal after delay
            setTimeout(() => {
                closeAuthModal();
            }, 1500);
        } else {
            showMessage('login-message', 'Falsches Passwort oder Email', 'error');
        }
    } catch (error) {
        showMessage('login-message', 'Ein Fehler ist aufgetreten', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Handle signup submission
 */
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const submitBtn = e.target.querySelector('.auth-submit');
    
    // Clear previous messages
    hideMessage('signup-message');
    
    // Validation
    if (!name || !email || !password) {
        showMessage('signup-message', 'Bitte fülle alle Felder aus', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('signup-message', 'Passwort muss mindestens 6 Zeichen lang sein', 'error');
        return;
    }
    
    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // TODO: Replace with actual API call
        await simulateAPICall();
        
        showMessage('signup-message', 'Account erfolgreich erstellt! Du kannst dich jetzt einloggen.', 'info');
        
        // Switch to login after delay
        setTimeout(() => {
            switchView('login');
            // Pre-fill email
            document.getElementById('login-email').value = email;
        }, 2000);
    } catch (error) {
        showMessage('signup-message', 'Ein Fehler ist aufgetreten', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Show message
 */
function showMessage(messageId, text, type = 'info') {
    const messageEl = document.getElementById(messageId);
    if (!messageEl) return;
    
    const textEl = messageEl.querySelector('.auth-message-text');
    if (textEl) {
        textEl.textContent = text;
    }
    
    // Remove all type classes
    messageEl.classList.remove('error', 'info', 'warning');
    // Add current type
    messageEl.classList.add(type);
    // Show message
    messageEl.classList.add('visible');
}

/**
 * Hide specific message
 */
function hideMessage(messageId) {
    const messageEl = document.getElementById(messageId);
    if (!messageEl) return;
    
    messageEl.classList.remove('visible');
}

/**
 * Hide all messages
 */
function hideAllMessages() {
    const messages = document.querySelectorAll('.auth-message');
    messages.forEach(msg => msg.classList.remove('visible'));
}

/**
 * Clear all forms
 */
function clearForms() {
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.reset());
}

/**
 * Update user icon state
 */
function updateUserIconState(loggedIn, email = '') {
    const userIcon = document.getElementById('user-icon');
    if (!userIcon) return;
    
    if (loggedIn) {
        userIcon.classList.remove('guest');
        userIcon.classList.add('logged-in');
        
        // Store login state (for demo - in production use proper auth)
        localStorage.setItem('user_logged_in', 'true');
        localStorage.setItem('user_email', email);
        
        console.log('✅ User logged in:', email);
    } else {
        userIcon.classList.add('guest');
        userIcon.classList.remove('logged-in');
        
        localStorage.removeItem('user_logged_in');
        localStorage.removeItem('user_email');
        
        console.log('👋 User logged out');
    }
}

/**
 * Check if user is logged in (on page load)
 */
export function checkAuthState() {
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    const email = localStorage.getItem('user_email') || '';
    
    if (isLoggedIn) {
        updateUserIconState(true, email);
    }
}

/**
 * Logout function
 */
export function logout() {
    updateUserIconState(false);
    console.log('User logged out');
}

/**
 * Show logout confirmation dialog
 */
function showLogoutConfirmation() {
    const email = localStorage.getItem('user_email') || '';
    
    const confirmed = confirm(`Möchtest du dich wirklich ausloggen?\n\nEingeloggt als: ${email}`);
    
    if (confirmed) {
        logout();
        // Show success message briefly
        showTemporaryMessage('Erfolgreich ausgeloggt');
    }
}

/**
 * Show temporary message (toast-style)
 */
function showTemporaryMessage(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'auth-toast';
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('visible'), 10);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Simulate API call (replace with real API)
 */
function simulateAPICall() {
    return new Promise(resolve => {
        setTimeout(resolve, 1500);
    });
}