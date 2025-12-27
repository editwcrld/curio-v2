/**
 * Art Engine Module
 * ✅ Backend API (Real Art Institute Data!)
 * ✅ Language Support (DE/EN)
 */

import { API_BASE_URL } from './config.js';
import { appState } from './state.js';
import { addToArtHistory } from './content-navigation.js';

export async function loadDailyArt() {
    try {
        const response = await fetch(`${API_BASE_URL}/daily/art`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load art`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        appState.setArtData(data);
        
        // Add to history
        addToArtHistory(data);
        
        return data;
    } catch (error) {
        console.error('Error loading daily art:', error);
        
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
    const contentEl = artView.querySelector('.info-content p');

    // Set image
    if (imageEl && data.imageUrl) {
        imageEl.src = data.imageUrl;
        imageEl.alt = data.title || 'Artwork';
    }
    
    // Set title (Artist - Year)
    if (titleEl) {
        const year = data.year ? ` (${data.year})` : '';
        titleEl.textContent = `${data.artist || 'Unknown'}${year}`;
    }
    
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

export function initArtView() {
    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.currentArtData) {
            displayArt(state.currentArtData);
        }
    });
    
    // ✅ Listen for language changes
    window.addEventListener('languageChanged', () => {
        if (appState.currentArtData) {
            displayArt(appState.currentArtData);
        }
    });
}