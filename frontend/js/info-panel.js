/**
 * Info Panel Module
 * ✅ Klick/Tap überall in info-section für Expand/Collapse
 * ✅ Reset scroll position on collapse
 * ✅ Collapse on navigation (collapseAllInfoSections)
 * ✅ Language Toggle
 * ✅ Guest Favorite → öffnet Auth Modal
 * ✅ Attribution Display für API Compliance
 */

import { toggleFavorite } from './fav-engine.js';
import { appState } from './state.js';

// ===== STATE =====
const State = {
    maxHeight: 0,
    minHeight: 165
};

// ===== INITIALIZATION =====

export function initInfoPanels() {
    State.maxHeight = window.innerHeight * 0.6;
    
    if (window.innerWidth <= 480) {
        State.minHeight = 155;
    }
    
    initClickToggle('art');
    initClickToggle('quotes');
    initLanguageToggles();
    
    window.addEventListener('resize', () => {
        State.maxHeight = window.innerHeight * 0.6;
        State.minHeight = window.innerWidth <= 480 ? 155 : 165;
    });
}

/**
 * ✅ Collapse all info sections - call this on navigation
 */
export function collapseAllInfoSections() {
    document.querySelectorAll('.info-section').forEach(section => {
        section.classList.remove('expanded');
        section.style.height = '';
        section.style.transition = '';
        
        // ✅ Reset scroll position
        resetScrollPosition(section);
    });
}

/**
 * Reset scroll position of info-content
 */
function resetScrollPosition(section) {
    const infoContent = section.querySelector('.info-content');
    if (infoContent) {
        infoContent.scrollTop = 0;
    }
    
    const descriptionText = section.querySelector('.description-text');
    if (descriptionText) {
        descriptionText.scrollTop = 0;
    }
}

/**
 * Initialize click toggle for expand/collapse
 */
function initClickToggle(viewType) {
    const infoSection = document.querySelector(`#view-${viewType} .info-section`);
    
    if (!infoSection) return;
    
    // ✅ Click/Tap ANYWHERE in info-section to toggle expand
    infoSection.addEventListener('click', (e) => {
        // Don't toggle when clicking interactive elements
        if (e.target.closest('.fav-btn')) return;
        if (e.target.closest('.lang-toggle')) return;
        if (e.target.closest('.lang-btn')) return;
        if (e.target.closest('.attribution-link')) return;
        if (e.target.closest('button')) return;
        if (e.target.closest('a')) return;
        
        toggleExpand(infoSection);
    });
}

/**
 * Toggle expand/collapse state
 */
function toggleExpand(infoSection) {
    const isExpanded = infoSection.classList.contains('expanded');
    
    // Add smooth transition
    infoSection.style.transition = 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    
    if (isExpanded) {
        // Collapse
        infoSection.style.height = '';
        infoSection.classList.remove('expanded');
        
        // ✅ Reset scroll position on collapse
        resetScrollPosition(infoSection);
    } else {
        // Expand
        infoSection.style.height = `${State.maxHeight}px`;
        infoSection.classList.add('expanded');
    }
    
    // Clear transition after animation
    setTimeout(() => {
        infoSection.style.transition = '';
        if (isExpanded) {
            infoSection.style.height = '';
        }
    }, 300);
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
    
    if (attribution && (attribution.text || attribution.museum)) {
        const lang = localStorage.getItem('curio_language') || 'de';
        const sourceText = lang === 'en' ? 'Source' : 'Quelle';
        
        // Support both backend format (text/url) and legacy format (museum/museumUrl)
        const displayText = attribution.text || `Image courtesy of ${attribution.museum}`;
        const linkUrl = attribution.url || attribution.artworkUrl || attribution.museumUrl || '#';
        const license = attribution.license || 'Public Domain';
        
        // Extract museum name from text for display, or use museum directly
        let museumName = attribution.museum;
        if (!museumName && attribution.text) {
            // Extract from "Image courtesy of the Art Institute of Chicago"
            if (attribution.text.includes('Art Institute of Chicago')) {
                museumName = 'Art Institute of Chicago';
            } else if (attribution.text.includes('Rijksmuseum')) {
                museumName = 'Rijksmuseum';
            } else {
                museumName = attribution.text;
            }
        }
        
        // Build artwork-specific URL if we have external_id
        let artworkUrl = linkUrl;
        if (artData.external_id && artData.source_api) {
            if (artData.source_api === 'artic') {
                artworkUrl = `https://www.artic.edu/artworks/${artData.external_id}`;
            } else if (artData.source_api === 'rijks') {
                artworkUrl = `https://www.rijksmuseum.nl/en/collection/${artData.external_id}`;
            }
        }
        
        // Create attribution HTML
        attributionEl.innerHTML = `
            <span class="attribution-label">${sourceText}:</span>
            <a href="${artworkUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="attribution-link"
               onclick="event.stopPropagation()">
                ${museumName}
            </a>
            <span class="attribution-license">(${license})</span>
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