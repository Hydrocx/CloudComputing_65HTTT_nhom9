/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui"],
        mono: ["DM Mono", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        educloud: {
          deep: "#0b0e14",
          surface: "#0f172a",
          accent: "#3b82f6",
          teal: "#14b8a6",
        },
      },
      backgroundImage: {
        "educloud-gradient":
          "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 60%), radial-gradient(circle at 20% 30%, rgba(20,184,166,0.12), transparent 55%), linear-gradient(180deg, #0b0e14 0%, #0f172a 100%)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)", opacity: 0.9 },
          "50%": { transform: "translateY(-6px)", opacity: 1 },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease-out",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
