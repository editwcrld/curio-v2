/**
 * Content Navigation
 * ✅ Back = Vorheriges anzeigen (kein API Call!)
 * ✅ Next = Neuer Content
 * ✅ History für Quotes UND Art
 * ✅ Prefetch NUR für eingeloggte User!
 * ✅ Längere Delays für API Schonung
 */

import { appState } from './state.js';
import { API_BASE_URL, getRandomGradient } from './config.js';
import { displayArt } from './art-engine.js';
import { displayQuote } from './quote-engine.js';
import { updateAllFavoriteButtons } from './fav-engine.js';
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

// ===== PREFETCH DELAY (API Schonung) =====
const PREFETCH_DELAY_MS = 3000;  // 3 Sekunden warten vor Prefetch

// ===== INITIALIZATION =====

export function initContentNavigation() {
    document.querySelectorAll('.nav-btn-prev').forEach(btn => {
        btn.addEventListener('click', handlePrevious);
    });
    
    document.querySelectorAll('.nav-btn-next').forEach(btn => {
        btn.addEventListener('click', handleNext);
    });
    
    // ✅ Prefetch NUR wenn eingeloggt!
    if (isLoggedIn()) {
        setTimeout(() => {
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
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    // Haben wir Prefetch?
    if (prefetchedQuote && isLoggedIn()) {
        const quote = prefetchedQuote;
        const gradient = getRandomGradient();
        
        prefetchedQuote = null;
        
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // Prefetch next (mit Delay)
        setTimeout(() => prefetchQuote(), PREFETCH_DELAY_MS);
        
        isNavigating = false;
    } else {
        // Fetch fresh (WARTET auf AI!)
        showContentLoading('view-quotes');
        
        try {
            const response = await fetch(`${API_BASE_URL}/quote/fresh`, { headers });
            
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
            
            // Prefetch nur wenn eingeloggt
            if (isLoggedIn()) {
                setTimeout(() => prefetchQuote(), PREFETCH_DELAY_MS);
            }
        } catch (error) {
            console.error('Quote navigation error:', error);
        } finally {
            hideContentLoading('view-quotes');
            isNavigating = false;
        }
    }
}

// ===== PREFETCH QUOTES (NUR für eingeloggte User!) =====

async function prefetchQuote() {
    // ✅ NICHT prefetchen wenn nicht eingeloggt!
    if (!isLoggedIn()) return;
    if (isPrefetchingQuote || prefetchedQuote) return;
    
    isPrefetchingQuote = true;
    
    try {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { headers });
        
        if (response.ok) {
            const result = await response.json();
            prefetchedQuote = result.data;
            console.log('✅ Quote prefetched');
        }
    } catch (error) {
        console.error('Quote prefetch error:', error);
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
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    if (prefetchedArt && isLoggedIn()) {
        const art = prefetchedArt;
        prefetchedArt = null;
        
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        setTimeout(() => prefetchArt(), PREFETCH_DELAY_MS);
        
        isNavigating = false;
    } else {
        showContentLoading('view-art');
        
        try {
            const response = await fetch(`${API_BASE_URL}/art/fresh`, { headers });
            
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
            console.error('Art navigation error:', error);
        } finally {
            hideContentLoading('view-art');
            isNavigating = false;
        }
    }
}

// ===== PREFETCH ART (NUR für eingeloggte User!) =====

async function prefetchArt() {
    // ✅ NICHT prefetchen wenn nicht eingeloggt!
    if (!isLoggedIn()) return;
    if (isPrefetchingArt || prefetchedArt) return;
    
    isPrefetchingArt = true;
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const response = await fetch(`${API_BASE_URL}/art/fresh`, { headers });
        
        if (response.ok) {
            const result = await response.json();
            prefetchedArt = result.data;
            console.log('✅ Art prefetched');
        }
    } catch (error) {
        // Silent fail
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