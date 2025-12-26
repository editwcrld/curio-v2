import { API_BASE_URL, getRandomGradient } from './config.js';
import { appState } from './state.js';
import { getRandomQuote } from './dummy-data.js';

/**
 * Quote Engine Module
 * Handles fetching and displaying daily quotes
 */

export async function loadDailyQuote() {
    try {
        const response = await fetch(`${API_BASE_URL}/daily/quote`);
        
        // Wenn API nicht verfügbar, verwende Dummy-Daten
        if (!response.ok) {
            console.warn('API not available, using dummy data');
            const dummyData = getRandomQuote();
            appState.setQuoteData(dummyData);
            
            // Set random gradient for this quote
            const gradient = getRandomGradient();
            appState.setGradient(gradient);
            
            return dummyData;
        }
        
        const result = await response.json();
        
        // FIXED: Backend wrapped data in { success: true, data: {...} }
        const data = result.data || result;
        
        appState.setQuoteData(data);
        
        // Set random gradient for this quote
        const gradient = getRandomGradient();
        appState.setGradient(gradient);
        
        return data;
    } catch (error) {
        console.warn('Error loading daily quote, using dummy data:', error);
        // Fallback auf Dummy-Daten
        const dummyData = getRandomQuote();
        appState.setQuoteData(dummyData);
        
        // Set random gradient for this quote
        const gradient = getRandomGradient();
        appState.setGradient(gradient);
        
        return dummyData;
    }
}

export function displayQuote(data, gradient) {
    if (!data) return;

    const quoteView = document.getElementById('view-quotes');
    if (!quoteView) return;

    const containerEl = quoteView.querySelector('.quote-container');
    const textEl = quoteView.querySelector('.quote-text');
    const authorEl = quoteView.querySelector('.quote-author');
    const titleEl = quoteView.querySelector('.info-title');
    const contentEl = quoteView.querySelector('.info-content p');

    if (containerEl && gradient) {
        containerEl.style.background = gradient;
    }
    if (textEl) textEl.textContent = data.text;
    if (authorEl) authorEl.textContent = data.author;
    if (titleEl) titleEl.textContent = data.author;
    if (contentEl) contentEl.textContent = data.backgroundInfo;
}

export function initQuoteView() {
    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.currentQuoteData) {
            displayQuote(state.currentQuoteData, state.currentGradient);
        }
    });
}