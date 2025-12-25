/**
 * Content Navigation Module - DEBUG VERSION
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
    console.log('🔧 Initializing content navigation...');
    
    const prevBtns = document.querySelectorAll('.nav-btn-prev');
    const nextBtns = document.querySelectorAll('.nav-btn-next');
    
    console.log(`Found ${prevBtns.length} previous buttons`);
    console.log(`Found ${nextBtns.length} next buttons`);
    
    prevBtns.forEach((btn, index) => {
        console.log(`Attaching previous handler to button ${index}`);
        btn.addEventListener('click', (e) => {
            console.log('🖱️ Previous button CLICKED', e);
            handlePrevious();
        });
    });
    
    nextBtns.forEach((btn, index) => {
        console.log(`Attaching next handler to button ${index}`);
        btn.addEventListener('click', (e) => {
            console.log('🖱️ Next button CLICKED', e);
            handleNext();
        });
    });
    
    console.log('✅ Content navigation initialized');
    console.log(`📊 Available: ${DUMMY_ART.length} artworks, ${DUMMY_QUOTES.length} quotes`);
}

/**
 * Handle previous button click
 */
export function handlePrevious() {
    console.log('⬅️ handlePrevious called');
    console.log(`Current view: ${appState.currentView}`);
    console.log(`Is loading: ${isLoading}`);
    
    if (isLoading) {
        console.log('⚠️ Already loading, ignoring click');
        return;
    }
    
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        console.log('🎨 Calling loadPreviousArt');
        loadPreviousArt();
    } else if (currentView === 'quotes') {
        console.log('💬 Calling loadPreviousQuote');
        loadPreviousQuote();
    } else {
        console.log(`⚠️ Unknown view: ${currentView}`);
    }
}

/**
 * Handle next button click
 */
export function handleNext() {
    console.log('➡️ handleNext called');
    console.log(`Current view: ${appState.currentView}`);
    console.log(`Is loading: ${isLoading}`);
    
    if (isLoading) {
        console.log('⚠️ Already loading, ignoring click');
        return;
    }
    
    const currentView = appState.currentView;
    
    if (currentView === 'art') {
        console.log('🎨 Calling loadNextArt');
        loadNextArt();
    } else if (currentView === 'quotes') {
        console.log('💬 Calling loadNextQuote');
        loadNextQuote();
    } else {
        console.log(`⚠️ Unknown view: ${currentView}`);
    }
}

/**
 * Load next art
 */
function loadNextArt() {
    console.log('🎨 loadNextArt START');
    console.log(`Current index: ${currentArtIndex}`);
    
    isLoading = true;
    setLoadingState(true);
    
    // Increment index with wrap-around
    const oldIndex = currentArtIndex;
    currentArtIndex = (currentArtIndex + 1) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    console.log(`Index changed: ${oldIndex} → ${currentArtIndex}`);
    console.log(`New art:`, newArt);
    console.log(`Title: ${newArt.title}`);
    console.log(`Artist: ${newArt.artist}`);
    
    setTimeout(() => {
        console.log('⏰ Timeout executed, updating display...');
        
        // Update state
        appState.setArtData(newArt);
        console.log('✅ State updated');
        
        // Force display update
        displayArt(newArt);
        console.log('✅ Display called');
        
        // Update favorite buttons
        updateAllFavoriteButtons();
        console.log('✅ Favorite buttons updated');
        
        isLoading = false;
        setLoadingState(false);
        console.log('🎨 loadNextArt COMPLETE');
    }, 300);
}

/**
 * Load previous art
 */
function loadPreviousArt() {
    console.log('🎨 loadPreviousArt START');
    console.log(`Current index: ${currentArtIndex}`);
    
    isLoading = true;
    setLoadingState(true);
    
    // Decrement index with wrap-around
    const oldIndex = currentArtIndex;
    currentArtIndex = (currentArtIndex - 1 + DUMMY_ART.length) % DUMMY_ART.length;
    const newArt = DUMMY_ART[currentArtIndex];
    
    console.log(`Index changed: ${oldIndex} → ${currentArtIndex}`);
    console.log(`New art:`, newArt);
    
    setTimeout(() => {
        console.log('⏰ Timeout executed, updating display...');
        
        // Update state
        appState.setArtData(newArt);
        
        // Force display update
        displayArt(newArt);
        
        // Update favorite buttons
        updateAllFavoriteButtons();
        
        isLoading = false;
        setLoadingState(false);
        console.log('🎨 loadPreviousArt COMPLETE');
    }, 300);
}

/**
 * Load next quote
 */
function loadNextQuote() {
    console.log('💬 loadNextQuote START');
    console.log(`Current index: ${currentQuoteIndex}`);
    
    isLoading = true;
    setLoadingState(true);
    
    // Increment index with wrap-around
    const oldIndex = currentQuoteIndex;
    currentQuoteIndex = (currentQuoteIndex + 1) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    console.log(`Index changed: ${oldIndex} → ${currentQuoteIndex}`);
    console.log(`New quote:`, newQuote);
    console.log(`Author: ${newQuote.author}`);
    console.log(`Gradient: ${newGradient}`);
    
    setTimeout(() => {
        console.log('⏰ Timeout executed, updating display...');
        
        // Update state
        appState.setQuoteData(newQuote);
        appState.setGradient(newGradient);
        console.log('✅ State updated');
        
        // Force display update
        displayQuote(newQuote, newGradient);
        console.log('✅ Display called');
        
        // Update favorite buttons
        updateAllFavoriteButtons();
        console.log('✅ Favorite buttons updated');
        
        isLoading = false;
        setLoadingState(false);
        console.log('💬 loadNextQuote COMPLETE');
    }, 300);
}

/**
 * Load previous quote
 */
function loadPreviousQuote() {
    console.log('💬 loadPreviousQuote START');
    console.log(`Current index: ${currentQuoteIndex}`);
    
    isLoading = true;
    setLoadingState(true);
    
    // Decrement index with wrap-around
    const oldIndex = currentQuoteIndex;
    currentQuoteIndex = (currentQuoteIndex - 1 + DUMMY_QUOTES.length) % DUMMY_QUOTES.length;
    const newQuote = DUMMY_QUOTES[currentQuoteIndex];
    const newGradient = getRandomGradient();
    
    console.log(`Index changed: ${oldIndex} → ${currentQuoteIndex}`);
    console.log(`New quote:`, newQuote);
    
    setTimeout(() => {
        console.log('⏰ Timeout executed, updating display...');
        
        // Update state
        appState.setQuoteData(newQuote);
        appState.setGradient(newGradient);
        
        // Force display update
        displayQuote(newQuote, newGradient);
        
        // Update favorite buttons
        updateAllFavoriteButtons();
        
        isLoading = false;
        setLoadingState(false);
        console.log('💬 loadPreviousQuote COMPLETE');
    }, 300);
}

/**
 * Set loading state on buttons
 */
function setLoadingState(loading) {
    console.log(`⚙️ Setting loading state: ${loading}`);
    const navBtns = document.querySelectorAll('.nav-btn');
    console.log(`Found ${navBtns.length} nav buttons to update`);
    
    navBtns.forEach(btn => {
        btn.classList.toggle('loading', loading);
    });
}