/**
 * Content Navigation Module
 * Handles back/next navigation for art and quotes
 * WITH LIMITS INTEGRATION
 */

import { DUMMY_ART, DUMMY_QUOTES } from './dummy-data.js';
import { appState } from './state.js';
import { getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons } from './fav-engine.js';
import { showContentLoading, hideContentLoading } from './loading.js';
import { canNavigate, incrementUsage, handleLimitReached } from './limits.js';

let isLoading = false;
let currentArtIndex = 0;
let currentQuoteIndex = 0;

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

export function handlePrevious() {
    if (isLoading) return;
    
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        loadPreviousArt();
    } else if (currentView === 'quotes') {
        loadPreviousQuote();
    }
}

export function handleNext() {
    if (isLoading) return;
    
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        loadNextArt();
    } else if (currentView === 'quotes') {
        loadNextQuote();
    }
}

async function loadNextArt() {
    if (isLoading) return;
    
    // ✅ CHECK LIMIT BEFORE NAVIGATING
    if (!canNavigate('art')) {
        console.log('🚫 Art limit reached!');
        handleLimitReached('art');
        return;
    }
    
    isLoading = true;
    showContentLoading('view-art');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentArtIndex = (currentArtIndex + 1) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    appState.setArtData(newArt);
    displayArt(newArt);
    updateAllFavoriteButtons();
    
    // ✅ INCREMENT USAGE AFTER SUCCESSFUL NAVIGATION
    incrementUsage('art');
    
    hideContentLoading('view-art');
    isLoading = false;
}

async function loadPreviousArt() {
    if (isLoading) return;
    
    // ✅ CHECK LIMIT BEFORE NAVIGATING
    if (!canNavigate('art')) {
        console.log('🚫 Art limit reached!');
        handleLimitReached('art');
        return;
    }
    
    isLoading = true;
    showContentLoading('view-art');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentArtIndex = (currentArtIndex - 1 + DUMMY_ART.length) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    appState.setArtData(newArt);
    displayArt(newArt);
    updateAllFavoriteButtons();
    
    // ✅ INCREMENT USAGE AFTER SUCCESSFUL NAVIGATION
    incrementUsage('art');
    
    hideContentLoading('view-art');
    isLoading = false;
}

async function loadNextQuote() {
    if (isLoading) return;
    
    // ✅ CHECK LIMIT BEFORE NAVIGATING
    if (!canNavigate('quotes')) {
        console.log('🚫 Quotes limit reached!');
        handleLimitReached('quotes');
        return;
    }
    
    isLoading = true;
    showContentLoading('view-quotes');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentQuoteIndex = (currentQuoteIndex + 1) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    appState.setQuoteData(newQuote);
    appState.setGradient(newGradient);
    displayQuote(newQuote, newGradient);
    updateAllFavoriteButtons();
    
    // ✅ INCREMENT USAGE AFTER SUCCESSFUL NAVIGATION
    incrementUsage('quotes');
    
    hideContentLoading('view-quotes');
    isLoading = false;
}

async function loadPreviousQuote() {
    if (isLoading) return;
    
    // ✅ CHECK LIMIT BEFORE NAVIGATING
    if (!canNavigate('quotes')) {
        console.log('🚫 Quotes limit reached!');
        handleLimitReached('quotes');
        return;
    }
    
    isLoading = true;
    showContentLoading('view-quotes');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentQuoteIndex = (currentQuoteIndex - 1 + DUMMY_QUOTES.length) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    appState.setQuoteData(newQuote);
    appState.setGradient(newGradient);
    displayQuote(newQuote, newGradient);
    updateAllFavoriteButtons();
    
    // ✅ INCREMENT USAGE AFTER SUCCESSFUL NAVIGATION
    incrementUsage('quotes');
    
    hideContentLoading('view-quotes');
    isLoading = false;
}