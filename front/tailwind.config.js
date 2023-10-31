const { config } = require("@charcoal-ui/tailwind-config");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["**/*.tsx"],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [config],
};
