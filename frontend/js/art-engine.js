/**
 * Art Engine Module
 * ✅ Loads from Backend
 * ✅ Adds initial art to history
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
        
        // ✅ Add to history!
        addToArtHistory(data);
        
        return data;
    } catch (error) {
        console.error('Error loading daily art:', error);
        
        appState.setArtData({
            id: 'error',
            title: 'Kunst konnte nicht geladen werden',
            artist: 'Fehler',
            imageUrl: 'https://via.placeholder.com/800x600?text=Error',
            description: 'Bitte lade die Seite neu.'
        });
        
        throw error;
    }
}

export function displayArt(data) {
    if (!data) return;

    const artView = document.getElementById('view-art');
    if (!artView) return;

    const imageEl = artView.querySelector('.art-image');
    const titleEl = artView.querySelector('.info-title');
    const artistEl = artView.querySelector('.info-content p');

    if (imageEl) {
        imageEl.src = data.imageUrl;
        imageEl.alt = data.title;
    }
    if (titleEl) titleEl.textContent = data.title;
    if (artistEl) artistEl.textContent = data.description || `${data.artist}, ${data.year}`;
}

export function initArtView() {
    appState.subscribe((state) => {
        if (state.currentArtData) {
            displayArt(state.currentArtData);
        }
    });
}