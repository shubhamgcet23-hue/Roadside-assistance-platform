/** Road-sign palette: asphalt ink, hazard yellow, highway green, signal red. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#fffbe6', 100: '#fff3b8', 200: '#ffe680', 300: '#ffd633', 400: '#ffc400', 500: '#f2b300', 600: '#cc9500', 700: '#8a6500', 800: '#5c4400', 900: '#3a2b00' },
        ink: { 50: '#f4f6f8', 100: '#e8ecf0', 200: '#d3dae1', 300: '#aeb9c4', 400: '#8393a2', 500: '#5f7080', 600: '#485766', 700: '#36424e', 800: '#232c35', 900: '#161c22', 950: '#0d1114' },
        go: { 50: '#e8f6ef', 100: '#c7ebd8', 500: '#12905f', 600: '#0b7a4f', 700: '#096440' },
        stop: { 50: '#fdebed', 100: '#f9ccd1', 500: '#d7263d', 600: '#b81d32', 700: '#98172a' },
        info: { 50: '#e8f1fd', 100: '#c9defa', 500: '#2b6fd6', 600: '#2159b0' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,17,20,.06), 0 10px 24px -14px rgba(13,17,20,.22)',
        lift: '0 2px 4px rgba(13,17,20,.08), 0 18px 36px -16px rgba(13,17,20,.35)',
      },
    },
  },
  plugins: [],
};
