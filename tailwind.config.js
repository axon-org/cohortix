/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        canvas: 'hsl(var(--bg-canvas))',
        surface: 'hsl(var(--bg-surface))',
        'surface-raised': 'hsl(var(--bg-surface-raised))',
        'surface-overlay': 'hsl(var(--bg-surface-overlay))',
        'bg-subtle': 'hsl(var(--bg-subtle))',
        'text-primary': 'hsl(var(--text-primary))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-muted': 'hsl(var(--text-muted))',
        'interactive-primary': 'hsl(var(--interactive-primary))',
        'interactive-secondary': 'hsl(var(--interactive-secondary))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Surface levels
        'surface-0': 'hsl(var(--surface-0))',
        'surface-1': 'hsl(var(--surface-1))',
        'surface-2': 'hsl(var(--surface-2))',
        'surface-3': 'hsl(var(--surface-3))',
        // Void accent colors
        'void-cyan': 'hsl(var(--void-cyan))',
        'void-mint': 'hsl(var(--void-mint))',
        'void-amber': 'hsl(var(--void-amber))',
        'void-violet': 'hsl(var(--void-violet))',
        'void-crimson': 'hsl(var(--void-crimson))',
        // Semantic status colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        'status-success': {
          bg: 'hsl(var(--status-success-bg))',
          fg: 'hsl(var(--status-success-fg))',
          border: 'hsl(var(--status-success-border))',
          icon: 'hsl(var(--status-success-icon))',
          solid: 'hsl(var(--status-success-solid))',
        },
        'status-warning': {
          bg: 'hsl(var(--status-warning-bg))',
          fg: 'hsl(var(--status-warning-fg))',
          border: 'hsl(var(--status-warning-border))',
          icon: 'hsl(var(--status-warning-icon))',
          solid: 'hsl(var(--status-warning-solid))',
        },
        'status-error': {
          bg: 'hsl(var(--status-error-bg))',
          fg: 'hsl(var(--status-error-fg))',
          border: 'hsl(var(--status-error-border))',
          icon: 'hsl(var(--status-error-icon))',
          solid: 'hsl(var(--status-error-solid))',
        },
        'status-info': {
          bg: 'hsl(var(--status-info-bg))',
          fg: 'hsl(var(--status-info-fg))',
          border: 'hsl(var(--status-info-border))',
          icon: 'hsl(var(--status-info-icon))',
          solid: 'hsl(var(--status-info-solid))',
        },
        'status-neutral': {
          bg: 'hsl(var(--status-neutral-bg))',
          fg: 'hsl(var(--status-neutral-fg))',
          border: 'hsl(var(--status-neutral-border))',
        },
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
        xs: '2px',
        btn: 'var(--btn-radius)',
        card: 'var(--card-radius)',
        input: 'var(--input-radius)',
        nav: 'var(--nav-item-radius)',
        kanban: 'var(--kanban-card-radius)',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        card: 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
        'kanban-drag': 'var(--kanban-card-shadow-drag)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'converge-top': 'convergeTop 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'converge-left': 'convergeLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'converge-right': 'convergeRight 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'converge-bottom': 'convergeBottom 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'converge-burst': 'convergeBurst 0.5s ease-out 0.9s forwards',
        'pair-fade-out': 'pairFadeOut 0.5s ease-in 1.8s forwards',
        'mc-fade-in': 'mcFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 2.0s forwards',
        'grid-flow': 'gridFlow 20s linear infinite',
        'edge-glow': 'edgeGlow 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.7', filter: 'brightness(1.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gridFlow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        edgeGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        convergeTop: {
          '0%': { transform: 'translate(-50%, -40px)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        convergeLeft: {
          '0%': { transform: 'translate(-40px, -50%)', opacity: '0' },
          '100%': { transform: 'translate(0, -50%)', opacity: '1' },
        },
        convergeRight: {
          '0%': { transform: 'translate(40px, -50%)', opacity: '0' },
          '100%': { transform: 'translate(0, -50%)', opacity: '1' },
        },
        convergeBottom: {
          '0%': { transform: 'translate(-50%, 40px)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        convergeBurst: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0.6' },
        },
        pairFadeOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        mcFadeIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
