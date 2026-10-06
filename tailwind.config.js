/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "#4F46E5",
          dark: "#3730A3",
          light: "#EEF2FF",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#ECFDF5",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FFFBEB",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEF2F2",
          foreground: "#FFFFFF",
        },
        border: "var(--border)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        card: "16px",
      },
      boxShadow: {
        premium: "0 4px 20px -2px rgba(17, 24, 39, 0.05), 0 2px 6px -1px rgba(17, 24, 39, 0.02)",
        "premium-hover": "0 10px 25px -3px rgba(79, 70, 229, 0.08), 0 4px 10px -2px rgba(17, 24, 39, 0.04)",
        "card-glow": "0 0 25px -5px rgba(79, 70, 229, 0.15)",
      },
    },
  },
  plugins: [],
}
