import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticar usuário
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização necessária");
    }

    const token = authHeader.replace(/Bearer\s+/i, "").trim();
    if (!token) {
      throw new Error("Token de autenticação inválido");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Erro ao obter usuário:", userError);
      throw new Error("Usuário não autenticado");
    }

    // Descobrir client_id do usuário logado
    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRowError) {
      throw new Error("Erro ao buscar client_id do usuário");
    }

    const clientId = userRow?.client_id;
    if (!clientId) {
      throw new Error("Usuário sem empresa vinculada (client_id ausente)");
    }

    // Buscar dados da Shopify do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('shopify_store_name, shopify_access_token')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError || !client) {
      throw new Error('Dados da Shopify não configurados');
    }

    let shopifyStoreUrl = client.shopify_store_name || "";
    const shopifyAccessToken = client.shopify_access_token || "";
    
    if (!shopifyStoreUrl || !shopifyAccessToken) {
      throw new Error("Credenciais da Shopify não configuradas");
    }

    // Normaliza domínio da loja: remove http/https e barras finais
    shopifyStoreUrl = shopifyStoreUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    
    // Se não tiver .myshopify.com, adiciona
    if (!shopifyStoreUrl.includes('.myshopify.com')) {
      shopifyStoreUrl = `${shopifyStoreUrl}.myshopify.com`;
    }

    const headers = {
      "X-Shopify-Access-Token": shopifyAccessToken,
      "Content-Type": "application/json",
    };

    const shopUrl = `https://${shopifyStoreUrl}/admin/api/2024-07/shop.json`;
    const response = await fetch(shopUrl, {
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Shop info retrieved:", data);
  
    const infoShop = {
      info: {
        data,
      }
    };

    return new Response(JSON.stringify(infoShop), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função shop-info:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Verifique se as credenciais da Shopify estão corretas",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
