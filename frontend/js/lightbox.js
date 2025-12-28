/**
 * Image Lightbox Module
 * Complete rewrite with bulletproof state management
 * 
 * Features:
 * - Pinch to zoom (up to 1000%)
 * - Pan when zoomed with boundary clamping
 * - Swipe down to close (only when not zoomed)
 * - Top swipe area with drag handle
 * - Mouse wheel zoom (desktop)
 * - Fit to screen button
 * - Close button
 * - ✅ Smooth slide-down close animation
 * - ✅ High-res image loading for lightbox
 * - ✅ Boundary clamping (image never leaves viewport)
 */

// ===== SINGLETON STATE =====
const LightboxState = {
    isOpen: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
    
    // Image dimensions for boundary clamping
    imageWidth: 0,
    imageHeight: 0,
    
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
    initialPinchCenter: { x: 0, y: 0 },
    
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
        this.imageWidth = 0;
        this.imageHeight = 0;
    }
};

// ===== CONSTANTS =====
const MIN_SCALE = 1;
const MAX_SCALE = 10;  // ✅ 1000% zoom
const SWIPE_CLOSE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.5;
const ZOOM_SMOOTH_DURATION = '0.25s';

// ===== INITIALIZATION =====

export function initLightbox() {
    // Make images clickable
    document.querySelectorAll('#view-art .main-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => openLightbox(img.src));
    });
}

// ===== HIGH-RES IMAGE URL =====

/**
 * Convert standard image URL to high-resolution version for lightbox
 * - ARTIC: /full/843,/ → /full/full/ (original)
 * - Rijks: =s800 → =s0 (original)
 */
function getHighResUrl(url) {
    if (!url) return url;
    
    // Art Institute of Chicago
    if (url.includes('artic.edu/iiif')) {
        // Replace /full/843,/ or /full/1686,/ with /full/full/
        return url.replace(/\/full\/\d+,\//, '/full/full/');
    }
    
    // Rijksmuseum
    if (url.includes('rijksmuseum.nl')) {
        // Replace =s800 or =s400 with =s0 (original)
        return url.replace(/=s\d+/, '=s0');
    }
    
    return url;
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
    LightboxState.image.style.opacity = '1';
    
    // Show loading
    loading.style.display = 'block';
    LightboxState.image.style.display = 'none';
    
    // ✅ Get high-res URL for lightbox
    const highResUrl = getHighResUrl(imageSrc);
    
    // Load image
    const img = new Image();
    img.onload = () => {
        LightboxState.image.src = highResUrl;
        
        // Store image dimensions for boundary clamping
        LightboxState.imageWidth = img.naturalWidth;
        LightboxState.imageHeight = img.naturalHeight;
        
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
        // Fallback to original URL if high-res fails
        if (highResUrl !== imageSrc) {
            img.src = imageSrc;
        } else {
            loading.style.display = 'none';
            closeLightbox();
        }
    };
    img.src = highResUrl;
}

/**
 * ✅ Close with smooth slide-down animation
 */
export function closeLightbox(withSlideDown = false) {
    if (!LightboxState.isOpen) return;
    
    // Mark as closed immediately to prevent race conditions
    LightboxState.isOpen = false;
    
    const overlay = LightboxState.overlay;
    const image = LightboxState.image;
    if (!overlay) return;
    
    document.body.style.overflow = '';
    
    if (withSlideDown && image) {
        // ✅ Smooth slide down + fade out
        image.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        image.style.transform = `translate(${LightboxState.translateX}px, ${window.innerHeight}px) scale(${LightboxState.scale})`;
        image.style.opacity = '0';
        
        overlay.style.transition = 'opacity 0.3s ease-out';
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.classList.remove('active');
            cleanupAfterClose();
        }, 300);
    } else {
        // Normal fade out
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.classList.remove('active');
        
        setTimeout(() => {
            cleanupAfterClose();
        }, 300);
    }
}

function cleanupAfterClose() {
    LightboxState.reset();
    if (LightboxState.image) {
        LightboxState.image.style.transform = '';
        LightboxState.image.style.opacity = '';
        LightboxState.image.style.transition = '';
    }
    if (LightboxState.overlay) {
        LightboxState.overlay.style.opacity = '';
        LightboxState.overlay.style.transition = '';
    }
}

// ===== BOUNDARY CLAMPING =====

/**
 * ✅ Clamp translation so image never leaves viewport
 */
