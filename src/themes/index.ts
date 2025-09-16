import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        neutral: {
          100: { value: "#e6e8ef" },  // very light cool gray with subtle blue tint
          200: { value: "#bfc4d1" },
          300: { value: "#9aa0b3" },
          400: { value: "#757c95" },
          500: { value: "#5b627a" },
          600: { value: "#454a5d" },
          700: { value: "#2f3340" },
          800: { value: "#1f2430" },
          900: { value: "#121721" },
        },
        brand: {
          900: { value: "#323715" },  // deeper, richer olive with cooler undertones
          800: { value: "#4a562a" },  // dark olive-green with a hint of blue
          700: { value: "#65703f" },  // balanced dark olive with more saturation
          600: { value: "#7f8e4f" },  // medium-dark olive with fresh tone
          500: { value: "#a4b25f" },  // warm olive-yellow green
          400: { value: "#b7c576" },  // lighter warm green with yellow hint
          300: { value: "#c9d88e" },  // soft pastel green-yellow
          200: { value: "#dbeea8" },  // pale warm yellow-green
          100: { value: "#f0f7ce" },
          // 900: { value: "#40421a" },
          // 800: { value: "#5B622D" },
          // 700: { value: "#76823F" },
          // 600: { value: "#90A252" },
          // 500: { value: "#abc265" },
          // 400: { value: "#BDD07E" },
          // 300: { value: "#CFDD96" },
          // 200: { value: "#E1EBAF" },
          // 100: { value: "#f3f8c7" },
          // ==============================
          // 100: { value: "#FEF499" },
          // 200: { value: "#FFE27B" },
          // 300: { value: "#FFC756" },
          // 400: { value: "#FFA336" },
          // 500: { value: "#FF7B16" },
          // 600: { value: "#F45D00" },
          // 700: { value: "#D03B00" },
          // 800: { value: "#A42B00" },
          // 900: { value: "#7A1E00" },
        },
        support: {
          "green":{value:"#b2c249"}
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

// const neutralShades = {
//   900: "#1c1b23", // base dark
//   800: "#3a3947",
//   700: "#58576b",
//   600: "#767590",
//   500: "#9494b4",
//   400: "#b2b2d8",
//   300: "#d0d0fc",
//   200: "#e6e6ff",
//   100: "#f2f2ff", // very light neutral
// };
