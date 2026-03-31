import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
      "@helpers": "/src/helpers",
      "@components": "/src/components",
      "@data": "/src/data",
      "@context": "/src/context",
      "@store": "/src/store",
      "@layouts": "/src/layouts",
      "@api": "/src/api",
      "@game": "/src/components/game",
      "@hooks": "/src/hooks",
      "@utils": "/src/utils",
      "@ui": "/src/ui",
      "@types": "/src/types",
      "@tools": "/src/tools",
    },
  },
})