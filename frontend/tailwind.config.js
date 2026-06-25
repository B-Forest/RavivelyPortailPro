/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ravively: {
          green: "#1E7A4D",
          greenDark: "#155C3A",
          cream: "#FCF6E8",
          orange: "#F4934B"
        }
      },
      fontSize: {
        base: ["16px", "24px"]
      }
    }
  },
  plugins: []
};
