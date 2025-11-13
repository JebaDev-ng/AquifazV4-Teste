/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple Color Hierarchy - Light Mode
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F5F5F5',
        'bg-tertiary': '#FAFAFA',
        
        'text-primary': '#1D1D1F',
        'text-secondary': '#6E6E73',
        'text-tertiary': '#86868B',
        'text-quaternary': '#A1A1A6',
        
        'border-primary': '#D2D2D7',
        'border-secondary': '#E5E5EA',
        'border-tertiary': '#F2F2F7',
        
        'accent-blue': '#007AFF',
        'accent-gray': '#8E8E93',
      },
      backgroundColor: {
        // Backgrounds específicos usados nos componentes
        'gray-light': '#F0F0F0', // Cinza mais visível (era #FAFAFA)
        'gray-card': '#F5F5F5',
        'dark-primary': '#1C1C1E',
        'dark-secondary': '#2C2C2E',
      },
      borderColor: {
        'dark-primary': '#38383A',
      },
    },
  },
  plugins: [],
}
