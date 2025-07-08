// PostCSS Configuration for Netlify Production
module.exports = {
  plugins: [
    require('tailwindcss')('./shared/tailwind.config.ts'),
    require('autoprefixer')(),
  ],
};
