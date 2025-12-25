import { appState } from './state.js';

/**
 * UI Controller Module
 * Handles navigation, view switching, and UI updates
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
}

export function showLoading(show = true) {
    // Future implementation for loading states
    console.log(show ? 'Loading...' : 'Loading complete');
}

export function showError(message) {
    // Future implementation for error messages
    console.error('Error:', message);
}