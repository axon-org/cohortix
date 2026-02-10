module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit format
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'chore',    // Maintenance task
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, semicolons, etc.)
        'refactor', // Code refactoring (no functional changes)
        'test',     // Adding or updating tests
        'ci',       // CI/CD pipeline changes
        'perf',     // Performance improvements
        'revert',   // Revert a previous commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'web',      // Frontend/Next.js app
        'db',       // Database schema, migrations
        'ui',       // UI components, design system
        'types',    // TypeScript types, interfaces
        'config',   // Configuration files
        'ci',       // CI/CD configuration
        'docs',     // Documentation
        'deps',     // Dependency updates
        'auth',     // Authentication/authorization
        'api',      // API routes, backend logic
      ],
    ],
    'subject-case': [
      2,
      'always',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case', 'lower-case'],
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};
