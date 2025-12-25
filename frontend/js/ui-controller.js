import { appState } from './state.js';
import { refreshFavoritesView } from './fav-engine.js';

/**
 * UI Controller Module - Optimiert
 */

export function initNavigation() {
    const navButtons = document.querySelectorAll('#bottom-nav button');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.id.replace('nav-', '');
            switchView(target);
        });
    });
}

export function switchView(viewName) {
    // Update state
    appState.setView(viewName);
    
    // Update navigation buttons
    const navButtons = document.querySelectorAll('#bottom-nav button');
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.id === `nav-${viewName}`);
    });
    
    // Update views
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== `view-${viewName}`);
    });
    
    // Refresh favorites when switching to it
    if (viewName === 'favorites') {
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
            refreshFavoritesView();
        });
    }
}

export function showLoading(show = true) {
    console.log(show ? 'Loading...' : 'Loading complete');
}

export function showError(message) {
    console.error('Error:', message);
}