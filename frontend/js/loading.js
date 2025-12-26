/**
 * Loading Controller Module
 * Handles all loading states for the Curio app
 */

/**
 * Show app startup loading screen
 */
export function showAppLoading() {
    // Create loading screen if doesn't exist
    if (!document.getElementById('app-loading-screen')) {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'app-loading-screen';
        loadingScreen.className = 'app-loading-screen';
        loadingScreen.innerHTML = `
            <div class="logo-spinner"></div>
            <div class="loading-text">Loading your daily inspiration...</div>
        `;
        document.body.appendChild(loadingScreen);
    }
}

/**
 * Hide app startup loading screen
 */
export function hideAppLoading() {
    const loadingScreen = document.getElementById('app-loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

/**
 * Show loading overlay for content transitions
 * @param {string} viewId - The view to show loading in (e.g., 'view-art', 'view-quotes')
 */
export function showContentLoading(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    // Collapse info section before loading
    const infoSection = view.querySelector('.info-section');
    if (infoSection) {
        infoSection.classList.remove('expanded');
        // Add loading class to info section for skeleton bars
        infoSection.classList.add('loading');
    }
    
    // Add loading class to body to dim header/nav
    document.body.classList.add('app-loading');
    
    // Add loading class to view for content blur
    view.classList.add('loading');
    
    // Create overlay if doesn't exist
    let overlay = view.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="logo-spinner"></div>
        `;
        view.appendChild(overlay);
    }
    
    // Show overlay
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    // Disable interactions
    disableViewInteractions(viewId);
    
    // Show loading state on nav buttons
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
        // Add loaded state for success animation
        spinner.classList.add('loaded');
        
        // Hide after animation
        setTimeout(() => {
            overlay.classList.remove('active');
            
            // Remove loading class from view
            view.classList.remove('loading');
            
            // Remove loading class from info section
            if (infoSection) {
                infoSection.classList.remove('loading');
            }
            
            // Remove loading class from body
            document.body.classList.remove('app-loading');
            
            setTimeout(() => {
                spinner.classList.remove('loaded');
            }, 600);
        }, 300);
    }
    
    // Re-enable interactions
    enableViewInteractions(viewId);
    
    // Remove loading state from nav buttons
    setNavButtonsLoading(false);
}

/**
 * Disable view interactions during loading
 */
function disableViewInteractions(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    // Disable info section
    const infoSection = view.querySelector('.info-section');
    if (infoSection) {
        infoSection.classList.add('loading-active');
    }
    
    // Disable image clicks
    const images = view.querySelectorAll('.main-image');
    images.forEach(img => {
        img.classList.add('loading-active');
    });
    
    // Disable favorite button
    const favBtn = view.querySelector('.fav-btn');
    if (favBtn) {
        favBtn.classList.add('loading-active');
    }
}

/**
 * Enable view interactions after loading
 */
function enableViewInteractions(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    
    // Re-enable info section
    const infoSection = view.querySelector('.info-section');
    if (infoSection) {
        infoSection.classList.remove('loading-active');
    }
    
    // Re-enable image clicks
    const images = view.querySelectorAll('.main-image');
    images.forEach(img => {
        img.classList.remove('loading-active');
    });
    
    // Re-enable favorite button
    const favBtn = view.querySelector('.fav-btn');
    if (favBtn) {
        favBtn.classList.remove('loading-active');
    }
}

/**
 * Set navigation buttons loading state
 * @param {boolean} isLoading - Whether buttons should show loading
 */
function setNavButtonsLoading(isLoading) {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        if (isLoading) {
            btn.classList.add('loading');
        } else {
            btn.classList.remove('loading');
        }
    });
}