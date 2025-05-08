/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        'joschi-green': '#38A169', // This is Tailwind's green-600. Adjust if the image's green is different.
                                  // Eyedropping the image, it looks very close to this, or perhaps a bit darker/more saturated.
                                  // Let's use this for now.
      },
      fontFamily: {
        'sans': ['Nunito', 'sans-serif'], // Using Nunito as a good, rounded sans-serif match.
      },
    },
  },
  plugins: [],
}