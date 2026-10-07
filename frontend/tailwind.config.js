/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070b14',
          surface: '#0d1322',
          card: '#111827',
          border: '#1f293d',
          cyan: '#00f2fe',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'cyber-cyan': '0 0 15px rgba(0, 242, 254, 0.25)',
        'cyber-rose': '0 0 15px rgba(244, 63, 94, 0.25)',
        'cyber-emerald': '0 0 15px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
