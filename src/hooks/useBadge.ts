'use client'

import { useEffect } from 'react'

export function useBadge(count: number) {
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    if (!('setAppBadge' in navigator)) return

    if (count > 0) {
      (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> })
        .setAppBadge(count)
        .catch(() => { /* silently fail if not permitted */ })
    } else {
      (navigator as Navigator & { clearAppBadge: () => Promise<void> })
        .clearAppBadge()
        .catch(() => {})
    }
  }, [count])
}
