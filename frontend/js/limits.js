/**
 * Limits Module
 * Handles daily navigation limits for guests, registered, and premium users
 */

const LIMITS = {
    guest: { art: 5, quotes: 5 },
    registered: { art: 20, quotes: 20 },
    premium: { art: Infinity, quotes: Infinity }
};

const STORAGE_KEYS = {
    LIMITS: 'user_limits_v1',
    LAST_RESET: 'limits_last_reset_v1',
    USER_TYPE: 'user_type_v1'
};

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
    console.log('🔄 Limits reset for new day');
}

export function initLimits() {
    if (shouldResetLimits()) {
        resetLimits();
    }
    console.log('✅ Limits initialized');
}

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
    const userType = getUserType();
    if (userType === 'premium') return true;
    
    const usage = getLimitUsage();
    const limit = getCurrentLimits()[type];
    
    return usage[type].used < limit;
}

export function incrementUsage(type) {
    const usage = getLimitUsage();
    usage[type].used += 1;
    
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(usage));
    console.log(`📊 ${type} usage: ${usage[type].used}/${getCurrentLimits()[type]}`);
}

export function getRemainingCount(type) {
    const userType = getUserType();
    if (userType === 'premium') return Infinity;
    
    const usage = getLimitUsage();
    return usage[type].remaining;
}

export function handleLimitReached(type) {
    const userType = getUserType();
    
    console.log('🚫 Limit reached!', { type, userType });
    
    if (userType === 'guest') {
        showGuestLimitModal(type);
    } else if (userType === 'registered') {
        showUpgradeModal(type);
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
    });
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
            <p class="limit-title">Tageslimit erreicht</p>
            <p class="limit-description">
                Du hast <strong>${usage[type].used}/${limits[type]} ${typeName}</strong> für heute angesehen. 
                Melde dich an für <strong>${registeredLimit} ${typeName}</strong> pro Tag!
            </p>
        </div>
    `;
}

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