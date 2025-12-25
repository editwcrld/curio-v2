const API_BASE_URL = 'http://localhost:3000/api';
const appState = {
    currentView: 'art',
    currentArtData: null,
    currentQuoteData: null,
    currentGradient: '',
    favorites: JSON.parse(localStorage.getItem('savedItems')) || [],
    currentFilter: 'all',
    searchQuery: ''
};

const gradients = ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initInfoToggles();
    initFavButtons();
    initFilters();
    loadDailyContent();
});

function initNavigation() {
    const navButtons = document.querySelectorAll('#bottom-nav button');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.id.replace('nav-', '');
            appState.currentView = target;
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
            document.getElementById(`view-${target}`).classList.remove('hidden');
            if(target === 'favorites') renderFavorites();
        });
    });
}

function initInfoToggles() {
    document.querySelectorAll('.info-section').forEach(section => {
        section.addEventListener('click', (e) => {
            if (!e.target.closest('.fav-btn')) section.classList.toggle('expanded');
        });
    });
}

function initFavButtons() {
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = appState.currentView;
            const data = type === 'art' ? appState.currentArtData : appState.currentQuoteData;
            toggleFavorite(data, type);
        });
    });
}

function toggleFavorite(data, type) {
    if (!data) return;
    const idx = appState.favorites.findIndex(f => f.id === data.id);
    if (idx === -1) {
        appState.favorites.push({...data, type, savedGradient: appState.currentGradient});
    } else {
        appState.favorites.splice(idx, 1);
    }
    localStorage.setItem('savedItems', JSON.stringify(appState.favorites));
    updateFavUI();
}

function initFilters() {
    const searchToggle = document.getElementById('search-toggle');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('fav-search');
    const searchClear = document.getElementById('search-clear');

    if(searchToggle) {
        searchToggle.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
            if(searchContainer.classList.contains('active')) searchInput.focus();
        });
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            appState.searchQuery = e.target.value.toLowerCase();
            // X-Button anzeigen/verstecken
            if(searchClear) {
                searchClear.classList.toggle('visible', e.target.value.length > 0);
            }
            renderFavorites();
        });
    }

    if(searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            appState.searchQuery = '';
            searchClear.classList.remove('visible');
            renderFavorites();
            searchInput.focus();
        });
    }

    // Filter-Buttons (Alles, Kunst, Zitate)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.currentFilter = btn.dataset.filter;
            renderFavorites();
        });
    });
}

async function loadDailyContent() {
    try {
        const [a, q] = await Promise.all([fetch(`${API_BASE_URL}/daily/art`), fetch(`${API_BASE_URL}/daily/quote`)]);
        appState.currentArtData = await a.json();
        appState.currentQuoteData = await q.json();
        appState.currentGradient = gradients[Math.floor(Math.random() * gradients.length)];
        updateMainUI();
    } catch(e) { console.error("API Fehler", e); }
}

function updateMainUI() {
    if(appState.currentArtData) {
        const artV = document.getElementById('view-art');
        artV.querySelector('.main-image').src = appState.currentArtData.imageUrl;
        artV.querySelector('.info-title').innerText = appState.currentArtData.title;
        artV.querySelector('.info-meta').innerText = appState.currentArtData.artist;
        artV.querySelector('.info-content p').innerText = appState.currentArtData.description;
    }
    if(appState.currentQuoteData) {
        const qV = document.getElementById('view-quotes');
        qV.querySelector('.quote-container').style.background = appState.currentGradient;
        qV.querySelector('.quote-text').innerText = appState.currentQuoteData.text;
        qV.querySelector('.quote-author').innerText = appState.currentQuoteData.author;
        qV.querySelector('.info-title').innerText = appState.currentQuoteData.author;
        qV.querySelector('.info-content p').innerText = appState.currentQuoteData.backgroundInfo;
    }
    updateFavUI();
}

function updateFavUI() {
    document.querySelectorAll('.view').forEach(v => {
        const type = v.id.replace('view-', '');
        if (type === 'favorites') return;
        const data = type === 'art' ? appState.currentArtData : appState.currentQuoteData;
        if(data) {
            const isFav = appState.favorites.some(f => f.id === data.id);
            v.querySelector('.fav-btn').classList.toggle('active', isFav);
        }
    });
}

function renderFavorites() {
    const list = document.getElementById('fav-list');
    if(!list) return;
    list.innerHTML = '';

    const filtered = appState.favorites.filter(f => {
        const matchType = appState.currentFilter === 'all' || f.type === appState.currentFilter;
        
        // Suche in ALLEN Feldern (Titel, Künstler, Text, Autor)
        const searchableText = [
            f.title, 
            f.artist, 
            f.text, 
            f.author, 
            f.source
        ].join(' ').toLowerCase();
        
        const matchSearch = searchableText.includes(appState.searchQuery);
        
        return matchType && matchSearch;
    });

    if(filtered.length === 0) {
        list.innerHTML = `<p style="color: rgba(255,255,255,0.4); text-align: center; padding-top: 40px;">Keine Treffer gefunden.</p>`;
        return;
    }

    filtered.forEach(f => {
        const div = document.createElement('div');
        div.className = `fav-item type-${f.type}`;
        if(f.type === 'art') {
            div.innerHTML = `
                <img src="${f.imageUrl}">
                <div class="fav-item-info">
                    <h3>${f.title}</h3>
                    <p>${f.artist}</p>
                </div>`;
        } else {
            div.style.background = f.savedGradient;
            div.innerHTML = `
                <div style="padding: 30px 20px; font-family: serif; font-style: italic; color: white; font-size: 1.1rem; line-height: 1.4;">
                    „${f.text}“
                </div>
                <div class="fav-item-info">
                    <h3>${f.author}</h3>
                </div>`;
        }
        list.appendChild(div);
    });
}