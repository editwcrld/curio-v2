/**
 * Quote Engine Module
 * ✅ Backend API
 * ✅ Language Support (DE/EN)
 * ✅ Random Gradient
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
        
        // Set random gradient
        const gradient = getRandomGradient();
        
        appState.setQuoteData(data);
        appState.setGradient(gradient);
        
        // Add to history
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

    // Set gradient
    if (containerEl && gradient) {
        containerEl.style.background = gradient;
    }
    
    // Set quote text
    if (textEl) textEl.textContent = data.text;
    if (authorEl) authorEl.textContent = data.author;
    if (titleEl) titleEl.textContent = data.author;
    
    // ✅ Set description in current language
    if (contentEl) {
        const lang = localStorage.getItem('curio_language') || 'de';
        let description;
        
        if (lang === 'en') {
            description = data.ai_description_en || data.ai_description_de || data.backgroundInfo || '';
        } else {
            description = data.ai_description_de || data.ai_description_en || data.backgroundInfo || '';
        }
        
        contentEl.textContent = description;
    }
}

export function initQuoteView() {
    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.currentQuoteData) {
            displayQuote(state.currentQuoteData, state.currentGradient);
        }
    });
    
    // ✅ Listen for language changes
    window.addEventListener('languageChanged', () => {
        if (appState.currentQuoteData) {
            displayQuote(appState.currentQuoteData, appState.currentGradient);
        }
    });
}