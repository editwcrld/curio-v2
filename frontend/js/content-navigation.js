/**
 * Content Navigation
 * Back/Next mit History, Prefetch, Favorites-Ausschluss
 * 
 * ✅ Erster Next: Zeigt aus Cache (instant)
 * ✅ Im Hintergrund: Holt frischen Content mit ?prefetch=true
 * ✅ Nächster Next: Zeigt prefetched Content (garantiert neu!)
 */

import { appState } from './state.js';
import { API_BASE_URL, getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons, getFavoriteIds } from './fav-engine.js';
import { showContentLoading, hideContentLoading } from './loading.js';
import { canNavigate, handleLimitReached, incrementUsage, syncLimitToMax } from './limits.js';
import { collapseAllInfoSections } from './info-drag-handler.js';

// ===== HISTORY =====
const quoteHistory = [];
const artHistory = [];
let quoteHistoryIndex = -1;
let artHistoryIndex = -1;

// ===== PREFETCH STATE =====
let prefetchedQuote = null;
let prefetchedArt = null;
let isPrefetchingQuote = false;
let isPrefetchingArt = false;
let isNavigating = false;

// ===== CONFIG =====
const PREFETCH_DELAY_MS = 500;  // Start prefetch quickly after display
const MAX_PREFETCH_RETRIES = 2;
let quotePrefetchRetries = 0;
let artPrefetchRetries = 0;

// ===== INIT =====

export function initContentNavigation() {
    document.querySelectorAll('.nav-btn-prev').forEach(btn => {
        btn.addEventListener('click', handlePrevious);
    });
    
    document.querySelectorAll('.nav-btn-next').forEach(btn => {
        btn.addEventListener('click', handleNext);
    });
    
    // ✅ No initial prefetch on page load
    // Prefetch starts AFTER first manual "Next" click
}

// ===== HELPERS =====

function isLoggedIn() {
    return localStorage.getItem('user_logged_in') === 'true' && 
           localStorage.getItem('auth_token');
}

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ===== HANDLERS =====

export function handlePrevious() {
    if (isNavigating) return;
    
    // ✅ Collapse expanded info section on navigation
    collapseAllInfoSections();
    
    const view = appState.currentView;
    if (view === 'art') goBackArt();
    else if (view === 'quotes') goBackQuote();
}

export function handleNext() {
    if (isNavigating) return;
    
    // ✅ Collapse expanded info section on navigation
    collapseAllInfoSections();
    
    const view = appState.currentView;
    if (view === 'art') goNextArt();
    else if (view === 'quotes') goNextQuote();
}

// ===== QUOTE NAVIGATION =====

function goBackQuote() {
    if (quoteHistoryIndex > 0) {
        quoteHistoryIndex--;
        const item = quoteHistory[quoteHistoryIndex];
        appState.setQuoteData(item.quote);
        appState.setGradient(item.gradient);
        displayQuote(item.quote, item.gradient);
        updateAllFavoriteButtons();
    }
}

