/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './base.js',
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
  ],
  rules: {
    // Next.js specific optimizations
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'error',
    '@next/next/no-unwanted-polyfillio': 'error',
    '@next/next/no-page-custom-font': 'warn',
    
    // Enforce Server Components best practices
    '@next/next/no-async-client-component': 'error',
    
    // Image optimization
    '@next/next/no-img-element': 'error',
    
    // Head component
    '@next/next/no-head-element': 'error',
    
    // Document structure
    '@next/next/no-document-import-in-page': 'error',
    '@next/next/no-head-import-in-document': 'error',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
};
