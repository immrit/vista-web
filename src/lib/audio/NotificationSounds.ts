/**
 * Simple Notification Sound Manager
 * Uses HTMLAudioElement for playing audio files
 */

export class NotificationSoundManager {
  private messageReceivedAudio: HTMLAudioElement | null = null;
  private messageSentAudio: HTMLAudioElement | null = null;
  private reactionAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== 'undefined') {
      // بارگذاری فایل‌های صوتی
      this.messageReceivedAudio = new Audio('/sounds/message-recive.mp3');
      this.messageSentAudio = new Audio('/sounds/message-sent.mp3');
      
      // Preload audio files
      this.messageReceivedAudio.preload = 'auto';
      this.messageSentAudio.preload = 'auto';
      
      // تنظیم volume
      this.loadSettings();
      
      // بررسی تنظیمات mute از localStorage
      const savedMute = localStorage.getItem('soundsMuted');
      this.isMuted = savedMute === 'true';
    }
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    
    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume) {
      this.volume = parseFloat(savedVolume);
    }
    
    if (this.messageReceivedAudio) {
      this.messageReceivedAudio.volume = this.volume;
    }
    if (this.messageSentAudio) {
      this.messageSentAudio.volume = this.volume;
    }
  }

  // پخش صدای دریافت پیام
  playReceived() {
    if (this.isMuted || !this.messageReceivedAudio) return;
    
    this.messageReceivedAudio.currentTime = 0; // ریست به اول
    this.messageReceivedAudio.play().catch(err => {
      console.log('Error playing received sound:', err);
    });
  }

  // پخش صدای ارسال پیام
  playSent() {
    if (this.isMuted || !this.messageSentAudio) return;
    
    this.messageSentAudio.currentTime = 0; // ریست به اول
    this.messageSentAudio.play().catch(err => {
      console.log('Error playing sent sound:', err);
    });
  }

  // پخش صدای reaction (fallback به sent sound)
  playReaction() {
    if (this.isMuted || !this.messageSentAudio) return;
    
    this.messageSentAudio.currentTime = 0;
    this.messageSentAudio.play().catch(err => {
      console.log('Error playing reaction sound:', err);
    });
  }

  // خاموش کردن صدا
  mute() {
    this.isMuted = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsMuted', 'true');
    }
  }

  // روشن کردن صدا
  unmute() {
    this.isMuted = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsMuted', 'false');
    }
  }

  // تغییر وضعیت mute
  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return !this.isMuted;
  }

  // گرفتن وضعیت mute
  get muted(): boolean {
    return this.isMuted;
  }

  // تنظیم volume (0 تا 1)
  setVolume(value: number) {
    const volume = Math.max(0, Math.min(1, value));
    this.volume = volume;
    
    if (this.messageReceivedAudio) {
      this.messageReceivedAudio.volume = volume;
    }
    if (this.messageSentAudio) {
      this.messageSentAudio.volume = volume;
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', volume.toString());
    }
  }

  // گرفتن volume فعلی
  get currentVolume(): number {
    return this.volume;
  }

  // Backward compatibility - برای کدهای قبلی
  play(soundName: 'newMessage' | 'sent' | 'reaction', customVolume?: number) {
    if (customVolume !== undefined) {
      const oldVolume = this.volume;
      this.setVolume(customVolume);
      
      if (soundName === 'newMessage') {
        this.playReceived();
      } else if (soundName === 'sent') {
        this.playSent();
      } else if (soundName === 'reaction') {
        this.playReaction();
      }
      
      // Restore volume
      this.setVolume(oldVolume);
    } else {
      if (soundName === 'newMessage') {
        this.playReceived();
      } else if (soundName === 'sent') {
        this.playSent();
      } else if (soundName === 'reaction') {
        this.playReaction();
      }
    }
  }
}

// Instance واحد برای کل اپلیکیشن
export const soundManager = new NotificationSoundManager();
