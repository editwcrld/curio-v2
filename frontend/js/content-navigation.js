/**
 * Content Navigation
 * Back/Next mit History, Prefetch, Favorites-Ausschluss
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
const PREFETCH_DELAY_MS = 3000;
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
    
    // ✅ FIX: No initial prefetch on page load
    // Prefetch only starts AFTER first manual "Next" click
    // This saves API calls and limits on page refresh
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
    if (quoteHistoryIndex < quoteHistory.length - 1 && quoteHistoryIndex >= 0) {
        quoteHistoryIndex++;
        const item = quoteHistory[quoteHistoryIndex];
        appState.setQuoteData(item.quote);
        appState.setGradient(item.gradient);
        displayQuote(item.quote, item.gradient);
        updateAllFavoriteButtons();
        return;
    }
    
    if (!canNavigate('quotes')) {
        handleLimitReached('quotes');
        return;
    }
    
    isNavigating = true;
    
    // Check prefetch validity
    if (prefetchedQuote && isLoggedIn()) {
        const favoriteIds = getFavoriteIds('quotes');
        if (favoriteIds.includes(prefetchedQuote.id)) {
            prefetchedQuote = null;
        }
    }
    
    // Use prefetch if available
    if (prefetchedQuote && isLoggedIn()) {
        const quote = prefetchedQuote;
        const gradient = getRandomGradient();
        
        prefetchedQuote = null;
        quotePrefetchRetries = 0;
        
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // ✅ Prefetch next quote (only quotes, not art)
        setTimeout(() => prefetchQuote(), 500);
        isNavigating = false;
        return;
    }
    
    // Fetch fresh
    showContentLoading('view-quotes');
    
    try {
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        // Handle 429 - Limit reached
        if (response.status === 429) {
            hideContentLoading('view-quotes');
            isNavigating = false;
            // Sync frontend limit to max (backend says limit reached)
            syncLimitToMax('quotes');
            handleLimitReached('quotes');
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        const quote = result.data;
        const gradient = getRandomGradient();
        
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // ✅ WICHTIG: Loading verstecken und Navigation beenden BEVOR Prefetch
        hideContentLoading('view-quotes');
        isNavigating = false;
        
        // ✅ Prefetch next quote im Hintergrund (non-blocking)
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

// ===== PREFETCH QUOTE =====

async function prefetchQuote() {
    if (!isLoggedIn() || isPrefetchingQuote || prefetchedQuote) return;
    if (quotePrefetchRetries >= MAX_PREFETCH_RETRIES) return;
    // Don't prefetch if limit already reached
    if (!canNavigate('quotes')) return;
    
    isPrefetchingQuote = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        if (response.status === 429) {
            // Limit reached - sync and stop prefetching
            syncLimitToMax('quotes');
            quotePrefetchRetries = MAX_PREFETCH_RETRIES; // Stop further attempts
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            const quote = result.data;
            const favoriteIds = getFavoriteIds('quotes');
            
            if (!favoriteIds.includes(quote.id)) {
                prefetchedQuote = quote;
                quotePrefetchRetries = 0;
            } else {
                quotePrefetchRetries++;
            }
        }
    } catch (error) {
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
    if (artHistoryIndex < artHistory.length - 1 && artHistoryIndex >= 0) {
        artHistoryIndex++;
        const art = artHistory[artHistoryIndex];
        appState.setArtData(art);
        displayArt(art);
        updateAllFavoriteButtons();
        return;
    }
    
    if (!canNavigate('art')) {
        handleLimitReached('art');
        return;
    }
    
    isNavigating = true;
    
    // Check prefetch validity
    if (prefetchedArt && isLoggedIn()) {
        const favoriteIds = getFavoriteIds('art');
        if (favoriteIds.includes(prefetchedArt.id)) {
            prefetchedArt = null;
        }
    }
    
    // Use prefetch if available
    if (prefetchedArt && isLoggedIn()) {
        const art = prefetchedArt;
        prefetchedArt = null;
        artPrefetchRetries = 0;
        
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        // ✅ Prefetch next art (only art, not quotes)
        setTimeout(() => prefetchArt(), 500);
        isNavigating = false;
        return;
    }
    
    // Fetch fresh
    showContentLoading('view-art');
    
    try {
        const response = await fetch(`${API_BASE_URL}/art/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        // Handle 429 - Limit reached
        if (response.status === 429) {
            hideContentLoading('view-art');
            isNavigating = false;
            // Sync frontend limit to max (backend says limit reached)
            syncLimitToMax('art');
            handleLimitReached('art');
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        const art = result.data;
        
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        // ✅ WICHTIG: Loading verstecken und Navigation beenden BEVOR Prefetch
        hideContentLoading('view-art');
        isNavigating = false;
        
        // ✅ Prefetch next art im Hintergrund (non-blocking)
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

// ===== PREFETCH ART =====

async function prefetchArt() {
    if (!isLoggedIn() || isPrefetchingArt || prefetchedArt) return;
    if (artPrefetchRetries >= MAX_PREFETCH_RETRIES) return;
    // Don't prefetch if limit already reached
    if (!canNavigate('art')) return;
    
    isPrefetchingArt = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/art/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        if (response.status === 429) {
            // Limit reached - sync and stop prefetching
            syncLimitToMax('art');
            artPrefetchRetries = MAX_PREFETCH_RETRIES; // Stop further attempts
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            const art = result.data;
            const favoriteIds = getFavoriteIds('art');
            
            if (!favoriteIds.includes(art.id)) {
                prefetchedArt = art;
                artPrefetchRetries = 0;
            } else {
                artPrefetchRetries++;
            }
        } else {
            artPrefetchRetries++;
        }
    } catch (error) {
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