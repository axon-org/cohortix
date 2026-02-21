/**
 * Spacing Design Tokens
 *
 * Based on 8px grid system (Tailwind defaults)
 * All spacing values are multiples or half-multiples of 8px
 *
 * See: docs/decisions/DDR-003-responsive-breakpoint-strategy.md
 * Reference: TOOLS.md "Spacing Scale (8px Base)"
 *
 * @packageDocumentation
 */

/**
 * Base spacing scale (px values)
 * Maps to Tailwind's spacing scale
 */
export const spacing = {
  /** 0px */
  0: '0',
  /** 1px */
  px: '1px',
  /** 2px (0.125rem) */
  0.5: '0.125rem',
  /** 4px (0.25rem) - 0.5 units */
  1: '0.25rem',
  /** 6px (0.375rem) - 0.75 units */
  1.5: '0.375rem',
  /** 8px (0.5rem) - 1 unit */
  2: '0.5rem',
  /** 10px (0.625rem) - 1.25 units */
  2.5: '0.625rem',
  /** 12px (0.75rem) - 1.5 units */
  3: '0.75rem',
  /** 14px (0.875rem) - 1.75 units */
  3.5: '0.875rem',
  /** 16px (1rem) - 2 units */
  4: '1rem',
  /** 20px (1.25rem) - 2.5 units */
  5: '1.25rem',
  /** 24px (1.5rem) - 3 units */
  6: '1.5rem',
  /** 28px (1.75rem) - 3.5 units */
  7: '1.75rem',
  /** 32px (2rem) - 4 units */
  8: '2rem',
  /** 36px (2.25rem) - 4.5 units */
  9: '2.25rem',
  /** 40px (2.5rem) - 5 units */
  10: '2.5rem',
  /** 44px (2.75rem) - 5.5 units */
  11: '2.75rem',
  /** 48px (3rem) - 6 units */
  12: '3rem',
  /** 56px (3.5rem) - 7 units */
  14: '3.5rem',
  /** 64px (4rem) - 8 units */
  16: '4rem',
  /** 80px (5rem) - 10 units */
  20: '5rem',
  /** 96px (6rem) - 12 units */
  24: '6rem',
  /** 112px (7rem) - 14 units */
  28: '7rem',
  /** 128px (8rem) - 16 units */
  32: '8rem',
  /** 144px (9rem) - 18 units */
  36: '9rem',
  /** 160px (10rem) - 20 units */
  40: '10rem',
  /** 176px (11rem) - 22 units */
  44: '11rem',
  /** 192px (12rem) - 24 units */
  48: '12rem',
  /** 208px (13rem) - 26 units */
  52: '13rem',
  /** 224px (14rem) - 28 units */
  56: '14rem',
  /** 240px (15rem) - 30 units */
  60: '15rem',
  /** 256px (16rem) - 32 units */
  64: '16rem',
  /** 288px (18rem) - 36 units */
  72: '18rem',
  /** 320px (20rem) - 40 units */
  80: '20rem',
  /** 384px (24rem) - 48 units */
  96: '24rem',
} as const;

/**
 * Layout-specific spacing values
 * Semantic names for common layout measurements
 */
export const layout = {
  /** Sidebar width (desktop) */
  sidebarWidth: '240px',
  /** Sidebar width (tablet) */
  sidebarWidthTablet: '200px',
  /** Top bar height */
  topBarHeight: '64px',
  /** Card padding (mobile) */
  cardPaddingMobile: spacing[4], // 16px
  /** Card padding (tablet) */
  cardPaddingTablet: spacing[5], // 20px
  /** Card padding (desktop) */
  cardPaddingDesktop: spacing[6], // 24px
  /** Main content padding (mobile) */
  contentPaddingMobile: spacing[4], // 16px
  /** Main content padding (tablet) */
  contentPaddingTablet: spacing[6], // 24px
  /** Main content padding (desktop) */
  contentPaddingDesktop: spacing[8], // 32px
  /** Card grid gap (mobile) */
  cardGapMobile: spacing[4], // 16px
  /** Card grid gap (desktop) */
  cardGapDesktop: spacing[6], // 24px
  /** Max content width (container) */
  maxContentWidth: '1440px',
} as const;

/**
 * Component-specific spacing
 * Common spacing patterns for UI components
 */
