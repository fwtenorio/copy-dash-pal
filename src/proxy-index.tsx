console.log("🚀 Resolution Hub Carregado");

import React from "react";
import { createRoot } from "react-dom/client";
import "./proxy.css";
import ResolutionHub from "./pages/proxy/ResolutionHub";

declare global {
  interface Window {
    CHARGEMIND_DATA?: unknown;
  }
}

// Função para inicializar o React de forma segura
function initApp() {
  try {
    // Tenta encontrar o container (suporta ambos os IDs)
    let container = document.getElementById("chargemind-proxy-root");
    if (!container) {
      container = document.getElementById("root");
    }

    // Log de debug antes do createRoot
    console.log("DOM detectado:", container);
    console.log("Elementos disponíveis:", Array.from(document.querySelectorAll("[id]")).map(el => el.id));

if (!container) {
      console.error("❌ Elemento raiz não encontrado (procurou por 'chargemind-proxy-root' e 'root').");
      console.log("Elementos disponíveis:", Array.from(document.querySelectorAll("[id]")).map(el => el.id));
      
      // Tenta criar o elemento se não existir
      const fallbackContainer = document.createElement("div");
      fallbackContainer.id = "chargemind-proxy-root";
      fallbackContainer.style.cssText = "min-height: 400px; padding: 20px 0;";
      
      // Tenta adicionar ao body, se não existir cria
      if (document.body) {
        document.body.appendChild(fallbackContainer);
      } else {
        document.documentElement.appendChild(fallbackContainer);
      }
      
      console.log("✅ Elemento raiz criado automaticamente");
      renderApp(fallbackContainer);
      return;
    }

    renderApp(container);
  } catch (error) {
    console.error("❌ Erro ao inicializar Resolution Hub:", error);
    const container = document.getElementById("chargemind-proxy-root") || document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
          <h2>Error loading Resolution Hub</h2>
          <p style="font-size: 14px; color: #999;">Please check the browser console for details.</p>
          <pre style="font-size: 11px; text-align: left; margin-top: 20px;">${error.message}</pre>
        </div>
      `;
    }
  }
}

function renderApp(container: HTMLElement) {
  try {
    console.log("🎨 Iniciando renderização do React...");
    console.log("📦 React disponível:", typeof React !== "undefined" ? "Sim" : "Não");
    console.log("📦 createRoot disponível:", typeof createRoot !== "undefined" ? "Sim" : "Não");
    console.log("📦 ResolutionHub disponível:", typeof ResolutionHub !== "undefined" ? "Sim" : "Não");

const root = createRoot(container);
    console.log("✅ createRoot criado com sucesso");

root.render(
  <React.StrictMode>
    <ResolutionHub />
  </React.StrictMode>,
);
    
    console.log("✅ Resolution Hub renderizado com sucesso");
  } catch (error) {
    console.error("❌ ERRO CRÍTICO ao renderizar React:", error);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Detalhes do erro:", {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    
    // Mostra o erro na página
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #dc2626;">
        <h2>Erro ao carregar Resolution Hub</h2>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">${error.message}</p>
        <pre style="font-size: 11px; text-align: left; margin-top: 20px; background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto;">${error.stack || error.toString()}</pre>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">Verifique o console do navegador para mais detalhes.</p>
      </div>
    `;
    
    // Re-throw para que seja capturado pelo try/catch externo
    throw error;
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
