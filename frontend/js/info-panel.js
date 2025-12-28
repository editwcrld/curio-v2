/**
 * Info Panel Module
 * ✅ Language Toggle OHNE Expand-Konflikt
 * ✅ Guest Favorite → öffnet Auth Modal
 * ✅ Attribution Display für API Compliance
 */

import { toggleFavorite } from './fav-engine.js';
import { appState } from './state.js';

export function initInfoPanels() {
    const infoSections = document.querySelectorAll('.info-section');
    
    infoSections.forEach(section => {
        section.addEventListener('click', (e) => {
            // Don't expand when clicking interactive elements
            if (e.target.closest('.fav-btn')) return;
            if (e.target.closest('.lang-toggle')) return;
            if (e.target.closest('.lang-btn')) return;
            if (e.target.closest('.attribution-link')) return;
            if (e.target.closest('button')) return;
            if (e.target.closest('a')) return;
            
            section.classList.toggle('expanded');
        });
    });
    
    initLanguageToggles();
}

/**
 * Initialize language toggle buttons
 */
function initLanguageToggles() {
    const langToggles = document.querySelectorAll('.lang-toggle');
    
    langToggles.forEach(toggle => {
        const buttons = toggle.querySelectorAll('.lang-btn');
        
        buttons.forEach(btn => {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = newBtn.dataset.lang;
                if (!lang) return;
                
                // Update localStorage
                localStorage.setItem('curio_language', lang);
                
                // Update button states in ALL toggles
                document.querySelectorAll('.lang-toggle').forEach(t => {
                    t.querySelectorAll('.lang-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.lang === lang);
                    });
                });
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
                
                console.log(`🌐 Language changed to: ${lang}`);
            });
        });
    });
    
    // Set initial state
    const currentLang = localStorage.getItem('curio_language') || 'de';
    document.querySelectorAll('.lang-toggle').forEach(toggle => {
        toggle.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    });
}

export function initFavoriteButtons() {
    const favButtons = document.querySelectorAll('.fav-btn');
    
    favButtons.forEach(btn => {
        // Remove existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', handleFavoriteClick, { passive: false });
    });
}

/**
 * Handle favorite button click
 */
function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    // ✅ Guest klickt auf Herz → Auth Modal öffnen
    if (!isLoggedIn) {
        import('./auth-modal.js').then(module => {
            module.openAuthModal('login');
        });
        return;
    }
    
    // Get view type
    const viewElement = e.currentTarget.closest('.view');
    const viewType = viewElement ? viewElement.id.replace('view-', '') : null;
    
    if (!viewType || viewType === 'favorites') return;
    
    // Get current data
    const data = viewType === 'art' ? appState.currentArtData : appState.currentQuoteData;
    
    if (!data || !data.id) {
        console.warn('No valid data to favorite');
        return;
    }
    
    // INSTANT visual feedback
    const btn = e.currentTarget;
    const willBeFavorited = !btn.classList.contains('active');
    btn.classList.toggle('active', willBeFavorited);
    
    // Add scale animation
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
    
    // Update storage async
    requestAnimationFrame(() => {
        toggleFavorite(data, viewType);
    });
}

// =====================================================
// ATTRIBUTION DISPLAY
// =====================================================

/**
 * Update attribution display for artwork
 * @param {object} artData - Artwork data with attribution info
 */
export function updateArtAttribution(artData) {
    const artView = document.getElementById('view-art');
    if (!artView) return;
    
    const attributionEl = artView.querySelector('.attribution');
    if (!attributionEl) return;
    
    // Get attribution from data or generate default
    const attribution = artData.attribution || generateDefaultAttribution(artData);
    
    if (attribution && attribution.museum) {
        const lang = localStorage.getItem('curio_language') || 'de';
        const sourceText = lang === 'en' ? 'Source' : 'Quelle';
        
        // Create attribution HTML
        attributionEl.innerHTML = `
            <span class="attribution-label">${sourceText}:</span>
            <a href="${attribution.artworkUrl || attribution.museumUrl || '#'}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="attribution-link"
               onclick="event.stopPropagation()">
                ${attribution.museum}
            </a>
            <span class="attribution-license">(${attribution.license || 'Public Domain'})</span>
        `;
        attributionEl.style.display = 'flex';
    } else {
        attributionEl.style.display = 'none';
    }
}

/**
 * Update attribution display for quote
 * @param {object} quoteData - Quote data with source info
 */
export function updateQuoteAttribution(quoteData) {
    const quoteView = document.getElementById('view-quotes');
    if (!quoteView) return;
    
    const attributionEl = quoteView.querySelector('.attribution');
    if (!attributionEl) return;
    
    // Quotes don't need visible attribution since they're public domain text
    // But we can show the API source for transparency (optional - currently hidden)
    // Uncomment below if you want to show quote source
    
    /*
    if (quoteData.source || quoteData.sourceApi) {
        const lang = localStorage.getItem('curio_language') || 'de';
        const viaText = lang === 'en' ? 'via' : 'via';
        
        const sourceNames = {
            'ninjas': 'API Ninjas',
            'favqs': 'FavQs',
            'api-ninjas': 'API Ninjas'
        };
        
        const sourceName = sourceNames[quoteData.sourceApi] || quoteData.source || '';
        
        if (sourceName) {
            attributionEl.innerHTML = `
                <span class="attribution-text">${viaText} ${sourceName}</span>
            `;
            attributionEl.style.display = 'flex';
        } else {
            attributionEl.style.display = 'none';
        }
    } else {
        attributionEl.style.display = 'none';
    }
    */
    
    // For now, hide quote attribution (quotes are public domain text)
    attributionEl.style.display = 'none';
}

/**
 * Generate default attribution based on source_api
 * @param {object} data - Art or Quote data
 * @returns {object} Attribution info
 */
function generateDefaultAttribution(data) {
    const sourceApi = data.source_api || data.sourceApi;
    
    if (sourceApi === 'artic') {
        return {
            museum: 'Art Institute of Chicago',
            museumUrl: 'https://www.artic.edu',
            license: 'Public Domain',
            artworkUrl: data.external_id ? `https://www.artic.edu/artworks/${data.external_id}` : null
        };
    } else if (sourceApi === 'rijks') {
        return {
            museum: 'Rijksmuseum',
            museumUrl: 'https://www.rijksmuseum.nl',
            license: 'CC0',
            artworkUrl: data.external_id ? `https://www.rijksmuseum.nl/en/collection/${data.external_id}` : null
        };
    }
    
    return null;
}
