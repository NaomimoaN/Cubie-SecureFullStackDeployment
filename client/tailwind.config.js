/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/react-datepicker/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
      },
      fontSize: {
        xss: "10px",
      },
      colors: {
        blue1: "#BDDFFF",
        blue2: "#317CD8",
        grayblue1: "#EDF6FE",
        grayblue2: "#FAFDFF",
        orange1: "#F06C00",
        orange2: "#E36600",
        gray1: "#F3F3F3",
        gray2: "#E2E2E2",
        gray3: "#C7C7C7",
        gray4: "F2F5F7",
        primeblack: "#393939",
        secondblack: "#787878",
        white: "#FFFFFF",
        "grade-emerging-bg": "#E8DA53",
        "grade-developing-bg": "#FFA237",
        "grade-proficient-bg": "#EEACD9",
        "grade-extending-bg": "#33BD88",
      },
      screens: {
        "md-custom": "860px",
        desktop: "1024px",
        "xl-custom": "1200px",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "0.5rem",
          sm: "1rem",
          md: "1.5rem",
          lg: "2rem",
          "xl-custom": "2.5rem",
          xl: "3rem",
          "2xl": "4rem",
        },
      },
    },
  },
  plugins: [],
};
