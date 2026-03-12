import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: "#4A7C6F",
          50: "#E8F0ED",
          100: "#D1E1DB",
          200: "#A3C3B7",
          300: "#75A593",
          400: "#4A7C6F",
          500: "#3D675C",
          600: "#305249",
          700: "#233D37",
          800: "#162824",
          900: "#091312",
        },
        cream: {
          DEFAULT: "#F5F0E8",
          50: "#FDFCFA",
          100: "#FAF7F2",
          200: "#F5F0E8",
          300: "#EBE2D3",
          400: "#E1D4BE",
        },
        card: "#FDFAF5",
        ink: {
          DEFAULT: "#2C2825",
          light: "#5A5550",
          lighter: "#8A8580",
        },
        amber: {
          DEFAULT: "#C8873A",
          50: "#FBF3E8",
          100: "#F5E2C9",
          200: "#EBC493",
          300: "#D9A567",
          400: "#C8873A",
          500: "#A66E2F",
          600: "#845624",
        },
      },
      fontFamily: {
        heading: ["Lora", "Georgia", "serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        small: "10px",
        pill: "100px",
      },
    },
  },
  plugins: [],
};

export default config;
