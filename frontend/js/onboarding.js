/**
 * Onboarding Module
 * TikTok-style tutorial for first-time guest users on mobile
 */

const ONBOARDING_KEY = 'curio_onboarding_seen';

// Check if user should see onboarding
function shouldShowOnboarding() {
    // Debug logging
    console.log('[Onboarding] Checking conditions...');
    console.log('[Onboarding] Window width:', window.innerWidth);
    console.log('[Onboarding] User logged in:', localStorage.getItem('user_logged_in'));
    console.log('[Onboarding] Already seen:', localStorage.getItem(ONBOARDING_KEY));
    
    // Only on mobile/tablet
    if (window.innerWidth > 768) {
        console.log('[Onboarding] Skipped: Desktop device');
        return false;
    }
    
    // Not for logged in users
    if (localStorage.getItem('user_logged_in') === 'true') {
        console.log('[Onboarding] Skipped: User is logged in');
        return false;
    }
    
    // Not if already seen
    if (localStorage.getItem(ONBOARDING_KEY) === 'true') {
        console.log('[Onboarding] Skipped: Already seen');
        return false;
    }
    
    console.log('[Onboarding] ✅ Will show onboarding!');
    return true;
}

// Create onboarding overlay
function createOnboardingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'onboarding-overlay';
    
    overlay.innerHTML = `
        <!-- Highlight cutout for info section -->
        <div class="onboarding-highlight"></div>
        
        <!-- Step 1: Swipe Left -->
        <div class="onboarding-step onboarding-step-1" data-step="1">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Swipe left</span>
                <span class="onboarding-text-sub">New art or quote</span>
            </div>
        </div>
        
        <!-- Step 2: Swipe Right -->
        <div class="onboarding-step onboarding-step-2" data-step="2">
            <div class="onboarding-text">
                <span class="onboarding-text-main">Swipe right</span>
                <span class="onboarding-text-sub">Go back</span>
            </div>
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            </div>
        </div>
        
        <!-- Step 3: Tap to read -->
        <div class="onboarding-step onboarding-step-3" data-step="3">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Tap card</span>
                <span class="onboarding-text-sub">Read full description</span>
            </div>
        </div>
        
        <!-- Progress dots -->
        <div class="onboarding-dots">
            <div class="onboarding-dot active" data-dot="1"></div>
            <div class="onboarding-dot" data-dot="2"></div>
            <div class="onboarding-dot" data-dot="3"></div>
        </div>
        
        <!-- Skip/Got it button -->
        <button class="onboarding-skip">Got it!</button>
    `;
    
    return overlay;
}

// Show onboarding with sequential animations
function showOnboarding() {
    console.log('[Onboarding] Creating overlay...');
    
    const overlay = createOnboardingOverlay();
    document.body.appendChild(overlay);
    
    // Activate overlay
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        console.log('[Onboarding] Overlay activated');
    });
    
    const steps = overlay.querySelectorAll('.onboarding-step');
    const dots = overlay.querySelectorAll('.onboarding-dot');
    const skipBtn = overlay.querySelector('.onboarding-skip');
    
    // Show steps sequentially
    function showStep(index) {
        console.log('[Onboarding] Showing step', index + 1);
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // Show current step
        steps.forEach((step, i) => {
            if (i === index) {
                step.classList.add('visible');
            }
        });
        
        // Show skip button after last step
        if (index === steps.length - 1) {
            setTimeout(() => {
                skipBtn.classList.add('visible');
            }, 500);
        }
    }
    
    // Start showing steps
    setTimeout(() => showStep(0), 300);
    setTimeout(() => showStep(1), 1000);
    setTimeout(() => showStep(2), 1700);
    
    // Skip button handler
    skipBtn.addEventListener('click', () => {
        closeOnboarding(overlay);
    });
    
    // Also close on tap anywhere after all steps shown
    let canClose = false;
    setTimeout(() => {
        canClose = true;
    }, 2500);
    
    overlay.addEventListener('click', (e) => {
        if (canClose && e.target === overlay) {
            closeOnboarding(overlay);
        }
    });
}

// Close onboarding
function closeOnboarding(overlay) {
    console.log('[Onboarding] Closing...');
    
    // Mark as seen
    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    // Fade out
    overlay.classList.remove('active');
    
    // Remove from DOM
    setTimeout(() => {
        overlay.remove();
        console.log('[Onboarding] Removed from DOM');
    }, 400);
}

// Initialize onboarding
export function initOnboarding() {
    console.log('[Onboarding] initOnboarding called');
    
    if (shouldShowOnboarding()) {
        // Show after app is loaded
        setTimeout(() => {
            showOnboarding();
        }, 800);
    }
}

// Force show onboarding (for testing)
export function forceShowOnboarding() {
    console.log('[Onboarding] Force showing...');
    showOnboarding();
}

// Reset onboarding (for testing)
export function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    console.log('[Onboarding] Reset. Refresh to see again.');
}

// Expose functions globally for testing
window.resetOnboarding = resetOnboarding;
window.forceShowOnboarding = forceShowOnboarding;