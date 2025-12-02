/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-main)",
        card: "var(--bg-card)",
        "text-main": "var(--text-main)",
        "border-soft": "var(--border-soft)",
        accent: {
          gold: "var(--accent-gold)",
          green: "var(--accent-green)",
          cyan: "var(--accent-cyan)",
          violet: "var(--accent-violet)"
        }
      },
      boxShadow: {
        card: "0 25px 45px rgba(0, 0, 0, 0.15)",
        glow: "0 0 35px rgba(59, 130, 246, 0.35)"
      },
      borderRadius: {
        luxe: "1.25rem"
      }
    }
  },
  plugins: []
};
