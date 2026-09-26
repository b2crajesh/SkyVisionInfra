/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#4338CA",
        gold: "#06B6D4",
        charcoal: "#1E293B",
        lightbg: "#F8FAFC",
        saffron: "#F59E0B",
        indiaGreen: "#10B981",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(15, 23, 42, 0.06)",
        card: "0 4px 16px rgba(15, 23, 42, 0.08)",
        lifted: "0 12px 32px rgba(67, 56, 202, 0.15)",
      },
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(0, -20px)" },
        },
      },
      animation: {
        fadeSlideUp: "fadeSlideUp 0.7s ease-out forwards",
        floatSlow: "floatSlow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
