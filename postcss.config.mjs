// PostCSS configuration using ES modules syntax
// This file can be used as an alternative if CommonJS version causes issues

export default {
  plugins: {
    'tailwindcss': { config: './shared/tailwind.config.ts' },
    'autoprefixer': {},
  },
};
