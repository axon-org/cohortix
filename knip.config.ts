export default {
  workspaces: {
    '.': {
      entry: ['scripts/**/*.{ts,tsx}'],
      project: ['scripts/**/*.{ts,tsx}'],
      ignore: ['docs/**', 'design/**', 'tests/**', 'tooling/**'],
      ignoreDependencies: ['@supabase/supabase-js', 'postgres'],
    },
    'apps/web': {
      entry: [
        'next.config.{js,ts,mjs,cjs}',
        'postcss.config.{js,ts,mjs,cjs}',
        'tailwind.config.{js,ts,mjs,cjs}',
        'src/middleware.{ts,tsx,js,jsx}',
        'src/pages/**/*.{ts,tsx,js,jsx}',
        'src/app/**/{page,layout,template,default,loading,not-found,error,route}.{ts,tsx,js,jsx}',
        'src/app/**/globals.css',
        'src/**/*.test.{ts,tsx,js,jsx}',
        'e2e/**/*.{ts,tsx,js,jsx}',
        'playwright.config.{ts,js}',
        'vitest.config.{ts,js}',
      ],
      project: [
        'src/**/*.{ts,tsx,js,jsx}',
        'e2e/**/*.{ts,tsx,js,jsx}',
        'next-env.d.ts',
        'next.config.{js,ts,mjs,cjs}',
        'postcss.config.{js,ts,mjs,cjs}',
        'tailwind.config.{js,ts,mjs,cjs}',
        'playwright.config.{ts,js}',
        'vitest.config.{ts,js}',
      ],
      paths: {
        '@/*': ['src/*'],
        '@/components/*': ['src/components/*'],
        '@/lib/*': ['src/lib/*'],
        '@/server/*': ['src/server/*'],
        '@/types/*': ['src/types/*'],
        '@repo/database': ['../../packages/database/src'],
        '@repo/types': ['../../packages/types/src'],
        '@repo/ui': ['../../packages/ui/src'],
        '@repo/utils': ['../../packages/utils/src'],
      },
      ignore: ['coverage/**', 'playwright-report/**', 'test-results/**', '.next/**'],
    },
    'packages/database': {
      entry: [
        'drizzle.config.ts',
        'src/index.ts',
        'src/schema/index.ts',
        'src/client.ts',
        'src/supabase/index.ts',
      ],
      project: ['src/**/*.ts', 'drizzle.config.ts'],
    },
    'packages/types': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/ui': {
      entry: ['src/index.ts'],
      project: ['src/**/*.{ts,tsx}'],
    },
  },
  ignoreIssues: {
    'apps/web/src/components/ui/**': ['exports', 'types'],
  },
  ignore: ['migrations/**'],
};
