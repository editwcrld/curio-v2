/**
 * Info Drag Handler Module
 * Swipe up/down on info-header area to expand/collapse
 * Improved touch targets for mobile
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
    
    // Update minHeight for mobile
    if (window.innerWidth <= 480) {
        DragState.minHeight = 155;
    }
    
    initDragHandle('art');
    initDragHandle('quotes');
    
    window.addEventListener('resize', () => {
        DragState.maxHeight = window.innerHeight * 0.6;
        DragState.minHeight = window.innerWidth <= 480 ? 155 : 165;
    });
}

/**
 * ✅ Collapse all info sections - call this on navigation
 */
export function collapseAllInfoSections() {
    document.querySelectorAll('.info-section').forEach(section => {
        section.classList.remove('expanded');
        section.classList.remove('dragging');
        section.style.height = '';
        section.style.transition = '';
    });
}

function initDragHandle(viewType) {
    const infoSection = document.querySelector(`#view-${viewType} .info-section`);
    const infoHeader = infoSection?.querySelector('.info-header');
    const dragHandle = infoSection?.querySelector('.drag-handle');
    
    if (!infoHeader || !infoSection) return;
    
    // ✅ Make the ENTIRE info-header a drag target (much bigger than just drag-handle)
    // This makes it much easier to grab on mobile
    
    // Touch events on info-header
    infoHeader.addEventListener('touchstart', (e) => {
        // Only start drag if touching the top part (drag-handle area)
        const touch = e.touches[0];
        const headerRect = infoHeader.getBoundingClientRect();
        const touchY = touch.clientY - headerRect.top;
        
        // Allow drag from top 50px of header (where drag-handle is)
        if (touchY <= 50) {
            handleDragStart(e, infoSection);
        }
    }, { passive: true });
    
    infoHeader.addEventListener('touchmove', (e) => {
        if (DragState.isDragging && DragState.activeSection === infoSection) {
            handleDragMove(e, infoSection);
        }
    }, { passive: false });
    
    infoHeader.addEventListener('touchend', (e) => {
        if (DragState.isDragging && DragState.activeSection === infoSection) {
            handleDragEnd(e, infoSection);
        }
    }, { passive: true });
    
    // Also keep drag-handle specific events for precision dragging
    if (dragHandle) {
        dragHandle.addEventListener('touchstart', (e) => handleDragStart(e, infoSection), { passive: true });
        dragHandle.addEventListener('touchmove', (e) => {
            if (DragState.isDragging && DragState.activeSection === infoSection) {
                handleDragMove(e, infoSection);
            }
        }, { passive: false });
        dragHandle.addEventListener('touchend', (e) => {
            if (DragState.isDragging && DragState.activeSection === infoSection) {
                handleDragEnd(e, infoSection);
            }
        }, { passive: true });
    }
    
    // Mouse events (for desktop testing)
    infoHeader.addEventListener('mousedown', (e) => {
        const headerRect = infoHeader.getBoundingClientRect();
        const mouseY = e.clientY - headerRect.top;
        if (mouseY <= 50) {
            handleDragStart(e, infoSection);
        }
    });
    
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
    
    // Clear inline height when info-section is clicked (for toggle)
    infoSection.addEventListener('click', (e) => {
        if (!e.target.closest('.drag-handle') && !DragState.isDragging) {
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
    
    // Only preventDefault if event is cancelable
    if (e.cancelable) {
        e.preventDefault();
    }
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
        infoSection.style.height = '';
        infoSection.classList.remove('expanded');
    }
    
    setTimeout(() => {
        infoSection.style.transition = '';
        if (!shouldExpand) {
            infoSection.style.height = '';
        }
    }, 300);
}