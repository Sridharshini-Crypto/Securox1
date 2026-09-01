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
        cyber: {
          darkBg: '#0B1220',
          darkCard: '#111827',
          darkBorder: '#1E293B',
          lightBg: '#F5F7FA',
          lightCard: '#FFFFFF',
          lightBorder: '#E2E8F0',
          accentCyan: '#06B6D4',
          accentBlue: '#2563EB',
          accentNavy: '#0F172A',
          normal: '#10B981',
          elevated: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

