/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        port: {
          navy: '#1e3a5f',
          blue: '#2563eb',
          sky: '#0ea5e9',
          orange: '#f97316',
          safety: '#fb923c',
          green: '#22c55e',
          red: '#ef4444',
          gray: '#64748b',
        },
      },
    },
  },
  plugins: [],
};
