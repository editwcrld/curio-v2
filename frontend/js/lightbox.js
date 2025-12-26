/**
 * Image Lightbox Module
 * Complete rewrite with proper touch gesture handling
 */

// State management
let currentScale = 1;
let translateX = 0;
let translateY = 0;
let imageElement = null;
let containerElement = null;
let overlayElement = null;

// Desktop mouse state
let isMouseDragging = false;
let mouseStartX = 0;
let mouseStartY = 0;

// Touch gesture state
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let initialTouchDistance = 0;
let initialPinchScale = 1;
let isTouchActive = false;
let isPinching = false;
let isVerticalSwipe = false;
let swipeDirection = null;

// Constants
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;
const SWIPE_CLOSE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

/**
 * Initialize lightbox
 */
export function initLightbox() {
    const artImages = document.querySelectorAll('#view-art .main-image');
    
    artImages.forEach(img => {
        img.addEventListener('click', () => {
            openLightbox(img.src);
        });
        img.style.cursor = 'zoom-in';
    });
    
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const overlay = document.getElementById('lightbox-overlay');
            if (overlay && overlay.classList.contains('active')) {
                closeLightbox();
            }
        });
    });
}

/**
 * Open lightbox
 */
export function openLightbox(imageSrc) {
    if (!document.getElementById('lightbox-overlay')) {
        createLightbox();
    }
    
    overlayElement = document.getElementById('lightbox-overlay');
    const image = document.getElementById('lightbox-image');
    const loading = document.getElementById('lightbox-loading');
    containerElement = document.getElementById('lightbox-container');
    
    resetState();
    
    loading.style.display = 'block';
    image.style.display = 'none';
    
    const img = new Image();
    img.onload = () => {
        image.src = imageSrc;
        imageElement = image;
        
        updateImageTransform();
        
        loading.style.display = 'none';
        image.style.display = 'block';
        
        overlayElement.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (window.innerWidth <= 768) {
            showSwipeIndicator();
        }
    };
    img.src = imageSrc;
}

/**
 * Close lightbox
 */
export function closeLightbox() {
    if (!overlayElement) return;
    
    overlayElement.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        resetState();
    }, 300);
}

/**
 * Reset state
 */
function resetState() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    isMouseDragging = false;
    isTouchActive = false;
    isPinching = false;
    isVerticalSwipe = false;
    swipeDirection = null;
}

/**
 * Update image transform
 */
function updateImageTransform(smooth = false) {
    if (!imageElement) return;
    
    if (smooth) {
        imageElement.classList.remove('no-transition');
    } else {
        imageElement.classList.add('no-transition');
    }
    
    imageElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
}

/**
 * Set zoom level
 */
function setZoom(scale, smooth = true) {
    currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    
    if (currentScale === MIN_SCALE) {
        translateX = 0;
        translateY = 0;
    }
    
    updateImageTransform(smooth);
    showZoomIndicator();
}

/**
 * Fit to screen
 */
function fitToScreen() {
    setZoom(1, true);
}

/**
 * Calculate distance between two touch points
 */
function getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Handle touch start
 */
function handleTouchStart(e) {
    if (!overlayElement || !overlayElement.classList.contains('active')) return;
    
    const touches = e.touches;
    isTouchActive = true;
    touchStartTime = Date.now();
    
    if (touches.length === 1) {
        // Single touch - setup for pan or swipe
        const touch = touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        mouseStartX = touchStartX - translateX;
        mouseStartY = touchStartY - translateY;
        
        isPinching = false;
        isVerticalSwipe = false;
        swipeDirection = null;
        
    } else if (touches.length === 2) {
        // Two fingers - pinch zoom
        isPinching = true;
        isVerticalSwipe = false;
        initialTouchDistance = getTouchDistance(touches[0], touches[1]);
        initialPinchScale = currentScale;
    }
}

/**
 * Handle touch move
 */
function handleTouchMove(e) {
    if (!isTouchActive || !overlayElement) return;
    
    const touches = e.touches;
    
    if (isPinching && touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        
        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const scaleChange = currentDistance / initialTouchDistance;
        const newScale = initialPinchScale * scaleChange;
        
        setZoom(newScale, false);
        
    } else if (touches.length === 1 && !isPinching) {
        const touch = touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Determine swipe direction if not yet determined
        if (!swipeDirection && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
            if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
                swipeDirection = 'vertical';
                isVerticalSwipe = true;
            } else {
                swipeDirection = 'horizontal';
            }
        }
        
        if (currentScale > MIN_SCALE) {
            // Pan zoomed image
            e.preventDefault();
            translateX = touch.clientX - mouseStartX;
            translateY = touch.clientY - mouseStartY;
            updateImageTransform(false);
            
        } else if (isVerticalSwipe && deltaY > 0) {
            // Swipe down to close (only when not zoomed)
            e.preventDefault();
            
            translateY = deltaY;
            const opacity = Math.max(0, 1 - (deltaY / 400));
            overlayElement.style.opacity = opacity;
            updateImageTransform(false);
        }
    }
}

