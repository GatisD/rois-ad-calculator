/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#090907', panel: '#13120f', panel2: '#1b1a16', line: '#2a2823',
        gold: '#D5A134', goldSoft: '#e7c074', txt: '#f4f1ea', muted: '#9a948a',
      },
      fontFamily: { head: ['Poppins', 'sans-serif'], body: ['Montserrat', 'sans-serif'] },
    },
  },
  plugins: [],
}
