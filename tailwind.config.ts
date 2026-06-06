import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:      "#002677",
        "navy-dark": "#001f5e",
        gold:      "#F5B700",
        "gold-hover": "#e0a800",
      },
    },
  },
  plugins: [],
};

export default config;
