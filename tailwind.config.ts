import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '.dark'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        'background-alt': 'hsl(var(--background-alt))',
        'surface-75': 'hsl(var(--surface-75))',
        'surface-100': 'hsl(var(--surface-100))',
        'surface-200': 'hsl(var(--surface-200))',
        'surface-300': 'hsl(var(--surface-300))',
        'surface-400': 'hsl(var(--surface-400))',
        foreground: 'hsl(var(--foreground))',
        'foreground-light': 'hsl(var(--foreground-light))',
        'foreground-lighter': 'hsl(var(--foreground-lighter))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-contrast': 'hsl(var(--foreground-contrast))',
        brand: 'hsl(var(--brand))',
        'brand-600': 'hsl(var(--brand-600))',
        border: 'hsl(var(--border))',
        'border-muted': 'hsl(var(--border-muted))',
        'border-secondary': 'hsl(var(--border-secondary))',
        'border-strong': 'hsl(var(--border-strong))',
        'border-control': 'hsl(var(--border-control))',
        destructive: 'hsl(var(--destructive))',
        'destructive-bg': 'hsl(var(--destructive-bg))',
        warning: 'hsl(var(--warning))',
        'warning-bg': 'hsl(var(--warning-bg))',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
