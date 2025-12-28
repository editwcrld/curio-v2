/**
 * Quote Engine Module
 * ✅ Nutzt /daily/today für fixes Tages-Content
 * ✅ Language Support (DE/EN)
 * ✅ Attribution Display für API Compliance
 * ✅ NEW: Proper paragraph display with newlines
 */

import { API_BASE_URL, getRandomGradient } from './config.js';
import { appState } from './state.js';
import { addToQuoteHistory } from './content-navigation.js';
import { updateQuoteAttribution } from './info-panel.js';

/**
 * ✅ Escape HTML to prevent XSS when using innerHTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cache für Tages-Content
let dailyQuoteCache = null;
let dailyQuoteDate = null;
let dailyQuoteGradient = null;

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

export async function loadDailyQuote() {
    try {
        const today = getTodayDate();
        
        // Return cached if same day
        if (dailyQuoteCache && dailyQuoteDate === today) {
            appState.setQuoteData(dailyQuoteCache);
            appState.setGradient(dailyQuoteGradient);
            addToQuoteHistory(dailyQuoteCache, dailyQuoteGradient);
            return dailyQuoteCache;
        }
        
        // Fetch from /daily/today (fixes Tages-Content)
        const response = await fetch(`${API_BASE_URL}/daily/today`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load daily content`);
        }
        
        const result = await response.json();
        const quote = result.data?.quote || result.quote;
        
        if (!quote) {
            throw new Error('No quote in daily content');
        }
        
        // Generate gradient for today (consistent for the day)
        const gradient = getRandomGradient();
        
        // Cache for today
        dailyQuoteCache = quote;
        dailyQuoteDate = today;
        dailyQuoteGradient = gradient;
        
        appState.setQuoteData(quote);
        appState.setGradient(gradient);
        addToQuoteHistory(quote, gradient);
        
        return quote;
    } catch (error) {
        const fallbackGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        appState.setQuoteData({
            id: 'error',
            text: 'Zitat nicht verfügbar',
            author: 'Fehler',
            backgroundInfo: 'Bitte lade die Seite neu.'
        });
        appState.setGradient(fallbackGradient);
        
        throw error;
    }
}

export function displayQuote(data, gradient) {
    if (!data) return;
    
    const quoteView = document.getElementById('view-quotes');
    if (!quoteView) return;
    
    const quoteTextEl = quoteView.querySelector('.quote-text');
    const authorEl = quoteView.querySelector('.quote-author');
    const titleEl = quoteView.querySelector('.info-title');
    const contentEl = quoteView.querySelector('.info-content p');
    
    // Set quote text
    if (quoteTextEl) {
        quoteTextEl.textContent = `"${data.text}"`;
    }
    
    // Set author (main display)
    if (authorEl) {
        authorEl.textContent = `— ${data.author}`;
    }
    
    // Set info-title (Author name in info panel)
    if (titleEl) {
        titleEl.textContent = data.author || 'Unknown';
    }
    
    // Set gradient background
    if (gradient) {
        quoteView.style.background = gradient;
    }
    
    // Set description in current language
    if (contentEl) {
        const lang = localStorage.getItem('curio_language') || 'de';
        let description;
        
        if (lang === 'en') {
            description = data.ai_description_en || data.ai_description_de || data.backgroundInfo || '';
        } else {
            description = data.ai_description_de || data.ai_description_en || data.backgroundInfo || '';
        }
        
        // ✅ Convert newlines to <br> for proper paragraph display
        contentEl.innerHTML = escapeHtml(description).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    }
    
    // ✅ Update attribution display (currently hidden for quotes)
    updateQuoteAttribution(data);

// ✅ Reset scroll position to show description
    const infoContent = quoteView.querySelector('.info-content');
    if (infoContent) {
        infoContent.scrollTop = 0;
    }

}

export function initQuoteView() {
    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.currentQuoteData) {
            displayQuote(state.currentQuoteData, state.currentGradient);
        }
    });
    
    // Listen for language changes
    window.addEventListener('languageChanged', () => {
        if (appState.currentQuoteData) {
            displayQuote(appState.currentQuoteData, appState.currentGradient);
        }
    });
}

// Clear cache (für manuellen Reset)
export function clearDailyQuoteCache() {
    dailyQuoteCache = null;
    dailyQuoteDate = null;
    dailyQuoteGradient = null;
}