async function goNextQuote() {
    // Check if we can go forward in history
    if (quoteHistoryIndex < quoteHistory.length - 1 && quoteHistoryIndex >= 0) {
        quoteHistoryIndex++;
        const item = quoteHistory[quoteHistoryIndex];
        appState.setQuoteData(item.quote);
        appState.setGradient(item.gradient);
        displayQuote(item.quote, item.gradient);
        updateAllFavoriteButtons();
        return;
    }
    
    // Check limits
    if (!canNavigate('quotes')) {
        handleLimitReached('quotes');
        return;
    }
    
    isNavigating = true;
    
    // =====================================================
    // OPTION 1: Use prefetched content (instant, guaranteed fresh!)
    // =====================================================
    if (prefetchedQuote) {
        const quote = prefetchedQuote;
        const gradient = getRandomGradient();
        
        // Clear prefetch
        prefetchedQuote = null;
        quotePrefetchRetries = 0;
        
        // Add to history
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        // Display immediately
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        isNavigating = false;
        
        // ✅ Start prefetching next fresh content
        if (isLoggedIn() && canNavigate('quotes')) {
            setTimeout(() => prefetchQuote(), PREFETCH_DELAY_MS);
        }
        return;
    }
    
    // =====================================================
    // OPTION 2: No prefetch available - fetch from cache (instant)
    // =====================================================
    showContentLoading('view-quotes');
    
    try {
        // Fetch from cache (instant response)
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        // Handle 429 - Limit reached
        if (response.status === 429) {
            hideContentLoading('view-quotes');
            isNavigating = false;
            syncLimitToMax('quotes');
            handleLimitReached('quotes');
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        const quote = result.data;
        const gradient = getRandomGradient();
        
        // Add to history
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        // Display
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // Hide loading and end navigation
        hideContentLoading('view-quotes');
        isNavigating = false;
        
        // ✅ Start prefetching fresh content for next click
        if (isLoggedIn() && canNavigate('quotes')) {
            setTimeout(() => prefetchQuote(), PREFETCH_DELAY_MS);
        }
        
    } catch (error) {
        if (window.showToast) {
            window.showToast('Quote konnte nicht geladen werden', 'error');
        }
        hideContentLoading('view-quotes');
        isNavigating = false;
    }
}

// ===== PREFETCH QUOTE (with ?prefetch=true for fresh content) =====

async function prefetchQuote() {
    if (!isLoggedIn() || isPrefetchingQuote || prefetchedQuote) return;
    if (quotePrefetchRetries >= MAX_PREFETCH_RETRIES) return;
    if (!canNavigate('quotes')) return;
    
    isPrefetchingQuote = true;
    console.log('🔄 Prefetching fresh quote...');
    
    try {
        // ✅ Use ?prefetch=true to get FRESH content from API
        const response = await fetch(`${API_BASE_URL}/quote/fresh?prefetch=true`, { 
            headers: getAuthHeaders() 
        });
        
        if (response.status === 429) {
            syncLimitToMax('quotes');
            quotePrefetchRetries = MAX_PREFETCH_RETRIES;
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            const quote = result.data;
            const favoriteIds = getFavoriteIds('quotes');
            
            // Double-check it's not a favorite
            if (!favoriteIds.includes(quote.id)) {
                prefetchedQuote = quote;
                quotePrefetchRetries = 0;
                console.log('✅ Quote prefetched:', quote.text.substring(0, 30) + '...');
            } else {
                console.log('⚠️ Prefetched quote is favorite, discarding');
                quotePrefetchRetries++;
            }
        } else {
            quotePrefetchRetries++;
        }
    } catch (error) {
        console.error('❌ Quote prefetch failed:', error.message);
        quotePrefetchRetries++;
    } finally {
        isPrefetchingQuote = false;
    }
}

// ===== ART NAVIGATION =====

function goBackArt() {
    if (artHistoryIndex > 0) {
        artHistoryIndex--;
        const art = artHistory[artHistoryIndex];
        appState.setArtData(art);
        displayArt(art);
        updateAllFavoriteButtons();
    }
}

async function goNextArt() {
    // Check if we can go forward in history
    if (artHistoryIndex < artHistory.length - 1 && artHistoryIndex >= 0) {
        artHistoryIndex++;
        const art = artHistory[artHistoryIndex];
        appState.setArtData(art);
        displayArt(art);
        updateAllFavoriteButtons();
        return;
    }
    
    // Check limits
    if (!canNavigate('art')) {
        handleLimitReached('art');
        return;
    }
    
    isNavigating = true;
    
    // =====================================================
    // OPTION 1: Use prefetched content (instant, guaranteed fresh!)
    // =====================================================
    if (prefetchedArt) {
        const art = prefetchedArt;
        
        // Clear prefetch
        prefetchedArt = null;
        artPrefetchRetries = 0;
        
        // Add to history
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        // Display immediately
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        isNavigating = false;
        
        // ✅ Start prefetching next fresh content
        if (isLoggedIn() && canNavigate('art')) {
            setTimeout(() => prefetchArt(), PREFETCH_DELAY_MS);
        }
        return;
    }
    
    // =====================================================
    // OPTION 2: No prefetch available - fetch from cache (instant)
    // =====================================================
    showContentLoading('view-art');
    
    try {
        // Fetch from cache (instant response)
        const response = await fetch(`${API_BASE_URL}/art/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        // Handle 429 - Limit reached
        if (response.status === 429) {
            hideContentLoading('view-art');
            isNavigating = false;
            syncLimitToMax('art');
            handleLimitReached('art');
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        const art = result.data;
        
        // Add to history
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        // Display
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        // Hide loading and end navigation
        hideContentLoading('view-art');
        isNavigating = false;
        
        // ✅ Start prefetching fresh content for next click
        if (isLoggedIn() && canNavigate('art')) {
            setTimeout(() => prefetchArt(), PREFETCH_DELAY_MS);
        }
        
    } catch (error) {
        if (window.showToast) {
            window.showToast('Artwork konnte nicht geladen werden', 'error');
        }
        hideContentLoading('view-art');
        isNavigating = false;
    }
}

// ===== PREFETCH ART (with ?prefetch=true for fresh content) =====

async function prefetchArt() {
    if (!isLoggedIn() || isPrefetchingArt || prefetchedArt) return;
    if (artPrefetchRetries >= MAX_PREFETCH_RETRIES) return;
    if (!canNavigate('art')) return;
    
    isPrefetchingArt = true;
    console.log('🔄 Prefetching fresh artwork...');
    
    try {
        // ✅ Use ?prefetch=true to get FRESH content from API
        const response = await fetch(`${API_BASE_URL}/art/fresh?prefetch=true`, { 
            headers: getAuthHeaders() 
        });
        
        if (response.status === 429) {
            syncLimitToMax('art');
            artPrefetchRetries = MAX_PREFETCH_RETRIES;
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            const art = result.data;
            const favoriteIds = getFavoriteIds('art');
            
            // Double-check it's not a favorite
            if (!favoriteIds.includes(art.id)) {
                prefetchedArt = art;
                artPrefetchRetries = 0;
                console.log('✅ Art prefetched:', art.title);
            } else {
                console.log('⚠️ Prefetched art is favorite, discarding');
                artPrefetchRetries++;
            }
        } else {
            artPrefetchRetries++;
        }
    } catch (error) {
        console.error('❌ Art prefetch failed:', error.message);
        artPrefetchRetries++;
    } finally {
        isPrefetchingArt = false;
    }
}

// ===== ADD TO HISTORY =====

export function addToQuoteHistory(quote, gradient) {
    if (!quoteHistory.find(h => h.quote.id === quote.id)) {
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
    }
}

export function addToArtHistory(art) {
    if (!artHistory.find(a => a.id === art.id)) {
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
    }
}

// ===== EXPORTS =====

export { goNextQuote as loadNextQuote, goNextArt as loadNextArt };