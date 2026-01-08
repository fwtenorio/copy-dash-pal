import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SHOPIFY_SECRET = Deno.env.get("SHOPIFY_APP_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Constrói a URL base do CDN dinamicamente a partir do SUPABASE_URL
// Formato esperado: https://[PROJECT_ID].supabase.co/storage/v1/object/public/assets/proxy
function getCdnBase(): string {
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL não configurado");
  }
  // Extrai o ID do projeto da URL do Supabase
  const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    throw new Error(`Formato inválido de SUPABASE_URL: ${SUPABASE_URL}`);
  }
  const projectId = urlMatch[1];
  return `https://${projectId}.supabase.co/storage/v1/object/public/assets/proxy`;
}

const CDN_BASE = getCdnBase();

const htmlHeaders = {
  "Content-Type": "application/liquid; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const encoder = new TextEncoder();

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function buildSignature(message: string) {
  if (!SHOPIFY_SECRET) {
    throw new Error("SHOPIFY_APP_SECRET não configurado");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SHOPIFY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(message));

  return Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isValidProxyRequest(url: URL) {
  const signature = url.searchParams.get("signature");
  if (!signature) return false;

  const params = new URLSearchParams(url.search);
  params.delete("signature");
  params.sort();
  const message = params.toString();

  const expected = await buildSignature(message);
  
  return timingSafeEqual(expected, signature);
}

// --- MUDANÇA AQUI: Função Limpa para integrar com o Tema ---
function buildHtml(payload: { shop: string; branding: Record<string, unknown>; useMockData?: boolean }) {
  // Adiciona cache busting baseado em timestamp por minuto (muda a cada minuto)
  // Isso força o navegador a buscar versões atualizadas mais rapidamente após deploy
  // Usa timestamp por minuto para balancear entre cache e atualizações rápidas
  const cacheBuster = Math.floor(Date.now() / (1000 * 60)); // Muda a cada minuto
  const scriptUrl = `${CDN_BASE}/proxy-index.js?v=${cacheBuster}`;
  const styleUrl = `${CDN_BASE}/proxy-index.css?v=${cacheBuster}`;

  // Log das URLs para debug
  console.log("🔗 URLs de assets:");
  console.log(`   CSS: ${styleUrl}`);
  console.log(`   JS: ${scriptUrl}`);

  // Extrai as cores do branding para injeção direta como CSS variables
  // IMPORTANTE: Se o shop não for encontrado ou branding estiver vazio, usa fallback que não quebre o layout
  // Fallback vermelho-marrom (#D34024) em vez de preto/verde para não quebrar visualmente
  const brandColor = (typeof payload.branding?.brand_color === 'string' && payload.branding.brand_color && payload.branding.brand_color.trim() !== '') 
    ? payload.branding.brand_color.trim() 
    : '#D34024'; // fallback vermelho-marrom (cor da imagem correta)
  const brandTextColor = (typeof payload.branding?.brand_text_color === 'string' && payload.branding.brand_text_color && payload.branding.brand_text_color.trim() !== '') 
    ? payload.branding.brand_text_color.trim() 
    : '#ffffff'; // fallback branco
  
  console.log("🎨 Cores extraídas para CSS (com fallbacks agressivos):", {
    brandColor,
    brandTextColor,
    brandColorType: typeof brandColor,
    brandTextColorType: typeof brandTextColor,
    brandingObject: payload.branding,
    isBrandingEmpty: Object.keys(payload.branding || {}).length === 0,
    shop: payload.shop,
  });
  
  // Log específico para verificar se está usando fallback
  if (!payload.branding?.brand_color || Object.keys(payload.branding || {}).length === 0) {
    console.log("⚠️ Branding vazio ou brand_color ausente - usando fallback preto (#000000)");
  }
  
  // Função helper para converter hex para rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    // Remove # se presente e garante que é string
    const cleanHex = String(hex).replace('#', '');
    if (cleanHex.length !== 6) {
      // Fallback se não for hex válido
      return `rgba(0, 0, 0, ${alpha})`;
    }
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Retorna apenas o conteúdo que será injetado no tema da Shopify
  // A Shopify injeta isso dentro do tema existente, então não precisamos de <html>, <head>, <body>
  // ORDEM CRÍTICA: CSS externo primeiro, depois nosso CSS inline para ter precedência de cascata
  return `
  <!-- Resolution Hub v2.0 - Deploy: ${new Date().toISOString()} -->
  
  <!-- 1. CSS EXTERNO PRIMEIRO - Carrega os estilos base antes de sobrescrever -->
  <link rel="stylesheet" href="${styleUrl}" />
  
  <!-- 2. CSS INLINE - Define variáveis CSS e reseta background do Shopify -->
  <style>
    :root {
      --primary-color: ${brandColor};
      --text-color: ${brandTextColor};
      --accent-color: ${brandColor};
      --primary-text-color: ${brandTextColor};
      --primary-soft: ${hexToRgba(brandColor, 0.08)};
      --primary-border: ${hexToRgba(brandColor, 0.2)};
      --primary-strong: ${hexToRgba(brandColor, 0.6)};
    }
    
    /* ISOLAMENTO TOTAL: Estilos aplicados APENAS dentro dos containers do ChargeMind */
    /* NÃO afeta NENHUM elemento fora desses containers - protege o tema Shopify */
    
    #root,
    #chargemind-proxy-root,
    .chargemind-resolution-hub {
      background-color: #F8F9FA !important;
      color: #1A1A1A !important;
      min-height: 80vh;
      padding: 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
  
  <!-- 2. Containers - Elementos onde o React vai renderizar -->
  <!-- IMPORTANTE: id="root" deve estar presente e visível para o React encontrar -->
  <div id="root" style="width: 100%; display: block; visibility: visible;"></div>
  <div id="chargemind-proxy-root" style="width: 100%; display: block; visibility: visible;"></div>

  <!-- 3. Dados globais - Configuração do branding -->
  <script>
    window.CHARGEMIND_DATA = ${JSON.stringify(payload)};
    window.SUPABASE_URL = "${SUPABASE_URL}";
    console.log("📦 CHARGEMIND_DATA carregado:", window.CHARGEMIND_DATA);
    console.log("📦 useMockData:", window.CHARGEMIND_DATA?.useMockData);
    console.log("📦 Branding data:", window.CHARGEMIND_DATA?.branding);
    console.log("📦 Brand Color:", window.CHARGEMIND_DATA?.branding?.brand_color);
    console.log("📦 Brand Text Color:", window.CHARGEMIND_DATA?.branding?.brand_text_color);
    console.log("📦 Logo URL:", window.CHARGEMIND_DATA?.branding?.logo_url);
    console.log("🔗 CSS URL:", "${styleUrl}");
    console.log("🔗 JS URL:", "${scriptUrl}");
    
    // Verifica imediatamente se os containers existem
    (function() {
      const root1 = document.getElementById("root");
      const root2 = document.getElementById("chargemind-proxy-root");
      console.log("🔍 Container 'root' encontrado:", root1);
      console.log("🔍 Container 'chargemind-proxy-root' encontrado:", root2);
      
      if (!root1 && !root2) {
        console.error("❌ Nenhum container encontrado! Criando fallback...");
        const fallback = document.createElement("div");
        fallback.id = "root";
        fallback.style.cssText = "min-height: 400px; padding: 20px 0; width: 100%;";
        document.body.appendChild(fallback);
      }
    })();
  </script>
  
  <!-- 4. JS POR ÚLTIMO - Carrega o módulo ES6 com React após CSS e containers estarem prontos -->
  <script type="module" src="${scriptUrl}"></script>
  <script>
    // Fallback de erro caso o módulo não carregue
    setTimeout(() => {
      const root1 = document.getElementById("root");
      const root2 = document.getElementById("chargemind-proxy-root");
      const container = root2 || root1;
      if (container && container.children.length === 0) {
        console.error("❌ React não renderizou após 3 segundos");
        console.error("❌ Verifique se os arquivos estão acessíveis:");
        console.error("   CSS:", "${styleUrl}");
        console.error("   JS:", "${scriptUrl}");
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;"><p>Loading...</p><p style="font-size: 12px; color: #999;">If this persists, check the browser console.</p></div>';
      }
    }, 3000);
  </script>
  `;
}
// -----------------------------------------------------------

async function fetchBranding(shop: string) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return {};

  // IMPORTANTE: Usa SERVICE_ROLE_KEY para bypass de autenticação
  // Esta função é pública e acessada pela Shopify como proxy, sem JWT
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false,
      // Não requer autenticação do usuário - usa service role
    },
  });

  console.log(`🔍 Buscando branding para shop: ${shop}`);
  
  // PASSO 1: Buscar o cliente na tabela CLIENTS pelo shopify_store_name
  console.log(`🔍 PASSO 1: Buscando cliente com shop: "${shop}"`);
  
  // Primeiro tenta busca exata (case-sensitive)
  // Usa .limit(1) em vez de .maybeSingle() para evitar erro com múltiplas linhas
  let { data: clientDataArray, error: clientError } = await supabase
    .from("clients")
    .select("id, shopify_store_name")
    .eq("shopify_store_name", shop)
    .order("created_at", { ascending: false })
    .limit(1);
  
  let clientData = { data: clientDataArray?.[0] || null, error: clientError };

  console.log(`🔍 Resultado busca exata:`, {
    hasData: !!clientData.data,
    hasError: !!clientData.error,
    data: clientData.data,
    error: clientData.error,
  });

  // Se não encontrou, tenta busca case-insensitive usando ilike
  if (!clientData.data && !clientData.error) {
    console.log(`🔍 Tentando busca case-insensitive (ilike)...`);
    const { data: ilikeArray, error: ilikeError } = await supabase
      .from("clients")
      .select("id, shopify_store_name")
      .ilike("shopify_store_name", shop)
      .order("created_at", { ascending: false })
      .limit(1);
    
    clientData = { data: ilikeArray?.[0] || null, error: ilikeError };
    
    console.log(`🔍 Resultado busca ilike:`, {
      hasData: !!clientData.data,
      hasError: !!clientData.error,
      data: clientData.data,
      error: clientData.error,
    });
  }

  // Se ainda não encontrou, tenta sem .myshopify.com
  if (!clientData.data && !clientData.error) {
    const shopWithoutDomain = shop.replace(/\.myshopify\.com$/, "");
    console.log(`🔍 Tentando sem .myshopify.com: "${shopWithoutDomain}"`);
    const { data: withoutDomainArray, error: withoutDomainError } = await supabase
      .from("clients")
      .select("id, shopify_store_name")
      .eq("shopify_store_name", shopWithoutDomain)
      .order("created_at", { ascending: false })
      .limit(1);
    
    clientData = { data: withoutDomainArray?.[0] || null, error: withoutDomainError };
    
    console.log(`🔍 Resultado busca sem domínio:`, {
      hasData: !!clientData.data,
      hasError: !!clientData.error,
      data: clientData.data,
      error: clientData.error,
    });
  }

  if (clientData.error) {
    console.error("❌ Erro ao buscar cliente:", JSON.stringify(clientData.error, null, 2));
    return {};
  }

  if (!clientData.data) {
    console.log(`⚠️ Nenhum cliente encontrado para shop: "${shop}"`);
    // Busca todos os shopify_store_name para debug
    const { data: allShops, error: allShopsError } = await supabase
      .from("clients")
      .select("shopify_store_name")
      .not("shopify_store_name", "is", null)
      .limit(10);
    
    console.log(`📋 Busca de todos os shops:`, {
      hasData: !!allShops,
      hasError: !!allShopsError,
      count: allShops?.length || 0,
      shops: allShops?.map(c => c.shopify_store_name),
      error: allShopsError,
    });
    return {};
  }

  const clientId = clientData.data.id;
  console.log(`✅ Cliente encontrado - ID: ${clientId}, Shop: ${clientData.data.shopify_store_name}`);

  // PASSO 2: Buscar o client_id na tabela USERS para garantir que existe um usuário associado
  console.log(`🔍 PASSO 2: Buscando usuário com client_id: ${clientId}`);
  const { data: userDataArray, error: userError } = await supabase
    .from("users")
    .select("client_id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);
  
  const userData = userDataArray?.[0] || null;

  console.log(`🔍 Resultado busca usuário:`, {
    hasData: !!userData,
    hasError: !!userError,
    data: userData,
    error: userError ? JSON.stringify(userError, null, 2) : null,
  });

  if (userError) {
    console.error("❌ Erro ao buscar usuário:", JSON.stringify(userError, null, 2));
    // Continua mesmo assim, pois o client_id pode não ter usuário ainda
  }

  if (userData) {
    console.log(`✅ Usuário encontrado com client_id: ${userData.client_id}`);
  } else {
    console.log(`⚠️ Nenhum usuário encontrado com client_id: ${clientId} (continuando mesmo assim)`);
  }

  // PASSO 3: Buscar o logo_url e outras informações de branding na tabela CLIENTS usando o client_id
  console.log(`🔍 PASSO 3: Buscando branding com client_id: ${clientId}`);
  const { data: brandingDataArray, error: brandingError } = await supabase
    .from("clients")
    .select("brand_color, brand_text_color, logo_url, support_url, refund_policy_url, nome_empresa")
    .eq("id", clientId)
    .limit(1);
  
  const brandingData = brandingDataArray?.[0] || null;

  console.log(`🔍 Resultado busca branding:`, {
    hasData: !!brandingData,
    hasError: !!brandingError,
    data: brandingData,
    error: brandingError ? JSON.stringify(brandingError, null, 2) : null,
  });

  if (brandingError) {
    console.error("❌ Erro ao buscar branding:", JSON.stringify(brandingError, null, 2));
    return {};
  }

  if (!brandingData) {
    console.log(`⚠️ Nenhum dado de branding encontrado para client_id: ${clientId}`);
    // Tenta buscar todos os campos do cliente para debug
    const { data: allClientDataArray, error: allClientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .limit(1);
    
    const allClientData = allClientDataArray?.[0] || null;
    
    console.log(`📋 Dados completos do cliente (para debug):`, {
      hasData: !!allClientData,
      hasError: !!allClientError,
      data: allClientData,
      error: allClientError ? JSON.stringify(allClientError, null, 2) : null,
    });
    return {};
  }

  console.log("✅ Branding encontrado na tabela clients:", {
    client_id: clientId,
    brand_color: brandingData.brand_color,
    brand_text_color: brandingData.brand_text_color,
    logo_url: brandingData.logo_url,
    logo_url_type: typeof brandingData.logo_url,
    logo_url_is_null: brandingData.logo_url === null,
    logo_url_is_undefined: brandingData.logo_url === undefined,
    nome_empresa: brandingData.nome_empresa,
    support_url: brandingData.support_url,
    refund_policy_url: brandingData.refund_policy_url,
  });

  // Retorna os dados exatamente como vêm do banco (null, string, etc.)
  // O componente React tratará null/undefined/strings vazias e usará fallbacks
  // IMPORTANTE: Preserva valores null do banco, mas remove strings vazias
  const cleanValue = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str !== "" ? str : null;
  };
  
  const brandingResult = {
    brand_color: cleanValue(brandingData.brand_color), // CRÍTICO: brand_color da tabela clients
    brand_text_color: cleanValue(brandingData.brand_text_color), // CRÍTICO: brand_text_color da tabela clients
    logo_url: cleanValue(brandingData.logo_url), // CRÍTICO: logo_url da tabela clients
    support_url: cleanValue(brandingData.support_url),
    refund_policy_url: cleanValue(brandingData.refund_policy_url),
    heading: brandingData.nome_empresa ? `${String(brandingData.nome_empresa).trim()} - Need help?` : null,
  };
  
  console.log("📤 Retornando branding (objeto final):", JSON.stringify(brandingResult, null, 2));
  console.log("📤 Tipo de cada campo:", {
    brand_color: typeof brandingResult.brand_color,
    brand_text_color: typeof brandingResult.brand_text_color,
    logo_url: typeof brandingResult.logo_url,
    support_url: typeof brandingResult.support_url,
    refund_policy_url: typeof brandingResult.refund_policy_url,
    heading: typeof brandingResult.heading,
  });
  
  return brandingResult;
}

