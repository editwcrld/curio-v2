/**
 * Limit/Upgrade Modal Module
 * Shows upgrade prompt when registered users hit their limits
 */

/**
 * Open upgrade modal
 * @param {string} type - 'art' or 'quotes'
 */
export function openUpgradeModal(type) {
    if (!document.getElementById('upgrade-overlay')) {
        createUpgradeModal();
    }
    
    const overlay = document.getElementById('upgrade-overlay');
    updateModalContent(type);
    overlay.classList.add('active');
    // REMOVED: document.body.style.overflow = 'hidden';
}

/**
 * Close upgrade modal
 */
export function closeUpgradeModal() {
    const overlay = document.getElementById('upgrade-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    // REMOVED: document.body.style.overflow = '';
}

/**
 * Create upgrade modal HTML
 */
function createUpgradeModal() {
    const modalHTML = `
        <div id="upgrade-overlay" class="upgrade-overlay">
            <div class="upgrade-modal">
                <button id="upgrade-close" class="upgrade-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                
                <div class="upgrade-header">
                    <div class="upgrade-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h2 class="upgrade-title">Tageslimit erreicht</h2>
                    <p class="upgrade-subtitle" id="upgrade-subtitle">
                        Du hast dein Tageslimit erreicht
                    </p>
                </div>
                
                <div class="upgrade-content">
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <div class="upgrade-stat-label">Heutiger Verbrauch</div>
                            <div class="upgrade-stat-value" id="upgrade-current-usage">—</div>
                        </div>
                        <div class="upgrade-stat">
                            <div class="upgrade-stat-label">Dein Limit</div>
                            <div class="upgrade-stat-value" id="upgrade-current-limit">—</div>
                        </div>
                    </div>
                    
                    <div class="upgrade-divider"></div>
                    
                    <div class="upgrade-premium-benefits">
                        <h3 class="upgrade-benefits-title">Upgrade zu Premium</h3>
                        <ul class="upgrade-benefits-list">
                            <li class="upgrade-benefit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>Unbegrenzter Zugriff auf alle Kunstwerke</span>
                            </li>
                            <li class="upgrade-benefit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>Unbegrenzter Zugriff auf alle Zitate</span>
                            </li>
                            <li class="upgrade-benefit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>Exklusive Premium-Inhalte</span>
                            </li>
                            <li class="upgrade-benefit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>Werbefreies Erlebnis</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div class="upgrade-actions">
                    <button class="upgrade-btn-primary" id="upgrade-btn-view-plans" disabled>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                        View Plans
                        <span class="upgrade-btn-badge">Coming Soon</span>
                    </button>
                    <button class="upgrade-btn-secondary" id="upgrade-btn-maybe-later">
                        Vielleicht später
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    initUpgradeModalEvents();
}

/**
 * Initialize event listeners
 */
function initUpgradeModalEvents() {
    const overlay = document.getElementById('upgrade-overlay');
    const closeBtn = document.getElementById('upgrade-close');
    const maybeLaterBtn = document.getElementById('upgrade-btn-maybe-later');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeUpgradeModal);
    }
    
    if (maybeLaterBtn) {
        maybeLaterBtn.addEventListener('click', closeUpgradeModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeUpgradeModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeUpgradeModal();
        }
    });
}

/**
 * Update modal content based on type
 */
function updateModalContent(type) {
    import('./limits.js').then(module => {
        const usage = module.getLimitUsage();
        const limits = module.getCurrentLimits();
        
        const typeName = type === 'art' ? 'Kunstwerke' : 'Zitate';
        
        const subtitle = document.getElementById('upgrade-subtitle');
        if (subtitle) {
            subtitle.textContent = `Du hast alle ${limits[type]} ${typeName} für heute angesehen`;
        }
        
        const currentUsage = document.getElementById('upgrade-current-usage');
        if (currentUsage) {
            currentUsage.textContent = `${usage[type].used} ${typeName}`;
        }
        
        const currentLimit = document.getElementById('upgrade-current-limit');
        if (currentLimit) {
            currentLimit.textContent = `${limits[type]} ${typeName}/Tag`;
        }
    });
}