/**
 * Content Navigation Module
 * Handles back/next navigation for art and quotes
 * WITH LOADING SYSTEM INTEGRATION
 */

import { DUMMY_ART, DUMMY_QUOTES } from './dummy-data.js';
import { appState } from './state.js';
import { getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons } from './fav-engine.js';
import { showContentLoading, hideContentLoading } from './loading.js';

let isLoading = false;
let currentArtIndex = 0;
let currentQuoteIndex = 0;

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
        loadPreviousArt();
    } else if (currentView === 'quotes') {
        loadPreviousQuote();
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
 * Load next art
 */
async function loadNextArt() {
    if (isLoading) return;
    
    isLoading = true;
    
    // Show loading overlay
    showContentLoading('view-art');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentArtIndex = (currentArtIndex + 1) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    appState.setArtData(newArt);
    displayArt(newArt);
    updateAllFavoriteButtons();
    
    // Hide loading overlay
    hideContentLoading('view-art');
    
    isLoading = false;
}

/**
 * Load previous art
 */
async function loadPreviousArt() {
    if (isLoading) return;
    
    isLoading = true;
    
    // Show loading overlay
    showContentLoading('view-art');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentArtIndex = (currentArtIndex - 1 + DUMMY_ART.length) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    appState.setArtData(newArt);
    displayArt(newArt);
    updateAllFavoriteButtons();
    
    // Hide loading overlay
    hideContentLoading('view-art');
    
    isLoading = false;
}

/**
 * Load next quote
 */
async function loadNextQuote() {
    if (isLoading) return;
    
    isLoading = true;
    
    // Show loading overlay
    showContentLoading('view-quotes');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentQuoteIndex = (currentQuoteIndex + 1) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    appState.setQuoteData(newQuote);
    appState.setGradient(newGradient);
    displayQuote(newQuote, newGradient);
    updateAllFavoriteButtons();
    
    // Hide loading overlay
    hideContentLoading('view-quotes');
    
    isLoading = false;
}

/**
 * Load previous quote
 */
async function loadPreviousQuote() {
    if (isLoading) return;
    
    isLoading = true;
    
    // Show loading overlay
    showContentLoading('view-quotes');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentQuoteIndex = (currentQuoteIndex - 1 + DUMMY_QUOTES.length) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    appState.setQuoteData(newQuote);
    appState.setGradient(newGradient);
    displayQuote(newQuote, newGradient);
    updateAllFavoriteButtons();
    
    // Hide loading overlay
    hideContentLoading('view-quotes');
    
    isLoading = false;
}