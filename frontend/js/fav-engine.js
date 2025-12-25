import { appState } from './state.js';

/**
 * Favorites Engine Module
 * Handles saving, loading, filtering and displaying favorites
 */

// LocalStorage key (später Supabase)
const STORAGE_KEY = 'dailyart_favorites';

// Current filter and search state
let currentFilter = 'all';
let searchQuery = '';

/**
 * Load favorites from storage
 */
export function loadFavorites() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
    }
}

/**
 * Save favorites to storage
 */
function saveFavorites(favorites) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
}

/**
 * Add item to favorites
 */
export function addFavorite(item, type) {
    const favorites = loadFavorites();
    
    // Check if already exists
    const exists = favorites.some(f => f.id === item.id);
    if (exists) {
        console.log('Item already in favorites');
        return favorites;
    }
    
    // Add type and timestamp
    const favoriteItem = {
        ...item,
        type,
        savedAt: new Date().toISOString(),
        savedGradient: appState.currentGradient || null
    };
    
    favorites.push(favoriteItem);
    saveFavorites(favorites);
    
    console.log('Added to favorites:', item.id);
    return favorites;
}

/**
 * Remove item from favorites
 */
export function removeFavorite(itemId) {
    const favorites = loadFavorites();
    const filtered = favorites.filter(f => f.id !== itemId);
    saveFavorites(filtered);
    
    console.log('Removed from favorites:', itemId);
    return filtered;
}

/**
 * Check if item is favorited
 */
export function isFavorite(itemId) {
    const favorites = loadFavorites();
    return favorites.some(f => f.id === itemId);
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(item, type) {
    if (isFavorite(item.id)) {
        return removeFavorite(item.id);
    } else {
        return addFavorite(item, type);
    }
}

/**
 * Filter favorites by type
 */
export function filterFavorites(favorites, filter) {
    if (filter === 'all') return favorites;
    return favorites.filter(f => f.type === filter);
}

/**
 * Search in favorites
 */
export function searchFavorites(favorites, query) {
    if (!query) return favorites;
    
    const lowerQuery = query.toLowerCase();
    
    return favorites.filter(f => {
        const searchableText = [
            f.title,
            f.artist,
            f.text,
            f.author,
            f.source
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(lowerQuery);
    });
}

/**
 * Get filtered and searched favorites
 */
export function getFilteredFavorites(filter = currentFilter, query = searchQuery) {
    let favorites = loadFavorites();
    favorites = filterFavorites(favorites, filter);
    favorites = searchFavorites(favorites, query);
    return favorites;
}

/**
 * Set current filter
 */
export function setFilter(filter) {
    currentFilter = filter;
}

/**
 * Set search query
 */
export function setSearchQuery(query) {
    searchQuery = query;
}

/**
 * Render favorites grid
 */
export function renderFavorites() {
    const container = document.getElementById('fav-list');
    if (!container) return;
    
    const favorites = getFilteredFavorites();
    
    // Empty state
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h3>${searchQuery ? 'Keine Treffer' : 'Noch keine Favoriten'}</h3>
                <p>${searchQuery ? 'Versuche einen anderen Suchbegriff' : 'Speichere Kunst und Zitate, indem du auf das Herz-Icon klickst'}</p>
            </div>
        `;
        return;
    }
    
    // Render items
    container.innerHTML = '';
    
    favorites.forEach(item => {
        const card = createFavoriteCard(item);
        container.appendChild(card);
    });
}

/**
 * Create favorite card element
 */
function createFavoriteCard(item) {
    const card = document.createElement('div');
    card.className = `fav-item type-${item.type}`;
    card.dataset.id = item.id;
    
    if (item.type === 'art') {
        card.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}">
            <div class="fav-item-info">
                <h3>${item.title}</h3>
                <p>${item.artist}</p>
            </div>
            <button class="fav-item-delete" aria-label="Remove from favorites">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
    } else {
        const gradient = item.savedGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        card.style.background = gradient;
        card.innerHTML = `
            <div class="quote-preview">"${item.text}"</div>
            <div class="fav-item-info">
                <h3>${item.author}</h3>
            </div>
            <button class="fav-item-delete" aria-label="Remove from favorites">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
    }
    
    // Click to open in detail view
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-item-delete')) {
            openFavoriteDetail(item);
        }
    });
    
    // Delete button
    const deleteBtn = card.querySelector('.fav-item-delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(item.id);
        renderFavorites();
        updateAllFavoriteButtons();
    });
    
    return card;
}

/**
 * Open favorite in detail view (art or quotes)
 */
function openFavoriteDetail(item) {
    if (item.type === 'art') {
        // Load into art view
        appState.setArtData(item);
        switchToView('art');
    } else {
        // Load into quotes view
        appState.setQuoteData(item);
        if (item.savedGradient) {
            appState.setGradient(item.savedGradient);
        }
        switchToView('quotes');
    }
}

/**
 * Switch to specific view
 */
function switchToView(viewName) {
    // Update nav
    const navButtons = document.querySelectorAll('#bottom-nav button');
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.id === `nav-${viewName}`);
    });
    
    // Update views
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== `view-${viewName}`);
    });
    
    appState.setView(viewName);
}

/**
 * Update all favorite button states
 */
export function updateAllFavoriteButtons() {
    // Update art view
    if (appState.currentArtData) {
        const artView = document.getElementById('view-art');
        const artBtn = artView?.querySelector('.fav-btn');
        if (artBtn) {
            artBtn.classList.toggle('active', isFavorite(appState.currentArtData.id));
        }
    }
    
    // Update quotes view
    if (appState.currentQuoteData) {
        const quotesView = document.getElementById('view-quotes');
        const quotesBtn = quotesView?.querySelector('.fav-btn');
        if (quotesBtn) {
            quotesBtn.classList.toggle('active', isFavorite(appState.currentQuoteData.id));
        }
    }
}

/**
 * Initialize favorites view
 */
export function initFavoritesView() {
    const searchToggle = document.getElementById('search-toggle');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('fav-search');
    const searchClear = document.getElementById('search-clear');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Search toggle
    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) {
                searchInput.focus();
            }
        });
    }
    
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            setSearchQuery(query);
            searchClear?.classList.toggle('visible', query.length > 0);
            renderFavorites();
        });
    }
    
    // Search clear
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            setSearchQuery('');
            searchClear.classList.remove('visible');
            renderFavorites();
            searchInput.focus();
        });
    }
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setFilter(btn.dataset.filter);
            renderFavorites();
        });
    });
    
    // Initial render
    renderFavorites();
}