/**
 * Auth Modal Module
 * ✅ Login and Sign-up modal
 * ✅ Toast notifications
 * ✅ User-Icon wird von user-menu.js gehandelt
 */

import { showSuccess, showError, showWarning, showInfo } from './toast.js';
import { API_BASE_URL } from './config.js';

let currentView = 'login';

/**
 * Initialize auth modal
 * NOTE: User icon click is handled by user-menu.js now!
 */
export function initAuthModal() {
    const overlay = document.getElementById('auth-overlay');
    const closeBtn = document.getElementById('auth-close');
    const toggleLinks = document.querySelectorAll('.auth-toggle-link');
    
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
        loginView?.classList.remove('hidden');
        signupView?.classList.add('hidden');
    } else {
        loginView?.classList.add('hidden');
        signupView?.classList.remove('hidden');
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
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Debug: Log full response
            console.log('🔍 Login response:', JSON.stringify(data, null, 2));
            
            // ✅ Token ist unter data.data.session.access_token (Backend Response Format)
            const token = data.data?.session?.access_token || 
                          data.session?.access_token || 
                          data.token ||
                          data.access_token;
            
            console.log('🔑 Extracted token:', token ? token.substring(0, 50) + '...' : 'NULL');
            
            if (!token) {
                console.error('❌ No token in response:', data);
                showError('Login fehlgeschlagen - kein Token erhalten');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                return;
            }
            
            // Validate token format (JWT has 3 parts separated by dots)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('❌ Invalid token format, parts:', tokenParts.length);
                showError('Login fehlgeschlagen - ungültiges Token-Format');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                return;
            }
            
            // Save auth data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_logged_in', 'true');
            localStorage.setItem('user_email', email);
            
            console.log('✅ Login successful, token saved (length:', token.length, ')');
            
            updateUserIconState(true, email);
            
            // Refresh favorites
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
            showError(data.error || 'Falsches Passwort oder Email');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Verbindungsfehler. Bitte versuche es erneut.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

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
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Account erfolgreich erstellt!');
            
            setTimeout(() => {
                switchView('login');
                document.getElementById('login-email').value = email;
                showInfo('Du kannst dich jetzt einloggen');
            }, 1500);
        } else {
            emailInput.classList.add('error');
            showError(data.error || 'Registrierung fehlgeschlagen');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('Verbindungsfehler. Bitte versuche es erneut.');
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
    // Clear all auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('user_email');
    
    updateUserIconState(false);
    showSuccess('Erfolgreich ausgeloggt');
    
    // Refresh favorites view
    import('./fav-engine.js').then(module => {
        module.refreshFavoritesView();
    });
}