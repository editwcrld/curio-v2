/**
 * Image Lightbox Module - Clean Rewrite
 * 
 * Best Practices:
 * ✅ Zoom 100% - 700%
 * ✅ Double-tap/click to zoom 300%
 * ✅ Pinch-to-zoom (touch)
 * ✅ Mouse wheel zoom (desktop)
 * ✅ Pan when zoomed (boundaries enforced - NO black edges ever)
 * ✅ Swipe down to close (via top handle)
 * ✅ X button for desktop
 * ✅ Fit-to-screen button
 * ✅ High-res image loading
 */

// ===== STATE =====
const State = {
    isOpen: false,
    scale: 1,
    x: 0,
    y: 0,
    
    // Image dimensions
    imgNaturalWidth: 0,
    imgNaturalHeight: 0,
    imgDisplayWidth: 0,
    imgDisplayHeight: 0,
    
    // Container dimensions
    containerWidth: 0,
    containerHeight: 0,
    
    // Touch tracking
    lastTouchX: 0,
    lastTouchY: 0,
    isPanning: false,
    isPinching: false,
    initialPinchDist: 0,
    initialScale: 1,
    pinchMidX: 0,
    pinchMidY: 0,
    
    // Double tap detection
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    
    // Mouse drag
    isMouseDragging: false,
    
    // Swipe to close
    isSwipingToClose: false,
    swipeStartY: 0,
    
    // DOM references
    overlay: null,
    container: null,
    image: null,
    
    reset() {
        this.scale = 1;
        this.x = 0;
        this.y = 0;
        this.isPanning = false;
        this.isPinching = false;
        this.isMouseDragging = false;
        this.isSwipingToClose = false;
        this.lastTapTime = 0;
    }
};

// ===== CONSTANTS =====
const MIN_SCALE = 1;
const MAX_SCALE = 7;
const DOUBLE_TAP_ZOOM = 3;
const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_DISTANCE = 50;
const ANIMATION_DURATION = 250;

// ===== INIT =====

export function initLightbox() {
    document.querySelectorAll('#view-art .main-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => openLightbox(img.src));
    });
}

// ===== HIGH-RES URL =====

