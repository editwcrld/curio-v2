/**
 * UI Controller Module
 * ✅ Tab Navigation
 * ✅ Favorites Refresh
 * ✅ Herz-Status Update bei jedem Tab-Wechsel
 */

import { appState } from './state.js';
import { renderFavorites, updateAllFavoriteButtons } from './fav-engine.js';

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
    
    // ✅ Refresh favorites when switching to favorites tab
    if (viewName === 'favorites') {
        renderFavorites();
    }
    
    // ✅ ALWAYS update heart buttons when switching views!
    setTimeout(() => {
        updateAllFavoriteButtons();
    }, 50);
}

export function showLoading(show = true) {
    console.log(show ? 'Loading...' : 'Loading complete');
}

export function showError(message) {
    console.error('Error:', message);
}