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
          primary: '#DC9750',      // Desert Sun
          primaryHover: '#C8823B',
          secondary: '#1E2640',    // Dark Blue
          secondaryLight: '#2A3454',
          bg: '#F4F6F9',           // Light Gray Background
          surface: '#FFFFFF',      // Card Surface
          border: '#E2E8F0',       // Border Gray
          amber: '#FEF3E7',        // Warm Amber badge bg
          amberText: '#DC9750',    // Warm Amber text
          textPrimary: '#1E2640',  // Primary Text
          textMuted: '#64748B'     // Muted Text
        }
      },
      fontFamily: {
        thai: ["'IBM Plex Sans Thai'", 'sans-serif']
      }
    },
  },
  plugins: [],
}
