/**
 * Onboarding Module
 * Minimal tutorial for first-time guest users on mobile
 */

const ONBOARDING_KEY = 'curio_onboarding_seen';

// Check if user should see onboarding
function shouldShowOnboarding() {
    if (window.innerWidth > 768) return false;
    if (localStorage.getItem('user_logged_in') === 'true') return false;
    if (localStorage.getItem(ONBOARDING_KEY) === 'true') return false;
    return true;
}

// Create onboarding overlay
function createOnboardingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'onboarding-overlay';
    
    overlay.innerHTML = `
        <!-- Highlight areas -->
        <div class="onboarding-highlight-art"></div>
        <div class="onboarding-highlight-info"></div>
        
        <!-- Step 1: Tap for fullscreen (TOP - at header) -->
        <div class="onboarding-step onboarding-step-1" data-step="1">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14"/>
                    <polyline points="19 12 12 19 5 12"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Tap for fullscreen</span>
                <span class="onboarding-text-sub">View artwork in detail</span>
            </div>
        </div>
        
        <!-- Step 2: Swipe left/next (RIGHT side) -->
        <div class="onboarding-step onboarding-step-2" data-step="2">
            <div class="onboarding-text">
                <span class="onboarding-text-main">Swipe left</span>
                <span class="onboarding-text-sub">Next art / quote</span>
            </div>
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
            </div>
        </div>
        
        <!-- Step 3: Swipe right/back (LEFT side) -->
        <div class="onboarding-step onboarding-step-3" data-step="3">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Swipe right</span>
                <span class="onboarding-text-sub">Previous art / quote</span>
            </div>
        </div>
        
        <!-- Step 4: Tap or swipe up (INSIDE info section) -->
        <div class="onboarding-step onboarding-step-4" data-step="4">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 19V5"/>
                    <polyline points="5 12 12 5 19 12"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Tap or swipe up</span>
                <span class="onboarding-text-sub">Expand description</span>
            </div>
        </div>
        
        <!-- Got it button -->
        <button class="onboarding-skip">Got it</button>
        
        <!-- Progress dots (below button) -->
        <div class="onboarding-dots">
            <div class="onboarding-dot active"></div>
            <div class="onboarding-dot"></div>
            <div class="onboarding-dot"></div>
            <div class="onboarding-dot"></div>
        </div>
    `;
    
    return overlay;
}

// Show onboarding
function showOnboarding() {
    const overlay = createOnboardingOverlay();
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    const steps = overlay.querySelectorAll('.onboarding-step');
    const dots = overlay.querySelectorAll('.onboarding-dot');
    const skipBtn = overlay.querySelector('.onboarding-skip');
    const highlightArt = overlay.querySelector('.onboarding-highlight-art');
    const highlightInfo = overlay.querySelector('.onboarding-highlight-info');
    
    function showStep(index) {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        steps[index]?.classList.add('visible');
        
        // Show art highlight for step 1 (tap for fullscreen)
        if (index === 0) highlightArt.classList.add('visible');
        
        // Show info highlight for step 4 (tap or swipe up)
        if (index === 3) highlightInfo.classList.add('visible');
        
        // Show button after last step
        if (index === 3) {
            setTimeout(() => skipBtn.classList.add('visible'), 300);
        }
    }
    
    // Sequential timing
    setTimeout(() => showStep(0), 200);
    setTimeout(() => showStep(1), 700);
    setTimeout(() => showStep(2), 1200);
    setTimeout(() => showStep(3), 1700);
    
    // ✅ Allow closing after all steps are shown
    let canClose = false;
    setTimeout(() => { canClose = true; }, 2000);
    
    // Got it button closes
    skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeOnboarding(overlay);
    });
    
    // ✅ Tap anywhere to close (after steps are shown)
    overlay.addEventListener('click', () => {
        if (canClose) {
            closeOnboarding(overlay);
        }
    });
}

function closeOnboarding(overlay) {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 400);
}

// Public API
export function initOnboarding() {
    if (shouldShowOnboarding()) {
        setTimeout(showOnboarding, 800);
    }
}

export function forceShowOnboarding() {
    showOnboarding();
}

export function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    console.log('Onboarding reset. Refresh to see again.');
}

window.resetOnboarding = resetOnboarding;
window.forceShowOnboarding = forceShowOnboarding;