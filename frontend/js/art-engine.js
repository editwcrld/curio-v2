import { API_BASE_URL } from './config.js';
import { appState } from './state.js';
import { getRandomArt } from './dummy-data.js';

/**
 * Art Engine Module
 * Handles fetching and displaying daily art content
 */

export async function loadDailyArt() {
    try {
        const response = await fetch(`${API_BASE_URL}/daily/art`);
        
        // Wenn API nicht verfügbar, verwende Dummy-Daten
        if (!response.ok) {
            console.warn('API not available, using dummy data');
            const dummyData = getRandomArt();
            appState.setArtData(dummyData);
            return dummyData;
        }
        
        const data = await response.json();
        appState.setArtData(data);
        return data;
    } catch (error) {
        console.warn('Error loading daily art, using dummy data:', error);
        // Fallback auf Dummy-Daten
        const dummyData = getRandomArt();
        appState.setArtData(dummyData);
        return dummyData;
    }
}

export function displayArt(data) {
    if (!data) return;

    const artView = document.getElementById('view-art');
    if (!artView) return;

    const imageEl = artView.querySelector('.main-image');
    const titleEl = artView.querySelector('.info-title');
    const metaEl = artView.querySelector('.info-meta');
    const contentEl = artView.querySelector('.info-content p');

    if (imageEl) imageEl.src = data.imageUrl;
    if (titleEl) titleEl.textContent = data.title;
    if (metaEl) metaEl.textContent = data.artist;
    if (contentEl) contentEl.textContent = data.description;
}

export function initArtView() {
    // Subscribe to state changes
    appState.subscribe((state) => {
        if (state.currentArtData) {
            displayArt(state.currentArtData);
        }
    });
}