/**
 * Limits Module - FIXED VERSION
 * Synchronizes with Backend Premium Status
 */

import { API_BASE_URL } from './config.js';

const LIMITS = {
    guest: { art: 2, quotes: 2 },
    registered: { art: 20, quotes: 20 },
    premium: { art: Infinity, quotes: Infinity }
};

/**
 * Get user type from localStorage + Backend
 */
export function getUserType() {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) return 'guest';
    
    // Check premium status from localStorage (set during login!)
    const isPremium = localStorage.getItem('user_premium') === 'true';
    if (isPremium) return 'premium';
    
    return 'registered';
}

/**
 * Get current limits based on user type
 */
export function getCurrentLimits() {
    return LIMITS[getUserType()];
}

/**
 * Check if limits should be reset (24h passed)
 */
function shouldResetLimits() {
    const lastReset = localStorage.getItem('limits_last_reset_v1');
    if (!lastReset) return true;
    
    const hoursPassed = (new Date() - new Date(lastReset)) / (1000 * 60 * 60);
    return hoursPassed >= 24;
}

/**
 * Reset limits to 0
 */
function resetLimits() {
    localStorage.setItem('user_limits_v1', JSON.stringify({
        art: { used: 0 },
        quotes: { used: 0 }
    }));
    localStorage.setItem('limits_last_reset_v1', new Date().toISOString());
}

/**
 * Initialize limits (called on app load)
 */
export function initLimits() {
    if (shouldResetLimits()) {
        resetLimits();
    }
}

/**
 * Get current usage
 */
export function getLimitUsage() {
    const stored = localStorage.getItem('user_limits_v1');
    const limits = getCurrentLimits();
    
    const usage = stored ? JSON.parse(stored) : { art: { used: 0 }, quotes: { used: 0 } };
    
    return {
        art: { 
            used: usage.art?.used || 0, 
            remaining: limits.art === Infinity ? Infinity : Math.max(0, limits.art - (usage.art?.used || 0))
        },
        quotes: { 
            used: usage.quotes?.used || 0, 
            remaining: limits.quotes === Infinity ? Infinity : Math.max(0, limits.quotes - (usage.quotes?.used || 0))
        }
    };
}

/**
 * Check if user can navigate (has remaining quota)
 */
export function canNavigate(type) {
    const userType = getUserType();
    
    // Premium: Always allowed
    if (userType === 'premium') {
        return true;
    }
    
    // Others: Check limits
    const usage = getLimitUsage();
    return usage[type].remaining > 0;
}

/**
 * Increment usage counter
 */
export function incrementUsage(type) {
    // Don't track for premium users
    if (getUserType() === 'premium') {
        return;
    }
    
    const stored = localStorage.getItem('user_limits_v1');
    const usage = stored ? JSON.parse(stored) : { art: { used: 0 }, quotes: { used: 0 } };
    
    usage[type].used = (usage[type].used || 0) + 1;
    
    localStorage.setItem('user_limits_v1', JSON.stringify(usage));
}

/**
 * Get remaining count for a type
 */
export function getRemainingCount(type) {
    return getLimitUsage()[type].remaining;
}

/**
 * Handle when limit is reached
 */
export function handleLimitReached(type) {
    const userType = getUserType();
    
    if (userType === 'guest') {
        // Show login modal for guests
        import('./auth-modal.js').then(m => m.openAuthModal('login'));
        setTimeout(() => updateAuthModalWithLimitInfo(type), 150);
    } else if (userType === 'registered') {
        // Show upgrade modal for registered users
        import('./limit-modal.js').then(m => m.openUpgradeModal(type));
    }
    // Premium users should never reach here!
}

/**
 * Update auth modal with limit info
 */
function updateAuthModalWithLimitInfo(type) {
    const authHeader = document.querySelector('.auth-header');
    if (!authHeader) return;
    
    let limitInfo = document.querySelector('.auth-limit-info');
    if (!limitInfo) {
        limitInfo = document.createElement('div');
        limitInfo.className = 'auth-limit-info';
        authHeader.after(limitInfo);
    }
    
    const usage = getLimitUsage();
    const limits = getCurrentLimits();
    const typeName = type === 'art' ? 'Kunstwerke' : 'Zitate';
    
    limitInfo.innerHTML = `
        <div class="limit-warning">
            <p class="limit-title">Tageslimit erreicht</p>
            <p class="limit-description">
                Du hast <strong>${usage[type].used}/${limits[type]} ${typeName}</strong> für heute angesehen. 
                Melde dich an für <strong>20 ${typeName}</strong> pro Tag!
            </p>
        </div>
    `;
}

/**
 * Sync limits with backend (for debugging)
 */
export function syncLimitsWithBackend() {
    return {
        userType: getUserType(),
        limits: getCurrentLimits(),
        usage: getLimitUsage(),
        resetAt: localStorage.getItem('limits_last_reset_v1'),
        isPremium: localStorage.getItem('user_premium') === 'true'
    };
}

/**
 * Track navigation (for compatibility)
 */
export function trackNavigationOnBackend(type) {
    incrementUsage(type);
}