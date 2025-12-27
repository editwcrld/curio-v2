/**
 * Content Navigation - MIT HISTORY SYSTEM
 * ✅ Back = Vorheriges anzeigen (kein API Call!)
 * ✅ Next = IMMER neuer Content (außer nach Back)
 * ✅ History für Quotes UND Art
 * ✅ Prefetch im Hintergrund (nutzt /daily = kein Limit)
 * ✅ Navigation nutzt /fresh (wartet auf AI!)
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
    
    // Start prefetching (uses /daily endpoint = no limit consumed)
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
    // ✅ Wenn wir in der History sind (nach Back), zeige nächstes aus History
    if (quoteHistoryIndex < quoteHistory.length - 1 && quoteHistoryIndex >= 0) {
        quoteHistoryIndex++;
        const item = quoteHistory[quoteHistoryIndex];
        
        appState.setQuoteData(item.quote);
        appState.setGradient(item.gradient);
        displayQuote(item.quote, item.gradient);
        updateAllFavoriteButtons();
        return;
    }
    
    // ✅ Am Ende der History = neuer Content!
    
    // Check limits
    if (!canNavigate('quotes')) {
        handleLimitReached('quotes');
        return;
    }
    
    isNavigating = true;
    
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    // ✅ Haben wir Prefetch? (Hat vielleicht kein AI)
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
        
        // ✅ Wenn kein AI, im Hintergrund nachladen
        if (!quote.ai_description_de && !quote.ai_description_en) {
            fetchAIForQuote(quote.id);
        }
    } else {
        // ✅ Kein Prefetch - fetch fresh (WARTET auf AI!)
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
            console.error('Quote navigation error:', error);
        } finally {
            hideContentLoading('view-quotes');
            isNavigating = false;
        }
    }
}

// ===== FETCH AI FOR EXISTING QUOTE =====

async function fetchAIForQuote(quoteId) {
    try {
        // Re-fetch quote to get AI description
        const response = await fetch(`${API_BASE_URL}/daily/quote`);
        if (!response.ok) return;
        
        // The backend will have generated AI by now for the cached quote
        // This is a background update - don't block UI
    } catch (error) {
        // Silent fail
    }
}

// ===== PREFETCH (uses /daily = no limit consumed) =====

async function prefetchQuote() {
    if (isPrefetchingQuote || prefetchedQuote) return;
    
    isPrefetchingQuote = true;
    
    try {
        // ✅ Use /quote/fresh to get AI text included!
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`${API_BASE_URL}/quote/fresh`, { headers });
        
        if (response.ok) {
            const result = await response.json();
            prefetchedQuote = result.data;
            console.log('✅ Quote prefetched with AI:', prefetchedQuote.ai_description_de ? 'yes' : 'no');
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
    // ✅ Wenn wir in der History sind (nach Back), zeige nächstes
    if (artHistoryIndex < artHistory.length - 1 && artHistoryIndex >= 0) {
        artHistoryIndex++;
        const art = artHistory[artHistoryIndex];
        
        appState.setArtData(art);
        displayArt(art);
        updateAllFavoriteButtons();
        return;
    }
    
    // ✅ Am Ende = neuer Content!
    
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
            console.error('Art navigation error:', error);
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