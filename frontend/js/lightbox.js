/**
 * Image Lightbox Module
 * Complete rewrite with bulletproof state management
 * 
 * Features:
 * - Pinch to zoom
 * - Pan when zoomed
 * - Swipe down to close (only when not zoomed)
 * - Mouse wheel zoom (desktop)
 * - Fit to screen button
 * - Close button
 */

// ===== SINGLETON STATE =====
const LightboxState = {
    isOpen: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
    
    // Touch tracking
    touchStartY: 0,
    touchStartX: 0,
    touchStartTime: 0,
    lastTouchY: 0,
    lastTouchX: 0,
    
    // Gesture detection
    gestureType: null, // 'none' | 'pan' | 'pinch' | 'swipe-close'
    initialPinchDistance: 0,
    initialPinchScale: 1,
    
    // Mouse drag (desktop)
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    
    // DOM references
    overlay: null,
    container: null,
    image: null,
    
    reset() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.gestureType = null;
        this.isDragging = false;
    }
};

// ===== CONSTANTS =====
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SWIPE_CLOSE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

// ===== INITIALIZATION =====

export function initLightbox() {
    // Make images clickable
    document.querySelectorAll('#view-art .main-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => openLightbox(img.src));
    });
}

// ===== OPEN / CLOSE =====

export function openLightbox(imageSrc) {
    // Prevent double-open
    if (LightboxState.isOpen) return;
    
    // Create DOM if needed
    if (!document.getElementById('lightbox-overlay')) {
        createLightboxDOM();
    }
    
    // Get references
    LightboxState.overlay = document.getElementById('lightbox-overlay');
    LightboxState.container = document.getElementById('lightbox-container');
    LightboxState.image = document.getElementById('lightbox-image');
    
    const loading = document.getElementById('lightbox-loading');
    
    // Reset state
    LightboxState.reset();
    applyTransform(false);
    
    // Reset overlay opacity (critical fix!)
    LightboxState.overlay.style.opacity = '';
    LightboxState.overlay.style.transition = 'opacity 0.3s ease';
    
    // Show loading
    loading.style.display = 'block';
    LightboxState.image.style.display = 'none';
    
    // Load image
    const img = new Image();
    img.onload = () => {
        LightboxState.image.src = imageSrc;
        loading.style.display = 'none';
        LightboxState.image.style.display = 'block';
        
        // Activate
        LightboxState.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        LightboxState.isOpen = true;
        
        // Show hint on mobile
        if (window.innerWidth <= 768) {
            showSwipeHint();
        }
    };
    img.onerror = () => {
        loading.style.display = 'none';
        closeLightbox();
    };
    img.src = imageSrc;
}

export function closeLightbox() {
    if (!LightboxState.isOpen) return;
    
    // Mark as closed immediately to prevent race conditions
    LightboxState.isOpen = false;
    
    const overlay = LightboxState.overlay;
    if (!overlay) return;
    
    // Animate out
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clean up after animation
    setTimeout(() => {
        LightboxState.reset();
        if (LightboxState.image) {
            LightboxState.image.style.transform = '';
        }
        // Reset opacity to default
        if (overlay) {
            overlay.style.opacity = '';
        }
    }, 300);
}

// ===== TRANSFORM =====

function applyTransform(smooth = false) {
    const img = LightboxState.image;
    if (!img) return;
    
    img.style.transition = smooth ? 'transform 0.3s ease' : 'none';
    img.style.transform = `translate(${LightboxState.translateX}px, ${LightboxState.translateY}px) scale(${LightboxState.scale})`;
}

function setScale(newScale, smooth = true) {
    LightboxState.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    // Reset position when fully zoomed out
    if (LightboxState.scale === MIN_SCALE) {
        LightboxState.translateX = 0;
        LightboxState.translateY = 0;
    }
    
    applyTransform(smooth);
    showZoomIndicator();
}

function fitToScreen() {
    setScale(1, true);
}

// ===== TOUCH HANDLERS =====

function handleTouchStart(e) {
    if (!LightboxState.isOpen) return;
    
    const touches = e.touches;
    LightboxState.touchStartTime = Date.now();
    
    if (touches.length === 2) {
        // PINCH START
        e.preventDefault();
        LightboxState.gestureType = 'pinch';
        LightboxState.initialPinchDistance = getTouchDistance(touches[0], touches[1]);
        LightboxState.initialPinchScale = LightboxState.scale;
        
    } else if (touches.length === 1) {
        // SINGLE TOUCH START
        const touch = touches[0];
        LightboxState.touchStartX = touch.clientX;
        LightboxState.touchStartY = touch.clientY;
        LightboxState.lastTouchX = touch.clientX;
        LightboxState.lastTouchY = touch.clientY;
        LightboxState.gestureType = null; // Will be determined on move
    }
}

