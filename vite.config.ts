import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detecta se é build apenas do proxy (via variável de ambiente)
  const isProxyOnly = process.env.VITE_BUILD_PROXY === 'true' || 
                      process.env.npm_lifecycle_event === 'build:proxy';
  
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
      emptyOutDir: true,
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      },
    rollupOptions: {
        // Builds mutuamente exclusivos:
        // - Se isProxyOnly: apenas proxy-index.tsx (para deploy no Shopify)
        // - Se build principal: apenas index.html (sem código do proxy)
        input: isProxyOnly
          ? path.resolve(__dirname, "src/proxy-index.tsx")
          : path.resolve(__dirname, "index.html"),
      output: {
        preserveModules: false,
        
        // FORÇA SINGLE BUNDLE: inlineDynamicImports garante que tudo fique em um único arquivo
        inlineDynamicImports: isProxyOnly ? true : false,
        
        entryFileNames: (chunk) => {
          if (isProxyOnly || chunk.name === "proxy") {
            return "proxy-index.js"; // Nome fixo sem hash
          }
          return "assets/[name]-[hash].js";
        },
        
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || "";
          if (name.includes("proxy") && name.endsWith(".css")) {
            return "proxy-index.css"; // Nome fixo sem hash
          }
          return "assets/[name]-[hash][extname]";
        },
        
        // REMOVE manualChunks quando isProxyOnly para forçar tudo em um único bundle
        // No build principal, separa vendor para otimização (sem código do proxy)
        manualChunks: isProxyOnly ? undefined : (id) => {
          // Garante que código do proxy nunca entre no build principal
          if (
            id.includes("proxy-index") ||
            id.includes("pages/proxy") ||
            id.includes("proxy/") ||
            id.includes("src/proxy") ||
            id.includes("proxy.css")
          ) {
            // Em builds principais, código do proxy não deve ser incluído
            // Se chegar aqui, algo está errado na configuração
            return undefined;
          }

          if (id.includes("node_modules")) {
            return "vendor";
          }

          return undefined;
        },
        
        chunkFileNames: (chunkInfo) => {
          if (isProxyOnly || chunkInfo.name === "proxy") {
            return "proxy-index.js"; // Nome fixo sem hash
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
  };
});
