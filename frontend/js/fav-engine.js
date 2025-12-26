/**
 * Favorites Engine - PRODUCTION VERSION
 * ✅ Nur Storage geändert: localStorage → Supabase Backend
 * ✅ Alle andere Logik bleibt IDENTISCH!
 */

import { appState } from './state.js';
import { API_BASE_URL } from './config.js';

// ===== STORAGE (GEÄNDERT: Supabase statt localStorage) =====
let favoritesCache = null;

/**
 * Load favorites from Backend (ersetzt localStorage.getItem)
 */
async function getFavorites() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (!isLoggedIn) {
        favoritesCache = [];
        return []; // Return empty array if not logged in
    }
    
    // Return cache if available
    if (favoritesCache !== null) {
        return favoritesCache;
    }
    
    // Fetch from backend
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            favoritesCache = [];
            return [];
        }
        
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            favoritesCache = [];
            return [];
        }
        
        const data = await response.json();
        favoritesCache = data.data || [];
        return favoritesCache;
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesCache = [];
        return [];
    }
}

/**
 * Save favorite to Backend (ersetzt localStorage.setItem)
 */
async function saveFavorite(item, type) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        // Show login modal
        import('./auth-modal.js').then(m => m.openAuthModal('login'));
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, itemId: item.id })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error saving favorite:', error);
        return false;
    }
}

/**
 * Delete favorite from Backend (ersetzt localStorage filter)
 */
async function deleteFavorite(favoriteId) {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error deleting favorite:', error);
        return false;
    }
}

/**
 * Clear cache (call when data might be stale)
 */
function clearCache() {
    favoritesCache = null;
}

// ===== CORE OPERATIONS (UNVERÄNDERT!) =====

/**
 * Check if item is favorited (fast)
 */
export async function isFavorite(itemId) {
    const favorites = await getFavorites();
    return favorites.some(f => f.id === itemId);
}

/**
 * Add to favorites
 */
export async function addFavorite(item, type) {
    const favorites = await getFavorites();
    
    // Prevent duplicates
    if (favorites.some(f => f.id === item.id)) {
        return false;
    }
    
    // Save to backend
    const success = await saveFavorite(item, type);
    if (!success) return false;
    
    // Clear cache for refresh
    clearCache();
    
    return true;
}

/**
 * Remove from favorites
 */
export async function removeFavorite(itemId) {
    const favorites = await getFavorites();
    const favorite = favorites.find(f => f.id === itemId);
    
    if (!favorite) return false;
    
    // Delete from backend
    const success = await deleteFavorite(favorite.favoriteId);
    if (!success) return false;
    
    // Clear cache for refresh
    clearCache();
    
    return true;
}

/**
 * Toggle favorite (optimized)
 */
export async function toggleFavorite(item, type) {
    if (!item || !item.id) {
        console.warn('Invalid item for favorite');
        return false;
    }
    
    const isCurrentlyFavorited = await isFavorite(item.id);
    
    if (isCurrentlyFavorited) {
        await removeFavorite(item.id);
    } else {
        await addFavorite(item, type);
    }
    
    // Immediate UI update
    updateFavoriteButtonState(type, item.id);
    
    return !isCurrentlyFavorited;
}

// ===== UI UPDATES (UNVERÄNDERT!) =====

/**
 * Update favorite button state for specific view
 */
export function updateFavoriteButtonState(viewType, itemId) {
    const view = document.getElementById(`view-${viewType}`);
    if (!view) return;
    
    const btn = view.querySelector('.fav-btn');
    if (!btn) return;
    
    // Async check
    isFavorite(itemId).then(isFav => {
        requestAnimationFrame(() => {
            btn.classList.toggle('active', isFav);
        });
    });
}

/**
 * Update all favorite buttons
 */
export function updateAllFavoriteButtons() {
    if (appState.currentArtData) {
        updateFavoriteButtonState('art', appState.currentArtData.id);
    }
    
    if (appState.currentQuoteData) {
        updateFavoriteButtonState('quotes', appState.currentQuoteData.id);
    }
}

// ===== FILTERING & SEARCH (UNVERÄNDERT!) =====

let currentFilter = 'all';
let currentSearch = '';

/**
 * Set filter
 */
export function setFilter(filter) {
    currentFilter = filter;
}

/**
 * Set search query
 */
export function setSearch(query) {
    currentSearch = query.toLowerCase().trim();
}

/**
 * Get current filter
 */
export function getFilter() {
    return currentFilter;
}

/**
 * Get current search
 */
export function getSearch() {
    return currentSearch;
}

/**
 * Refresh favorites view (called after login)
 */
export function refreshFavoritesView() {
    // Clear cache to force reload
    clearCache();
    
    // Re-render favorites
    renderFavorites();
}

/**
 * Apply filters and search (optimized)
 */
