'use client'

import { useEffect } from 'react'

export function ThemeInit() {
  useEffect(() => {
    const theme = localStorage.getItem('vista_theme') || 'system'
    const reduceMotion = localStorage.getItem('vista_reduce_motion') === 'true'

    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (localStorage.getItem('vista_theme') === 'system') {
        document.documentElement.classList.toggle('dark', mq.matches)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return null
}
