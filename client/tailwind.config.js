/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#171717",
        gold: "#8B6B2E",
        "gold-light": "#D8B867",
        charcoal: "#2E2B27",
        lightbg: "#F8F6F1",
        saffron: "#F59E0B",
        indiaGreen: "#10B981",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(23, 23, 23, 0.06)",
        card: "0 4px 16px rgba(23, 23, 23, 0.08)",
        lifted: "0 12px 32px rgba(139, 107, 46, 0.15)",
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
