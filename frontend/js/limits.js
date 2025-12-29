/**
 * Limits Module
 * Handles daily navigation limits for guests, registered, and premium users
 * ✅ Fetches limits from backend on init
 * ✅ Falls back to local limits if backend unreachable
 */

import { API_BASE_URL } from './config.js';

// ========================================
// LIMIT CONFIGURATION
// ========================================

// Fallback limits (used when backend not reachable)
const FALLBACK_LIMITS = {
    guest: { art: 3, quotes: 3 },
    registered: { art: 10, quotes: 10 },
    premium: { art: 50, quotes: 50 }
};

// Live limits from backend (will be fetched on init)
let LIMITS = {
    guest: { ...FALLBACK_LIMITS.guest },
    registered: { ...FALLBACK_LIMITS.registered },
    premium: { ...FALLBACK_LIMITS.premium }
};

const STORAGE_KEYS = {
    LIMITS: 'user_limits_v1',
    LAST_RESET: 'limits_last_reset_v1',
    USER_TYPE: 'user_type_v1'
};

// ========================================
// USER TYPE DETECTION
// ========================================

export function getUserType() {
    const isPremium = localStorage.getItem('user_premium') === 'true';
    if (isPremium) return 'premium';
    
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    if (isLoggedIn) return 'registered';
    
    return 'guest';
}

export function getCurrentLimits() {
    const userType = getUserType();
    return LIMITS[userType] || FALLBACK_LIMITS[userType];
}

// ========================================
// 24H RESET LOGIC
// ========================================

function shouldResetLimits() {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    if (!lastReset) return true;
    
    const lastResetTime = new Date(lastReset);
    const now = new Date();
    const hoursPassed = (now - lastResetTime) / (1000 * 60 * 60);
    
    return hoursPassed >= 24;
}

function resetLimits() {
    const emptyLimits = {
        art: { used: 0, remaining: 0 },
        quotes: { used: 0, remaining: 0 }
    };
    
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(emptyLimits));
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, new Date().toISOString());
}

// ========================================
// BACKEND SYNC
// ========================================

async function fetchLimitsFromBackend() {
    const token = localStorage.getItem('auth_token');
    
    try {
        // Always fetch public limits config (for all user types)
        const configResponse = await fetch(`${API_BASE_URL}/config/limits`);
        if (configResponse.ok) {
            const configResult = await configResponse.json();
            if (configResult.data) {
                LIMITS.guest = configResult.data.guest;
                LIMITS.registered = configResult.data.registered;
                LIMITS.premium = configResult.data.premium;
                console.log('✅ Limits loaded from backend');
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch limits config, using fallback');
    }
    
    // If logged in, also sync usage
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/limits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            const data = result.data;
            
            // Update LIMITS with backend values
            LIMITS[data.userType] = {
                art: data.limits.art.max,
                quotes: data.limits.quotes.max
            };
            
            // Sync usage from backend
            const usage = getLimitUsage();
            usage.art.used = data.limits.art.used;
            usage.quotes.used = data.limits.quotes.used;
            localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(usage));
            
            console.log('✅ Usage synced from backend:', data.userType);
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch user limits from backend');
    }
}

export async function initLimits() {
    if (shouldResetLimits()) {
        resetLimits();
    }
    
    // Fetch limits from backend
    await fetchLimitsFromBackend();
}

// ========================================
// LIMIT TRACKING
// ========================================

export function getLimitUsage() {
    const stored = localStorage.getItem(STORAGE_KEYS.LIMITS);
    const userLimits = getCurrentLimits();
    
    let usage = stored ? JSON.parse(stored) : {
        art: { used: 0, remaining: userLimits.art },
        quotes: { used: 0, remaining: userLimits.quotes }
    };
    
    usage.art.remaining = userLimits.art - usage.art.used;
    usage.quotes.remaining = userLimits.quotes - usage.quotes.used;
    
    return usage;
}

export function canNavigate(type) {
    const usage = getLimitUsage();
    const limit = getCurrentLimits()[type];
    
    return usage[type].used < limit;
}

export function incrementUsage(type) {
    const usage = getLimitUsage();
    usage[type].used += 1;
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(usage));
}

export function syncLimitToMax(type) {
    // Called when backend returns 429 - sync frontend to max
    const usage = getLimitUsage();
    const limit = getCurrentLimits()[type];
    usage[type].used = limit;
    usage[type].remaining = 0;
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(usage));
}

