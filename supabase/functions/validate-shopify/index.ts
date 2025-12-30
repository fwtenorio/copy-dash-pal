import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopName, accessToken } = await req.json();

    if (!shopName || !accessToken) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Store name and access token are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normaliza o nome da loja
    let shopifyStoreUrl = shopName.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    
    // Se não tiver .myshopify.com, adiciona
    if (!shopifyStoreUrl.includes('.myshopify.com')) {
      shopifyStoreUrl = `${shopifyStoreUrl}.myshopify.com`;
    }

    // Faz uma chamada simples à API do Shopify para validar as credenciais
    const shopUrl = `https://${shopifyStoreUrl}/admin/api/2024-07/shop.json`;
    const response = await fetch(shopUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log(`Validation attempt for ${shopifyStoreUrl}: Status ${response.status}`);

    if (response.status === 401) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invalid access token. Please check your credentials.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (response.status === 404) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Store not found. Please check the store name.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Error validating credentials: ${response.status}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Shopify validation successful for shop:", data.shop?.name);

    return new Response(
      JSON.stringify({
        valid: true,
        shopName: data.shop?.name || shopName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Shopify validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        valid: false,
        error: `Erro ao validar: ${errorMessage}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
