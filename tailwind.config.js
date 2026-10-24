/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDFB',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#00A896', // Primary Teal
          600: '#008C7D',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        'hc-primary': '#009488',
        'hc-secondary': '#0284C7',
        'hc-accent': '#38BDF8',
        'hc-bg-light': '#F0F9FF',
        'hc-dark': '#0F172A',
        'hc-muted': '#64748B',
        'hc-border': '#E2E8F0',
        'hc-success': '#10B981',
        surface: {
          card: '#FFFFFF',
          subtle: '#F8FAFC',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 168, 150, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'floating': '0 8px 24px rgba(0, 168, 150, 0.35)',
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
