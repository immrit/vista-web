/** Vista design tokens — synced with Flutter AppColors */
export const colors = {
  primary: '#6366F1',
  primaryStart: '#6366F1',
  primaryEnd: '#8B5CF6',
  primaryLight: '#EEF2FF',
  primaryDark: '#4F46E5',
  secondary: '#8B5CF6',
  accent: '#EC4899',

  light: {
    background: '#F8F9FF',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4FF',
    border: '#E5E7EB',
    textPrimary: '#0F1117',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
  },

  dark: {
    background: '#09090F',
    surface: '#13131E',
    surfaceVariant: '#1C1C2E',
    elevated: '#252540',
    border: '#2A2A45',
    textPrimary: '#F0F0FF',
    textSecondary: '#8B8BAD',
    textTertiary: '#5A5A7A',
  },

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  chat: {
    myBubble: '#6366F1',
    otherBubble: '#1C1C2E',
    myBubbleLight: '#EEF2FF',
    otherBubbleLight: '#F3F4F6',
  },
} as const

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  island: 30,
} as const

export const layout = {
  sidebarWidth: 275,
  feedMaxWidth: 600,
  rightPanelWidth: 320,
  mobileBottomNavHeight: 90,
  mobileTopBarHeight: 56,
} as const