export function getRemainingCount(type) {
    const usage = getLimitUsage();
    return usage[type].remaining;
}

// ========================================
// LIMIT REACHED HANDLERS
// ========================================

export function handleLimitReached(type) {
    const userType = getUserType();
    
    if (userType === 'guest') {
        showGuestLimitModal(type);
    } else if (userType === 'registered') {
        showUpgradeModal(type);
    } else if (userType === 'premium') {
        showPremiumLimitModal(type);
    }
}

function showPremiumLimitModal(type) {
    const typeName = type === 'art' ? 'Kunstwerke' : 'Zitate';
    const limit = getCurrentLimits()[type];
    if (window.showToast) {
        window.showToast(`Tageslimit von ${limit} ${typeName} erreicht. Morgen geht's weiter!`, 'info');
    }
}

function showGuestLimitModal(type) {
    import('./auth-modal.js').then(module => {
        module.openAuthModal('login');
    });
    
    setTimeout(() => {
        updateAuthModalWithLimitInfo(type);
    }, 150);
}

function showUpgradeModal(type) {
    import('./limit-modal.js').then(module => {
        module.openUpgradeModal(type);
    }).catch(() => {});
}

function updateAuthModalWithLimitInfo(type) {
    const usage = getLimitUsage();
    const limits = getCurrentLimits();
    
    const authHeader = document.querySelector('.auth-header');
    if (!authHeader) return;
    
    let limitInfo = document.querySelector('.auth-limit-info');
    if (!limitInfo) {
        limitInfo = document.createElement('div');
        limitInfo.className = 'auth-limit-info';
        authHeader.after(limitInfo);
    }
    
    const typeName = type === 'art' ? 'Kunstwerke' : 'Zitate';
    const registeredLimit = LIMITS.registered[type];
    
    limitInfo.innerHTML = `
        <div class="limit-warning">
            <div class="limit-text">
                <p class="limit-title">Tageslimit erreicht</p>
                <p class="limit-description">
                    Du hast <strong>${usage[type].used}/${limits[type]} ${typeName}</strong> für heute angesehen. 
                    Melde dich an für <strong>${registeredLimit} ${typeName}</strong> pro Tag!
                </p>
            </div>
        </div>
    `;
}

// ========================================
// API-READY STRUCTURE
// ========================================

export async function syncLimitsWithBackend() {
    await fetchLimitsFromBackend();
    return {
        userType: getUserType(),
        limits: getCurrentLimits(),
        usage: getLimitUsage(),
        resetAt: localStorage.getItem(STORAGE_KEYS.LAST_RESET)
    };
}

export async function trackNavigationOnBackend(type) {
    incrementUsage(type);
}

// ========================================
// DEBUG HELPERS
// ========================================

export function debugResetLimits() {
    resetLimits();
    console.log('🔧 Debug: Limits manually reset');
}

export function debugSetUserType(type) {
    if (type === 'premium') {
        localStorage.setItem('user_premium', 'true');
        localStorage.setItem('user_logged_in', 'true');
    } else if (type === 'registered') {
        localStorage.removeItem('user_premium');
        localStorage.setItem('user_logged_in', 'true');
    } else {
        localStorage.removeItem('user_premium');
        localStorage.removeItem('user_logged_in');
    }
    console.log(`🔧 Debug: User type set to ${type}`);
}

export function debugGetInfo() {
    return {
        userType: getUserType(),
        limits: getCurrentLimits(),
        usage: getLimitUsage(),
        lastReset: localStorage.getItem(STORAGE_KEYS.LAST_RESET)
    };
}

export function debugTestUpgradeModal() {
    console.log('🧪 Testing upgrade modal...');
    showUpgradeModal('art');
}

export function debugSetLimitReached(type) {
    const limits = getCurrentLimits();
    const usage = {
        art: { used: limits.art, remaining: 0 },
        quotes: { used: limits.quotes, remaining: 0 }
    };
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(usage));
    console.log(`🔧 Debug: ${type} limit set to maximum (${limits[type]}/${limits[type]})`);
}

export function debugForceFetchLimits() {
    fetchLimitsFromBackend();
    console.log('🔧 Debug: Forcing limit fetch from backend');
}