/**
 * Main Application Entry Point
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

// ===== GET LAST VIEW =====

function getLastView() {
    const lastView = localStorage.getItem('curio_last_view');
    if (lastView && ['art', 'quotes', 'favorites'].includes(lastView)) {
        return lastView;
    }
    return 'art';
}

// ===== LOAD CONTENT =====

async function loadContentForView(viewName) {
    try {
        if (viewName === 'art' || viewName === 'favorites') {
            await loadDailyArt();
        }
        
        if (viewName === 'quotes' || viewName === 'favorites') {
            await loadDailyQuote();
        }
        
        // Preload other in background
        if (viewName === 'art') {
            loadDailyQuote().catch(() => {});
        }
        if (viewName === 'quotes') {
            loadDailyArt().catch(() => {});
        }
    } catch (error) {
        // Silent fail - content will show error state
    }
}

// ===== INIT APP =====

document.addEventListener('DOMContentLoaded', async () => {
    try {
        showAppLoading();
        
        const lastView = getLastView();
        
        // Initialize modules
        initLimits();
        initNavigation();
        initInfoPanels();
        initFavoriteButtons();
        initArtView();
        initQuoteView();
        initFavoritesView();
        initAuthModal();
        initUserMenu();
        checkAuthState();
        initLightbox();
        initContentNavigation();
        
        // Swipe gestures
        initSwipeHandler(
            () => import('./content-navigation.js').then(m => m.handleNext()),
            () => import('./content-navigation.js').then(m => m.handlePrevious())
        );
        
        // Switch to last view and load content
        switchView(lastView);
        await loadContentForView(lastView);
        
        updateAllFavoriteButtons();
        hideAppLoading();
    } catch (error) {
        hideAppLoading();
        if (window.showToast) {
            window.showToast('Fehler beim Laden. Bitte neu laden.', 'error');
        }
    }
});

// ===== REFRESH =====

window.refreshCurrentView = async function() {
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        await loadDailyArt();
    } else if (currentView === 'quotes') {
        await loadDailyQuote();
    }
    
    updateAllFavoriteButtons();
};