/**
 * Main Application Entry Point
 */

import { appState } from './state.js';
import { loadDailyArt, initArtView } from './art-engine.js';
import { loadDailyQuote, initQuoteView } from './quote-engine.js';
import { initInfoPanels, initFavoriteButtons } from './info-panel.js';
import { initNavigation } from './ui-controller.js';
import { initFavoritesView, updateAllFavoriteButtons } from './fav-engine.js';
import { initContentNavigation } from './content-navigation.js';
import { initSwipeHandler } from './swipe-handler.js';
import { initAuthModal, checkAuthState } from './auth-modal.js';
import { initLightbox } from './lightbox.js';
import { showAppLoading, hideAppLoading } from './loading.js';
import { initLimits } from './limits.js';
import './toast.js';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showAppLoading();
        
        // Initialize limits system
        initLimits();
        
        // Initialize UI components
        initNavigation();
        initInfoPanels();
        initFavoriteButtons();
        
        // Initialize language toggle (if exists in HTML)
        initLanguageToggleIfExists();
        
        // Initialize view-specific logic
        initArtView();
        initQuoteView();
        initFavoritesView();
        
        // Initialize auth modal
        initAuthModal();
        checkAuthState();
        
        // Initialize lightbox
        initLightbox();
        
        // Initialize content navigation
        initContentNavigation();
        
        // Initialize swipe gestures
        initSwipeHandler(
            () => import('./content-navigation.js').then(m => m.handleNext()),
            () => import('./content-navigation.js').then(m => m.handlePrevious())
        );
        
        // Load daily content
        await Promise.all([
            loadDailyArt(),
            loadDailyQuote()
        ]);
        
        // Update favorite button states
        updateAllFavoriteButtons();
        
        hideAppLoading();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        hideAppLoading();
    }
});

// Simple language toggle init without separate module
function initLanguageToggleIfExists() {
    const currentLang = localStorage.getItem('curio_language') || 'de';
    
    document.querySelectorAll('.lang-toggle .lang-btn').forEach(btn => {
        // Set initial active state
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
        
        // Add click handler
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const lang = btn.dataset.lang;
            localStorage.setItem('curio_language', lang);
            
            // Update all buttons
            document.querySelectorAll('.lang-toggle .lang-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.lang === lang);
            });
            
            // Trigger update
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        });
    });
}