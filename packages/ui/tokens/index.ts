/**
 * Design Tokens - Cohortix UI
 *
 * Centralized design tokens extracted from Tailwind config
 * Provides type-safe access to colors, spacing, typography
 *
 * Usage:
 * ```ts
 * import { colors, spacing, typography } from '@cohortix/ui/tokens'
 *
 * const Button = styled.button`
 *   color: ${colors.dark.primary.DEFAULT};
 *   padding: ${spacing[4]};
 *   font-size: ${typography.fontSize.base[0]};
 * `
 * ```
 *
 * @packageDocumentation
 */

export * from './colors';
export * from './spacing';
export * from './typography';

// Re-export defaults for convenience
export { default as defaultColors } from './colors';
export { default as defaultSpacing } from './spacing';
export { default as defaultTypography } from './typography';

/**
 * Design token version
 * Increment on breaking changes to token structure
 */
export const TOKENS_VERSION = '1.0.0';

/**
 * Token categories for documentation
 */
export const TOKEN_CATEGORIES = {
  colors: 'Color palette and semantic colors',
  spacing: 'Spacing scale, layout values, touch targets',
  typography: 'Font families, sizes, weights, line heights',
} as const;

/**
 * Token change log
 * Track major token updates for design system evolution
 */
export const TOKEN_CHANGELOG = [
  {
    version: '1.0.0',
    date: '2026-02-11',
    changes: [
      'Initial token extraction from Tailwind config',
      'Added semantic color mappings for mission/ally statuses',
      'Defined component-specific typography styles',
      'Documented responsive spacing patterns',
    ],
  },
] as const;
