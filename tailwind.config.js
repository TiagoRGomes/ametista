/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: '#ed7024', dark: '#c95a16' }, ink: '#242424' },
      boxShadow: { card: '0 18px 48px rgba(36,36,36,.09)' },
    },
  },
  plugins: [],
}