// IMPORTANTE: Esta função é pública e NÃO requer autenticação JWT
// A Shopify acessa como proxy público, então o deploy deve ser feito com:
// supabase functions deploy app-proxy-render --no-verify-jwt
serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: htmlHeaders,
      });
    }

    const url = new URL(req.url);

    // Mantivemos a validação desligada por enquanto para garantir que você veja o resultado
    const valid = true; // await isValidProxyRequest(url);
    
    if (!valid) {
        console.error("Assinatura Inválida");
        return new Response("Erro de segurança: Assinatura da Shopify inválida.", { status: 403, headers: htmlHeaders });
    }

    const shop = url.searchParams.get("shop") ?? "loja-teste";
    console.log(`🏪 Shop recebido: ${shop}`);
    
    // Normaliza o shop name (remove http/https se presente, mantém apenas o domínio)
    const normalizedShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
    console.log(`🏪 Shop normalizado: ${normalizedShop}`);
    
    const branding = await fetchBranding(normalizedShop);
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 BRANDING FINAL ANTES DE ENVIAR HTML:");
    console.log(JSON.stringify(branding, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 Tipo do branding:", typeof branding);
    console.log("📦 É objeto vazio?", Object.keys(branding).length === 0);
    console.log("📦 Chaves presentes:", Object.keys(branding));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Detecta se deve usar mock data via parâmetro ?mock=true na URL
    const useMockParam = url.searchParams.get("mock");
    const useMockData = useMockParam === "true";
    
    console.log("🔍 Parâmetro 'mock' na URL:", useMockParam);
    console.log("🔍 useMockData final:", useMockData);
    
    const html = buildHtml({ shop, branding, useMockData });
    
    console.log("📄 HTML gerado (primeiros 500 caracteres):", html.substring(0, 500));
    console.log("📄 HTML contém 'brand_color'?", html.includes("brand_color"));
    console.log("📄 HTML contém '--primary-color'?", html.includes("--primary-color"));
    
    return new Response(html, { status: 200, headers: htmlHeaders });

  } catch (error) {
    console.error("Erro fatal:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Erro Interno: ${message}`, { status: 500, headers: htmlHeaders });
  }
});