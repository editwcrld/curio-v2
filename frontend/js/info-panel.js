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
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (!isLoggedIn) {
        // Show login required message
        showLoginRequiredMessage();
        return;
    }
    
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

/**
 * Show login required message
 */
function showLoginRequiredMessage() {
    // Create toast message
    const toast = document.createElement('div');
    toast.className = 'auth-toast login-required-toast';
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; margin-right: 8px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>Bitte melde dich an um Favoriten zu speichern</span>
    `;
    toast.style.cursor = 'pointer';
    toast.style.pointerEvents = 'all';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    
    // Add click to open login
    toast.addEventListener('click', () => {
        import('./auth-modal.js').then(module => {
            module.openAuthModal('login');
            toast.remove();
        });
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('visible'), 10);
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}