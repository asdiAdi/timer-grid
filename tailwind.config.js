/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        alertPulse: {
          "0%,100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(239,68,68,0.7)" },
          "50%": { transform: "scale(1.02)", boxShadow: "0 0 0 12px rgba(239,68,68,0)" },
        },
        flash: {
          "0%,100%": { backgroundColor: "rgb(254 242 242)" },
          "50%": { backgroundColor: "rgb(254 226 226)" },
        },
      },
      animation: {
        alertPulse: "alertPulse 0.6s ease-in-out infinite",
        flash: "flash 0.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

