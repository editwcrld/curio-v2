/**
 * Image Lightbox Module - REWORK v2
 * 
 * Best Practices Implementation:
 * ✅ Momentum/Inertia scrolling (physics-based, wie iOS)
 * ✅ Pinch-to-zoom (touch) + Mousewheel zoom (desktop)
 * ✅ Boundary clamping mit smooth elastic snapback
 * ✅ Double-tap/click → 300% zoom toggle
 * ✅ Swipe down to close am drag-handler
 * ✅ Close + Fit-to-screen buttons
 * ✅ High-res image loading
 */

// ===== STATE =====
const State = {
    isOpen: false,
    scale: 1,
    x: 0,
    y: 0,
    
    // Velocity for momentum
    velocityX: 0,
    velocityY: 0,
    
    // Image info
    imgWidth: 0,
    imgHeight: 0,
    
    // Touch tracking
    touches: [],
    gesture: null, // 'pan' | 'pinch' | 'swipe-close'
    startX: 0,
    startY: 0,
    startScale: 1,
    startPinchDist: 0,
    pinchCenterX: 0,
    pinchCenterY: 0,
    
    // Double tap
    lastTap: 0,
    lastTapX: 0,
    lastTapY: 0,
    
    // Mouse drag
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    
    // Momentum animation
    momentumId: null,
    
    // DOM
    overlay: null,
    container: null,
    image: null,
    
    reset() {
        this.scale = 1;
        this.x = 0;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gesture = null;
        this.isDragging = false;
        this.imgWidth = 0;
        this.imgHeight = 0;
        this.lastTap = 0;
        if (this.momentumId) {
            cancelAnimationFrame(this.momentumId);
            this.momentumId = null;
        }
    }
};

// ===== CONSTANTS =====
const MIN_SCALE = 1;
const MAX_SCALE = 8;
const DOUBLE_TAP_ZOOM = 3;
const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_DIST = 40;
const SWIPE_CLOSE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

// Momentum physics
const FRICTION = 0.92;
const MIN_VELOCITY = 0.5;
const BOUNCE_RESISTANCE = 0.3;
const BOUNCE_BACK_DURATION = 300;

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
    
    // Art Institute of Chicago
    if (url.includes('artic.edu/iiif')) {
        return url.replace(/\/full\/\d+,\//, '/full/full/');
    }
    
    // Rijksmuseum
    if (url.includes('googleusercontent.com') || url.includes('rijksmuseum.nl')) {
        return url.replace(/=s\d+/, '=s0');
    }
    
    return url;
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
    applyTransform(false);
    
    // Reset styles
    State.overlay.style.opacity = '';
    State.overlay.style.transition = 'opacity 0.3s ease';
    State.image.style.opacity = '1';
    
    loading.style.display = 'block';
    State.image.style.display = 'none';
    
    const highResUrl = getHighResUrl(imageSrc);
    
    const img = new Image();
    img.onload = () => {
        State.image.src = highResUrl;
        State.imgWidth = img.naturalWidth;
        State.imgHeight = img.naturalHeight;
        
        loading.style.display = 'none';
        State.image.style.display = 'block';
        
        State.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        State.isOpen = true;
        
        if (window.innerWidth <= 768) {
            showSwipeHint();
        }
    };
    img.onerror = () => {
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
    
    stopMomentum();
    
    const { overlay, image } = State;
    if (!overlay) return;
    
    document.body.style.overflow = '';
    
    if (slideDown && image) {
        image.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        image.style.transform = `translate(${State.x}px, ${window.innerHeight}px) scale(${State.scale})`;
        image.style.opacity = '0';
        
        overlay.style.transition = 'opacity 0.3s ease-out';
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.classList.remove('active');
            cleanup();
        }, 300);
    } else {
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.classList.remove('active');
        setTimeout(cleanup, 300);
    }
}

