module.exports = {
  // TypeScript/TSX files
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],

  // JavaScript/JSX files
  '*.{js,jsx}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],

  // CSS/SCSS files
  '*.{css,scss}': [
    'prettier --write',
  ],

  // Markdown files
  '*.md': [
    'prettier --write',
  ],

  // JSON files
  '*.json': [
    'prettier --write',
  ],

  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
  ],

  // Package.json specific (sort dependencies)
  'package.json': [
    'prettier --write',
  ],
};