function clampTranslation() {
    const img = LightboxState.image;
    if (!img) return;
    
    const rect = img.getBoundingClientRect();
    const containerRect = LightboxState.container.getBoundingClientRect();
    
    // Calculate scaled image dimensions
    const scaledWidth = rect.width;
    const scaledHeight = rect.height;
    
    const viewportWidth = containerRect.width;
    const viewportHeight = containerRect.height;
    
    // If image is smaller than viewport, center it
    if (scaledWidth <= viewportWidth) {
        LightboxState.translateX = 0;
    } else {
        // Calculate max translation (half of overflow on each side)
        const maxTranslateX = (scaledWidth - viewportWidth) / 2;
        LightboxState.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, LightboxState.translateX));
    }
    
    if (scaledHeight <= viewportHeight) {
        LightboxState.translateY = 0;
    } else {
        const maxTranslateY = (scaledHeight - viewportHeight) / 2;
        LightboxState.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, LightboxState.translateY));
    }
}

// ===== TRANSFORM =====

function applyTransform(smooth = false) {
    const img = LightboxState.image;
    if (!img) return;
    
    // ✅ Smoother transition
    img.style.transition = smooth ? `transform ${ZOOM_SMOOTH_DURATION} cubic-bezier(0.25, 0.1, 0.25, 1)` : 'none';
    img.style.transform = `translate(${LightboxState.translateX}px, ${LightboxState.translateY}px) scale(${LightboxState.scale})`;
}

function setScale(newScale, smooth = true, centerX = null, centerY = null) {
    const oldScale = LightboxState.scale;
    LightboxState.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    // ✅ Zoom towards center point (pinch center or viewport center)
    if (centerX !== null && centerY !== null && oldScale !== LightboxState.scale) {
        const containerRect = LightboxState.container.getBoundingClientRect();
        const imgCenterX = containerRect.width / 2;
        const imgCenterY = containerRect.height / 2;
        
        // Calculate offset from center
        const offsetX = centerX - imgCenterX;
        const offsetY = centerY - imgCenterY;
        
        // Adjust translation based on scale change
        const scaleRatio = LightboxState.scale / oldScale;
        LightboxState.translateX = LightboxState.translateX * scaleRatio - offsetX * (scaleRatio - 1);
        LightboxState.translateY = LightboxState.translateY * scaleRatio - offsetY * (scaleRatio - 1);
    }
    
    // Reset position when fully zoomed out
    if (LightboxState.scale === MIN_SCALE) {
        LightboxState.translateX = 0;
        LightboxState.translateY = 0;
    } else {
        // ✅ Apply boundary clamping
        clampTranslation();
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
        
        // ✅ Store pinch center for zoom-towards-point
        LightboxState.initialPinchCenter = {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
        
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
        const newScale = LightboxState.initialPinchScale * scaleRatio;
        
        // ✅ Zoom towards pinch center
        setScale(newScale, false, LightboxState.initialPinchCenter.x, LightboxState.initialPinchCenter.y);
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
        
        // ✅ Apply boundary clamping during pan
        clampTranslation();
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
            // ✅ Close with smooth slide-down animation
            closeLightbox(true);
        } else {
            // Snap back smoothly
            LightboxState.translateY = 0;
            LightboxState.overlay.style.transition = 'opacity 0.25s ease';
            LightboxState.overlay.style.opacity = '';
            applyTransform(true);
        }
    } else if (gestureType === 'pan' || gestureType === 'pinch') {
        // ✅ Smooth snap to boundaries after gesture ends
        clampTranslation();
        applyTransform(true);
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
    } else {
        clampTranslation();
    }
    
    LightboxState.overlay.style.transition = 'opacity 0.3s ease';
    LightboxState.overlay.style.opacity = '';
    applyTransform(true);
}

// ===== MOUSE HANDLERS (Desktop) =====

function handleWheel(e) {
    if (!LightboxState.isOpen) return;
    e.preventDefault();
    
    // ✅ Smoother zoom steps
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newScale = LightboxState.scale * (1 + delta);
    
    // ✅ Zoom towards mouse position
    setScale(newScale, true, e.clientX, e.clientY);
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
    
    // ✅ Apply boundary clamping during drag
    clampTranslation();
    applyTransform(false);
}

function handleMouseUp() {
    if (!LightboxState.isDragging) return;
    
    LightboxState.isDragging = false;
    if (LightboxState.container) {
        LightboxState.container.style.cursor = 'grab';
    }
    
    // ✅ Smooth snap to boundaries
    clampTranslation();
    applyTransform(true);
}

// ===== DOUBLE TAP TO ZOOM =====

let lastTapTime = 0;

function handleDoubleTap(e) {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double tap detected
        e.preventDefault();
        
        if (LightboxState.scale > MIN_SCALE) {
            // Zoom out
            setScale(MIN_SCALE, true);
        } else {
            // Zoom in to 300% at tap position
            const touch = e.changedTouches ? e.changedTouches[0] : e;
            setScale(3, true, touch.clientX, touch.clientY);
        }
        
        lastTapTime = 0;
    } else {
        lastTapTime = now;
    }
}

