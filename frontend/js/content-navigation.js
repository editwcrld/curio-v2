/**
 * Content Navigation Module - PRODUCTION VERSION
 * Handles back/next navigation with REAL Backend API
 * ✅ NO DUMMY DATA - Always from Backend!
 */

import { appState } from './state.js';
import { API_BASE_URL, getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons } from './fav-engine.js';
import { showContentLoading, hideContentLoading } from './loading.js';
import { trackNavigationOnBackend, canNavigate, handleLimitReached, incrementUsage } from './limits.js';

let isLoading = false;

/**
 * Initialize navigation controls
 */
export function initContentNavigation() {
    const prevBtns = document.querySelectorAll('.nav-btn-prev');
    const nextBtns = document.querySelectorAll('.nav-btn-next');
    
    prevBtns.forEach(btn => {
        btn.addEventListener('click', handlePrevious);
    });
    
    nextBtns.forEach(btn => {
        btn.addEventListener('click', handleNext);
    });
}

/**
 * Handle previous button click
 */
export function handlePrevious() {
    if (isLoading) return;
    
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        loadNextArt(); // Previous = Next (random anyway)
    } else if (currentView === 'quotes') {
        loadNextQuote(); // Previous = Next (random anyway)
    }
}

/**
 * Handle next button click
 */
export function handleNext() {
    if (isLoading) return;
    
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        loadNextArt();
    } else if (currentView === 'quotes') {
        loadNextQuote();
    }
}

/**
 * Load next art (from Backend)
 */
async function loadNextArt() {
    if (isLoading) return;
    
    // Check limits first
    if (!canNavigate('art')) {
        handleLimitReached('art');
        return;
    }
    
    isLoading = true;
    showContentLoading('view-art');
    
    try {
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/art/next`, {
            headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load art`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        appState.setArtData(data);
        displayArt(data);
        
        // Track navigation
        trackNavigationOnBackend('art');
        
        await updateAllFavoriteButtons();
        
        hideContentLoading('view-art');
    } catch (error) {
        console.error('Error loading art:', error);
        hideContentLoading('view-art');
        
        // Show error
        appState.setArtData({
            id: 'error',
            title: 'Fehler beim Laden',
            artist: 'Bitte versuche es erneut',
            imageUrl: 'https://via.placeholder.com/800x600?text=Error',
            description: 'Kunstwerk konnte nicht geladen werden.'
        });
    } finally {
        isLoading = false;
    }
}

/**
 * Load next quote (from Backend)
 */
async function loadNextQuote() {
    if (isLoading) return;
    
    // Check limits first
    if (!canNavigate('quotes')) {
        handleLimitReached('quotes');
        return;
    }
    
    isLoading = true;
    showContentLoading('view-quotes');
    
    try {
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/quote/next`, {
            headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load quote`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        const newGradient = getRandomGradient();
        
        appState.setQuoteData(data);
        appState.setGradient(newGradient);
        displayQuote(data, newGradient);
        
        // Track navigation
        trackNavigationOnBackend('quotes');
        
        await updateAllFavoriteButtons();
        
        hideContentLoading('view-quotes');
    } catch (error) {
        console.error('Error loading quote:', error);
        hideContentLoading('view-quotes');
        
        // Show error
        const errorQuote = {
            id: 'error',
            text: 'Zitat konnte nicht geladen werden',
            author: 'Fehler',
            backgroundInfo: 'Bitte lade die Seite neu oder versuche es später erneut.'
        };
        
        appState.setQuoteData(errorQuote);
        displayQuote(errorQuote, getRandomGradient());
    } finally {
        isLoading = false;
    }
}