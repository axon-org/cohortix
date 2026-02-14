/**
 * Typography Design Tokens
 *
 * Font families, sizes, weights, and line heights
 * Based on 1.25 ratio scale (Major Third)
 *
 * See: docs/UI_DESIGN_SYSTEM.md
 * Reference: TOOLS.md "Typography Scale (1.25 Ratio)"
 *
 * @packageDocumentation
 */

/**
 * Font families
 * System font stack with modern fallbacks
 */
export const fontFamily = {
  /** Primary sans-serif (UI text) */
  sans: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
  /** Monospace (code, technical content) */
  mono: ['Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
  /** Display (headings, marketing) - currently same as sans */
  display: ['Inter', 'system-ui', 'sans-serif'],
} as const;

/**
 * Font weights
 * Inter variable font supports 100-900
 */
export const fontWeight = {
  /** 300 - Light */
  light: '300',
  /** 400 - Normal/Regular */
  normal: '400',
  /** 500 - Medium */
  medium: '500',
  /** 600 - Semibold */
  semibold: '600',
  /** 700 - Bold */
  bold: '700',
  /** 800 - Extrabold */
  extrabold: '800',
} as const;

/**
 * Font sizes with line heights
 * Based on 1.25 (Major Third) ratio scale
 * Each size includes recommended line-height for readability
 */
export const fontSize = {
  /** 12px / 16px - Tiny labels, metadata */
  xs: ['0.75rem', { lineHeight: '1rem' }],
  /** 14px / 20px - Secondary text, captions */
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  /** 16px / 24px - Base body text */
  base: ['1rem', { lineHeight: '1.5rem' }],
  /** 18px / 28px - Emphasized body text */
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  /** 20px / 28px - Small headings */
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  /** 24px / 32px - Medium headings (H3) */
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  /** 30px / 36px - Large headings (H2) */
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  /** 36px / 40px - Extra large headings (H1) */
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  /** 48px / 48px - Display headings */
  '5xl': ['3rem', { lineHeight: '1' }],
  /** 60px / 60px - Hero headings */
  '6xl': ['3.75rem', { lineHeight: '1' }],
  /** 72px / 72px - Marketing hero */
  '7xl': ['4.5rem', { lineHeight: '1' }],
} as const;

/**
 * Line heights (unitless multipliers)
 * Used when overriding fontSize line-height
 */
export const lineHeight = {
  /** 1.0 - No extra space (large headings) */
  none: '1',
  /** 1.25 - Tight (small headings) */
  tight: '1.25',
  /** 1.375 - Snug (UI labels) */
  snug: '1.375',
  /** 1.5 - Normal (body text) */
  normal: '1.5',
  /** 1.625 - Relaxed (long-form content) */
  relaxed: '1.625',
  /** 2.0 - Loose (spacious layouts) */
  loose: '2',
} as const;

/**
 * Letter spacing (tracking)
 */
export const letterSpacing = {
  /** -0.05em - Tighter (large headings) */
  tighter: '-0.05em',
  /** -0.025em - Tight (headings) */
  tight: '-0.025em',
  /** 0 - Normal */
  normal: '0',
  /** 0.025em - Wide (small caps, labels) */
  wide: '0.025em',
  /** 0.05em - Wider (all caps) */
  wider: '0.05em',
  /** 0.1em - Widest (loose all caps) */
  widest: '0.1em',
} as const;

/**
 * Text styles for common UI patterns
 * Combines fontSize, fontWeight, lineHeight for consistency
 */
export const textStyles = {
  /** Hero heading (marketing pages) */
  hero: {
    fontSize: fontSize['6xl'][0],
    lineHeight: fontSize['6xl'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  /** H1 heading */
  h1: {
    fontSize: fontSize['4xl'][0],
    lineHeight: fontSize['4xl'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  /** H2 heading */
  h2: {
    fontSize: fontSize['3xl'][0],
    lineHeight: fontSize['3xl'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },
  /** H3 heading */
  h3: {
    fontSize: fontSize['2xl'][0],
    lineHeight: fontSize['2xl'][1].lineHeight,
    fontWeight: fontWeight.semibold,
  },
  /** H4 heading */
  h4: {
    fontSize: fontSize.xl[0],
    lineHeight: fontSize.xl[1].lineHeight,
    fontWeight: fontWeight.semibold,
  },
  /** Body text (default) */
  body: {
    fontSize: fontSize.base[0],
    lineHeight: fontSize.base[1].lineHeight,
    fontWeight: fontWeight.normal,
  },
  /** Body text (large) */
  bodyLarge: {
    fontSize: fontSize.lg[0],
    lineHeight: fontSize.lg[1].lineHeight,
    fontWeight: fontWeight.normal,
  },
  /** Body text (small) */
  bodySmall: {
    fontSize: fontSize.sm[0],
    lineHeight: fontSize.sm[1].lineHeight,
    fontWeight: fontWeight.normal,
  },
  /** Caption text (metadata, timestamps) */
  caption: {
    fontSize: fontSize.xs[0],
    lineHeight: fontSize.xs[1].lineHeight,
    fontWeight: fontWeight.normal,
  },
  /** Label text (form labels, nav items) */
  label: {
    fontSize: fontSize.sm[0],
    lineHeight: fontSize.sm[1].lineHeight,
    fontWeight: fontWeight.medium,
  },
  /** Button text (default) */
  button: {
    fontSize: fontSize.sm[0],
    lineHeight: fontSize.sm[1].lineHeight,
    fontWeight: fontWeight.medium,
  },
  /** Button text (large) */
  buttonLarge: {
    fontSize: fontSize.base[0],
    lineHeight: fontSize.base[1].lineHeight,
    fontWeight: fontWeight.semibold,
  },
  /** Code/monospace text */
  code: {
    fontSize: fontSize.sm[0],
    lineHeight: fontSize.sm[1].lineHeight,
    fontFamily: fontFamily.mono.join(', '),
  },
} as const;

/**
 * Component-specific typography
 * Typography rules for specific UI components
 */
export const componentTypography = {
  /** Mission/Goal card */
  card: {
    title: {
      fontSize: fontSize.lg[0],
      lineHeight: fontSize.lg[1].lineHeight,
      fontWeight: fontWeight.semibold,
    },
    description: {
      fontSize: fontSize.sm[0],
      lineHeight: fontSize.sm[1].lineHeight,
      fontWeight: fontWeight.normal,
    },
    metadata: {
      fontSize: fontSize.xs[0],
      lineHeight: fontSize.xs[1].lineHeight,
      fontWeight: fontWeight.normal,
    },
  },
  /** Ally card */
  ally: {
    name: {
      fontSize: fontSize.lg[0],
      lineHeight: fontSize.lg[1].lineHeight,
      fontWeight: fontWeight.semibold,
    },
    role: {
      fontSize: fontSize.sm[0],
      lineHeight: fontSize.sm[1].lineHeight,
      fontWeight: fontWeight.normal,
    },
    status: {
      fontSize: fontSize.sm[0],
      lineHeight: fontSize.sm[1].lineHeight,
      fontWeight: fontWeight.medium,
    },
  },
  /** Navigation sidebar */
  sidebar: {
    item: {
      fontSize: fontSize.sm[0],
      lineHeight: fontSize.sm[1].lineHeight,
      fontWeight: fontWeight.medium,
    },
    section: {
      fontSize: fontSize.xs[0],
      lineHeight: fontSize.xs[1].lineHeight,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.wide,
      textTransform: 'uppercase' as const,
    },
  },
  /** Form fields */
  form: {
    label: {
      fontSize: fontSize.sm[0],
      lineHeight: fontSize.sm[1].lineHeight,
      fontWeight: fontWeight.medium,
    },
    input: {
      fontSize: fontSize.base[0],
      lineHeight: fontSize.base[1].lineHeight,
      fontWeight: fontWeight.normal,
    },
    helperText: {
      fontSize: fontSize.xs[0],
      lineHeight: fontSize.xs[1].lineHeight,
      fontWeight: fontWeight.normal,
    },
    error: {
      fontSize: fontSize.xs[0],
      lineHeight: fontSize.xs[1].lineHeight,
      fontWeight: fontWeight.medium,
    },
  },
  /** Breadcrumbs */
  breadcrumb: {
    fontSize: fontSize.sm[0],
    lineHeight: fontSize.sm[1].lineHeight,
    fontWeight: fontWeight.normal,
  },
  /** Tabs */
  tab: {
    fontSize: fontSize.sm[0],
    lineHeight: fontSize.sm[1].lineHeight,
    fontWeight: fontWeight.medium,
  },
  /** Badge/Pill */
  badge: {
    fontSize: fontSize.xs[0],
    lineHeight: fontSize.xs[1].lineHeight,
    fontWeight: fontWeight.medium,
  },
  /** Tooltip */
  tooltip: {
    fontSize: fontSize.xs[0],
    lineHeight: fontSize.xs[1].lineHeight,
    fontWeight: fontWeight.normal,
  },
} as const;

/**
 * Responsive typography utilities
 * Functions to calculate responsive font sizes
 */
export const responsiveTypography = {
  /**
   * Scale font size based on viewport
   * Mobile: reduce by 1 size, Desktop: default
   */
  scaledSize: (desktopSize: keyof typeof fontSize) => {
    const sizeMap: Record<keyof typeof fontSize, keyof typeof fontSize> = {
      '7xl': '6xl',
      '6xl': '5xl',
      '5xl': '4xl',
      '4xl': '3xl',
      '3xl': '2xl',
      '2xl': 'xl',
      xl: 'lg',
      lg: 'base',
      base: 'sm',
      sm: 'xs',
      xs: 'xs', // Don't go smaller
    };
    return {
      mobile: fontSize[sizeMap[desktopSize]],
      desktop: fontSize[desktopSize],
    };
  },

  /**
   * Get heading size for mobile vs desktop
   */
  heading: (level: 1 | 2 | 3 | 4) => {
    const headingMap = {
      1: responsiveTypography.scaledSize('4xl'),
      2: responsiveTypography.scaledSize('3xl'),
      3: responsiveTypography.scaledSize('2xl'),
      4: responsiveTypography.scaledSize('xl'),
    };
    return headingMap[level];
  },
} as const;

/**
 * Accessibility utilities
 */
export const a11y = {
  /** Minimum font size for body text (WCAG 2.2) */
  minimumBodySize: fontSize.base[0],
  /** Minimum font size for UI controls */
  minimumControlSize: fontSize.sm[0],
  /** Recommended line-height for readability */
  readableLineHeight: lineHeight.relaxed,
  /** Focus-visible styles for keyboard navigation */
  focusVisible: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineOffset: '2px',
  },
} as const;

/**
 * Export default fontSize object for Tailwind config
 */
export default fontSize;
