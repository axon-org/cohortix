module.exports = {
  // TypeScript/TSX files (with custom design token enforcement)
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings=0 --rulesdir apps/web/eslint-rules',
    'prettier --write',
  ],

  // JavaScript/JSX files (skip eslint for config files outside app)
  '*.{js,jsx}': ['prettier --write'],

  // CSS/SCSS files
  '*.{css,scss}': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],

  // JSON files
  '*.json': ['prettier --write'],

  // YAML files
  '*.{yml,yaml}': ['prettier --write'],

  // Package.json specific (sort dependencies)
  'package.json': ['prettier --write'],
};
