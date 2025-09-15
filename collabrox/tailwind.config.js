/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Input variants
    'input-base',
    'input-sm',
    'input-md',
    'input-lg',

    // Checkbox variants
    'input-check',
    'input-check-sm',
    'input-check-md',
    'input-check-lg',
    'input-check-primary',
    'input-check-danger',
    'input-check-success',
    'input-check-dark',
    'input-check-light',
    'input-check-rounded-sharp',
    'input-check-rounded-small',
    'input-check-rounded-half',
    'input-check-rounded-full',
    'input-check-container-sm',
    'input-check-container-md',
    'input-check-container-lg',

    // Button variants
    'btn',
    'btn-sm',
    'btn-md',
    'btn-lg',
    'btn-dark',
    'btn-light',
    'btn-primary',
    'btn-danger',
    'btn-success',

    // Dropdown variants
    'dropdown',
    'dropdown-sm',
    'dropdown-md',
    'dropdown-lg',
    'dropdown-dark',
    'dropdown-light',
    'dropdown-primary',

    // Icon button variants
    'icon-btn',
    'icon-btn-dark',
    'icon-btn-light',
    'icon-btn-primary',
    'icon-btn-success',
    'icon-btn-danger',

    'icon-btn-ss',
    'icon-btn-xs',
    'icon-btn-sm',
    'icon-btn-md',
    'icon-btn-lg',
    'icon-btn-xl',

    // Link variants
    'link',
    'link-xs',
    'link-sm',
    'link-md',
    'link-lg',
    'link-dark',
    'link-primary',
    'link-danger',
    'link-success',
    'link-disabled',

    // Badge variants
    'badge',
    'badge-sm',
    'badge-md',
    'badge-lg',
    'badge-dark',
    'badge-primary',
    'badge-danger',
    'badge-success',
    'badge-light',

    // Scrollbar classes
    'custom-scrollbar-css-md',
    'custom-scrollbar-css-sm',
    'scrollbar-hide',

    // Tooltip classes
    'position-top',
    'position-bottom',
    'position-left',
    'position-right',
    'arrow-top',
    'arrow-bottom',
    'arrow-left',
    'arrow-right',

    // Text utility classes
    'text-light-100',
    'text-light-200',
    'text-light-300',
    'text-light-400',
    'text-light-500',
    'text-dark-base',
    'text-dark-lighter',
    'text-dark-darker',
  ],
  theme: {
    // Center the container by default
    extend: {
      // Extend the color palette with custom semantic colors
      colors: {
        primary: {
          base: '#6366f1',     // indigo-500
          lighter: '#818cf8',  // indigo-400
          darker: '#4f46e5',   // indigo-600
        },
        danger: {
          base: 'rgb(239 68 68)',     // red-500
          lighter: 'rgb(248 113 113)',// red-400
          darker: 'rgb(220 38 38)',   // red-600
        },
        success: {
          base: 'rgb(34 197 94)',     // green-500
          lighter: 'rgb(74 222 128)', // green-400
          darker: 'rgb(22 163 74)',   // green-600
        },
        dark: {
          base: '#111827',     // gray-900
          lighter: '#1f2937',  // gray-800
          darker: '#000000',   // pure black
        },
        light: {
          base: '#ffffff',     // white
          100: '#f3f4f6',      // gray-100
          200: '#e5e7eb',      // gray-200
          300: '#d1d5db',      // gray-300
          400: '#9ca3af',      // gray-400
          500: '#6b7280',      // gray-500
        },
      },

      // Custom font families used in your app
      fontFamily: {
        primary: ['Quicksand', 'Arial', 'sans-serif'],
        secondary: ['Rajdhani', 'Arial', 'sans-serif'],
      },

      // Default transition duration for smoother animations
      transitionDuration: {
        DEFAULT: '150ms',
      },

      // Default ring color, using a CSS variable (for focus states, etc.)
      ringColor: {
        DEFAULT: 'var(--color-ring-primary)',
      },

      // Custom animation utility
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        fadeOut: 'fadeOut 0.5s ease-out-in',
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },

      // Keyframes for the fadeIn animation
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' }, // start faded and slightly scaled down
          '100%': { opacity: '1', transform: 'scale(1)' },  // end fully visible and normal scale
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'scale(1)' }, // start faded and slightly scaled down
          '100%': { opacity: '0', transform: 'scale(.95)' },  // end fully visible and normal scale
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-2px)' },
          '20%, 80%': { transform: 'translateX(4px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
      },
    },
  },

  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.flex-center': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      });
    },


    // The ToolTip components class names
    function ({ addUtilities }) {
      const tooltipUtilities = {
        // Position classes
        '.position-top': {
          bottom: 'calc(100% + 5px)',
          left: '50%',
          top: 'auto',
          right: 'auto',
          translate: '-50% 0',
        },
        '.position-bottom': {
          top: 'calc(100% + 5px)',
          left: '50%',
          bottom: 'auto',
          right: 'auto',
          translate: '-50% 0',
        },
        '.position-left': {
          right: 'calc(100% + 5px)',
          top: '50%',
          left: 'auto',
          bottom: 'auto',
          translate: '0 -50%',
        },
        '.position-right': {
          left: 'calc(100% + 5px)',
          top: '50%',
          right: 'auto',
          bottom: 'auto',
          translate: '0 -50%',
        },
        // Alignment classes (only for top/bottom)
        '.tooltip-align-left': {
          left: '100%',
          translate: '-100% 0',
        },

        '.tooltip-align-right': {
          left: '0%',
          translate: '0 0',
        },
        // Arrow classes
        '.topside-middle': {
          top: '-3px',
          bottom: 'auto',
          left: '50%',
          translate: '-50% 0',
          rotate: '45deg',
        },
        '.topside-right': {
          top: '-3px',
          bottom: 'auto',
          left: 'auto',
          right: '0',
          translate: 'calc(50% - 5px) 0',
          rotate: '45deg',
        },
        '.topside-left': {
          top: '-3px',
          bottom: 'auto',
          left: '0',
          right: 'auto',
          translate: 'calc(-50% + 5px) 0',
          rotate: '45deg',
        },
        '.bottomside-middle': {
          top: 'auto',
          bottom: '-3px',
          left: '50%',
          translate: '-50% 0',
          rotate: '45deg',
        },
        '.bottomside-right': {
          top: 'auto',
          bottom: '-3px',
          left: 'auto',
          right: '0',
          translate: '-50% 0',
          rotate: '45deg',
        },
        '.bottomside-left': {
          top: 'auto',
          bottom: '-3px',
          left: '0',
          right: 'auto',
          translate: 'calc(-50% + 5px) 0',
          rotate: '45deg',
        },
        '.leftside-middle': {
          left: '-3px',
          right: 'auto',
          top: '50%',
          translate: '0 -50%',
          rotate: '45deg',
        },
        '.rightside-middle': {
          left: 'auto',
          right: '-3px',
          top: '50%',
          translate: '0 -50%',
          rotate: '45deg',
        },
      };

      addUtilities(tooltipUtilities, ['responsive']);
    },
  ]
};