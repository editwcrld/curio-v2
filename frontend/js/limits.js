/**
 * Limits Module
 * Handles daily navigation limits for guests, registered, and premium users
 * Backend-ready: localStorage structure mimics future API responses
 */

// ========================================
// LIMIT CONFIGURATION
// Guest: 3, Registered: 10, Premium: 50
// ========================================
const LIMITS = {
    guest: {
        art: 3,
        quotes: 3
    },
    registered: {
        art: 10,
        quotes: 10
    },
    premium: {
        art: 50,
        quotes: 50
    }
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
    return LIMITS[userType];
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

export function initLimits() {
    if (shouldResetLimits()) {
        resetLimits();
    }
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
        // Premium hat jetzt auch Limits (50)
        showPremiumLimitModal(type);
    }
}

function showPremiumLimitModal(type) {
    const typeName = type === 'art' ? 'Kunstwerke' : 'Zitate';
    if (window.showToast) {
        window.showToast(`Tageslimit von 50 ${typeName} erreicht. Morgen geht's weiter!`, 'info');
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
    
    // Simple box without any icons
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