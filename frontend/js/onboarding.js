/**
 * Onboarding Module
 * TikTok-style tutorial for first-time guest users on mobile
 */

const ONBOARDING_KEY = 'curio_onboarding_seen';

// Check if user should see onboarding
function shouldShowOnboarding() {
    // Only on mobile/tablet
    if (window.innerWidth > 768) {
        return false;
    }
    
    // Not for logged in users
    if (localStorage.getItem('user_logged_in') === 'true') {
        return false;
    }
    
    // Not if already seen
    if (localStorage.getItem(ONBOARDING_KEY) === 'true') {
        return false;
    }
    
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
        
        <!-- Step 1: Swipe Right (left side) -->
        <div class="onboarding-step onboarding-step-1" data-step="1">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Swipe right</span>
                <span class="onboarding-text-sub">Go back</span>
            </div>
        </div>
        
        <!-- Step 2: Swipe Left (right side) -->
        <div class="onboarding-step onboarding-step-2" data-step="2">
            <div class="onboarding-text">
                <span class="onboarding-text-main">Swipe left</span>
                <span class="onboarding-text-sub">New art or quote</span>
            </div>
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
            </div>
        </div>
        
        <!-- Step 3: Tap art (upper area, pointing down) -->
        <div class="onboarding-step onboarding-step-3" data-step="3">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14"/>
                    <polyline points="19 12 12 19 5 12"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Tap image</span>
                <span class="onboarding-text-sub">View full picture</span>
            </div>
        </div>
        
        <!-- Step 4: Tap card (above info section) -->
        <div class="onboarding-step onboarding-step-4" data-step="4">
            <div class="onboarding-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14"/>
                    <polyline points="19 12 12 19 5 12"/>
                </svg>
            </div>
            <div class="onboarding-text">
                <span class="onboarding-text-main">Tap card</span>
                <span class="onboarding-text-sub">Read description</span>
            </div>
        </div>
        
        <!-- Progress dots -->
        <div class="onboarding-dots">
            <div class="onboarding-dot active" data-dot="1"></div>
            <div class="onboarding-dot" data-dot="2"></div>
            <div class="onboarding-dot" data-dot="3"></div>
            <div class="onboarding-dot" data-dot="4"></div>
        </div>
        
        <!-- Got it button -->
        <button class="onboarding-skip">Got it!</button>
    `;
    
    return overlay;
}

// Show onboarding with sequential animations
function showOnboarding() {
    const overlay = createOnboardingOverlay();
    document.body.appendChild(overlay);
    
    // Activate overlay
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    const steps = overlay.querySelectorAll('.onboarding-step');
    const dots = overlay.querySelectorAll('.onboarding-dot');
    const skipBtn = overlay.querySelector('.onboarding-skip');
    const highlightArt = overlay.querySelector('.onboarding-highlight-art');
    const highlightInfo = overlay.querySelector('.onboarding-highlight-info');
    
    // Show steps sequentially
    function showStep(index) {
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // Show current step
        steps[index]?.classList.add('visible');
        
        // Show highlights based on step
        if (index === 2) {
            // Step 3: Tap image - highlight art area
            highlightArt.classList.add('visible');
        }
        
        if (index === 3) {
            // Step 4: Tap card - highlight info section
            highlightInfo.classList.add('visible');
        }
        
        // Show skip button after last step
        if (index === steps.length - 1) {
            setTimeout(() => {
                skipBtn.classList.add('visible');
            }, 400);
        }
    }
    
    // Start showing steps with delays
    setTimeout(() => showStep(0), 300);   // Swipe right
    setTimeout(() => showStep(1), 900);   // Swipe left
    setTimeout(() => showStep(2), 1500);  // Tap image
    setTimeout(() => showStep(3), 2100);  // Tap card
    
    // Skip button handler
    skipBtn.addEventListener('click', () => {
        closeOnboarding(overlay);
    });
    
    // Also close on tap anywhere after all steps shown
    let canClose = false;
    setTimeout(() => {
        canClose = true;
    }, 2800);
    
    overlay.addEventListener('click', (e) => {
        if (canClose && (e.target === overlay || e.target.classList.contains('onboarding-highlight-art') || e.target.classList.contains('onboarding-highlight-info'))) {
            closeOnboarding(overlay);
        }
    });
}

// Close onboarding
function closeOnboarding(overlay) {
    // Mark as seen
    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    // Fade out
    overlay.classList.remove('active');
    
    // Remove from DOM
    setTimeout(() => {
        overlay.remove();
    }, 400);
}

// Initialize onboarding
export function initOnboarding() {
    if (shouldShowOnboarding()) {
        // Show after app is loaded
        setTimeout(() => {
            showOnboarding();
        }, 800);
    }
}

// Force show onboarding (for testing)
export function forceShowOnboarding() {
    showOnboarding();
}

// Reset onboarding (for testing)
export function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    console.log('Onboarding reset. Refresh to see again.');
}

// Expose functions globally for testing
window.resetOnboarding = resetOnboarding;
window.forceShowOnboarding = forceShowOnboarding;