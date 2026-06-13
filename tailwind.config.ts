import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                vazir: ['Vazirmatn', 'Tahoma', 'Arial', 'sans-serif'],
                bauhaus: ['BauhausBold', 'cursive'],
            },
            colors: {
                vista: {
                    primary: '#6366F1',
                    'primary-dark': '#4F46E5',
                    'primary-light': '#EEF2FF',
                    secondary: '#8B5CF6',
                    accent: '#EC4899',
                    bg: '#F8F9FF',
                    'bg-dark': '#09090F',
                    surface: '#FFFFFF',
                    'surface-dark': '#13131E',
                    'surface-variant': '#F3F4FF',
                    'surface-variant-dark': '#1C1C2E',
                    elevated: '#252540',
                    border: '#E5E7EB',
                    'border-dark': '#2A2A45',
                    'text-primary': '#0F1117',
                    'text-primary-dark': '#F0F0FF',
                    'text-secondary': '#6B7280',
                    'text-secondary-dark': '#8B8BAD',
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                },
            },
            backgroundImage: {
                'vista-gradient': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                'vista-hero': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
            },
            spacing: {
                sidebar: '275px',
                'feed-max': '600px',
                'right-panel': '320px',
                'bottom-nav': '90px',
            },
            borderRadius: {
                island: '30px',
            },
            backdropBlur: {
                glass: '30px',
            },
            keyframes: {
                waveform: {
                    '0%, 100%': { transform: 'scaleY(1)' },
                    '50%': { transform: 'scaleY(0.4)' },
                },
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-bottom': {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                wobble: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                pop: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '40%': { transform: 'scale(1.1)', opacity: '1' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'story-ring': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                waveform: 'waveform 0.6s ease-in-out infinite alternate',
                'spin-slow': 'spin-slow 8s linear infinite',
                'fade-up': 'fade-up 0.3s ease-out',
                'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                wobble: 'wobble 2s ease-in-out infinite',
                pop: 'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                'story-ring': 'story-ring 3s ease infinite',
                shimmer: 'shimmer 2s linear infinite',
            },
        },
    },
    plugins: [],
}

export default config
