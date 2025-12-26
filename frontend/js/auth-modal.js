/**
 * Auth Modal Module - FIXED VERSION
 * Handles login and sign-up with REAL Backend
 */

import { showSuccess, showError, showWarning, showInfo } from './toast.js';
import { API_BASE_URL } from './config.js';

let currentView = 'login';

/**
 * Initialize auth modal
 */
export function initAuthModal() {
    const userIcon = document.getElementById('user-icon');
    const overlay = document.getElementById('auth-overlay');
    const closeBtn = document.getElementById('auth-close');
    const toggleLinks = document.querySelectorAll('.auth-toggle-link');
    
    if (userIcon) {
        userIcon.addEventListener('click', () => {
            const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
            
            if (isLoggedIn) {
                showLogoutConfirmation();
            } else {
                openAuthModal('login');
            }
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAuthModal();
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAuthModal);
    }
    
    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.view;
            switchView(targetView);
        });
    });
    
    initForms();
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeAuthModal();
        }
    });
}

export function openAuthModal(view = 'login') {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    
    switchView(view);
    overlay.classList.add('active');
}

export function closeAuthModal() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    
    setTimeout(() => {
        clearForms();
        clearInputErrors();
    }, 300);
}

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
    
    clearInputErrors();
}

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
 * FIXED: Real Backend Login
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const submitBtn = e.target.querySelector('.auth-submit');
    
    clearInputErrors();
    
    if (!email || !password) {
        if (!email) emailInput.classList.add('error');
        if (!password) passwordInput.classList.add('error');
        showWarning('Bitte fülle alle Felder aus');
        return;
    }
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // REAL Backend Call!
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Save auth data
            localStorage.setItem('auth_token', data.data.session.access_token);
            localStorage.setItem('user_logged_in', 'true');
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_premium', data.data.isPremium);  // ← CRITICAL!
            
            // Update UI
            updateUserIconState(true, email);
            
            // Refresh favorites
            import('./fav-engine.js').then(module => {
                module.refreshFavoritesView();
            });
            
            // Show success message
            if (data.data.isPremium) {
                showSuccess('🎉 Premium Login erfolgreich!');
            } else {
                showSuccess('Erfolgreich angemeldet!');
            }
            
            setTimeout(() => {
                closeAuthModal();
            }, 1000);
        } else {
            // Login failed
            emailInput.classList.add('error');
            passwordInput.classList.add('error');
            showError(data.message || 'Falsches Passwort oder Email');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Verbindungsfehler. Bitte versuche es später erneut.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * FIXED: Real Backend Signup
 */
async function handleSignup(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const submitBtn = e.target.querySelector('.auth-submit');
    
    clearInputErrors();
    
    if (!email || !password) {
        if (!email) emailInput.classList.add('error');
        if (!password) passwordInput.classList.add('error');
        showWarning('Bitte fülle alle Felder aus');
        return;
    }
    
    if (password.length < 6) {
        passwordInput.classList.add('error');
        showError('Passwort muss mindestens 6 Zeichen lang sein');
        return;
    }
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // REAL Backend Call!
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Account erfolgreich erstellt! 🎉');
            
            setTimeout(() => {
                switchView('login');
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').value = password;
                showInfo('Du kannst dich jetzt einloggen');
            }, 1500);
        } else {
            emailInput.classList.add('error');
            showError(data.message || 'Registrierung fehlgeschlagen');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('Verbindungsfehler. Bitte versuche es später erneut.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function clearInputErrors() {
    const inputs = document.querySelectorAll('.auth-input');
    inputs.forEach(input => input.classList.remove('error'));
}

function clearForms() {
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.reset());
}

function updateUserIconState(loggedIn, email = '') {
    const userIcon = document.getElementById('user-icon');
    if (!userIcon) return;
    
    if (loggedIn) {
        userIcon.classList.remove('guest');
        userIcon.classList.add('logged-in');
    } else {
        userIcon.classList.add('guest');
        userIcon.classList.remove('logged-in');
        localStorage.removeItem('user_logged_in');
        localStorage.removeItem('user_email');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_premium');
    }
}

export function checkAuthState() {
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    const email = localStorage.getItem('user_email') || '';
    
    if (isLoggedIn) {
        updateUserIconState(true, email);
    }
}

export function logout() {
    updateUserIconState(false);
    showSuccess('Erfolgreich ausgeloggt');
    
    // Reload page to reset limits
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

function showLogoutConfirmation() {
    logout();
}