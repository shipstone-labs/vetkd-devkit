module.exports = {
    content: [
      './index.html',
      './src/**/*.{svelte,js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [require('daisyui'), require('@tailwindcss/line-clamp')],
  };