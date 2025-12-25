/**
 * Main Application Entry Point
 * Orchestrates all modules and initializes the app
 */

import { appState } from './state.js';
import { loadDailyArt, initArtView } from './art-engine.js';
import { loadDailyQuote, initQuoteView } from './quote-engine.js';
import { initInfoPanels, initFavoriteButtons, updateFavoriteButtonState } from './info-panel.js';
import { initNavigation, showLoading, showError } from './ui-controller.js';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize UI components
        initNavigation();
        initInfoPanels();
        
        // Initialize view-specific logic
        initArtView();
        initQuoteView();
        
        // Initialize favorite buttons with callback
        initFavoriteButtons(handleFavoriteToggle);
        
        // Load daily content
        showLoading(true);
        await Promise.all([
            loadDailyArt(),
            loadDailyQuote()
        ]);
        showLoading(false);
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load content. Please refresh the page.');
    }
});

/**
 * Handle favorite button toggle
 * This is a placeholder - will be implemented when favorites feature is rebuilt
 */
function handleFavoriteToggle(viewType) {
    console.log(`Favorite toggled for ${viewType}`);
    
    // Get current data based on view type
    const data = viewType === 'art' ? appState.currentArtData : appState.currentQuoteData;
    
    if (!data) {
        console.warn('No data available to favorite');
        return;
    }
    
    // TODO: Implement favorite logic when rebuilding favorites feature
    // For now, just toggle the visual state
    const isFavorite = Math.random() > 0.5; // Placeholder
    updateFavoriteButtonState(viewType, isFavorite);
}