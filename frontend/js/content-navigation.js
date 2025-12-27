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
import { canNavigate, handleLimitReached, incrementUsage } from './limits.js';

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
    
    if (isLoggedIn()) {
        setTimeout(() => {
            // Only prefetch if user has remaining limits
            if (canNavigate('quotes')) prefetchQuote();
            if (canNavigate('art')) prefetchArt();
        }, PREFETCH_DELAY_MS);
    }
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
    const view = appState.currentView;
    if (view === 'art') goBackArt();
    else if (view === 'quotes') goBackQuote();
}

export function handleNext() {
    if (isNavigating) return;
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
        
        if (isLoggedIn()) {
            setTimeout(() => prefetchQuote(), PREFETCH_DELAY_MS);
        }
    } catch (error) {
        if (window.showToast) {
            window.showToast('Quote konnte nicht geladen werden', 'error');
        }
    } finally {
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
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        const art = result.data;
        
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        if (isLoggedIn()) {
            setTimeout(() => prefetchArt(), PREFETCH_DELAY_MS);
        }
    } catch (error) {
        if (window.showToast) {
            window.showToast('Artwork konnte nicht geladen werden', 'error');
        }
    } finally {
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