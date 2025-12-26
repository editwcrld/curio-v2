/**
 * Favorites Engine - FIXED VERSION
 * Uses Supabase Backend statt localStorage
 * ✅ User-specific favorites
 * ✅ Persistiert in DB
 * ✅ Keine Funktionalität verloren
 */

import { appState } from './state.js';
import { API_BASE_URL } from './config.js';

// ===== STATE =====
let favoritesCache = null;
let currentFilter = 'all';
let currentSearch = '';

// ===== API CALLS =====

/**
 * Fetch favorites from backend
 */
async function fetchFavoritesFromBackend() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        return []; // Not logged in
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
}

/**
 * Add favorite to backend
 */
async function addFavoriteToBackend(type, itemId) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        // Not logged in - show login modal
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
            body: JSON.stringify({ type, itemId })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
    }
}

/**
 * Remove favorite from backend
 */
async function removeFavoriteFromBackend(favoriteId) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
    }
}

// ===== CACHE MANAGEMENT =====

/**
 * Get favorites (with cache)
 */
async function getFavorites() {
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (!isLoggedIn) {
        favoritesCache = [];
        return [];
    }
    
    // Return cache if available
    if (favoritesCache !== null) {
        return favoritesCache;
    }
    
    // Fetch from backend
    favoritesCache = await fetchFavoritesFromBackend();
    return favoritesCache;
}

/**
 * Clear cache (force refresh)
 */
function clearCache() {
    favoritesCache = null;
}

// ===== CORE OPERATIONS =====

/**
 * Check if item is favorited
 */
export async function isFavorite(itemId) {
    const favorites = await getFavorites();
    return favorites.some(f => f.id === itemId);
}

/**
 * Add to favorites
 */
export async function addFavorite(item, type) {
    // Add to backend
    const success = await addFavoriteToBackend(type, item.id);
    
    if (!success) return false;
    
    // Clear cache to force refresh
    clearCache();
    
    // Refresh UI
    await renderFavorites();
    updateAllFavoriteButtons();
    
    return true;
}

/**
 * Remove from favorites
 */
export async function removeFavorite(favoriteId) {
    // Remove from backend
    const success = await removeFavoriteFromBackend(favoriteId);
    
    if (!success) return false;
    
    // Clear cache
    clearCache();
    
    // Refresh UI
    await renderFavorites();
    updateAllFavoriteButtons();
    
    return true;
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(item, type) {
    if (!item || !item.id) {
        console.warn('Invalid item for favorite');
        return false;
    }
    
    const favorites = await getFavorites();
    const existingFavorite = favorites.find(f => f.id === item.id);
    
    if (existingFavorite) {
        // Remove
        await removeFavorite(existingFavorite.favoriteId);
        return false; // Now not favorited
    } else {
        // Add
        await addFavorite(item, type);
        return true; // Now favorited
    }
}

// ===== UI UPDATES =====

/**
 * Update favorite button state
 */
export async function updateFavoriteButtonState(viewType, itemId) {
    const view = document.getElementById(`view-${viewType}`);
    if (!view) return;
    
    const btn = view.querySelector('.fav-btn');
    if (!btn) return;
    
    const isFav = await isFavorite(itemId);
    
    requestAnimationFrame(() => {
        btn.classList.toggle('active', isFav);
    });
}

/**
 * Update all favorite buttons
 */
export async function updateAllFavoriteButtons() {
    if (appState.currentArtData) {
        await updateFavoriteButtonState('art', appState.currentArtData.id);
    }
    
    if (appState.currentQuoteData) {
        await updateFavoriteButtonState('quotes', appState.currentQuoteData.id);
    }
}

// ===== FILTERING & SEARCH =====

export function setFilter(filter) {
    currentFilter = filter;
}

export function setSearch(query) {
    currentSearch = query.toLowerCase().trim();
}

export function getFilter() {
    return currentFilter;
}

export function getSearch() {
    return currentSearch;
}

/**
 * Refresh favorites view (called after login)
 */
export async function refreshFavoritesView() {
    clearCache();
    await renderFavorites();
}

/**
 * Get filtered favorites
 */
async function getFilteredFavorites() {
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

// ===== RENDER =====

/**
 * Render favorites grid
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
    
    // Create cards
    const fragment = document.createDocumentFragment();
    
    favorites.forEach((item) => {
        const card = createCard(item);
        fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
}

/**
 * Create card element
 */
function createCard(item) {
    const card = document.createElement('div');
    card.className = `fav-card type-${item.type}`;
    card.dataset.id = item.id;
    card.dataset.favoriteId = item.favoriteId;
    
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
        const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
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
    
    // Card click - open detail
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-card-delete')) {
            openDetail(item);
        }
    });
    
    // Delete click
    const deleteBtn = card.querySelector('.fav-card-delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCard(item.favoriteId, card);
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
function deleteCard(favoriteId, cardElement) {
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.8)';
    
    setTimeout(async () => {
        await removeFavorite(favoriteId);
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

// ===== INITIALIZATION =====

/**
 * Initialize favorites view
 */
export function initFavoritesView() {
    const searchInput = document.getElementById('fav-search');
    const searchClear = document.getElementById('fav-search-clear');
    const filterBtns = document.querySelectorAll('.fav-filter-pill');
    
    // Search with debounce
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            
            if (searchClear) {
                searchClear.classList.toggle('visible', value.length > 0);
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                setSearch(value);
                await renderFavorites();
            }, 300);
        });
    }
    
    // Search clear
    if (searchClear) {
        searchClear.addEventListener('click', async () => {
            if (searchInput) {
                searchInput.value = '';
                searchClear.classList.remove('visible');
                setSearch('');
                await renderFavorites();
                searchInput.focus();
            }
        });
    }
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setFilter(btn.dataset.filter);
            await renderFavorites();
        });
    });
    
    // Initial render
    renderFavorites();
}