/**
 * Language Toggle Module
 * ✅ DE/EN Toggle für AI Descriptions
 * ✅ Speichert Preference in localStorage
 * ✅ Toggle muss im HTML existieren!
 */

const STORAGE_KEY = 'curio_language';
let currentLanguage = localStorage.getItem(STORAGE_KEY) || 'de';

export function getCurrentLanguage() {
    return currentLanguage;
}

export function setLanguage(lang) {
    if (lang !== 'de' && lang !== 'en') return;
    
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update toggle buttons
    document.querySelectorAll('.lang-toggle .lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
    
    // Trigger content update
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

export function getLocalizedDescription(item) {
    if (!item) return null;
    
    if (currentLanguage === 'de') {
        return item.ai_description_de || item.ai_description_en || item.backgroundInfo || null;
    } else {
        return item.ai_description_en || item.ai_description_de || item.backgroundInfo || null;
    }
}

export function initLanguageToggle() {
    // Set initial state
    document.querySelectorAll('.lang-toggle .lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setLanguage(btn.dataset.lang);
        });
    });
}