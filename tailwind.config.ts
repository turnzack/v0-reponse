import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: "#08b3c9",
        tealMuted: "#52a6b4",
        tealDark: "#106f8e",
        pink: "#e274a9",
        orange: "#f09a39",
        violetLight: "#9e81b6",
        glass: "rgba(16, 111, 142, 0.4)",
        glassDark: "rgba(15, 12, 41, 0.75)"
      },
      backgroundImage: {
        'gta-sunset': 'linear-gradient(160deg, #2a225e 0%, #643886 20%, #b2539f 40%, #ff8e75 70%, #ffb471 100%)',
        'tiger-gradient': 'linear-gradient(90deg, #08b3c9, #e274a9, #f09a39)',
      }
    },
  },
  plugins: [],
};
export default config;
