/**
 * Swipe Handler Module
 * Handles touch swipe gestures for navigation
 */

let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

const SWIPE_THRESHOLD = 75; // Minimum distance for swipe
const SWIPE_VERTICAL_TOLERANCE = 150; // Max vertical movement allowed

/**
 * Initialize swipe handlers
 */
export function initSwipeHandler(onNext, onPrevious) {
    const artView = document.getElementById('view-art');
    const quotesView = document.getElementById('view-quotes');
      
    if (artView) {
        addSwipeListeners(artView, onNext, onPrevious);
    }
    
    if (quotesView) {
        addSwipeListeners(quotesView, onNext, onPrevious);
    }
}

/**
 * Add swipe listeners to element
 */
function addSwipeListeners(element, onNext, onPrevious) {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', (e) => handleTouchEnd(e, onNext, onPrevious), { passive: true });
}

/**
 * Handle touch start
 */
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

/**
 * Handle touch end
 */
function handleTouchEnd(e, onNext, onPrevious) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    handleSwipe(onNext, onPrevious);
}

/**
 * Determine swipe direction
 */
function handleSwipe(onNext, onPrevious) {
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);
    
   
    // Check if vertical movement is too much (probably scrolling)
    if (diffY > SWIPE_VERTICAL_TOLERANCE) {
        return;
    }
    
    // Swipe left (next) - moving finger to the left
    if (diffX < -SWIPE_THRESHOLD) {
        if (typeof onNext === 'function') {
            onNext();
        }
    }
    
    // Swipe right (previous) - moving finger to the right
    if (diffX > SWIPE_THRESHOLD) {
        if (typeof onPrevious === 'function') {
            onPrevious();
        }
    }
}

/**
 * Remove swipe listeners (cleanup)
 */
export function removeSwipeHandler() {
    const artView = document.getElementById('view-art');
    const quotesView = document.getElementById('view-quotes');
    
    if (artView) {
        artView.removeEventListener('touchstart', handleTouchStart);
        artView.removeEventListener('touchend', handleTouchEnd);
    }
    
    if (quotesView) {
        quotesView.removeEventListener('touchstart', handleTouchStart);
        quotesView.removeEventListener('touchend', handleTouchEnd);
    }
}