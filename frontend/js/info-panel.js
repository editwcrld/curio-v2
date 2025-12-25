/**
 * Info Panel Module
 * Handles expandable info sections and favorite button interactions
 */

export function initInfoPanels() {
    const infoSections = document.querySelectorAll('.info-section');
    
    infoSections.forEach(section => {
        section.addEventListener('click', (e) => {
            // Don't expand when clicking favorite button
            if (!e.target.closest('.fav-btn')) {
                section.classList.toggle('expanded');
            }
        });
    });
}

export function initFavoriteButtons(onToggle) {
    const favButtons = document.querySelectorAll('.fav-btn');
    
    favButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Call the callback function with the current view context
            if (typeof onToggle === 'function') {
                const viewElement = e.target.closest('.view');
                const viewType = viewElement ? viewElement.id.replace('view-', '') : null;
                onToggle(viewType);
            }
        });
    });
}

export function updateFavoriteButtonState(viewType, isFavorite) {
    const view = document.getElementById(`view-${viewType}`);
    if (!view) return;
    
    const favBtn = view.querySelector('.fav-btn');
    if (favBtn) {
        favBtn.classList.toggle('active', isFavorite);
    }
}