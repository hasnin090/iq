const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindcss('./shared/tailwind.config.ts'),
    autoprefixer({
      overrideBrowserslist: ['> 1%', 'last 2 versions']
    }),
  ],
};
