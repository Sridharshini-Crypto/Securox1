/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          lightBg: '#F7F9FC',
          lightCard: '#FFFFFF',
          lightBorder: '#DCE3EC',
          navy: '#0B1728',
          blue: '#0B4EA2',
          blueSecondary: '#1769AA',
          text: '#172033',
          darkBg: '#07111F',
          darkCard: '#0B1728',
          darkBorder: '#102238',
          accentCyan: '#0284C7',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        },
        cyber: {
          darkBg: '#07111F',
          darkCard: '#0B1728',
          darkBorder: '#102238',
          lightBg: '#F7F9FC',
          lightCard: '#FFFFFF',
          lightBorder: '#DCE3EC',
          accentCyan: '#0B4EA2',
          accentBlue: '#0B4EA2',
          accentNavy: '#0B1728',
          normal: '#10B981',
          elevated: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
