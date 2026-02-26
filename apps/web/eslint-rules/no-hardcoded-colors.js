/**
 * ESLint rule: no-hardcoded-colors
 *
 * Disallows hardcoded hex color values in Tailwind className strings.
 * Forces use of design tokens from tailwind.config.ts instead.
 *
 * ❌ Bad:  className="bg-[#5E6AD2] text-[#FFFFFF]"
 * ✅ Good: className="bg-primary text-primary-foreground"
 *
 * Exceptions:
 * - tailwind.config.ts (where tokens are defined)
 * - CSS/SCSS files
 * - style={{ }} props with radial-gradient (HSL values allowed)
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded hex colors in className — use design tokens instead',
      category: 'Best Practices',
    },
    messages: {
      noHardcodedColor:
        'Hardcoded color "{{color}}" found in className. Use a design token from tailwind.config.ts instead. See docs/design/DESIGN-TOKENS.md for the full token reference.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Skip config files where tokens are defined
    if (
      filename.includes('tailwind.config') ||
      filename.endsWith('.css') ||
      filename.endsWith('.scss')
    ) {
      return {};
    }

    // Match Tailwind arbitrary color classes like bg-[#xxx], text-[#xxx], border-[#xxx], etc.
    const hexInClassRegex =
      /(?:bg|text|border|ring|shadow|from|to|via|fill|stroke|outline|decoration|accent|caret|placeholder)-\[#[0-9a-fA-F]{3,8}\]/g;

    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className' || !node.value) {
          return;
        }

        // Handle string literals
        if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
          const matches = node.value.value.match(hexInClassRegex);
          if (matches) {
            for (const match of matches) {
              context.report({
                node,
                messageId: 'noHardcodedColor',
                data: { color: match },
              });
            }
          }
        }

        // Handle template literals and expressions
        if (node.value.type === 'JSXExpressionContainer') {
          checkExpression(node.value.expression, context, hexInClassRegex);
        }
      },
    };

    function checkExpression(expr, ctx, regex) {
      if (!expr) return;

      if (expr.type === 'Literal' && typeof expr.value === 'string') {
        const matches = expr.value.match(regex);
        if (matches) {
          for (const match of matches) {
            ctx.report({
              node: expr,
              messageId: 'noHardcodedColor',
              data: { color: match },
            });
          }
        }
      }

      if (expr.type === 'TemplateLiteral') {
        for (const quasi of expr.quasis) {
          const matches = quasi.value.raw.match(regex);
          if (matches) {
            for (const match of matches) {
              ctx.report({
                node: quasi,
                messageId: 'noHardcodedColor',
                data: { color: match },
              });
            }
          }
        }
      }

      // Handle cn() and other function calls
      if (expr.type === 'CallExpression') {
        for (const arg of expr.arguments) {
          checkExpression(arg, ctx, regex);
        }
      }
    }
  },
};
