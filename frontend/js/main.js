/**
 * Main Application Entry Point
 * Orchestrates all modules and initializes the app
 */

import { appState } from './state.js';
import { loadDailyArt, initArtView } from './art-engine.js';
import { loadDailyQuote, initQuoteView } from './quote-engine.js';
import { initInfoPanels, initFavoriteButtons } from './info-panel.js';
import { initNavigation, showLoading, showError } from './ui-controller.js';
import { initFavoritesView, updateAllFavoriteButtons } from './fav-engine.js';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize UI components
        initNavigation();
        initInfoPanels();
        initFavoriteButtons();
        
        // Initialize view-specific logic
        initArtView();
        initQuoteView();
        initFavoritesView();
        
        // Load daily content
        showLoading(true);
        await Promise.all([
            loadDailyArt(),
            loadDailyQuote()
        ]);
        showLoading(false);
        
        // Update favorite button states after loading
        updateAllFavoriteButtons();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showError('Failed to load content. Please refresh the page.');
    }
});