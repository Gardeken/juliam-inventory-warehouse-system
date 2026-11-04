/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#fcfaf7',
        'on-background': '#423d38',
        surface: {
          DEFAULT: '#f3f4f6',
          soft: '#edebe9',
          elevated: '#ffffff',
        },
        'on-surface': '#423d38',
        'on-surface-muted': '#797067',
        outline: {
          DEFAULT: '#e3e0dd',
          strong: '#d1d5dc',
        },
        primary: {
          DEFAULT: '#fe6e00',
          strong: '#ff6b00',
          warm: '#ffb74d',
          focus: '#f97015',
        },
        shell: {
          base: '#000000',
          border: 'rgba(255, 255, 255, 0.12)',
        },
        status: {
          success: '#00c758',
          warning: '#edb200',
          danger: '#fb2c36',
          info: '#3080ff',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.10), 0 1px 2px rgba(0, 0, 0, 0.06)',
        raised: '0 4px 12px rgba(0, 0, 0, 0.12)',
        dialog: '0 20px 25px rgba(0, 0, 0, 0.10), 0 8px 10px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