function getHighResUrl(url) {
    if (!url) return url;
    
    // Art Institute of Chicago - get full resolution
    if (url.includes('artic.edu/iiif')) {
        return url.replace(/\/full\/\d+,\//, '/full/full/');
    }
    
    // Rijksmuseum - get full resolution
    if (url.includes('googleusercontent.com') || url.includes('rijksmuseum.nl')) {
        return url.replace(/=s\d+/, '=s0');
    }
    
    return url;
}

// ===== BOUNDARY CALCULATION =====

function updateDimensions() {
    if (!State.image || !State.container) return;
    
    const containerRect = State.container.getBoundingClientRect();
    State.containerWidth = containerRect.width;
    State.containerHeight = containerRect.height;
    
    // Get the displayed size of the image at scale 1
    const imgRect = State.image.getBoundingClientRect();
    State.imgDisplayWidth = imgRect.width / State.scale;
    State.imgDisplayHeight = imgRect.height / State.scale;
}

function getBounds() {
    // Calculate how far the image can move before showing black
    const scaledWidth = State.imgDisplayWidth * State.scale;
    const scaledHeight = State.imgDisplayHeight * State.scale;
    
    // If image is smaller than container, no movement allowed
    const maxX = Math.max(0, (scaledWidth - State.containerWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - State.containerHeight) / 2);
    
    return { minX: -maxX, maxX, minY: -maxY, maxY };
}

function clampPosition() {
    const bounds = getBounds();
    State.x = Math.max(bounds.minX, Math.min(bounds.maxX, State.x));
    State.y = Math.max(bounds.minY, Math.min(bounds.maxY, State.y));
}

// ===== TRANSFORM =====

function applyTransform(animate = false) {
    if (!State.image) return;
    
    State.image.style.transition = animate 
        ? `transform ${ANIMATION_DURATION}ms ease-out` 
        : 'none';
    State.image.style.transform = `translate(${State.x}px, ${State.y}px) scale(${State.scale})`;
}

function setScale(newScale, animate = true, centerX = null, centerY = null) {
    const oldScale = State.scale;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    if (newScale === oldScale) return;
    
    // Default center is screen center
    if (centerX === null) centerX = State.containerWidth / 2;
    if (centerY === null) centerY = State.containerHeight / 2;
    
    // Adjust position to zoom toward the center point
    const ratio = newScale / oldScale;
    
    // Calculate offset from center
    const offsetX = centerX - State.containerWidth / 2;
    const offsetY = centerY - State.containerHeight / 2;
    
    // Adjust position
    State.x = (State.x - offsetX) * ratio + offsetX;
    State.y = (State.y - offsetY) * ratio + offsetY;
    State.scale = newScale;
    
    // Reset position if zoomed all the way out
    if (State.scale === MIN_SCALE) {
        State.x = 0;
        State.y = 0;
    } else {
        clampPosition();
    }
    
    applyTransform(animate);
    showZoomIndicator();
}

// ===== OPEN / CLOSE =====

export function openLightbox(imageSrc) {
    if (State.isOpen) return;
    
    if (!document.getElementById('lightbox-overlay')) {
        createDOM();
    }
    
    State.overlay = document.getElementById('lightbox-overlay');
    State.container = document.getElementById('lightbox-container');
    State.image = document.getElementById('lightbox-image');
    
    const loading = document.getElementById('lightbox-loading');
    
    State.reset();
    
    // Show loading
    loading.style.display = 'block';
    State.image.style.display = 'none';
    State.image.style.opacity = '0';
    
    // Reset overlay
    State.overlay.style.opacity = '';
    State.overlay.style.transition = '';
    
    const highResUrl = getHighResUrl(imageSrc);
    
    const img = new Image();
    img.onload = () => {
        State.imgNaturalWidth = img.naturalWidth;
        State.imgNaturalHeight = img.naturalHeight;
        
        State.image.src = highResUrl;
        loading.style.display = 'none';
        State.image.style.display = 'block';
        
        // Wait for image to render, then get dimensions
        requestAnimationFrame(() => {
            updateDimensions();
            State.image.style.opacity = '1';
            applyTransform(false);
        });
        
        State.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        State.isOpen = true;
        
        // Show hint on mobile
        if (window.innerWidth <= 768) {
            showSwipeHint();
        }
    };
    
    img.onerror = () => {
        // Fallback to original URL
        if (highResUrl !== imageSrc) {
            img.src = imageSrc;
        } else {
            loading.style.display = 'none';
            closeLightbox();
        }
    };
    
    img.src = highResUrl;
}

export function closeLightbox(slideDown = false) {
    if (!State.isOpen) return;
    State.isOpen = false;
    
    document.body.style.overflow = '';
    
    if (slideDown && State.image) {
        State.image.style.transition = `transform ${ANIMATION_DURATION}ms ease-out, opacity ${ANIMATION_DURATION}ms ease-out`;
        State.image.style.transform = `translate(${State.x}px, ${window.innerHeight}px) scale(${State.scale})`;
        State.image.style.opacity = '0';
        
        State.overlay.style.transition = `opacity ${ANIMATION_DURATION}ms ease-out`;
        State.overlay.style.opacity = '0';
        
        setTimeout(() => {
            State.overlay.classList.remove('active');
            resetStyles();
        }, ANIMATION_DURATION);
    } else {
        State.overlay.classList.remove('active');
        setTimeout(resetStyles, ANIMATION_DURATION);
    }
}

function resetStyles() {
    if (State.image) {
        State.image.style.transform = '';
        State.image.style.transition = '';
        State.image.style.opacity = '';
    }
    if (State.overlay) {
        State.overlay.style.opacity = '';
        State.overlay.style.transition = '';
    }
    State.reset();
}

function fitToScreen() {
    setScale(MIN_SCALE, true);
}

// ===== TOUCH HANDLERS =====

function handleTouchStart(e) {
    if (!State.isOpen) return;
    
    const touches = e.touches;
    
    if (touches.length === 2) {
        // Pinch start
        e.preventDefault();
        State.isPinching = true;
        State.isPanning = false;
        State.initialPinchDist = getTouchDistance(touches[0], touches[1]);
        State.initialScale = State.scale;
        State.pinchMidX = (touches[0].clientX + touches[1].clientX) / 2;
        State.pinchMidY = (touches[0].clientY + touches[1].clientY) / 2;
        
    } else if (touches.length === 1) {
        State.lastTouchX = touches[0].clientX;
        State.lastTouchY = touches[0].clientY;
        
        // Check for double tap
        const now = Date.now();
        const timeDiff = now - State.lastTapTime;
        const dist = Math.hypot(
            touches[0].clientX - State.lastTapX,
            touches[0].clientY - State.lastTapY
        );
        
        if (timeDiff < DOUBLE_TAP_DELAY && dist < DOUBLE_TAP_DISTANCE) {
            // Double tap detected
            e.preventDefault();
            if (State.scale > MIN_SCALE) {
                setScale(MIN_SCALE, true);
            } else {
                setScale(DOUBLE_TAP_ZOOM, true, touches[0].clientX, touches[0].clientY);
            }
            State.lastTapTime = 0;
            return;
        }
        
        State.lastTapTime = now;
        State.lastTapX = touches[0].clientX;
        State.lastTapY = touches[0].clientY;
    }
}

function handleTouchMove(e) {
    if (!State.isOpen) return;
    
    const touches = e.touches;
    
    // Pinch zoom
    if (State.isPinching && touches.length === 2) {
        e.preventDefault();
        
        const dist = getTouchDistance(touches[0], touches[1]);
        const newScale = State.initialScale * (dist / State.initialPinchDist);
        
        // Direct scale update without animation
        const oldScale = State.scale;
        State.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        
        if (oldScale !== State.scale) {
            // Adjust position to zoom toward pinch center
            const ratio = State.scale / oldScale;
            const offsetX = State.pinchMidX - State.containerWidth / 2;
            const offsetY = State.pinchMidY - State.containerHeight / 2;
            
            State.x = (State.x - offsetX) * ratio + offsetX;
            State.y = (State.y - offsetY) * ratio + offsetY;
            
            clampPosition();
            applyTransform(false);
            showZoomIndicator();
        }
        return;
    }
    
    // Single finger pan (only when zoomed)
    if (touches.length === 1 && State.scale > MIN_SCALE) {
        e.preventDefault();
        State.isPanning = true;
        
        const touch = touches[0];
        const deltaX = touch.clientX - State.lastTouchX;
        const deltaY = touch.clientY - State.lastTouchY;
        
        State.x += deltaX;
        State.y += deltaY;
        
        // Clamp immediately - never allow out of bounds
        clampPosition();
        
        State.lastTouchX = touch.clientX;
        State.lastTouchY = touch.clientY;
        
        applyTransform(false);
    }
}

function handleTouchEnd(e) {
    if (!State.isOpen) return;
    
    if (State.isPinching) {
        State.isPinching = false;
        // Ensure final position is valid
        clampPosition();
        applyTransform(true);
    }
    
    State.isPanning = false;
}

function handleTouchCancel() {
    State.isPinching = false;
    State.isPanning = false;
    clampPosition();
    applyTransform(true);
}

// ===== MOUSE HANDLERS =====

function handleWheel(e) {
    if (!State.isOpen) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newScale = State.scale * (1 + delta);
    
    setScale(newScale, false, e.clientX, e.clientY);
}

function handleMouseDown(e) {
    if (!State.isOpen || State.scale <= MIN_SCALE) return;
    
    e.preventDefault();
    State.isMouseDragging = true;
    State.lastTouchX = e.clientX;
    State.lastTouchY = e.clientY;
    State.container.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (!State.isMouseDragging) return;
    
    const deltaX = e.clientX - State.lastTouchX;
    const deltaY = e.clientY - State.lastTouchY;
    
    State.x += deltaX;
    State.y += deltaY;
    
    // Clamp immediately
    clampPosition();
    
    State.lastTouchX = e.clientX;
    State.lastTouchY = e.clientY;
    
    applyTransform(false);
}

function handleMouseUp() {
    if (!State.isMouseDragging) return;
    
    State.isMouseDragging = false;
    State.container.style.cursor = State.scale > MIN_SCALE ? 'grab' : 'default';
}

function handleDoubleClick(e) {
    if (!State.isOpen) return;
    
    if (State.scale > MIN_SCALE) {
        setScale(MIN_SCALE, true);
    } else {
        setScale(DOUBLE_TAP_ZOOM, true, e.clientX, e.clientY);
    }
}

// ===== TOP SWIPE TO CLOSE =====

function initTopSwipeClose(element) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    const onStart = (y) => {
        if (!State.isOpen) return;
        isDragging = true;
        startY = y;
        currentY = y;
    };
    
    const onMove = (y) => {
        if (!isDragging || !State.isOpen) return;
        currentY = y;
        const deltaY = Math.max(0, currentY - startY);
        
        if (deltaY > 0) {
            State.image.style.transition = 'none';
            State.image.style.transform = `translate(${State.x}px, ${State.y + deltaY}px) scale(${State.scale})`;
            State.overlay.style.transition = 'none';
            State.overlay.style.opacity = Math.max(0.3, 1 - deltaY / 250);
        }
    };
    
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaY = currentY - startY;
        
        if (deltaY > 80) {
            closeLightbox(true);
        } else {
            // Snap back
            State.overlay.style.transition = `opacity ${ANIMATION_DURATION}ms ease-out`;
            State.overlay.style.opacity = '';
            applyTransform(true);
        }
    };
    
    // Touch events
    element.addEventListener('touchstart', e => onStart(e.touches[0].clientY), { passive: true });
    element.addEventListener('touchmove', e => {
        e.preventDefault();
        onMove(e.touches[0].clientY);
    }, { passive: false });
    element.addEventListener('touchend', onEnd, { passive: true });
    
    // Mouse events
    element.addEventListener('mousedown', e => {
        e.preventDefault();
        onStart(e.clientY);
    });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('mouseup', onEnd);
}

