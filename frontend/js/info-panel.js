/**
 * Info Panel Module
 * ✅ Language Toggle OHNE Expand-Konflikt
 * ✅ Optimierte Reaktion
 */

import { toggleFavorite, updateFavoriteButtonState as updateFavButtonState } from './fav-engine.js';
import { appState } from './state.js';

export function initInfoPanels() {
    const infoSections = document.querySelectorAll('.info-section');
    
    infoSections.forEach(section => {
        section.addEventListener('click', (e) => {
            // ✅ Don't expand when clicking favorite button
            if (e.target.closest('.fav-btn')) return;
            
            // ✅ Don't expand when clicking language toggle
            if (e.target.closest('.lang-toggle')) return;
            if (e.target.closest('.lang-btn')) return;
            
            // ✅ Don't expand when clicking inside info-header buttons
            if (e.target.closest('.info-header button')) return;
            
            section.classList.toggle('expanded');
        });
    });
    
    // ✅ Initialize language toggles
    initLanguageToggles();
}

/**
 * Initialize language toggle buttons
 */
function initLanguageToggles() {
    const langToggles = document.querySelectorAll('.lang-toggle');
    
    langToggles.forEach(toggle => {
        const buttons = toggle.querySelectorAll('.lang-btn');
        
        buttons.forEach(btn => {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = newBtn.dataset.lang;
                if (!lang) return;
                
                // Update localStorage
                localStorage.setItem('curio_language', lang);
                
                // Update button states in ALL toggles
                document.querySelectorAll('.lang-toggle').forEach(t => {
                    t.querySelectorAll('.lang-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.lang === lang);
                    });
                });
                
                // Dispatch event for engines to update content
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
                
                console.log(`🌐 Language changed to: ${lang}`);
            });
        });
    });
    
    // Set initial state from localStorage
    const currentLang = localStorage.getItem('curio_language') || 'de';
    document.querySelectorAll('.lang-toggle').forEach(toggle => {
        toggle.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    });
}

export function initFavoriteButtons() {
    const favButtons = document.querySelectorAll('.fav-btn');
    
    favButtons.forEach(btn => {
        // Remove any existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add optimized click handler
        newBtn.addEventListener('click', handleFavoriteClick, { passive: false });
    });
}

/**
 * Optimized favorite click handler
 */
function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (!isLoggedIn) {
        // ✅ Open auth modal instead of just showing message
        import('./auth-modal.js').then(module => {
            module.openAuthModal('login');
        });
        return;
    }
    
    // Get view type
    const viewElement = e.currentTarget.closest('.view');
    const viewType = viewElement ? viewElement.id.replace('view-', '') : null;
    
    if (!viewType || viewType === 'favorites') return;
    
    // Get current data
    const data = viewType === 'art' ? appState.currentArtData : appState.currentQuoteData;
    
    if (!data || !data.id) {
        console.warn('No valid data to favorite');
        return;
    }
    
    // INSTANT visual feedback
    const btn = e.currentTarget;
    const willBeFavorited = !btn.classList.contains('active');
    btn.classList.toggle('active', willBeFavorited);
    
    // Add scale animation
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
    
    // Then update storage (async, doesn't block UI)
    requestAnimationFrame(() => {
        toggleFavorite(data, viewType);
    });
}

/**
 * Show login required message (legacy, now opens modal)
 */
function showLoginRequiredMessage() {
    import('./auth-modal.js').then(module => {
        module.openAuthModal('login');
    });
}