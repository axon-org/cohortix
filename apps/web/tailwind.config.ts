import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Linear.app dark aesthetic
        background: '#0A0A0B',
        foreground: '#FAFAFA',
        card: '#141416',
        'card-foreground': '#FAFAFA',
        primary: {
          DEFAULT: '#5E6AD2',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1E1F24',
          foreground: '#A6A8AD',
        },
        muted: {
          DEFAULT: '#1E1F24',
          foreground: '#6E7079',
        },
        accent: {
          DEFAULT: '#5E6AD2',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        border: '#27282D',
        input: '#27282D',
        ring: '#5E6AD2',
        success: '#10B981',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
