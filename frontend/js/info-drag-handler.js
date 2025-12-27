/**
 * Scroll Expand Module
 * ONLY drag-handle swipe up/down for expand/collapse
 */

// ===== STATE =====
const DragState = {
    isDragging: false,
    startY: 0,
    currentY: 0,
    startHeight: 0,
    minHeight: 165,
    maxHeight: 0,
    activeSection: null
};

// ===== INITIALIZATION =====

export function initScrollExpand() {
    DragState.maxHeight = window.innerHeight * 0.6;
    
    initDragHandle('art');
    initDragHandle('quotes');
    
    window.addEventListener('resize', () => {
        DragState.maxHeight = window.innerHeight * 0.6;
    });
}

function initDragHandle(viewType) {
    const infoSection = document.querySelector(`#view-${viewType} .info-section`);
    const dragHandle = infoSection?.querySelector('.drag-handle');
    
    if (!dragHandle || !infoSection) return;
    
    // Touch events
    dragHandle.addEventListener('touchstart', (e) => handleDragStart(e, infoSection), { passive: true });
    dragHandle.addEventListener('touchmove', (e) => handleDragMove(e, infoSection), { passive: false });
    dragHandle.addEventListener('touchend', (e) => handleDragEnd(e, infoSection), { passive: true });
    
    // Mouse events
    dragHandle.addEventListener('mousedown', (e) => handleDragStart(e, infoSection));
    document.addEventListener('mousemove', (e) => {
        if (DragState.isDragging && DragState.activeSection === infoSection) {
            handleDragMove(e, infoSection);
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (DragState.isDragging && DragState.activeSection === infoSection) {
            handleDragEnd(e, infoSection);
        }
    });
    
    // CRITICAL FIX: Clear inline height when info-section is clicked elsewhere
    // This prevents conflict between swipe (inline height) and click (CSS class)
    infoSection.addEventListener('click', (e) => {
        // Only if click is NOT on drag-handle
        if (!e.target.closest('.drag-handle')) {
            // Clear any inline height so CSS .expanded class works properly
            infoSection.style.height = '';
        }
    });
}

// ===== DRAG HANDLERS =====

function handleDragStart(e, infoSection) {
    e.stopPropagation();
    
    DragState.isDragging = true;
    DragState.activeSection = infoSection;
    DragState.startY = e.touches ? e.touches[0].clientY : e.clientY;
    DragState.currentY = DragState.startY;
    DragState.startHeight = infoSection.getBoundingClientRect().height;
    
    infoSection.style.transition = 'none';
    infoSection.classList.add('dragging');
}

function handleDragMove(e, infoSection) {
    if (!DragState.isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = DragState.startY - clientY;
    
    let newHeight = DragState.startHeight + deltaY;
    newHeight = Math.max(DragState.minHeight, Math.min(DragState.maxHeight, newHeight));
    
    infoSection.style.height = `${newHeight}px`;
    
    const progress = (newHeight - DragState.minHeight) / (DragState.maxHeight - DragState.minHeight);
    infoSection.classList.toggle('expanded', progress > 0.5);
    
    DragState.currentY = clientY;
}

function handleDragEnd(e, infoSection) {
    if (!DragState.isDragging) return;
    
    e.stopPropagation();
    
    DragState.isDragging = false;
    DragState.activeSection = null;
    infoSection.classList.remove('dragging');
    
    const currentHeight = infoSection.getBoundingClientRect().height;
    const progress = (currentHeight - DragState.minHeight) / (DragState.maxHeight - DragState.minHeight);
    const shouldExpand = progress > 0.3;
    
    infoSection.style.transition = 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    
    if (shouldExpand) {
        infoSection.style.height = `${DragState.maxHeight}px`;
        infoSection.classList.add('expanded');
    } else {
        // CRITICAL: Clear inline height so CSS handles collapsed state
        infoSection.style.height = '';
        infoSection.classList.remove('expanded');
    }
    
    setTimeout(() => {
        infoSection.style.transition = '';
        // If collapsed, ensure no inline height remains
        if (!shouldExpand) {
            infoSection.style.height = '';
        }
    }, 300);
}