/**
 * Quote Engine Module
 * ✅ Loads from Backend
 * ✅ Adds initial quote to history
 */

import { API_BASE_URL, getRandomGradient } from './config.js';
import { appState } from './state.js';
import { addToQuoteHistory } from './content-navigation.js';

export async function loadDailyQuote() {
    try {
        const response = await fetch(`${API_BASE_URL}/daily/quote`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load quote`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        const gradient = getRandomGradient();
        
        appState.setQuoteData(data);
        appState.setGradient(gradient);
        
        // ✅ Add to history!
        addToQuoteHistory(data, gradient);
        
        return data;
    } catch (error) {
        console.error('Error loading daily quote:', error);
        
        appState.setQuoteData({
            id: 'error',
            text: 'Quotes konnten nicht geladen werden',
            author: 'Fehler',
            backgroundInfo: 'Bitte lade die Seite neu.'
        });
        
        throw error;
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
    if (contentEl) contentEl.textContent = data.backgroundInfo || '';
}

export function initQuoteView() {
    appState.subscribe((state) => {
        if (state.currentQuoteData) {
            displayQuote(state.currentQuoteData, state.currentGradient);
        }
    });
}