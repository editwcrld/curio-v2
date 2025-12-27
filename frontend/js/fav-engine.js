/**
 * Favorites Engine
 * ✅ Supabase Backend
 * ✅ Gradient in DB
 * ✅ Fallback Gradient für alte Favorites (basierend auf ID)
 */

import { appState } from './state.js';
import { API_BASE_URL, GRADIENTS } from './config.js';

// ===== STATE =====
let favorites = [];
let isLoaded = false;
let currentFilter = 'all';
let currentSearch = '';

// ===== GRADIENT HELPER =====

/**
 * Generiert einen konsistenten Gradient basierend auf der ID
 * Alte Favorites ohne gespeicherten Gradient bekommen so immer den gleichen!
 */
function getGradientForId(id) {
    if (!id) return GRADIENTS[0];
    
    // Hash die ID zu einer Zahl
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Positiver Index
    const index = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[index];
}

// ===== BACKEND API =====

async function fetchFavoritesFromBackend() {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return [];
        
        const data = await response.json();
        const backendFavs = data.data || [];
        
        // ✅ Fallback Gradient für alte Favorites!
        return backendFavs.map(fav => ({
            ...fav,
            savedGradient: fav.savedGradient || getGradientForId(fav.id)
        }));
    } catch (error) {
        console.error('Fetch favorites error:', error);
        return [];
    }
}

async function addFavoriteToBackend(type, itemId, gradient) {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    console.log('📤 Sending to backend:', { type, itemId, gradient }); // DEBUG
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                type, 
                itemId,
                gradient  // ✅ Gradient an Backend senden!
            })
        });
        
        if (!response.ok) {
            console.error('Add favorite failed:', response.status);
            return null;
        }
        
        const data = await response.json();
        console.log('📥 Backend response:', data); // DEBUG
        return data.data?.favoriteId || null;
    } catch (error) {
        console.error('Add favorite error:', error);
        return null;
    }
}

async function removeFavoriteFromBackend(favoriteId) {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    } catch (error) {
        console.error('Remove favorite error:', error);
        return false;
    }
}

// ===== CORE FUNCTIONS =====

export function isFavorite(itemId) {
    return favorites.some(f => f.id === itemId);
}

export function toggleFavorite(item, type) {
    if (!item?.id) return false;
    
    const existing = favorites.find(f => f.id === item.id);
    
    if (existing) {
        // REMOVE
        favorites = favorites.filter(f => f.id !== item.id);
        
        if (existing.favoriteId) {
            removeFavoriteFromBackend(existing.favoriteId);
        }
        
        return false;
    } else {
        // ADD
        const gradient = type === 'quotes' ? appState.currentGradient : null;
        
        console.log('💾 Saving favorite with gradient:', gradient); // DEBUG
        
        const newFav = {
            ...item,
            type,
            favoriteId: null,
            savedAt: Date.now(),
            savedGradient: gradient
        };
        
        favorites.unshift(newFav);
        
        // ✅ Gradient mit an Backend senden!
        addFavoriteToBackend(type, item.id, gradient).then(favId => {
            if (favId) {
                const fav = favorites.find(f => f.id === item.id);
                if (fav) fav.favoriteId = favId;
            }
        });
        
        return true;
    }
}

export function updateFavoriteButtonState(viewType, itemId) {
    const view = document.getElementById(`view-${viewType}`);
    if (!view) return;
    
    const btn = view.querySelector('.fav-btn');
    if (!btn) return;
    
    btn.classList.toggle('active', isFavorite(itemId));
}

export function updateAllFavoriteButtons() {
    if (appState.currentArtData) {
        updateFavoriteButtonState('art', appState.currentArtData.id);
    }
    if (appState.currentQuoteData) {
        updateFavoriteButtonState('quotes', appState.currentQuoteData.id);
    }
}

// ===== FILTER & SEARCH =====

export function setFilter(filter) {
    currentFilter = filter;
}

export function setSearch(query) {
    currentSearch = query.toLowerCase().trim();
}

