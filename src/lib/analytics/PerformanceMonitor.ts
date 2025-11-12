interface PerformanceMetric {
  type: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private recentMetrics: PerformanceMetric[] = [];
  private maxRecentMetrics = 100;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Track page load time
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.trackMetric('page_load', loadTime);
      });
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  trackFeedLoad(duration: number, metadata?: Record<string, any>) {
    this.trackMetric('feed_load', duration, metadata);

    // اگه بیشتر از 3 ثانیه طول کشید، alert بده
    if (duration > 3000) {
      this.reportSlowLoad({
        type: 'feed',
        duration,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        ...metadata,
      });
    }
  }

  trackMetric(key: string, value: number, metadata?: Record<string, any>) {
    const values = this.metrics.get(key) || [];
    values.push(value);

    // فقط 100 تا آخر رو نگه دار
    if (values.length > 100) {
      values.shift();
    }

    this.metrics.set(key, values);

    // Store recent metric
    this.recentMetrics.push({
      type: key,
      duration: value,
      timestamp: Date.now(),
      metadata,
    });

    if (this.recentMetrics.length > this.maxRecentMetrics) {
      this.recentMetrics.shift();
    }
  }

  getAverageLoadTime(key: string = 'feed_load'): number {
    const values = this.metrics.get(key) || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getMetrics(key?: string): PerformanceMetric[] {
    if (key) {
      return this.recentMetrics.filter((m) => m.type === key);
    }
    return [...this.recentMetrics];
  }

  private async reportSlowLoad(data: Record<string, any>) {
    try {
      // به backend بفرست (اگه API endpoint وجود داشته باشه)
      if (typeof fetch !== 'undefined') {
        await fetch('/api/analytics/slow-load', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).catch(() => {
          // Silent fail - analytics shouldn't break the app
        });
      }
    } catch (error) {
      console.debug('Failed to report slow load:', error);
    }
  }

  getStats() {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [key, values] of this.metrics.entries()) {
      if (values.length > 0) {
        stats[key] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return stats;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();


