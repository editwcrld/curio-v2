/**
 * User Menu Module
 * ✅ Dropdown für eingeloggte User
 * ✅ X-Button zum Schließen
 * ✅ Außerhalb klicken schließt
 * ✅ Mobile-optimiert
 */

import { logout } from './auth-modal.js';
import { showSuccess } from './toast.js';

let menuOpen = false;
let menuElement = null;

// =====================================================
// INITIALIZE USER MENU
// =====================================================

export function initUserMenu() {
    const userIcon = document.getElementById('user-icon');
    if (!userIcon) return;
    
    // Create menu element
    createMenuElement();
    
    // Override the user icon click
    userIcon.addEventListener('click', handleUserIconClick);
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) {
            closeUserMenu();
        }
    });
    
    // ✅ Close when clicking bottom nav buttons (by ID)
    const navButtons = ['nav-art', 'nav-quotes', 'nav-favorites'];
    navButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                if (menuOpen) closeUserMenu();
            });
        }
    });
    
    // ✅ Also try by parent selector
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
        bottomNav.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (menuOpen) closeUserMenu();
            });
        });
    }
    
    // ✅ Close when clicking app logo
    const appLogo = document.querySelector('.app-logo');
    if (appLogo) {
        appLogo.addEventListener('click', () => {
            if (menuOpen) closeUserMenu();
        });
    }
}

// =====================================================
// CREATE MENU ELEMENT
// =====================================================

function createMenuElement() {
    // Remove existing if any
    const existing = document.querySelector('.user-menu');
    if (existing) existing.remove();
    
    menuElement = document.createElement('div');
    menuElement.className = 'user-menu';
    menuElement.innerHTML = `
        <div class="user-menu-backdrop"></div>
        <div class="user-menu-content">
            <button class="user-menu-close" aria-label="Schließen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="user-menu-header">
                <div class="user-menu-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                <div class="user-menu-info">
                    <span class="user-menu-label">Eingeloggt als</span>
                    <span class="user-menu-email"></span>
                </div>
            </div>
            <div class="user-menu-divider"></div>
            <div class="user-menu-options">
                <button class="user-menu-item" id="user-menu-settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>Einstellungen</span>
                    <span class="user-menu-badge">Bald</span>
                </button>
                <button class="user-menu-item user-menu-logout" id="user-menu-logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>Ausloggen</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(menuElement);
    
    // Add event listeners
    const closeBtn = menuElement.querySelector('.user-menu-close');
    const settingsBtn = menuElement.querySelector('#user-menu-settings');
    const logoutBtn = menuElement.querySelector('#user-menu-logout');
    const backdrop = menuElement.querySelector('.user-menu-backdrop');
    
    closeBtn.addEventListener('click', closeUserMenu);
    settingsBtn.addEventListener('click', handleSettings);
    logoutBtn.addEventListener('click', handleLogout);
    backdrop.addEventListener('click', closeUserMenu);
}

// =====================================================
// HANDLE USER ICON CLICK
// =====================================================

function handleUserIconClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (isLoggedIn) {
        if (menuOpen) {
            closeUserMenu();
        } else {
            openUserMenu();
        }
    } else {
        // Open auth modal
        import('./auth-modal.js').then(module => {
            module.openAuthModal('login');
        });
    }
}

// =====================================================
// OPEN/CLOSE MENU
// =====================================================

function openUserMenu() {
    if (!menuElement) createMenuElement();
    
    // Update email
    const email = localStorage.getItem('user_email') || 'user@example.com';
    const emailEl = menuElement.querySelector('.user-menu-email');
    if (emailEl) emailEl.textContent = email;
    
    // Show menu
    menuElement.classList.add('active');
    menuOpen = true;
}

function closeUserMenu() {
    if (menuElement) {
        menuElement.classList.remove('active');
    }
    menuOpen = false;
}

// =====================================================
// MENU ACTIONS
// =====================================================

function handleSettings() {
    closeUserMenu();
    showSuccess('Einstellungen kommen bald!');
}

function handleLogout() {
    closeUserMenu();
    logout();
}

// =====================================================
// EXPORTS
// =====================================================

export function isUserMenuOpen() {
    return menuOpen;
}

export { closeUserMenu, openUserMenu };