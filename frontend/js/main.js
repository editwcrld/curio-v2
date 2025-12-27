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
import { hideAppLoading, showErrorScreen } from './loading.js';
import { initScrollExpand } from './info-drag-handler.js';
import { initLimits } from './limits.js';
import { initOnboarding } from './onboarding.js';
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
    if (viewName === 'art') {
        await loadDailyArt();
        loadDailyQuote().catch(() => {});
    } else if (viewName === 'quotes') {
        await loadDailyQuote();
        loadDailyArt().catch(() => {});
    } else if (viewName === 'favorites') {
        await Promise.all([loadDailyArt(), loadDailyQuote()]);
    }
}

// ===== INIT APP =====

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Loading screen is already in HTML, no need to create it
        
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
        initScrollExpand();
        
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
        
        // ✅ Initialize onboarding for first-time guest users
        initOnboarding();
        
    } catch (error) {
        console.error('App initialization failed:', error);
        
        // Show beautiful error screen instead of broken UI
        showErrorScreen('Unable to load content');
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