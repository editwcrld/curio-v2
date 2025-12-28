/**
 * Art Engine Module
 * ✅ Nutzt /daily/today für fixes Tages-Content
 * ✅ Language Support (DE/EN)
 * ✅ Attribution Display für API Compliance
 * ✅ NEW: Title/Subtitle structure, Dimensions/Medium display
 * ✅ NEW: Proper paragraph display with newlines
 */

import { API_BASE_URL } from './config.js';
import { appState } from './state.js';
import { addToArtHistory } from './content-navigation.js';
import { updateArtAttribution } from './info-panel.js';

/**
 * ✅ Escape HTML to prevent XSS when using innerHTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cache für Tages-Content (damit nicht jeder Reload neu fetcht)
let dailyArtCache = null;
let dailyArtDate = null;

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

export async function loadDailyArt() {
    try {
        const today = getTodayDate();
        
        // Return cached if same day
        if (dailyArtCache && dailyArtDate === today) {
            appState.setArtData(dailyArtCache);
            addToArtHistory(dailyArtCache);
            return dailyArtCache;
        }
        
        // Fetch from /daily/today (fixes Tages-Content)
        const response = await fetch(`${API_BASE_URL}/daily/today`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load daily content`);
        }
        
        const result = await response.json();
        const art = result.data?.art || result.art;
        
        if (!art) {
            throw new Error('No art in daily content');
        }
        
        // Cache for today
        dailyArtCache = art;
        dailyArtDate = today;
        
        appState.setArtData(art);
        addToArtHistory(art);
        
        return art;
    } catch (error) {
        appState.setArtData({
            id: 'error',
            title: 'Artwork nicht verfügbar',
            artist: 'Fehler',
            imageUrl: '',
            backgroundInfo: 'Bitte lade die Seite neu.'
        });
        
        throw error;
    }
}

export function displayArt(data) {
    if (!data) return;

    const artView = document.getElementById('view-art');
    if (!artView) return;

    const imageEl = artView.querySelector('.main-image');
    const titleEl = artView.querySelector('.info-title');
    const subtitleEl = artView.querySelector('.info-subtitle');
    const contentEl = artView.querySelector('.info-content p');

    // Set image
    if (imageEl && data.imageUrl) {
        imageEl.src = data.imageUrl;
        imageEl.alt = data.title || 'Artwork';
    }
    
    // ✅ NEW: Set title (Artwork title only)
    if (titleEl) {
        titleEl.textContent = data.title || 'Untitled';
    }
    
    // ✅ NEW: Set subtitle (Artist + Year)
    if (subtitleEl) {
        const year = data.year ? `, ${data.year}` : '';
        subtitleEl.textContent = `${data.artist || 'Unknown Artist'}${year}`;
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
    
    // ✅ NEW: Update dimensions display
    updateDimensionsDisplay(data);
    
    // ✅ NEW: Update medium display
    updateMediumDisplay(data);
    
    // ✅ Update attribution display
    updateArtAttribution(data);

        // ✅ Reset scroll position to show description
    const infoContent = artView.querySelector('.info-content');
    if (infoContent) {
        infoContent.scrollTop = 0;
    }
}

/**
 * Update dimensions display - only shows if data exists
 */
function updateDimensionsDisplay(data) {
    const artView = document.getElementById('view-art');
    if (!artView) return;
    
    const dimensionsRow = artView.querySelector('.dimensions-row');
    if (!dimensionsRow) return;
    
    const valueEl = dimensionsRow.querySelector('.detail-value');
    const labelEl = dimensionsRow.querySelector('.detail-label');
    const lang = localStorage.getItem('curio_language') || 'de';
    
    // Hide if no dimensions
    if (!data.dimensions) {
        dimensionsRow.style.display = 'none';
        return;
    }
    
    // Show and update
    dimensionsRow.style.display = 'flex';
    
    if (labelEl) {
        labelEl.textContent = lang === 'en' ? 'Dimensions:' : 'Maße:';
    }
    
    if (valueEl) {
        valueEl.textContent = data.dimensions;
    }
}

/**
 * Update medium display - only shows if data exists
 */
function updateMediumDisplay(data) {
    const artView = document.getElementById('view-art');
    if (!artView) return;
    
    const mediumRow = artView.querySelector('.medium-row');
    if (!mediumRow) return;
    
    const valueEl = mediumRow.querySelector('.detail-value');
    const labelEl = mediumRow.querySelector('.detail-label');
    const lang = localStorage.getItem('curio_language') || 'de';
    
    // Hide if no medium
    if (!data.medium) {
        mediumRow.style.display = 'none';
        return;
    }
    
    // Show and update
    mediumRow.style.display = 'flex';
    
    if (labelEl) {
        labelEl.textContent = lang === 'en' ? 'Medium:' : 'Technik:';
    }
    
    if (valueEl) {
        valueEl.textContent = data.medium;
    }
}

export function initArtView() {
    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.currentArtData) {
            displayArt(state.currentArtData);
        }
    });
    
    // Listen for language changes
    window.addEventListener('languageChanged', () => {
        if (appState.currentArtData) {
            displayArt(appState.currentArtData);
        }
    });
}

// Clear cache (für manuellen Reset)
export function clearDailyArtCache() {
    dailyArtCache = null;
    dailyArtDate = null;
}