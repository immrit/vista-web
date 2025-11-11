export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    if (values.length > 100) {
      values.shift();
    }
  }

  static getStats(name: string) {
    const values = this.metrics.get(name) ?? [];
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((sum, current) => sum + current, 0) / values.length;
    const percentile = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

    return {
      count: values.length,
      avg: Math.round(avg),
      p50: Math.round(percentile(0.5)),
      p95: Math.round(percentile(0.95)),
      p99: Math.round(percentile(0.99)),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
    };
  }

  static logMetrics() {
    console.log('=== Performance Metrics ===');
    for (const [name] of this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, stats);
      }
    }
  }

  static async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    PerformanceMonitor.logMetrics();
  }, 5 * 60 * 1000).unref?.();
}

