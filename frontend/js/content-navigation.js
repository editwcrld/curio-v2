/**
 * Content Navigation - MIT HISTORY SYSTEM
 * ✅ Back = Vorheriges anzeigen (kein API Call!)
 * ✅ Next = IMMER neuer Content (außer nach Back)
 * ✅ History für Quotes UND Art
 * ✅ Prefetch im Hintergrund
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

// ===== INITIALIZATION =====

export function initContentNavigation() {
    document.querySelectorAll('.nav-btn-prev').forEach(btn => {
        btn.addEventListener('click', handlePrevious);
    });
    
    document.querySelectorAll('.nav-btn-next').forEach(btn => {
        btn.addEventListener('click', handleNext);
    });
    
    // Start prefetching
    prefetchQuote();
    prefetchArt();
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
    // ✅ NUR wenn wir HINTER dem Ende sind (nach Back), zeige History
    // Sonst IMMER neuen Content!
    if (quoteHistoryIndex < quoteHistory.length - 1 && quoteHistoryIndex >= 0) {
        // Wir sind in der History (nach Back) - zeige nächstes aus History
        quoteHistoryIndex++;
        const item = quoteHistory[quoteHistoryIndex];
        
        appState.setQuoteData(item.quote);
        appState.setGradient(item.gradient);
        displayQuote(item.quote, item.gradient);
        updateAllFavoriteButtons();
        return;
    }
    
    // ✅ Am Ende der History oder keine History = IMMER neuer Content!
    
    // Check limits
    if (!canNavigate('quotes')) {
        handleLimitReached('quotes');
        return;
    }
    
    isNavigating = true;
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    // Haben wir Prefetch?
    if (prefetchedQuote) {
        const quote = prefetchedQuote;
        const gradient = getRandomGradient();
        
        prefetchedQuote = null;
        
        // Add to history
        quoteHistory.push({ quote, gradient });
        quoteHistoryIndex = quoteHistory.length - 1;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        displayQuote(quote, gradient);
        
        incrementUsage('quotes');
        updateAllFavoriteButtons();
        
        // Prefetch next
        prefetchQuote();
        
        isNavigating = false;
    } else {
        // Fetch now
        showContentLoading('view-quotes');
        
        try {
            const response = await fetch(`${API_BASE_URL}/quote/fresh`, { headers });
            
            if (!response.ok) throw new Error('Failed to fetch');
            
            const result = await response.json();
            const quote = result.data;
            const gradient = getRandomGradient();
            
            // Add to history
            quoteHistory.push({ quote, gradient });
            quoteHistoryIndex = quoteHistory.length - 1;
            
            appState.setQuoteData(quote);
            appState.setGradient(gradient);
            displayQuote(quote, gradient);
            
            incrementUsage('quotes');
            updateAllFavoriteButtons();
            
            prefetchQuote();
        } catch (error) {
            console.error('Quote fetch error:', error);
        } finally {
            hideContentLoading('view-quotes');
            isNavigating = false;
        }
    }
}

async function prefetchQuote() {
    if (isPrefetchingQuote || prefetchedQuote) return;
    
    isPrefetchingQuote = true;
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { headers });
        
        if (response.ok) {
            const result = await response.json();
            prefetchedQuote = result.data;
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
    // ✅ NUR wenn wir in der History sind (nach Back), zeige nächstes
    if (artHistoryIndex < artHistory.length - 1 && artHistoryIndex >= 0) {
        artHistoryIndex++;
        const art = artHistory[artHistoryIndex];
        
        appState.setArtData(art);
        displayArt(art);
        updateAllFavoriteButtons();
        return;
    }
    
    // ✅ Am Ende = IMMER neuer Content!
    
    // Check limits
    if (!canNavigate('art')) {
        handleLimitReached('art');
        return;
    }
    
    isNavigating = true;
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    if (prefetchedArt) {
        const art = prefetchedArt;
        prefetchedArt = null;
        
        artHistory.push(art);
        artHistoryIndex = artHistory.length - 1;
        
        appState.setArtData(art);
        displayArt(art);
        
        incrementUsage('art');
        updateAllFavoriteButtons();
        
        prefetchArt();
        
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
            
            prefetchArt();
        } catch (error) {
            console.error('Art fetch error:', error);
        } finally {
            hideContentLoading('view-art');
            isNavigating = false;
        }
    }
}

async function prefetchArt() {
    if (isPrefetchingArt || prefetchedArt) return;
    
    isPrefetchingArt = true;
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const response = await fetch(`${API_BASE_URL}/art/fresh`, { headers });
        
        if (response.ok) {
            const result = await response.json();
            prefetchedArt = result.data;
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