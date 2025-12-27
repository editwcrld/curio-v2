/**
 * Main Application Entry Point
 * ✅ Lädt NUR die aktuelle View bei Reload (nicht beides!)
 * ✅ View Persistence nach Reload
 * ✅ Refresh bleibt in aktueller View
 */

import { appState } from './state.js';
import { loadDailyArt, displayArt, initArtView } from './art-engine.js';
import { loadDailyQuote, displayQuote, initQuoteView } from './quote-engine.js';
import { initInfoPanels, initFavoriteButtons } from './info-panel.js';
import { initNavigation, switchView } from './ui-controller.js';
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
// GET LAST VIEW FROM STORAGE
// =====================================================

function getLastView() {
    const lastView = localStorage.getItem('curio_last_view');
    if (lastView && ['art', 'quotes', 'favorites'].includes(lastView)) {
        return lastView;
    }
    return 'art'; // Default
}

// =====================================================
// LOAD CONTENT FOR CURRENT VIEW ONLY
// =====================================================

async function loadContentForView(viewName) {
    console.log(`📅 Loading content for view: ${viewName}`);
    
    try {
        if (viewName === 'art' || viewName === 'favorites') {
            // Load art
            await loadDailyArt();
        }
        
        if (viewName === 'quotes' || viewName === 'favorites') {
            // Load quote
            await loadDailyQuote();
        }
        
        // If on art view, also preload quote in background (ohne zu warten)
        if (viewName === 'art') {
            loadDailyQuote().catch(e => console.warn('Background quote load failed:', e));
        }
        
        // If on quotes view, also preload art in background (ohne zu warten)
        if (viewName === 'quotes') {
            loadDailyArt().catch(e => console.warn('Background art load failed:', e));
        }
        
    } catch (error) {
        console.error('❌ Failed to load content:', error);
    }
}

// =====================================================
// INITIALIZE APP
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show app loading screen
        showAppLoading();
        
        // Get last view FIRST
        const lastView = getLastView();
        console.log(`🔄 Starting with view: ${lastView}`);
        
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
        
        // ✅ Switch to last view BEFORE loading content
        switchView(lastView);
        
        // ✅ Load content for current view (lädt nur was nötig ist!)
        await loadContentForView(lastView);
        
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