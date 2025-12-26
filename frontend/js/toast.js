/**
 * Toast Notification System
 * Centralized messaging for success, error, info, and warning messages
 */

let toastQueue = [];
let currentToast = null;
let isShowingToast = false;

export function showToast(message, type = 'info', duration = null) {
    toastQueue.push({
        message,
        type,
        duration: duration || getDefaultDuration(type)
    });
    
    if (!isShowingToast) {
        processQueue();
    }
}

function getDefaultDuration(type) {
    switch (type) {
        case 'success': return 3000;
        case 'error': return 4000;
        case 'warning': return 4000;
        case 'info': return 3000;
        default: return 3000;
    }
}

function processQueue() {
    if (toastQueue.length === 0) {
        isShowingToast = false;
        return;
    }
    
    isShowingToast = true;
    const toast = toastQueue.shift();
    displayToast(toast.message, toast.type, toast.duration);
}

function displayToast(message, type, duration) {
    if (currentToast) {
        removeToast(currentToast, true);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = getIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    document.body.appendChild(toast);
    currentToast = toast;
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    const timeoutId = setTimeout(() => {
        removeToast(toast);
    }, duration);
    
    toast.dataset.timeoutId = timeoutId;
}

function removeToast(toast, immediate = false) {
    if (!toast) return;
    
    if (toast.dataset.timeoutId) {
        clearTimeout(parseInt(toast.dataset.timeoutId));
    }
    
    if (immediate) {
        toast.remove();
        currentToast = null;
    } else {
        toast.classList.remove('show');
        
        setTimeout(() => {
            toast.remove();
            currentToast = null;
            processQueue();
        }, 300);
    }
}

function getIcon(type) {
    switch (type) {
        case 'success':
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            `;
        case 'error':
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            `;
        case 'warning':
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            `;
        case 'info':
        default:
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
            `;
    }
}

export function clearAllToasts() {
    toastQueue = [];
    if (currentToast) {
        removeToast(currentToast, true);
    }
}

export function showSuccess(message, duration) {
    showToast(message, 'success', duration);
}

export function showError(message, duration) {
    showToast(message, 'error', duration);
}

export function showWarning(message, duration) {
    showToast(message, 'warning', duration);
}

export function showInfo(message, duration) {
    showToast(message, 'info', duration);
}