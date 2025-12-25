import { toggleFavorite, updateFavoriteButtonState as updateFavButtonState } from './fav-engine.js';
import { appState } from './state.js';

/**
 * Info Panel Module - Optimiert für sofortige Reaktion
 */

export function initInfoPanels() {
    const infoSections = document.querySelectorAll('.info-section');
    
    infoSections.forEach(section => {
        section.addEventListener('click', (e) => {
            // Don't expand when clicking favorite button
            if (!e.target.closest('.fav-btn')) {
                section.classList.toggle('expanded');
            }
        });
    });
}

export function initFavoriteButtons() {
    const favButtons = document.querySelectorAll('.fav-btn');
    
    favButtons.forEach(btn => {
        // Remove any existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add optimized click handler
        newBtn.addEventListener('click', handleFavoriteClick, { passive: false });
    });
}

/**
 * Optimized favorite click handler
 */
function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
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
    
    // Then update storage (async, doesn't block UI)
    requestAnimationFrame(() => {
        toggleFavorite(data, viewType);
    });
}