function handleTouchMove(e) {
    if (!LightboxState.isOpen) return;
    
    const touches = e.touches;
    
    if (LightboxState.gestureType === 'pinch' && touches.length === 2) {
        // PINCH ZOOM
        e.preventDefault();
        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const scaleRatio = currentDistance / LightboxState.initialPinchDistance;
        setScale(LightboxState.initialPinchScale * scaleRatio, false);
        return;
    }
    
    if (touches.length !== 1) return;
    
    const touch = touches[0];
    const deltaX = touch.clientX - LightboxState.touchStartX;
    const deltaY = touch.clientY - LightboxState.touchStartY;
    const moveDeltaX = touch.clientX - LightboxState.lastTouchX;
    const moveDeltaY = touch.clientY - LightboxState.lastTouchY;
    
    // Determine gesture type on first significant move
    if (!LightboxState.gestureType) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX < 10 && absY < 10) {
            // Not enough movement yet
            return;
        }
        
        if (LightboxState.scale > MIN_SCALE) {
            // Zoomed in = always pan
            LightboxState.gestureType = 'pan';
        } else if (deltaY > 0 && absY > absX * 1.2) {
            // Swiping down and more vertical than horizontal
            LightboxState.gestureType = 'swipe-close';
        } else {
            // Horizontal swipe - ignore (let it pass through)
            LightboxState.gestureType = 'ignore';
        }
    }
    
    // Handle based on gesture type
    if (LightboxState.gestureType === 'pan') {
        e.preventDefault();
        LightboxState.translateX += moveDeltaX;
        LightboxState.translateY += moveDeltaY;
        applyTransform(false);
        
    } else if (LightboxState.gestureType === 'swipe-close') {
        e.preventDefault();
        // Only allow downward movement
        const swipeY = Math.max(0, deltaY);
        LightboxState.translateY = swipeY;
        
        // Fade overlay based on swipe distance
        const opacity = Math.max(0.3, 1 - (swipeY / 300));
        LightboxState.overlay.style.opacity = opacity;
        LightboxState.overlay.style.transition = 'none';
        
        applyTransform(false);
    }
    
    LightboxState.lastTouchX = touch.clientX;
    LightboxState.lastTouchY = touch.clientY;
}

function handleTouchEnd(e) {
    if (!LightboxState.isOpen) return;
    
    const gestureType = LightboxState.gestureType;
    const duration = Date.now() - LightboxState.touchStartTime;
    const velocity = Math.abs(LightboxState.translateY) / Math.max(duration, 1);
    
    if (gestureType === 'swipe-close') {
        // Check if should close
        const shouldClose = 
            LightboxState.translateY > SWIPE_CLOSE_THRESHOLD || 
            velocity > SWIPE_VELOCITY_THRESHOLD;
        
        if (shouldClose) {
            closeLightbox();
        } else {
            // Snap back
            LightboxState.translateY = 0;
            LightboxState.overlay.style.transition = 'opacity 0.3s ease';
            LightboxState.overlay.style.opacity = '';
            applyTransform(true);
        }
    }
    
    // Reset gesture
    LightboxState.gestureType = null;
}

function handleTouchCancel() {
    if (!LightboxState.isOpen) return;
    
    // Reset everything on cancel
    LightboxState.gestureType = null;
    
    if (LightboxState.scale === MIN_SCALE) {
        LightboxState.translateX = 0;
        LightboxState.translateY = 0;
    }
    
    LightboxState.overlay.style.transition = 'opacity 0.3s ease';
    LightboxState.overlay.style.opacity = '';
    applyTransform(true);
}

// ===== MOUSE HANDLERS (Desktop) =====

function handleWheel(e) {
    if (!LightboxState.isOpen) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    setScale(LightboxState.scale + delta, true);
}

function handleMouseDown(e) {
    if (!LightboxState.isOpen || LightboxState.scale <= MIN_SCALE) return;
    
    LightboxState.isDragging = true;
    LightboxState.dragStartX = e.clientX - LightboxState.translateX;
    LightboxState.dragStartY = e.clientY - LightboxState.translateY;
    
    LightboxState.container.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (!LightboxState.isDragging) return;
    
    LightboxState.translateX = e.clientX - LightboxState.dragStartX;
    LightboxState.translateY = e.clientY - LightboxState.dragStartY;
    applyTransform(false);
}

function handleMouseUp() {
    if (!LightboxState.isDragging) return;
    
    LightboxState.isDragging = false;
    if (LightboxState.container) {
        LightboxState.container.style.cursor = 'grab';
    }
}

// ===== UTILITIES =====

function getTouchDistance(t1, t2) {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function showZoomIndicator() {
    const indicator = document.getElementById('lightbox-zoom-indicator');
    if (!indicator) return;
    
    indicator.textContent = `${Math.round(LightboxState.scale * 100)}%`;
    indicator.classList.add('visible');
    
    clearTimeout(indicator._timeout);
    indicator._timeout = setTimeout(() => {
        indicator.classList.remove('visible');
    }, 1000);
}

function showSwipeHint() {
    const hint = document.getElementById('lightbox-swipe-indicator');
    if (!hint) return;
    
    hint.classList.add('visible');
    setTimeout(() => hint.classList.remove('visible'), 2500);
}

// ===== DOM CREATION =====

function createLightboxDOM() {
    const html = `
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="19 12 12 19 5 12"/>
                </svg>
                Swipe down to close
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Get references
    LightboxState.overlay = document.getElementById('lightbox-overlay');
    LightboxState.container = document.getElementById('lightbox-container');
    
    // Buttons
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-fit').addEventListener('click', fitToScreen);
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && LightboxState.isOpen) {
            closeLightbox();
        }
    });
    
    // Touch events on container
    LightboxState.container.addEventListener('touchstart', handleTouchStart, { passive: false });
    LightboxState.container.addEventListener('touchmove', handleTouchMove, { passive: false });
    LightboxState.container.addEventListener('touchend', handleTouchEnd, { passive: true });
    LightboxState.container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    // Mouse events
    LightboxState.container.addEventListener('wheel', handleWheel, { passive: false });
    LightboxState.container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Click on background to close (only when not zoomed)
    LightboxState.overlay.addEventListener('click', (e) => {
        if (e.target === LightboxState.overlay && LightboxState.scale === MIN_SCALE) {
            closeLightbox();
        }
    });
}