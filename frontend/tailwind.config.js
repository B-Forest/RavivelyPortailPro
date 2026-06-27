/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  safelist: [
    "bg-emerald-500", "bg-orange-500", "bg-blue-500", "bg-gray-400", "bg-red-500", "text-white"
  ],
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
