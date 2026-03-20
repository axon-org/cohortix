import next from 'eslint-config-next'

const config = [
  ...next,
  {
    ignores: [
      '.data/**',
      'ops/**',
    ],
  },
  // The React 19/ESLint ecosystem is still settling. These rules are valuable,
  // but they currently trigger a lot of false positives in this codebase.
  // Keep them off until we do a dedicated refactor pass.
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  // Block hardcoded Tailwind color classes
  // Rule: no-restricted-syntax targeting className strings with color-shade patterns
  {
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:text|bg|border|ring|stroke|fill)-(?:red|green|blue|amber|yellow|orange|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-\\d{2,3}(?:\\/\\d{1,3})?\\b/]",
          message:
            'Avoid hardcoded Tailwind color shades in className. Use semantic tokens (e.g. text-muted-foreground, bg-status-*-bg, border-border) instead.',
        },
        {
          selector:
            "JSXAttribute[name.name='className'] JSXExpressionContainer > Literal[value=/\\b(?:text|bg|border|ring|stroke|fill)-(?:red|green|blue|amber|yellow|orange|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-\\d{2,3}(?:\\/\\d{1,3})?\\b/]",
          message:
            'Avoid hardcoded Tailwind color shades in className expressions. Use semantic tokens instead.',
        },
        {
          selector:
            "JSXAttribute[name.name='className'] JSXExpressionContainer TemplateLiteral > TemplateElement[value.raw=/\\b(?:text|bg|border|ring|stroke|fill)-(?:red|green|blue|amber|yellow|orange|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-\\d{2,3}(?:\\/\\d{1,3})?\\b/]",
          message:
            'Avoid hardcoded Tailwind color shades in className templates. Use semantic tokens instead.',
        },
      ],
    },
  },
]

export default config
