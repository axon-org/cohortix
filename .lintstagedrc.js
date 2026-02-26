module.exports = {
  // TypeScript/TSX files (with custom design token enforcement)
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings=0 --rulesdir apps/web/eslint-rules',
    'prettier --write',
  ],

  // JavaScript/JSX files (prettier only - codebase uses TypeScript)
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