export function getFilteredFavorites() {
    let result = [...favorites];
    
    if (currentFilter !== 'all') {
        result = result.filter(f => f.type === currentFilter);
    }
    
    if (currentSearch) {
        result = result.filter(item => {
            const fields = [item.title, item.artist, item.text, item.author, item.source]
                .filter(Boolean).join(' ').toLowerCase();
            return fields.includes(currentSearch);
        });
    }
    
    return result;
}

// ===== RENDER =====

export function renderFavorites() {
    const container = document.getElementById('fav-list');
    const countEl = document.querySelector('.fav-count');
    
    if (!container) return;
    
    const filtered = getFilteredFavorites();
    
    if (countEl) {
        countEl.textContent = `${favorites.length} ${favorites.length === 1 ? 'Favorit' : 'Favoriten'}`;
    }
    
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = createEmptyState();
        return;
    }
    
    const fragment = document.createDocumentFragment();
    filtered.forEach(item => fragment.appendChild(createCard(item)));
    container.appendChild(fragment);
}

function createCard(item) {
    const card = document.createElement('div');
    card.className = `fav-card type-${item.type}`;
    card.dataset.id = item.id;
    
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
        // ✅ savedGradient aus DB oder Fallback
        const gradient = item.savedGradient || getGradientForId(item.id);
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
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-card-delete')) {
            openDetail(item);
        }
    });
    
    card.querySelector('.fav-card-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            toggleFavorite(item, item.type);
            renderFavorites();
            updateAllFavoriteButtons();
        }, 250);
    });
    
    return card;
}

function createEmptyState() {
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    
    if (!isLoggedIn) {
        setTimeout(() => {
            const btn = document.querySelector('.fav-login-btn');
            if (btn) {
                btn.onclick = () => {
                    import('./auth-modal.js').then(m => m.openAuthModal('login'));
                };
            }
        }, 50);
        
        return `
            <div class="fav-empty">
                <svg class="fav-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h3 class="fav-empty-title">Melde dich an um Favoriten zu speichern</h3>
                <p class="fav-empty-text">Speichere deine Lieblingskunstwerke und Zitate</p>
                <button class="fav-login-btn">Jetzt anmelden</button>
            </div>
        `;
    }
    
    return `
        <div class="fav-empty">
            <svg class="fav-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <h3 class="fav-empty-title">${currentSearch ? 'Keine Treffer' : 'Noch keine Favoriten'}</h3>
            <p class="fav-empty-text">
                ${currentSearch ? 'Versuche einen anderen Suchbegriff' : 'Speichere Kunst und Zitate, indem du auf das Herz klickst'}
            </p>
        </div>
    `;
}

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
    
    setTimeout(() => {
        updateAllFavoriteButtons();
    }, 50);
}

function switchView(viewName) {
    document.querySelectorAll('#bottom-nav button').forEach(btn => {
        btn.classList.toggle('active', btn.id === `nav-${viewName}`);
    });
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('hidden', view.id !== `view-${viewName}`);
    });
    
    appState.setView(viewName);
    updateAllFavoriteButtons();
}

// ===== PUBLIC =====

export function refreshFavoritesView() {
    isLoaded = false;
    initFavoritesView();
}

export async function initFavoritesView() {
    if (!isLoaded) {
        const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
        if (isLoggedIn) {
            favorites = await fetchFavoritesFromBackend();
        } else {
            favorites = [];
        }
        isLoaded = true;
    }
    
    setupFavoritesUI();
    renderFavorites();
}

let uiSetup = false;

function setupFavoritesUI() {
    if (uiSetup) return;
    uiSetup = true;
    
    const searchInput = document.getElementById('fav-search');
    const searchClear = document.getElementById('fav-search-clear');
    const filterBtns = document.querySelectorAll('.fav-filter-pill');
    
    let timeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (searchClear) searchClear.classList.toggle('visible', val.length > 0);
            
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setSearch(val);
                renderFavorites();
            }, 200);
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchClear.classList.remove('visible');
                setSearch('');
                renderFavorites();
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
}