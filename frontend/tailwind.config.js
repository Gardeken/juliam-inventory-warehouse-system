/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#2BA8A2',
          light: '#3CC4BD',
          dark: '#1E8C86',
          bg: '#E8F6F5',
        },
        gold: {
          DEFAULT: '#FFD23F',
          light: '#FFE47A',
          dark: '#E6B800',
        },
        coral: {
          DEFAULT: '#EF6C4A',
          light: '#FF8A6A',
          dark: '#D45233',
        },
        cream: {
          DEFAULT: '#FFF8E7',
          dark: '#F3E6C8',
        },
        sky: {
          DEFAULT: '#5DADE2',
        },
        surface: {
          base: '#EFF8F7',
          card: '#FFFFFF',
        },
        status: {
          success: '#27AE60',
          error: '#E74C3C',
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(43, 168, 162, 0.12)',
        'coral-glow': '0 4px 20px rgba(239, 108, 74, 0.35)',
        'teal-glow': '0 4px 20px rgba(43, 168, 162, 0.30)',
        'accent-glow': '0 4px 20px rgba(255, 210, 63, 0.45)',
        'sky-glow': '0 4px 16px rgba(93, 173, 226, 0.30)',
        focus: '0 0 0 4px rgba(43, 168, 162, 0.20)',
      },
      keyframes: {
        'boom-pulse': {
          '0%, 100%': {
            boxShadow: '0 4px 20px rgba(239, 108, 74, 0.25)',
          },
          '50%': {
            boxShadow: '0 4px 26px rgba(239, 108, 74, 0.55)',
          },
        },
      },
      animation: {
        'boom-pulse': 'boom-pulse 2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
