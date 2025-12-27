/**
 * Info Panel Module
 * ✅ Language Toggle OHNE Expand-Konflikt
 * ✅ Guest Favorite → öffnet Auth Modal
 */

import { toggleFavorite } from './fav-engine.js';
import { appState } from './state.js';

export function initInfoPanels() {
    const infoSections = document.querySelectorAll('.info-section');
    
    infoSections.forEach(section => {
        section.addEventListener('click', (e) => {
            // Don't expand when clicking interactive elements
            if (e.target.closest('.fav-btn')) return;
            if (e.target.closest('.lang-toggle')) return;
            if (e.target.closest('.lang-btn')) return;
            if (e.target.closest('button')) return;
            
            section.classList.toggle('expanded');
        });
    });
    
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
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
                
                console.log(`🌐 Language changed to: ${lang}`);
            });
        });
    });
    
    // Set initial state
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
        // Remove existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', handleFavoriteClick, { passive: false });
    });
}

/**
 * Handle favorite button click
 */
function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    // ✅ Guest klickt auf Herz → Auth Modal öffnen
    if (!isLoggedIn) {
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
    
    // Update storage async
    requestAnimationFrame(() => {
        toggleFavorite(data, viewType);
    });
}