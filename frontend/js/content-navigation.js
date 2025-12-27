/**
 * Content Navigation
 * ✅ Back = Vorheriges anzeigen (kein API Call!)
 * ✅ Next = Neuer Content (schließt Favorites aus!)
 * ✅ ROBUSTER Prefetch - kein Endlos-Loop bei Fehlern
 * ✅ Timeout und Retry-Limits
 */

import { appState } from './state.js';
import { API_BASE_URL, getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons, getFavoriteIds } from './fav-engine.js';
import { showContentLoading, hideContentLoading } from './loading.js';
import { canNavigate, handleLimitReached, incrementUsage } from './limits.js';

// ===== HISTORY SYSTEM =====
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

// ===== PREFETCH CONFIG =====
const PREFETCH_DELAY_MS = 3000;
const MAX_PREFETCH_RETRIES = 2;
let quotePrefetchRetries = 0;
let artPrefetchRetries = 0;

// ===== INITIALIZATION =====

export function initContentNavigation() {
    document.querySelectorAll('.nav-btn-prev').forEach(btn => {
        btn.addEventListener('click', handlePrevious);
    });
    
    document.querySelectorAll('.nav-btn-next').forEach(btn => {
        btn.addEventListener('click', handleNext);
    });
    
    // ✅ Prefetch NUR wenn eingeloggt - nach Delay
    if (isLoggedIn()) {
        setTimeout(() => {
            console.log('🔄 Starting initial prefetch...');
            prefetchQuote();
            prefetchArt();
        }, PREFETCH_DELAY_MS);
    }
}

// ===== HELPER =====

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
    
    if (view === 'art') {
        goBackArt();
    } else if (view === 'quotes') {
        goBackQuote();
    }
}

export function handleNext() {
    if (isNavigating) return;
    
    const view = appState.currentView;
    
    if (view === 'art') {
        goNextArt();
    } else if (view === 'quotes') {
        goNextQuote();
    }
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
    // Wenn wir in der History sind, zeige nächstes aus History
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
    
    // Check if prefetch is valid (not a favorite)
    if (prefetchedQuote && isLoggedIn()) {
        const favoriteIds = getFavoriteIds('quotes');
        if (favoriteIds.includes(prefetchedQuote.id)) {
            console.log('⚠️ Prefetched quote is a favorite, discarding');
            prefetchedQuote = null;
        }
    }
    
    // Haben wir gültigen Prefetch?
    if (prefetchedQuote && isLoggedIn()) {
        const quote = prefetchedQuote;
        const gradient = getRandomGradient();
        
        prefetchedQuote = null;
        quotePrefetchRetries = 0; // Reset retries
        
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // Prefetch next
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
        let quote = result.data;
        
        // Check if quote is a favorite
        const favoriteIds = getFavoriteIds('quotes');
        if (favoriteIds.includes(quote.id)) {
            console.log('⚠️ Got favorite quote, using anyway (no infinite retry)');
        }
        
        const gradient = getRandomGradient();
        
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // Prefetch wenn eingeloggt
        if (isLoggedIn()) {
            setTimeout(() => prefetchQuote(), PREFETCH_DELAY_MS);
        }
    } catch (error) {
        console.error('Quote navigation error:', error);
        if (window.showToast) {
            window.showToast('Quote konnte nicht geladen werden', 'error');
        }
    } finally {
        hideContentLoading('view-quotes');
        isNavigating = false;
    }
}

// ===== PREFETCH QUOTES =====

async function prefetchQuote() {
    if (!isLoggedIn()) return;
    if (isPrefetchingQuote || prefetchedQuote) return;
    if (quotePrefetchRetries >= MAX_PREFETCH_RETRIES) {
        console.log('⚠️ Quote prefetch max retries reached');
        return;
    }
    
    isPrefetchingQuote = true;
    console.log('🔄 Prefetching quote...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        if (response.ok) {
            const result = await response.json();
            const quote = result.data;
            
            // Check if it's a favorite
            const favoriteIds = getFavoriteIds('quotes');
            if (!favoriteIds.includes(quote.id)) {
                prefetchedQuote = quote;
                quotePrefetchRetries = 0;
                console.log('✅ Quote prefetched:', quote.author);
            } else {
                console.log('⚠️ Prefetched quote is favorite, will retry later');
                quotePrefetchRetries++;
            }
        }
    } catch (error) {
        console.error('Quote prefetch error:', error);
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
    // Wenn wir in der History sind, zeige nächstes
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
    
    // Check if prefetch is valid
    if (prefetchedArt && isLoggedIn()) {
        const favoriteIds = getFavoriteIds('art');
        if (favoriteIds.includes(prefetchedArt.id)) {
            console.log('⚠️ Prefetched art is a favorite, discarding');
            prefetchedArt = null;
        }
    }
    
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
        let art = result.data;
        
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
        console.error('Art navigation error:', error);
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
    if (!isLoggedIn()) return;
    if (isPrefetchingArt || prefetchedArt) return;
    if (artPrefetchRetries >= MAX_PREFETCH_RETRIES) {
        console.log('⚠️ Art prefetch max retries reached');
        return;
    }
    
    isPrefetchingArt = true;
    console.log('🔄 Prefetching art...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/art/fresh`, { 
            headers: getAuthHeaders() 
        });
        
        if (response.ok) {
            const result = await response.json();
            const art = result.data;
            
            // Check if it's a favorite
            const favoriteIds = getFavoriteIds('art');
            if (!favoriteIds.includes(art.id)) {
                prefetchedArt = art;
                artPrefetchRetries = 0;
                console.log('✅ Art prefetched:', art.title);
            } else {
                console.log('⚠️ Prefetched art is favorite, will retry later');
                artPrefetchRetries++;
            }
        } else {
            console.warn('⚠️ Art prefetch response not ok');
            artPrefetchRetries++;
        }
    } catch (error) {
        console.error('Art prefetch error:', error);
        artPrefetchRetries++;
    } finally {
        isPrefetchingArt = false;
    }
}

// ===== ADD INITIAL CONTENT TO HISTORY =====

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