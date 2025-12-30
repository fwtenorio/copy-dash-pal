import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Autenticar usuário
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autorização necessária" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace(/Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação inválido" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do Supabase ausente" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cliente autenticado
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error("Erro ao obter usuário:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = user.id;
    console.log("=== DEBUG: Iniciando desinstalação do app ===");
    console.log("User ID:", userId);

    // Cliente com service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do usuário para obter client_id
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, client_id")
      .eq("id", userId)
      .maybeSingle();

    if (usersError || !usersData || !usersData.client_id) {
      console.error("Erro ao buscar dados do usuário:", usersError);
      throw new Error("Usuário não encontrado ou sem empresa vinculada");
    }

    const clientId = usersData.client_id;
    console.log("Client ID:", clientId);

    // Buscar dados do cliente incluindo credenciais Shopify
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id, shopify_store_name, shopify_access_token")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError || !clientData) {
      console.error("Erro ao buscar dados do cliente:", clientError);
      throw new Error("Cliente não encontrado");
    }

    console.log("Cliente encontrado:", clientData.id);

    // Se houver credenciais Shopify, tentar desinstalar o app via GraphQL
    if (clientData.shopify_store_name && clientData.shopify_access_token) {
      try {
        let shopifyStoreUrl = clientData.shopify_store_name.trim();
        shopifyStoreUrl = shopifyStoreUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
        if (!shopifyStoreUrl.includes(".myshopify.com")) {
          shopifyStoreUrl = `${shopifyStoreUrl}.myshopify.com`;
        }

        // Chamar a mutation appUninstall via Shopify GraphQL Admin API
        const graphqlEndpoint = `https://${shopifyStoreUrl}/admin/api/2024-10/graphql.json`;
        
        const mutation = `
          mutation {
            appUninstall {
              userErrors {
                field
                message
              }
            }
          }
        `;

        console.log("Chamando appUninstall para loja:", shopifyStoreUrl);

        const shopifyResponse = await fetch(graphqlEndpoint, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": clientData.shopify_access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: mutation }),
        });

        if (!shopifyResponse.ok) {
          console.warn("Erro ao chamar appUninstall:", shopifyResponse.status, await shopifyResponse.text());
          // Continuar mesmo se falhar, pois vamos limpar os dados locais
        } else {
          const result = await shopifyResponse.json();
          console.log("Resultado do appUninstall:", JSON.stringify(result, null, 2));

          // Verificar se houve erros
          if (result.data?.appUninstall?.userErrors && result.data.appUninstall.userErrors.length > 0) {
            console.warn("UserErrors ao desinstalar app:", result.data.appUninstall.userErrors);
            // Continuar mesmo com erros, pois vamos limpar os dados
          } else {
            console.log("✅ App desinstalado com sucesso via Shopify GraphQL");
          }
        }
      } catch (shopifyError) {
        console.error("Erro ao tentar desinstalar app via Shopify:", shopifyError);
        // Continuar mesmo se falhar a chamada Shopify
      }
    }

    // Limpar dados do cliente (independente do resultado da chamada Shopify)
    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        shopify_store_name: null,
        shopify_access_token: null,
        shopify_connected_at: null,
        shopify_status: 'uninstalled',
        // Marcar conta como desativada
        account_status: 'deactivated',
        deactivated_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("Erro ao limpar dados do cliente:", updateError);
      throw new Error("Erro ao desativar conta: " + updateError.message);
    }

    console.log("✅ Dados do cliente limpos com sucesso");

    // Desativar todos os usuários associados ao cliente
    const { error: deactivateUsersError } = await supabaseAdmin
      .from("users")
      .update({ active: false })
      .eq("client_id", clientId);

    if (deactivateUsersError) {
      console.warn("Erro ao desativar usuários:", deactivateUsersError);
      // Não lançar erro, pois a conta já foi desativada
    }

    console.log("✅ Conta desativada com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message: "App desinstalado e conta desativada com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro na função app-uninstall:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error("Detalhes do erro:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
