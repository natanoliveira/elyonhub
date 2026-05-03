import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#553159',
          alt: '#7D6AA6',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#BDB0D9',
          foreground: '#553159',
        },
        accent: {
          DEFAULT: '#A68881',
          foreground: '#ffffff',
        },
        foreground: '#0D0D0D',
        background: '#fafafa',
        border: '#e2e0e8',
        destructive: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
}

export default config
