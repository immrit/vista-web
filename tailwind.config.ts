import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                'vazir': ['Vazirmatn', 'Tahoma', 'Arial', 'sans-serif'],
                'bauhaus': ['BauhausBold', 'cursive'],
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
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
                'wobble': {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                'pop': {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '40%': { transform: 'scale(1.1)', opacity: '1' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            animation: {
                'waveform': 'waveform 0.6s ease-in-out infinite alternate',
                'spin-slow': 'spin-slow 8s linear infinite',
                'fade-up': 'fade-up 0.3s ease-out',
                'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
                'wobble': 'wobble 2s ease-in-out infinite',
                'pop': 'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            },
        },
    },
    plugins: [],
}

export default config