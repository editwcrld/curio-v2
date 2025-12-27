/**
 * Loading Controller Module
 * Beautiful loading & error screens for Daily Art & Quotes
 */

// =====================================================
// APP STARTUP LOADING
// =====================================================

/**
 * Show app startup loading screen
 * Creates beautiful animated loading screen
 */
export function showAppLoading() {
    // Don't create duplicate
    if (document.getElementById('app-loading-screen')) return;
    
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'app-loading-screen';
    loadingScreen.className = 'app-loading-screen';
    
    loadingScreen.innerHTML = `
        <!-- Animated Background Shapes -->
        <div class="loading-bg-shapes">
            <div class="loading-shape"></div>
            <div class="loading-shape"></div>
            <div class="loading-shape"></div>
            <div class="loading-shape"></div>
        </div>
        
        <!-- Logo & Branding -->
        <div class="loading-logo-container">
            <div class="loading-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <h1 class="loading-app-name">Curio</h1>
            <p class="loading-tagline">Daily Art & Quotes</p>
        </div>
        
        <!-- Loading Progress -->
        <div class="loading-progress-container">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <p class="loading-status">Loading your daily inspiration...</p>
        </div>
    `;
    
    document.body.appendChild(loadingScreen);
}

/**
 * Hide app startup loading screen with smooth animation
 */
export function hideAppLoading() {
    const loadingScreen = document.getElementById('app-loading-screen');
    if (!loadingScreen) return;
    
    // Add fade out animation
    loadingScreen.classList.add('fade-out');
    
    // Remove after animation completes
    setTimeout(() => {
        loadingScreen.remove();
    }, 600);
}

// =====================================================
// ERROR SCREEN
// =====================================================

/**
 * Show beautiful error screen with retry button
 * @param {string} message - Error message to display
 */
export function showErrorScreen(message = 'Something went wrong') {
    // Remove loading screen if present
    const loadingScreen = document.getElementById('app-loading-screen');
    if (loadingScreen) loadingScreen.remove();
    
    // Don't create duplicate
    if (document.getElementById('app-error-screen')) return;
    
    const errorScreen = document.createElement('div');
    errorScreen.id = 'app-error-screen';
    errorScreen.className = 'app-error-screen';
    
    errorScreen.innerHTML = `
        <!-- Background Pattern -->
        <div class="error-bg-pattern"></div>
        
        <!-- Error Content -->
        <div class="error-content">
            <div class="error-icon">
                <div class="error-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                    </svg>
                </div>
                <div class="error-decoration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </div>
            </div>
            
            <h1 class="error-title">Connection Lost</h1>
            <p class="error-message">
                ${message}<br>
                Please check your internet connection and try again.
            </p>
            
            <button class="error-retry-btn" onclick="window.location.reload()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
                </svg>
                Try Again
            </button>
            
            <p class="error-help">
                Still having issues? <a href="mailto:support@curio.app">Contact Support</a>
            </p>
        </div>
    `;
    
    document.body.appendChild(errorScreen);
}

/**
 * Hide error screen
 */
export function hideErrorScreen() {
    const errorScreen = document.getElementById('app-error-screen');
    if (errorScreen) {
        errorScreen.remove();
    }
}

// =====================================================
// CONTENT LOADING (for view transitions)
// =====================================================

/**
 * Show loading overlay for content transitions
 * @param {string} viewId - The view to show loading in
 */
export function showContentLoading(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    // Collapse info section
    const infoSection = view.querySelector('.info-section');
    if (infoSection) {
        infoSection.classList.remove('expanded');
        infoSection.classList.add('loading');
    }
    
    // Add loading classes
    document.body.classList.add('app-loading');
    view.classList.add('loading');
    
    // Create overlay if needed
    let overlay = view.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="logo-spinner"></div>';
        view.appendChild(overlay);
    }
    
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    disableViewInteractions(viewId);
    setNavButtonsLoading(true);
}

/**
 * Hide loading overlay
 * @param {string} viewId - The view to hide loading from
 */
export function hideContentLoading(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    const overlay = view.querySelector('.loading-overlay');
    const spinner = overlay?.querySelector('.logo-spinner');
    const infoSection = view.querySelector('.info-section');
    
    if (overlay && spinner) {
        spinner.classList.add('loaded');
        
        setTimeout(() => {
            overlay.classList.remove('active');
            view.classList.remove('loading');
            
            if (infoSection) {
                infoSection.classList.remove('loading');
            }
            
            document.body.classList.remove('app-loading');
            
            setTimeout(() => {
                spinner.classList.remove('loaded');
            }, 600);
        }, 300);
    }
    
    enableViewInteractions(viewId);
    setNavButtonsLoading(false);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function disableViewInteractions(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    view.querySelector('.info-section')?.classList.add('loading-active');
    view.querySelectorAll('.main-image').forEach(img => img.classList.add('loading-active'));
    view.querySelector('.fav-btn')?.classList.add('loading-active');
}

function enableViewInteractions(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    view.querySelector('.info-section')?.classList.remove('loading-active');
    view.querySelectorAll('.main-image').forEach(img => img.classList.remove('loading-active'));
    view.querySelector('.fav-btn')?.classList.remove('loading-active');
}

function setNavButtonsLoading(isLoading) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('loading', isLoading);
    });
}