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
      // Design Tokens - Colors (Material Design 3)
      colors: {
        // Semantic color roles for consistency
        primary: {
          DEFAULT: 'var(--color-primary)',
          onPrimary: 'var(--color-on-primary)',
          container: 'var(--color-primary-container)',
          onContainer: 'var(--color-on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          onSecondary: 'var(--color-on-secondary)',
          container: 'var(--color-secondary-container)',
          onContainer: 'var(--color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--color-tertiary)',
          onTertiary: 'var(--color-on-tertiary)',
          container: 'var(--color-tertiary-container)',
          onContainer: 'var(--color-on-tertiary-container)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          onError: 'var(--color-on-error)',
          container: 'var(--color-error-container)',
          onContainer: 'var(--color-on-error-container)',
        },
        // Neutral palette (grayscale)
        outline: 'var(--color-outline)',
        background: 'var(--color-background)',
        onBackground: 'var(--color-on-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          variant: 'var(--color-surface-variant)',
          onSurface: 'var(--color-on-surface)',
          onVariant: 'var(--color-on-surface-variant)',
        },
        // Custom brand colors
        brand: {
          blue: 'var(--color-brand-blue)',
          green: 'var(--color-brand-green)',
          red: 'var(--color-brand-red)',
        },
        // Legacy support
        foreground: 'var(--color-on-background)',
      },
      
      // Design Tokens - Typography
      fontFamily: {
        sans: ['var(--font-primary)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      
      fontSize: {
        // Material Design 3 Type Scale
        'display-large': ['57px', { lineHeight: '64px', fontWeight: '400' }],
        'display-medium': ['45px', { lineHeight: '52px', fontWeight: '400' }],
        'display-small': ['36px', { lineHeight: '44px', fontWeight: '400' }],
        'headline-large': ['32px', { lineHeight: '40px', fontWeight: '400' }],
        'headline-medium': ['28px', { lineHeight: '36px', fontWeight: '400' }],
        'headline-small': ['24px', { lineHeight: '32px', fontWeight: '400' }],
        'title-large': ['22px', { lineHeight: '28px', fontWeight: '500' }],
        'title-medium': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'title-small': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-large': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-large': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-medium': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-small': ['11px', { lineHeight: '16px', fontWeight: '500' }],
      },
      
      // Design Tokens - Spacing (4px grid system)
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },
      
      // Design Tokens - Shadows / Elevation (Material Design 3)
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
        'elevation-4': '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30)',
        'elevation-5': '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)',
      },
      
      // Design Tokens - Border Radii
      borderRadius: {
        'none': '0px',
        'small': '4px',
        'medium': '8px',
        'large': '16px',
        'full': '9999px',
      },
      
      // Responsive breakpoints for better mobile experience
      screens: {
        'xs': '375px', // Small mobile
        'sm': '640px', // Medium mobile
        'md': '768px', // Tablet
        'lg': '1024px', // Desktop
        'xl': '1280px', // Large desktop
        '2xl': '1536px', // Extra large desktop
      },
    },
  },
  plugins: [],
}
export default config
