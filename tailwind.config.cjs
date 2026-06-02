/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: '#0f0f11',
        surface: '#18181b',
        'surface-raised': '#202024',
        field: '#27272a',
        line: {
          soft: 'rgba(255, 255, 255, 0.05)',
          DEFAULT: 'rgba(255, 255, 255, 0.10)',
          strong: 'rgba(255, 255, 255, 0.20)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        brand: ['Poppins', 'Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      borderRadius: {
        control: '0.5rem',
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 18px 40px rgba(0, 0, 0, 0.28)',
        panel: '0 24px 70px rgba(0, 0, 0, 0.45)',
        focus: '0 0 0 3px rgba(59, 130, 246, 0.22)',
      },
    },
  },
  plugins: [],
}
