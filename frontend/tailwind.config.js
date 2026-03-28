/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0d1117',
          secondary: '#161b22',
          tertiary:  '#21262d',
          elevated:  '#30363d',
        },
        brand: {
          purple: '#bc8cff',
          blue:   '#58a6ff',
        },
        status: {
          red:   '#f85149',
          amber: '#d29922',
          green: '#3fb950',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
