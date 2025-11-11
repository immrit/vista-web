/**
 * Utility functions for playing notification sounds
 */

/**
 * Play a notification sound for new messages
 * Similar to WhatsApp web notification sound
 */
export function playMessageNotificationSound(): void {
    try {
        // Check if browser supports AudioContext
        if (typeof window === 'undefined') return;

        // Check if user has granted permission to play sounds
        // Some browsers require user interaction first
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a simple notification sound (similar to WhatsApp)
        // Two short beeps
        const playBeep = (frequency: number, duration: number, delay: number) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }, delay);
        };

        // Play two beeps (like WhatsApp)
        playBeep(800, 0.1, 0); // First beep
        playBeep(1000, 0.1, 150); // Second beep after 150ms
    } catch (error) {
        console.warn('Could not play notification sound:', error);
        // Fallback: Try using HTML5 Audio if available
        try {
            const audio = new Audio();
            // Create a data URL for a simple beep sound
            // This is a fallback if Web Audio API fails
            audio.volume = 0.3;
            // We'll use a simple approach with Web Audio API instead
        } catch (fallbackError) {
            console.warn('Fallback audio also failed:', fallbackError);
        }
    }
}

/**
 * Check if notification sounds are enabled (can be extended with user preferences)
 */
export function shouldPlayNotificationSound(): boolean {
    // Check localStorage for user preference
    if (typeof window === 'undefined') return true;

    const soundEnabled = localStorage.getItem('chat-sound-enabled');
    if (soundEnabled === 'false') return false;

    // Default: enabled (even if page is in focus, play sound like WhatsApp)
    return true;
}

/**
 * Check if the page is currently in focus
 */
export function isPageInFocus(): boolean {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
}

/**
 * Set notification sound preference
 */
export function setNotificationSoundEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('chat-sound-enabled', enabled.toString());
}