// ===== TOP SWIPE AREA CLOSE =====

function initTopSwipeAreaClose(swipeArea) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    // Touch events
    swipeArea.addEventListener('touchstart', (e) => {
        if (!LightboxState.isOpen) return;
        isDragging = true;
        startY = e.touches[0].clientY;
        currentY = startY;
    }, { passive: true });
    
    swipeArea.addEventListener('touchmove', (e) => {
        if (!isDragging || !LightboxState.isOpen) return;
        e.preventDefault();
        
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        // Only allow downward movement
        if (deltaY > 0) {
            LightboxState.translateY = deltaY;
            const opacity = Math.max(0.3, 1 - (deltaY / 250));
            LightboxState.overlay.style.opacity = opacity;
            LightboxState.overlay.style.transition = 'none';
            applyTransform(false);
        }
    }, { passive: false });
    
    swipeArea.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaY = currentY - startY;
        
        if (deltaY > 80) {
            // ✅ Close with slide-down
            closeLightbox(true);
        } else {
            // Snap back
            LightboxState.translateY = 0;
            LightboxState.overlay.style.transition = 'opacity 0.25s ease';
            LightboxState.overlay.style.opacity = '';
            applyTransform(true);
        }
    }, { passive: true });
    
    // Mouse events (desktop)
    swipeArea.addEventListener('mousedown', (e) => {
        if (!LightboxState.isOpen) return;
        isDragging = true;
        startY = e.clientY;
        currentY = startY;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !LightboxState.isOpen) return;
        
        currentY = e.clientY;
        const deltaY = currentY - startY;
        
        if (deltaY > 0) {
            LightboxState.translateY = deltaY;
            const opacity = Math.max(0.3, 1 - (deltaY / 250));
            LightboxState.overlay.style.opacity = opacity;
            LightboxState.overlay.style.transition = 'none';
            applyTransform(false);
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaY = currentY - startY;
        
        if (deltaY > 80) {
            // ✅ Close with slide-down
            closeLightbox(true);
        } else {
            LightboxState.translateY = 0;
            LightboxState.overlay.style.transition = 'opacity 0.25s ease';
            LightboxState.overlay.style.opacity = '';
            applyTransform(true);
        }
    });
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
            <!-- Top Swipe Area (drag handle + zoom indicator zone) -->
            <div id="lightbox-top-swipe-area" class="lightbox-top-swipe-area">
                <div class="lightbox-drag-handle-bar"></div>
                <div id="lightbox-zoom-indicator" class="lightbox-zoom-indicator">100%</div>
            </div>
            
            <div id="lightbox-container" class="lightbox-container">
                <div id="lightbox-loading" class="lightbox-loading"></div>
                <img id="lightbox-image" class="lightbox-image" alt="Lightbox">
            </div>
            
            <!-- Bottom Controls - Fit and Close together -->
            <div class="lightbox-controls">
                <button id="lightbox-fit" class="lightbox-fit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    Fit
                </button>
                <button id="lightbox-close" class="lightbox-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            
            <div id="lightbox-swipe-indicator" class="lightbox-swipe-indicator">
                <svg class="lightbox-swipe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    document.getElementById('lightbox-close').addEventListener('click', () => closeLightbox(false));
    document.getElementById('lightbox-fit').addEventListener('click', fitToScreen);
    
    // Top swipe area - drag down to close
    const topSwipeArea = document.getElementById('lightbox-top-swipe-area');
    initTopSwipeAreaClose(topSwipeArea);
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && LightboxState.isOpen) {
            closeLightbox(false);
        }
    });
    
    // Touch events on container
    LightboxState.container.addEventListener('touchstart', handleTouchStart, { passive: false });
    LightboxState.container.addEventListener('touchmove', handleTouchMove, { passive: false });
    LightboxState.container.addEventListener('touchend', (e) => {
        handleTouchEnd(e);
        handleDoubleTap(e);  // ✅ Double tap to zoom
    }, { passive: false });
    LightboxState.container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    // Mouse events
    LightboxState.container.addEventListener('wheel', handleWheel, { passive: false });
    LightboxState.container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // ✅ Double click to zoom (desktop)
    LightboxState.container.addEventListener('dblclick', (e) => {
        if (LightboxState.scale > MIN_SCALE) {
            setScale(MIN_SCALE, true);
        } else {
            setScale(3, true, e.clientX, e.clientY);
        }
    });
    
    // Click on background to close (only when not zoomed)
    LightboxState.overlay.addEventListener('click', (e) => {
        if (e.target === LightboxState.overlay && LightboxState.scale === MIN_SCALE) {
            closeLightbox(false);
        }
    });
}