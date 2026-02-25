/**
 * eslint-plugin-cohortix
 *
 * Custom ESLint rules to enforce Cohortix design system consistency.
 * Rule: no-hardcoded-colors — flags raw hex/rgb/hsl values in TSX/JSX,
 * enforcing use of Tailwind classes or design tokens instead.
 */

'use strict';

// Patterns that match hardcoded color values
const HEX_PATTERN = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/;
const RGB_PATTERN = /\brgba?\s*\(/;
const HSL_PATTERN = /\bhsla?\s*\(/;

// Files/patterns to ignore (config files, tokens, tests, etc.)
const IGNORED_FILE_PATTERNS = [
  /tailwind\.config/,
  /tokens\//,
  /\.test\./,
  /\.spec\./,
  /\.config\./,
  /globals\.css/,
  /\.css$/,
];

// Known safe values (transparent, inherit, currentColor, CSS vars, etc.)
const SAFE_VALUES = new Set([
  'transparent',
  'inherit',
  'currentColor',
  'currentcolor',
  'none',
  'unset',
  'initial',
  'revert',
]);

// Hex values that are clearly not colors (e.g., crypto hashes, IDs)
function isLikelyNonColorHex(value) {
  // If hex is longer than 9 chars (#RRGGBBAA max), it's not a color
  const match = value.match(/#[0-9a-fA-F]+/);
  if (match && match[0].length > 9) return true;
  return false;
}

module.exports = {
  rules: {
    'no-hardcoded-colors': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Disallow hardcoded color values. Use Tailwind classes or design tokens from @repo/ui/tokens.',
          category: 'Design System',
          recommended: true,
        },
        messages: {
          noHardcodedHex:
            "Avoid hardcoded hex color '{{value}}'. Use a Tailwind class (e.g., bg-primary, text-muted-foreground) or import from @repo/ui/tokens.",
          noHardcodedRgb:
            'Avoid hardcoded rgb/rgba color. Use a Tailwind class or import from @repo/ui/tokens.',
          noHardcodedHsl:
            'Avoid hardcoded hsl/hsla color. Use a Tailwind class or import from @repo/ui/tokens.',
        },
        schema: [
          {
            type: 'object',
            properties: {
              ignoreFiles: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            additionalProperties: false,
          },
        ],
      },

      create(context) {
        const filename = context.getFilename();

        // Skip ignored files
        if (IGNORED_FILE_PATTERNS.some((p) => p.test(filename))) {
          return {};
        }

        // Skip non-TSX/JSX/TS files
        if (!/\.(tsx?|jsx?)$/.test(filename)) {
          return {};
        }

        // Additional user-configured ignore patterns
        const options = context.options[0] || {};
        const ignoreFiles = (options.ignoreFiles || []).map((p) => new RegExp(p));
        if (ignoreFiles.some((p) => p.test(filename))) {
          return {};
        }

        function checkStringValue(node, value) {
          if (typeof value !== 'string') return;

          // Skip CSS variables (var(--...))
          if (value.includes('var(--')) return;

          // Skip safe values
          if (SAFE_VALUES.has(value.trim().toLowerCase())) return;

          // Skip Tailwind class strings (contain spaces + common Tailwind prefixes)
          if (
            value.includes(' ') &&
            /\b(bg-|text-|border-|ring-|shadow-|fill-|stroke-)/.test(value)
          )
            return;

          // Check for hex colors
          if (HEX_PATTERN.test(value) && !isLikelyNonColorHex(value)) {
            const match = value.match(HEX_PATTERN);
            context.report({
              node,
              messageId: 'noHardcodedHex',
              data: { value: match[0] },
            });
            return;
          }

          // Check for rgb/rgba
          if (RGB_PATTERN.test(value)) {
            context.report({
              node,
              messageId: 'noHardcodedRgb',
            });
            return;
          }

          // Check for hsl/hsla
          if (HSL_PATTERN.test(value)) {
            context.report({
              node,
              messageId: 'noHardcodedHsl',
            });
            return;
          }
        }

        return {
          // Check string literals (style={{ color: '#fff' }})
          Literal(node) {
            if (typeof node.value === 'string') {
              checkStringValue(node, node.value);
            }
          },

          // Check template literals (`color: ${x}` or `#ff0000`)
          TemplateLiteral(node) {
            for (const quasi of node.quasis) {
              checkStringValue(node, quasi.value.raw);
            }
          },
        };
      },
    },
  },
};
