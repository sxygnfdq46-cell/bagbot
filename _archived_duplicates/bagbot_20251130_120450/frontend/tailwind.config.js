/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './design-system/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './index.html',
    './app.js',
    './*.html'
  ],
  darkMode: 'class',
  mode: 'jit',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        // Sci-Fi Neon Theme - Primary Colors
        neon: {
          cyan: '#00F6FF',      // Primary neon cyan
          purple: '#9B5CFF',    // Secondary neon purple
          pink: '#FF007A',      // Accent neon pink
          magenta: '#FF00FF',   // Bright magenta
          yellow: '#FFFF00',    // Neon yellow
          green: '#00FF00',     // Neon green
          orange: '#FF6600',    // Neon orange
          blue: '#0080FF',      // Neon blue
        },
        // Dark backgrounds for sci-fi theme
        dark: {
          50: '#1A1A1A',
          100: '#0F0F0F',
          200: '#0A0A0A',
          300: '#050505',
          400: '#030303',
          500: '#000000',
        },
        // Glass morphism panels
        glass: {
          light: 'rgba(255, 255, 255, 0.04)',
          lighter: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(0, 255, 255, 0.25)',
          'border-strong': 'rgba(0, 255, 255, 0.5)',
        },
        // Backwards compatibility
        primary: {
          DEFAULT: '#00F6FF',
          light: '#33F8FF',
          dark: '#00C4CC',
        },
        secondary: {
          DEFAULT: '#9B5CFF',
          light: '#B57FFF',
          dark: '#7A3FCC',
        },
        accent: {
          DEFAULT: '#FF007A',
          light: '#FF3395',
          dark: '#CC0062',
        },
        // Neutrals with neon tint
        neutral: {
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#D4D4D4',
          300: '#A3A3A3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#2A2A2A',
          800: '#1F1F1F',
          900: '#141414',
          950: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      spacing: {
        '0.5': '0.125rem',    // 2px
        '1': '0.25rem',       // 4px
        '1.5': '0.375rem',    // 6px
        '2': '0.5rem',        // 8px
        '2.5': '0.625rem',    // 10px
        '3': '0.75rem',       // 12px
        '3.5': '0.875rem',    // 14px
        '4': '1rem',          // 16px
        '5': '1.25rem',       // 20px
        '6': '1.5rem',        // 24px
        '7': '1.75rem',       // 28px
        '8': '2rem',          // 32px
        '9': '2.25rem',       // 36px
        '10': '2.5rem',       // 40px
        '11': '2.75rem',      // 44px
        '12': '3rem',         // 48px
        '14': '3.5rem',       // 56px
        '16': '4rem',         // 64px
        '18': '4.5rem',       // 72px
        '20': '5rem',         // 80px
        '24': '6rem',         // 96px
        '28': '7rem',         // 112px
        '32': '8rem',         // 128px
        '36': '9rem',         // 144px
        '40': '10rem',        // 160px
        '44': '11rem',        // 176px
        '48': '12rem',        // 192px
        '52': '13rem',        // 208px
        '56': '14rem',        // 224px
        '60': '15rem',        // 240px
        '64': '16rem',        // 256px
        '72': '18rem',        // 288px
        '80': '20rem',        // 320px
        '96': '24rem',        // 384px
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1' }],             // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],          // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],           // 72px
        '8xl': ['6rem', { lineHeight: '1' }],             // 96px
        '9xl': ['8rem', { lineHeight: '1' }],             // 128px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',     // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem',     // 6px
        'lg': '0.5rem',       // 8px
        'xl': '0.75rem',      // 12px
        '2xl': '1rem',        // 16px
        '3xl': '1.5rem',      // 24px
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'none': 'none',
        // Sci-Fi Neon Glow Effects
        'neon-cyan': '0 0 20px rgba(0, 246, 255, 0.5), 0 0 40px rgba(0, 246, 255, 0.3)',
        'neon-cyan-strong': '0 0 30px rgba(0, 246, 255, 0.8), 0 0 60px rgba(0, 246, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(155, 92, 255, 0.5), 0 0 40px rgba(155, 92, 255, 0.3)',
        'neon-purple-strong': '0 0 30px rgba(155, 92, 255, 0.8), 0 0 60px rgba(155, 92, 255, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 122, 0.5), 0 0 40px rgba(255, 0, 122, 0.3)',
        'neon-pink-strong': '0 0 30px rgba(255, 0, 122, 0.8), 0 0 60px rgba(255, 0, 122, 0.5)',
        'neon-card': '0 8px 32px 0 rgba(0, 246, 255, 0.15)',
        'neon-panel': 'inset 0 0 0 1px rgba(0, 255, 255, 0.25), 0 8px 24px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 246, 255, 0.5), 0 0 40px rgba(0, 246, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 246, 255, 0.8), 0 0 60px rgba(0, 246, 255, 0.5)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(155, 92, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(155, 92, 255, 0.8)' },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '41%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45%': { opacity: '0.9' },
          '46%': { opacity: '1' },
        },
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [
    // Add plugins here if needed, e.g.:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'),
  ],
}