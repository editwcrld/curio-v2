/**
 * Main Application Entry Point
 * ✅ Lädt Daily Content (ALLE User sehen dasselbe!)
 * ✅ Refresh bleibt in aktueller View
 */

import { appState } from './state.js';
import { loadDailyArt, displayArt, initArtView } from './art-engine.js';
import { loadDailyQuote, displayQuote, initQuoteView } from './quote-engine.js';
import { initInfoPanels, initFavoriteButtons } from './info-panel.js';
import { initNavigation } from './ui-controller.js';
import { initFavoritesView, updateAllFavoriteButtons } from './fav-engine.js';
import { initContentNavigation, addToArtHistory, addToQuoteHistory } from './content-navigation.js';
import { initSwipeHandler } from './swipe-handler.js';
import { initAuthModal, checkAuthState } from './auth-modal.js';
import { initLightbox } from './lightbox.js';
import { showAppLoading, hideAppLoading } from './loading.js';
import { initLimits } from './limits.js';
import { API_BASE_URL, getRandomGradient } from './config.js';
import './toast.js';

// =====================================================
// LOAD DAILY CONTENT (ALLE User sehen dasselbe!)
// =====================================================

async function loadDailyContent() {
    try {
        console.log('📅 Loading daily content...');
        
        const response = await fetch(`${API_BASE_URL}/daily/today`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        const { art, quote, date } = result.data;
        
        console.log(`✅ Daily content for ${date} loaded`);
        
        // Set Art
        appState.setArtData(art);
        addToArtHistory(art);
        
        // Set Quote with gradient
        const gradient = getRandomGradient();
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        addToQuoteHistory(quote, gradient);
        
        return { art, quote };
    } catch (error) {
        console.error('❌ Failed to load daily content:', error);
        
        // Fallback: Load separately
        console.log('🔄 Falling back to separate loading...');
        
        await Promise.all([
            loadDailyArt(),
            loadDailyQuote()
        ]);
        
        return null;
    }
}

// =====================================================
// INITIALIZE APP
// =====================================================

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
        
        // Load daily content (ALLE User sehen dasselbe!)
        await loadDailyContent();
        
        // Update favorite button states after loading
        updateAllFavoriteButtons();
        
        // Hide loading screen
        hideAppLoading();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        hideAppLoading();
        
        // Show error toast
        if (window.showToast) {
            window.showToast('Fehler beim Laden. Bitte neu laden.', 'error');
        }
    }
});

// =====================================================
// REFRESH FUNCTIONALITY (bleibt in aktueller View!)
// =====================================================

// Expose refresh function globally
window.refreshCurrentView = async function() {
    const currentView = appState.currentView;
    
    console.log(`🔄 Refreshing ${currentView}...`);
    
    if (currentView === 'art') {
        await loadDailyArt();
    } else if (currentView === 'quotes') {
        await loadDailyQuote();
    }
    
    updateAllFavoriteButtons();
};