function cleanup() {
    State.reset();
    if (State.image) {
        State.image.style.transform = '';
        State.image.style.opacity = '';
        State.image.style.transition = '';
    }
    if (State.overlay) {
        State.overlay.style.opacity = '';
        State.overlay.style.transition = '';
    }
}

// ===== BOUNDARIES =====

function getBounds() {
    if (!State.image || !State.container) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const imgRect = State.image.getBoundingClientRect();
    const contRect = State.container.getBoundingClientRect();
    
    const scaledW = imgRect.width;
    const scaledH = imgRect.height;
    const viewW = contRect.width;
    const viewH = contRect.height;
    
    // If image smaller than viewport, center it (bounds = 0)
    const maxX = scaledW <= viewW ? 0 : (scaledW - viewW) / 2;
    const maxY = scaledH <= viewH ? 0 : (scaledH - viewH) / 2;
    
    return { minX: -maxX, maxX, minY: -maxY, maxY };
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function clampToBounds(smooth = false) {
    const bounds = getBounds();
    const newX = clamp(State.x, bounds.minX, bounds.maxX);
    const newY = clamp(State.y, bounds.minY, bounds.maxY);
    
    const changed = newX !== State.x || newY !== State.y;
    State.x = newX;
    State.y = newY;
    
    if (changed && smooth) {
        applyTransform(true);
    }
    
    return changed;
}

function softClamp() {
    const bounds = getBounds();
    
    // Allow overscroll with resistance
    if (State.x > bounds.maxX) {
        State.x = bounds.maxX + (State.x - bounds.maxX) * BOUNCE_RESISTANCE;
    } else if (State.x < bounds.minX) {
        State.x = bounds.minX + (State.x - bounds.minX) * BOUNCE_RESISTANCE;
    }
    
    if (State.y > bounds.maxY) {
        State.y = bounds.maxY + (State.y - bounds.maxY) * BOUNCE_RESISTANCE;
    } else if (State.y < bounds.minY) {
        State.y = bounds.minY + (State.y - bounds.minY) * BOUNCE_RESISTANCE;
    }
}

function isOutOfBounds() {
    const bounds = getBounds();
    return State.x < bounds.minX || State.x > bounds.maxX ||
           State.y < bounds.minY || State.y > bounds.maxY;
}

// ===== TRANSFORM =====

function applyTransform(smooth = false) {
    if (!State.image) return;
    
    State.image.style.transition = smooth 
        ? `transform ${BOUNCE_BACK_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
        : 'none';
    State.image.style.transform = `translate(${State.x}px, ${State.y}px) scale(${State.scale})`;
}

function setScale(newScale, smooth = true, centerX = null, centerY = null) {
    const oldScale = State.scale;
    State.scale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    
    if (oldScale === State.scale) return;
    
    // Zoom towards point
    if (centerX !== null && centerY !== null) {
        const contRect = State.container.getBoundingClientRect();
        const imgCenterX = contRect.width / 2;
        const imgCenterY = contRect.height / 2;
        
        const offsetX = centerX - imgCenterX;
        const offsetY = centerY - imgCenterY;
        
        const ratio = State.scale / oldScale;
        State.x = State.x * ratio - offsetX * (ratio - 1);
        State.y = State.y * ratio - offsetY * (ratio - 1);
    }
    
    // Reset when fully zoomed out
    if (State.scale === MIN_SCALE) {
        State.x = 0;
        State.y = 0;
    } else {
        // Smooth clamp - animate towards valid bounds
        const bounds = getBounds();
        
        // Gradually pull towards bounds during zoom-out
        if (State.scale < oldScale) {
            // Zooming out - smoothly approach bounds
            const t = 0.3; // Interpolation factor
            const targetX = clamp(State.x, bounds.minX, bounds.maxX);
            const targetY = clamp(State.y, bounds.minY, bounds.maxY);
            State.x = State.x + (targetX - State.x) * t;
            State.y = State.y + (targetY - State.y) * t;
        }
        
        // Final clamp to ensure we're in bounds
        clampToBounds();
    }
    
    applyTransform(smooth);
    showZoomIndicator();
}

function fitToScreen() {
    stopMomentum();
    setScale(MIN_SCALE, true);
}

// ===== MOMENTUM =====

function startMomentum() {
    stopMomentum();
    
    if (Math.abs(State.velocityX) < MIN_VELOCITY && Math.abs(State.velocityY) < MIN_VELOCITY) {
        // No significant velocity, just snap to bounds
        if (isOutOfBounds()) {
            clampToBounds(true);
        }
        return;
    }
    
    const animate = () => {
        // Apply friction
        State.velocityX *= FRICTION;
        State.velocityY *= FRICTION;
        
        // Update position
        State.x += State.velocityX;
        State.y += State.velocityY;
        
        // Check bounds
        const bounds = getBounds();
        let hitBound = false;
        
        if (State.x < bounds.minX || State.x > bounds.maxX) {
            hitBound = true;
            State.velocityX *= -0.3; // Bounce back
            State.x = clamp(State.x, bounds.minX, bounds.maxX);
        }
        
        if (State.y < bounds.minY || State.y > bounds.maxY) {
            hitBound = true;
            State.velocityY *= -0.3;
            State.y = clamp(State.y, bounds.minY, bounds.maxY);
        }
        
        applyTransform(false);
        
        // Continue if still moving
        if (Math.abs(State.velocityX) > MIN_VELOCITY || Math.abs(State.velocityY) > MIN_VELOCITY) {
            State.momentumId = requestAnimationFrame(animate);
        } else {
            State.momentumId = null;
            // Final snap to bounds
            if (isOutOfBounds()) {
                clampToBounds(true);
            }
        }
    };
    
    State.momentumId = requestAnimationFrame(animate);
}

function stopMomentum() {
    if (State.momentumId) {
        cancelAnimationFrame(State.momentumId);
        State.momentumId = null;
    }
    State.velocityX = 0;
    State.velocityY = 0;
}

// ===== TOUCH HANDLERS =====

function handleTouchStart(e) {
    if (!State.isOpen) return;
    
    stopMomentum();
    
    const touches = e.touches;
    State.touches = Array.from(touches).map(t => ({ x: t.clientX, y: t.clientY, time: Date.now() }));
    
    if (touches.length === 2) {
        // Pinch start
        e.preventDefault();
        State.gesture = 'pinch';
        State.startScale = State.scale;
        State.startPinchDist = getTouchDist(touches[0], touches[1]);
        State.pinchCenterX = (touches[0].clientX + touches[1].clientX) / 2;
        State.pinchCenterY = (touches[0].clientY + touches[1].clientY) / 2;
        State.startX = State.x;
        State.startY = State.y;
        
    } else if (touches.length === 1) {
        State.startX = touches[0].clientX;
        State.startY = touches[0].clientY;
        State.gesture = null;
    }
}

function handleTouchMove(e) {
    if (!State.isOpen) return;
    
    const touches = e.touches;
    
    if (State.gesture === 'pinch' && touches.length === 2) {
        e.preventDefault();
        
        const dist = getTouchDist(touches[0], touches[1]);
        const ratio = dist / State.startPinchDist;
        const newScale = clamp(State.startScale * ratio, MIN_SCALE, MAX_SCALE);
        
        // Calculate zoom offset
        const contRect = State.container.getBoundingClientRect();
        const imgCenterX = contRect.width / 2;
        const imgCenterY = contRect.height / 2;
        const offsetX = State.pinchCenterX - imgCenterX;
        const offsetY = State.pinchCenterY - imgCenterY;
        
        const actualRatio = newScale / State.startScale;
        State.scale = newScale;
        State.x = State.startX * actualRatio - offsetX * (actualRatio - 1);
        State.y = State.startY * actualRatio - offsetY * (actualRatio - 1);
        
        clampToBounds();
        applyTransform(false);
        showZoomIndicator();
        return;
    }
    
    if (touches.length !== 1) return;
    
    const touch = touches[0];
    const dx = touch.clientX - State.startX;
    const dy = touch.clientY - State.startY;
    
    // Determine gesture
    if (!State.gesture) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        
        if (State.scale > MIN_SCALE) {
            State.gesture = 'pan';
        } else if (dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.2) {
            State.gesture = 'swipe-close';
        } else {
            State.gesture = 'ignore';
        }
    }
    
    if (State.gesture === 'pan') {
        e.preventDefault();
        
        // Track for velocity
        const now = Date.now();
        const prev = State.touches[State.touches.length - 1];
        if (prev) {
            const dt = now - prev.time || 16;
            State.velocityX = (touch.clientX - prev.x) / dt * 16;
            State.velocityY = (touch.clientY - prev.y) / dt * 16;
        }
        State.touches.push({ x: touch.clientX, y: touch.clientY, time: now });
        if (State.touches.length > 5) State.touches.shift();
        
        State.x += touch.clientX - (State.touches[State.touches.length - 2]?.x || touch.clientX);
        State.y += touch.clientY - (State.touches[State.touches.length - 2]?.y || touch.clientY);
        
        softClamp();
        applyTransform(false);
        
    } else if (State.gesture === 'swipe-close') {
        e.preventDefault();
        const swipeY = Math.max(0, dy);
        State.y = swipeY;
        
        const opacity = Math.max(0.3, 1 - swipeY / 300);
        State.overlay.style.opacity = opacity;
        State.overlay.style.transition = 'none';
        
        applyTransform(false);
    }
}

function handleTouchEnd(e) {
    if (!State.isOpen) return;
    
    const gesture = State.gesture;
    
    if (gesture === 'swipe-close') {
        const shouldClose = State.y > SWIPE_CLOSE_THRESHOLD || 
            Math.abs(State.velocityY) > SWIPE_VELOCITY_THRESHOLD;
        
        if (shouldClose) {
            closeLightbox(true);
        } else {
            State.y = 0;
            State.overlay.style.transition = 'opacity 0.25s ease';
            State.overlay.style.opacity = '';
            applyTransform(true);
        }
    } else if (gesture === 'pan') {
        // Start momentum
        startMomentum();
    } else if (gesture === 'pinch') {
        clampToBounds(true);
    }
    
    // Check double tap
    if (!gesture || gesture === 'ignore') {
        checkDoubleTap(e);
    }
    
    State.gesture = null;
    State.touches = [];
}

function handleTouchCancel() {
    if (!State.isOpen) return;
    
    State.gesture = null;
    State.touches = [];
    stopMomentum();
    
    if (State.scale === MIN_SCALE) {
        State.x = 0;
        State.y = 0;
    } else {
        clampToBounds();
    }
    
    State.overlay.style.transition = 'opacity 0.3s ease';
    State.overlay.style.opacity = '';
    applyTransform(true);
}

function checkDoubleTap(e) {
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    
    const now = Date.now();
    const dt = now - State.lastTap;
    const dist = Math.hypot(touch.clientX - State.lastTapX, touch.clientY - State.lastTapY);
    
    if (dt < DOUBLE_TAP_DELAY && dist < DOUBLE_TAP_DIST) {
        e.preventDefault();
        
        if (State.scale > MIN_SCALE) {
            setScale(MIN_SCALE, true);
        } else {
            setScale(DOUBLE_TAP_ZOOM, true, touch.clientX, touch.clientY);
        }
        
        State.lastTap = 0;
    } else {
        State.lastTap = now;
        State.lastTapX = touch.clientX;
        State.lastTapY = touch.clientY;
    }
}

// ===== MOUSE HANDLERS =====

function handleWheel(e) {
    if (!State.isOpen) return;
    e.preventDefault();
    
    stopMomentum();
    
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = State.scale * (1 + delta);
    
    setScale(newScale, true, e.clientX, e.clientY);
}

function handleMouseDown(e) {
    if (!State.isOpen || State.scale <= MIN_SCALE) return;
    
    stopMomentum();
    
    State.isDragging = true;
    State.dragStartX = e.clientX - State.x;
    State.dragStartY = e.clientY - State.y;
    State.touches = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
    
    State.container.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (!State.isDragging) return;
    
    // Track velocity
    const now = Date.now();
    const prev = State.touches[State.touches.length - 1];
    if (prev) {
        const dt = now - prev.time || 16;
        State.velocityX = (e.clientX - prev.x) / dt * 16;
        State.velocityY = (e.clientY - prev.y) / dt * 16;
    }
    State.touches.push({ x: e.clientX, y: e.clientY, time: now });
    if (State.touches.length > 5) State.touches.shift();
    
    State.x = e.clientX - State.dragStartX;
    State.y = e.clientY - State.dragStartY;
    
    softClamp();
    applyTransform(false);
}

function handleMouseUp() {
    if (!State.isDragging) return;
    
    State.isDragging = false;
    State.container.style.cursor = 'grab';
    
    // Start momentum
    startMomentum();
}

// ===== TOP SWIPE AREA =====

function initTopSwipeClose(area) {
    let startY = 0, currentY = 0, dragging = false;
    
    const onStart = (y) => {
        if (!State.isOpen) return;
        dragging = true;
        startY = currentY = y;
    };
    
    const onMove = (y) => {
        if (!dragging || !State.isOpen) return;
        currentY = y;
        const dy = currentY - startY;
        
        if (dy > 0) {
            State.y = dy;
            State.overlay.style.opacity = Math.max(0.3, 1 - dy / 250);
            State.overlay.style.transition = 'none';
            applyTransform(false);
        }
    };
    
    const onEnd = () => {
        if (!dragging) return;
        dragging = false;
        
        const dy = currentY - startY;
        if (dy > 80) {
            closeLightbox(true);
        } else {
            State.y = 0;
            State.overlay.style.transition = 'opacity 0.25s ease';
            State.overlay.style.opacity = '';
            applyTransform(true);
        }
    };
    
    // Touch
    area.addEventListener('touchstart', e => onStart(e.touches[0].clientY), { passive: true });
    area.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientY); }, { passive: false });
    area.addEventListener('touchend', onEnd, { passive: true });
    
    // Mouse
    area.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientY); });
    document.addEventListener('mousemove', e => onMove(e.clientY));
    document.addEventListener('mouseup', onEnd);
}

// ===== UTILITIES =====

function getTouchDist(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function showZoomIndicator() {
    const el = document.getElementById('lightbox-zoom-indicator');
    if (!el) return;
    
    el.textContent = `${Math.round(State.scale * 100)}%`;
    el.classList.add('visible');
    
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), 1000);
}

function showSwipeHint() {
    const el = document.getElementById('lightbox-swipe-indicator');
    if (!el) return;
    
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
}

// ===== DOM =====

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
    
    // Buttons
    document.getElementById('lightbox-close').addEventListener('click', () => closeLightbox(false));
    document.getElementById('lightbox-fit').addEventListener('click', fitToScreen);
    
    // Top swipe area
    initTopSwipeClose(document.getElementById('lightbox-top-swipe-area'));
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && State.isOpen) closeLightbox(false);
    });
    
    // Touch
    State.container.addEventListener('touchstart', handleTouchStart, { passive: false });
    State.container.addEventListener('touchmove', handleTouchMove, { passive: false });
    State.container.addEventListener('touchend', handleTouchEnd, { passive: false });
    State.container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    // Mouse
    State.container.addEventListener('wheel', handleWheel, { passive: false });
    State.container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Double click
    State.container.addEventListener('dblclick', e => {
        if (State.scale > MIN_SCALE) {
            setScale(MIN_SCALE, true);
        } else {
            setScale(DOUBLE_TAP_ZOOM, true, e.clientX, e.clientY);
        }
    });
    
    // Click background to close
    State.overlay.addEventListener('click', e => {
        if (e.target === State.overlay && State.scale === MIN_SCALE) {
            closeLightbox(false);
        }
    });
}