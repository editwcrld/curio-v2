// Application State
class AppState {
    constructor() {
        this.currentView = 'art';
        this.currentArtData = null;
        this.currentQuoteData = null;
        this.currentGradient = '';
        this.listeners = [];
    }

    setView(view) {
        this.currentView = view;
        this.notify();
    }

    setArtData(data) {
        this.currentArtData = data;
        this.notify();
    }

    setQuoteData(data) {
        this.currentQuoteData = data;
        this.notify();
    }

    setGradient(gradient) {
        this.currentGradient = gradient;
        this.notify();
    }

    // Observer pattern for state changes
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(callback => callback(this));
    }
}

// Export singleton instance
export const appState = new AppState();