/**
 * Main Application Entry Point
 * Orchestrates all modules and initializes the app
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
        // Show app loading screen
        showAppLoading();
        
        // Initialize limits system (check 24h reset)
        initLimits();
        
        // Initialize UI components
        initNavigation();
        initInfoPanels();
        initFavoriteButtons();
        
        // Initialize view-specific logic
        initArtView();
        initQuoteView();
        initFavoritesView();
        
        // Initialize auth modal
        initAuthModal();
        checkAuthState();
        
        // Initialize lightbox
        initLightbox();
        
        // Initialize content navigation (back/next buttons)
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
        
        // Update favorite button states after loading
        updateAllFavoriteButtons();
        
        // Hide loading screen
        hideAppLoading();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        hideAppLoading();
        alert('Failed to load content. Please refresh the page.');
    }
});