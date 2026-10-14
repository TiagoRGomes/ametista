/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: '#fd8d3c', dark: '#df7021' }, ink: '#242424' },
      boxShadow: { card: '0 18px 48px rgba(36,36,36,.09)' },
    },
  },
  plugins: [],
}
