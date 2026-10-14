/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)', dark: 'var(--brand-dark-color)', contrast: 'rgb(var(--brand-contrast-rgb) / <alpha-value>)' }, ink: '#242424' },
      boxShadow: { card: '0 18px 48px rgba(36,36,36,.09)' },
    },
  },
  plugins: [],
}