/**
 * Handle touch end
 */
function handleTouchEnd(e) {
    if (!isTouchActive || !overlayElement) return;
    
    const touchDuration = Date.now() - touchStartTime;
    const velocity = Math.abs(translateY) / touchDuration;
    
    // Check if should close (swipe down far enough or fast enough)
    if (isVerticalSwipe && currentScale === MIN_SCALE) {
        if (translateY > SWIPE_CLOSE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
            closeLightbox();
            return;
        }
    }
    
    // Reset position and opacity if not closing
    if (overlayElement) {
        overlayElement.style.opacity = '1';
    }
    
    if (currentScale === MIN_SCALE && translateY !== 0) {
        translateY = 0;
        updateImageTransform(true);
    }
    
    isTouchActive = false;
    isPinching = false;
    isVerticalSwipe = false;
    swipeDirection = null;
}

/**
 * Handle mouse wheel zoom
 */
function handleWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = currentScale + delta;
    
    setZoom(newScale, true);
}

/**
 * Handle mouse down
 */
function handleMouseDown(e) {
    if (currentScale <= MIN_SCALE) return;
    
    isMouseDragging = true;
    mouseStartX = e.clientX - translateX;
    mouseStartY = e.clientY - translateY;
    
    if (containerElement) {
        containerElement.classList.add('dragging');
    }
    imageElement.classList.add('no-transition');
}

/**
 * Handle mouse move
 */
function handleMouseMove(e) {
    if (!isMouseDragging) return;
    
    translateX = e.clientX - mouseStartX;
    translateY = e.clientY - mouseStartY;
    
    updateImageTransform(false);
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
    if (!isMouseDragging) return;
    
    isMouseDragging = false;
    
    if (containerElement) {
        containerElement.classList.remove('dragging');
    }
    if (imageElement) {
        imageElement.classList.remove('no-transition');
    }
}

/**
 * Show zoom indicator
 */
function showZoomIndicator() {
    const indicator = document.getElementById('lightbox-zoom-indicator');
    if (!indicator) return;
    
    const percentage = Math.round(currentScale * 100);
    indicator.textContent = `${percentage}%`;
    indicator.classList.add('visible');
    
    clearTimeout(indicator.hideTimeout);
    indicator.hideTimeout = setTimeout(() => {
        indicator.classList.remove('visible');
    }, 1000);
}

/**
 * Show swipe indicator
 */
function showSwipeIndicator() {
    const indicator = document.getElementById('lightbox-swipe-indicator');
    if (!indicator) return;
    
    indicator.classList.add('visible');
    
    setTimeout(() => {
        indicator.classList.remove('visible');
    }, 3000);
}

/**
 * Create lightbox HTML
 */
function createLightbox() {
    const lightboxHTML = `
        <div id="lightbox-overlay" class="lightbox-overlay">
            <div id="lightbox-container" class="lightbox-container">
                <div id="lightbox-loading" class="lightbox-loading"></div>
                <img id="lightbox-image" class="lightbox-image" alt="Lightbox">
            </div>
            
            <button id="lightbox-close" class="lightbox-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            
            <button id="lightbox-fit" class="lightbox-fit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                Fit to Screen
            </button>
            
            <div id="lightbox-zoom-indicator" class="lightbox-zoom-indicator">100%</div>
            
            <div id="lightbox-swipe-indicator" class="lightbox-swipe-indicator">
                <svg class="lightbox-swipe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="19 12 12 19 5 12"/>
                </svg>
                Swipe down to close
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    initLightboxEvents();
}

/**
 * Initialize all lightbox event listeners
 */
function initLightboxEvents() {
    overlayElement = document.getElementById('lightbox-overlay');
    containerElement = document.getElementById('lightbox-container');
    const closeBtn = document.getElementById('lightbox-close');
    const fitBtn = document.getElementById('lightbox-fit');
    
    // Close button
    closeBtn.addEventListener('click', closeLightbox);
    
    // Fit to screen button
    fitBtn.addEventListener('click', fitToScreen);
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlayElement && overlayElement.classList.contains('active')) {
            closeLightbox();
        }
    });
    
    // Mouse events
    containerElement.addEventListener('wheel', handleWheel, { passive: false });
    containerElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events - all with proper passive settings
    containerElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    containerElement.addEventListener('touchend', handleTouchEnd, { passive: true });
}