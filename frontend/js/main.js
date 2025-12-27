/**
 * Main Application Entry Point
 * ✅ Lädt NUR die aktuelle View bei Reload
 * ✅ View Persistence nach Reload
 * ✅ User Menu Integration
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
import { initUserMenu } from './user-menu.js';
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
            await loadDailyArt();
        }
        
        if (viewName === 'quotes' || viewName === 'favorites') {
            await loadDailyQuote();
        }
        
        // Preload other content in background
        if (viewName === 'art') {
            loadDailyQuote().catch(e => console.warn('Background quote load:', e.message));
        }
        
        if (viewName === 'quotes') {
            loadDailyArt().catch(e => console.warn('Background art load:', e.message));
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
        showAppLoading();
        
        const lastView = getLastView();
        console.log(`🔄 Starting with view: ${lastView}`);
        
        // Initialize all modules
        initLimits();
        initNavigation();
        initInfoPanels();
        initFavoriteButtons();
        initArtView();
        initQuoteView();
        initFavoritesView();
        initAuthModal();
        initUserMenu();  // ✅ User Menu initialisieren
        checkAuthState();
        initLightbox();
        initContentNavigation();
        
        // Initialize swipe gestures
        initSwipeHandler(
            () => import('./content-navigation.js').then(m => m.handleNext()),
            () => import('./content-navigation.js').then(m => m.handlePrevious())
        );
        
        // Switch to last view BEFORE loading content
        switchView(lastView);
        
        // Load content for current view
        await loadContentForView(lastView);
        
        updateAllFavoriteButtons();
        hideAppLoading();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        hideAppLoading();
        
        if (window.showToast) {
            window.showToast('Fehler beim Laden. Bitte neu laden.', 'error');
        }
    }
});

// =====================================================
// REFRESH FUNCTIONALITY
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