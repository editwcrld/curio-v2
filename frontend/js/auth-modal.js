/**
 * Auth Modal Module
 * Handles login and sign-up modal with Toast notifications
 */

import { showSuccess, showError, showWarning, showInfo } from './toast.js';

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
    // REMOVED: document.body.style.overflow = 'hidden';
}

export function closeAuthModal() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    // REMOVED: document.body.style.overflow = '';
    
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

async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value;
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
        await simulateAPICall();
        
        const success = Math.random() > 0.5;
        
        if (success) {
            updateUserIconState(true, email);
            
            import('./fav-engine.js').then(module => {
                module.refreshFavoritesView();
            });
            
            showSuccess('Erfolgreich angemeldet!');
            
            setTimeout(() => {
                closeAuthModal();
            }, 1000);
        } else {
            emailInput.classList.add('error');
            passwordInput.classList.add('error');
            showError('Falsches Passwort oder Email');
        }
    } catch (error) {
        showError('Ein Fehler ist aufgetreten');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    // FIXED: Kein Name-Feld mehr!
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const email = emailInput.value;
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
        await simulateAPICall();
        
        showSuccess('Account erfolgreich erstellt!');
        
        setTimeout(() => {
            switchView('login');
            document.getElementById('login-email').value = email;
            showInfo('Du kannst dich jetzt einloggen');
        }, 1500);
    } catch (error) {
        showError('Ein Fehler ist aufgetreten');
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
}

function showLogoutConfirmation() {
    // FIXED: Einfach ausloggen ohne Confirm-Box, mit Toast
    logout();
}

function simulateAPICall() {
    return new Promise(resolve => {
        setTimeout(resolve, 1500);
    });
}