export async function getFilteredFavorites() {
    let favorites = await getFavorites();
    
    // Filter by type
    if (currentFilter !== 'all') {
        favorites = favorites.filter(f => f.type === currentFilter);
    }
    
    // Search
    if (currentSearch) {
        favorites = favorites.filter(item => {
            const searchFields = [
                item.title,
                item.artist,
                item.text,
                item.author,
                item.source
            ].filter(Boolean).join(' ').toLowerCase();
            
            return searchFields.includes(currentSearch);
        });
    }
    
    return favorites;
}

// ===== RENDER (UNVERÄNDERT!) =====

/**
 * Render favorites grid (optimized)
 */
export async function renderFavorites() {
    const container = document.getElementById('fav-list');
    const countEl = document.querySelector('.fav-count');
    
    if (!container) return;
    
    const favorites = await getFilteredFavorites();
    const allFavorites = await getFavorites();
    
    // Update count
    if (countEl) {
        const count = allFavorites.length;
        countEl.textContent = `${count} ${count === 1 ? 'Favorit' : 'Favoriten'}`;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Empty state
    if (favorites.length === 0) {
        container.innerHTML = createEmptyState();
        return;
    }
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    favorites.forEach((item, index) => {
        const card = createCard(item, index);
        fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
}

/**
 * Create card element (optimized)
 */
function createCard(item, index) {
    const card = document.createElement('div');
    card.className = `fav-card type-${item.type}`;
    card.dataset.id = item.id;
    card.dataset.favoriteId = item.favoriteId; // Für Backend Delete
    
    if (item.type === 'art') {
        card.innerHTML = `
            <img class="fav-card-image" src="${item.imageUrl}" alt="${item.title}" loading="lazy">
            <div class="fav-card-content">
                <h3 class="fav-card-title">${item.title}</h3>
                <p class="fav-card-meta">${item.artist}</p>
            </div>
            <button class="fav-card-delete" aria-label="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
    } else {
        const gradient = item.savedGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        card.style.background = gradient;
        card.innerHTML = `
            <p class="fav-card-quote">"${item.text}"</p>
            <p class="fav-card-author">${item.author}</p>
            <button class="fav-card-delete" aria-label="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
    }
    
    const deleteBtn = card.querySelector('.fav-card-delete');
    
    // Card click - open detail
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-card-delete')) {
            openDetail(item);
        }
    });
    
    // Delete click
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCard(item.id, card);
    });
    
    return card;
}

/**
 * Create empty state
 */
function createEmptyState() {
    const hasSearch = currentSearch.length > 0;
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (!isLoggedIn && !hasSearch) {
        setTimeout(() => {
            const loginBtn = document.querySelector('.fav-login-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    import('./auth-modal.js').then(module => {
                        module.openAuthModal('login');
                    });
                });
            }
        }, 100);
        
        return `
            <div class="fav-empty">
                <svg class="fav-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h3 class="fav-empty-title">Melde dich an um Favoriten zu speichern</h3>
                <p class="fav-empty-text">Speichere deine Lieblingskunstwerke und Zitate</p>
                <button class="fav-login-btn">
                    Jetzt anmelden
                </button>
            </div>
        `;
    }
    
    return `
        <div class="fav-empty">
            <svg class="fav-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <h3 class="fav-empty-title">${hasSearch ? 'Keine Treffer' : 'Noch keine Favoriten'}</h3>
            <p class="fav-empty-text">
                ${hasSearch 
                    ? 'Versuche einen anderen Suchbegriff' 
                    : 'Speichere Kunst und Zitate, indem du auf das Herz klickst'
                }
            </p>
        </div>
    `;
}

/**
 * Delete card with animation
 */
function deleteCard(itemId, cardElement) {
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.8)';
    
    setTimeout(async () => {
        await removeFavorite(itemId);
        await renderFavorites();
        updateAllFavoriteButtons();
    }, 300);
}

/**
 * Open detail view
 */
function openDetail(item) {
    if (item.type === 'art') {
        appState.setArtData(item);
        switchView('art');
    } else {
        appState.setQuoteData(item);
        if (item.savedGradient) {
            appState.setGradient(item.savedGradient);
        }
        switchView('quotes');
    }
}

/**
 * Switch view helper
 */
function switchView(viewName) {
    const navButtons = document.querySelectorAll('#bottom-nav button');
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.id === `nav-${viewName}`);
    });
    
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== `view-${viewName}`);
    });
    
    appState.setView(viewName);
}

// ===== INITIALIZATION (UNVERÄNDERT!) =====

/**
 * Initialize favorites view
 */
export function initFavoritesView() {
    const searchInput = document.getElementById('fav-search');
    const searchClear = document.getElementById('fav-search-clear');
    const filterBtns = document.querySelectorAll('.fav-filter-pill');
    
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            
            if (searchClear) {
                searchClear.classList.toggle('visible', value.length > 0);
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                setSearch(value);
                renderFavorites();
            }, 300);
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchClear.classList.remove('visible');
                setSearch('');
                renderFavorites();
                searchInput.focus();
            }
        });
    }
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setFilter(btn.dataset.filter);
            renderFavorites();
        });
    });
    
    // Initial render
    renderFavorites();
}