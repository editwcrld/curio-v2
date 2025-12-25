/**
 * Content Navigation Module
 * Handles back/next navigation for art and quotes
 */

import { DUMMY_ART, DUMMY_QUOTES } from './dummy-data.js';
import { appState } from './state.js';
import { getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons } from './fav-engine.js';

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
function loadNextArt() {
    isLoading = true;
    setLoadingState(true);
    
    currentArtIndex = (currentArtIndex + 1) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    setTimeout(() => {
        appState.setArtData(newArt);
        displayArt(newArt);
        updateAllFavoriteButtons();
        
        isLoading = false;
        setLoadingState(false);
    }, 300);
}

/**
 * Load previous art
 */
function loadPreviousArt() {
    isLoading = true;
    setLoadingState(true);
    
    currentArtIndex = (currentArtIndex - 1 + DUMMY_ART.length) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    setTimeout(() => {
        appState.setArtData(newArt);
        displayArt(newArt);
        updateAllFavoriteButtons();
        
        isLoading = false;
        setLoadingState(false);
    }, 300);
}

/**
 * Load next quote
 */
function loadNextQuote() {
    isLoading = true;
    setLoadingState(true);
    
    currentQuoteIndex = (currentQuoteIndex + 1) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    setTimeout(() => {
        appState.setQuoteData(newQuote);
        appState.setGradient(newGradient);
        displayQuote(newQuote, newGradient);
        updateAllFavoriteButtons();
        
        isLoading = false;
        setLoadingState(false);
    }, 300);
}

/**
 * Load previous quote
 */
function loadPreviousQuote() {
    isLoading = true;
    setLoadingState(true);
    
    currentQuoteIndex = (currentQuoteIndex - 1 + DUMMY_QUOTES.length) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    setTimeout(() => {
        appState.setQuoteData(newQuote);
        appState.setGradient(newGradient);
        displayQuote(newQuote, newGradient);
        updateAllFavoriteButtons();
        
        isLoading = false;
        setLoadingState(false);
    }, 300);
}

/**
 * Set loading state on buttons
 */
function setLoadingState(loading) {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.toggle('loading', loading);
    });
}