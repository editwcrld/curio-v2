/**
 * Limits Module - QUICK FIX VERSION
 */

const LIMITS = {
    guest: { art: 2, quotes: 2 },
    registered: { art: 3, quotes: 3 },
    premium: { art: Infinity, quotes: Infinity }
};

export function getUserType() {
    const isPremium = localStorage.getItem('user_premium') === 'true';
    if (isPremium) return 'premium';
    
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    if (isLoggedIn) return 'registered';
    
    return 'guest';
}

export function getCurrentLimits() {
    return LIMITS[getUserType()];
}

function shouldResetLimits() {
    const lastReset = localStorage.getItem('limits_last_reset_v1');
    if (!lastReset) return true;
    
    const hoursPassed = (new Date() - new Date(lastReset)) / (1000 * 60 * 60);
    return hoursPassed >= 24;
}

function resetLimits() {
    localStorage.setItem('user_limits_v1', JSON.stringify({
        art: { used: 0 },
        quotes: { used: 0 }
    }));
    localStorage.setItem('limits_last_reset_v1', new Date().toISOString());
}

export function initLimits() {
    if (shouldResetLimits()) resetLimits();
}

export function getLimitUsage() {
    const stored = localStorage.getItem('user_limits_v1');
    const limits = getCurrentLimits();
    
    const usage = stored ? JSON.parse(stored) : { art: { used: 0 }, quotes: { used: 0 } };
    
    // FIX: Berechne remaining korrekt
    return {
        art: { 
            used: usage.art?.used || 0, 
            remaining: Math.max(0, limits.art - (usage.art?.used || 0))
        },
        quotes: { 
            used: usage.quotes?.used || 0, 
            remaining: Math.max(0, limits.quotes - (usage.quotes?.used || 0))
        }
    };
}

export function canNavigate(type) {
    if (getUserType() === 'premium') return true;
    const usage = getLimitUsage();
    return usage[type].remaining > 0;
}

export function incrementUsage(type) {
    const stored = localStorage.getItem('user_limits_v1');
    const usage = stored ? JSON.parse(stored) : { art: { used: 0 }, quotes: { used: 0 } };
    
    usage[type].used = (usage[type].used || 0) + 1;
    
    localStorage.setItem('user_limits_v1', JSON.stringify(usage));
    
    const current = getLimitUsage();
}

export function getRemainingCount(type) {
    return getLimitUsage()[type].remaining;
}

export function handleLimitReached(type) {
    const userType = getUserType();
    
    if (userType === 'guest') {
        import('./auth-modal.js').then(m => m.openAuthModal('login'));
        setTimeout(() => updateAuthModalWithLimitInfo(type), 150);
    } else if (userType === 'registered') {
        import('./limit-modal.js').then(m => m.openUpgradeModal(type));
    }
}

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

export function syncLimitsWithBackend() {
    return {
        userType: getUserType(),
        limits: getCurrentLimits(),
        usage: getLimitUsage(),
        resetAt: localStorage.getItem('limits_last_reset_v1')
    };
}

export function trackNavigationOnBackend(type) {
    incrementUsage(type);
}