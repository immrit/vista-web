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
            },
            animation: {
                'waveform': 'waveform 0.6s ease-in-out infinite alternate',
                'spin-slow': 'spin-slow 8s linear infinite',
                'fade-up': 'fade-up 0.3s ease-out',
                'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
            },
        },
    },
    plugins: [],
}

export default config