export const component = {
  /** Button padding (small) */
  buttonPaddingSmall: {
    horizontal: spacing[3], // 12px
    vertical: spacing[2], // 8px
  },
  /** Button padding (default) */
  buttonPaddingDefault: {
    horizontal: spacing[4], // 16px
    vertical: spacing[2], // 8px
  },
  /** Button padding (large) */
  buttonPaddingLarge: {
    horizontal: spacing[8], // 32px
    vertical: spacing[3], // 12px
  },
  /** Form field spacing */
  formFieldGap: spacing[4], // 16px
  /** Form section spacing */
  formSectionGap: spacing[8], // 32px
  /** Card header height */
  cardHeaderHeight: spacing[12], // 48px
  /** Modal padding */
  modalPadding: spacing[6], // 24px
  /** Tooltip padding */
  tooltipPadding: spacing[2], // 8px
  /** Avatar size (small) */
  avatarSmall: spacing[8], // 32px
  /** Avatar size (default) */
  avatarDefault: spacing[10], // 40px
  /** Avatar size (large) */
  avatarLarge: spacing[20], // 80px
} as const;

/**
 * Touch target minimum sizes (WCAG 2.5.5)
 */
export const touchTarget = {
  /** Minimum interactive area (44x44px) */
  minimum: '44px',
  /** Recommended interactive area (48x48px) */
  recommended: '48px',
  /** Minimum gap between targets */
  minimumGap: spacing[2], // 8px
} as const;

/**
 * Border radius scale
 * Extracted from Tailwind config
 */
export const borderRadius = {
  /** 0px - No rounding */
  none: '0',
  /** 2px - Subtle rounding */
  sm: '0.125rem',
  /** 4px - Default rounding */
  DEFAULT: '0.25rem',
  /** 6px - Medium rounding */
  md: '0.375rem',
  /** 8px - Large rounding */
  lg: '0.5rem',
  /** 12px - Extra large rounding */
  xl: '0.75rem',
  /** 16px - 2XL rounding */
  '2xl': '1rem',
  /** 24px - 3XL rounding */
  '3xl': '1.5rem',
  /** 9999px - Full rounding (pills, circles) */
  full: '9999px',
} as const;

/**
 * Shadow scale
 * Elevation levels for cards, modals, dropdowns
 */
export const shadows = {
  /** Subtle shadow for cards */
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  /** Default shadow for elevated elements */
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  /** Medium shadow for hover states */
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  /** Large shadow for modals */
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  /** Extra large shadow for prominent elements */
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  /** 2XL shadow for dramatic elevation */
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  /** Inner shadow for inset elements */
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  /** No shadow */
  none: 'none',
} as const;

/**
 * Z-index scale
 * Manages layering of UI elements
 */
export const zIndex = {
  /** Base layer (default) */
  base: 0,
  /** Dropdown menus */
  dropdown: 1000,
  /** Sticky elements (headers, sidebars) */
  sticky: 1020,
  /** Fixed position elements */
  fixed: 1030,
  /** Modal backdrop */
  modalBackdrop: 1040,
  /** Modal content */
  modal: 1050,
  /** Popover content */
  popover: 1060,
  /** Tooltip content */
  tooltip: 1070,
} as const;

/**
 * Responsive spacing utilities
 * Functions to calculate responsive spacing
 */
export const responsive = {
  /**
   * Get padding for a card at different breakpoints
   */
  cardPadding: (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    switch (breakpoint) {
      case 'mobile':
        return layout.cardPaddingMobile;
      case 'tablet':
        return layout.cardPaddingTablet;
      case 'desktop':
        return layout.cardPaddingDesktop;
    }
  },

  /**
   * Get content padding for main area at different breakpoints
   */
  contentPadding: (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    switch (breakpoint) {
      case 'mobile':
        return layout.contentPaddingMobile;
      case 'tablet':
        return layout.contentPaddingTablet;
      case 'desktop':
        return layout.contentPaddingDesktop;
    }
  },

  /**
   * Get grid gap for card layouts at different breakpoints
   */
  cardGap: (breakpoint: 'mobile' | 'desktop') => {
    return breakpoint === 'mobile' ? layout.cardGapMobile : layout.cardGapDesktop;
  },
} as const;

/**
 * Export default spacing object for Tailwind config
 */
export default spacing;