// ===== UTILITIES =====

function getTouchDistance(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function showZoomIndicator() {
    const el = document.getElementById('lightbox-zoom-indicator');
    if (!el) return;
    
    el.textContent = `${Math.round(State.scale * 100)}%`;
    el.classList.add('visible');
    
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('visible'), 1000);
}

function showSwipeHint() {
    const el = document.getElementById('lightbox-swipe-indicator');
    if (!el) return;
    
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
}

// ===== DOM CREATION =====

function createDOM() {
    const html = `
        <div id="lightbox-overlay" class="lightbox-overlay">
            <div id="lightbox-top-swipe-area" class="lightbox-top-swipe-area">
                <div class="lightbox-drag-handle-bar"></div>
                <div id="lightbox-zoom-indicator" class="lightbox-zoom-indicator">100%</div>
            </div>
            
            <div id="lightbox-container" class="lightbox-container">
                <div id="lightbox-loading" class="lightbox-loading"></div>
                <img id="lightbox-image" class="lightbox-image" alt="Lightbox">
            </div>
            
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
    
    State.overlay = document.getElementById('lightbox-overlay');
    State.container = document.getElementById('lightbox-container');
    State.image = document.getElementById('lightbox-image');
    
    // Buttons
    document.getElementById('lightbox-close').addEventListener('click', () => closeLightbox(false));
    document.getElementById('lightbox-fit').addEventListener('click', fitToScreen);
    
    // Top swipe area
    initTopSwipeClose(document.getElementById('lightbox-top-swipe-area'));
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && State.isOpen) closeLightbox(false);
    });
    
    // Touch events on container
    State.container.addEventListener('touchstart', handleTouchStart, { passive: false });
    State.container.addEventListener('touchmove', handleTouchMove, { passive: false });
    State.container.addEventListener('touchend', handleTouchEnd, { passive: true });
    State.container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    // Mouse events
    State.container.addEventListener('wheel', handleWheel, { passive: false });
    State.container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Double click
    State.container.addEventListener('dblclick', handleDoubleClick);
    
    // Click background to close (only when not zoomed)
    State.overlay.addEventListener('click', e => {
        if (e.target === State.overlay && State.scale === MIN_SCALE) {
            closeLightbox(false);
        }
    });
    
    // Update dimensions on resize
    window.addEventListener('resize', () => {
        if (State.isOpen) {
            updateDimensions();
            clampPosition();
            applyTransform(false);
        }
    });
}