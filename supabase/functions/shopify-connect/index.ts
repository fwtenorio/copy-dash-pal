import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

type ConnectPayload = {
  shopUrl?: string;
  accessToken?: string;
  action?: "disconnect";
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

    // Cliente autenticado (para verificar o usuário)
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

    // Obter dados do corpo da requisição
    const { shopUrl, accessToken, action }: ConnectPayload = await req.json().catch(() => ({}));

    const userId = user.id;

    console.log("=== DEBUG: Iniciando conexão Shopify ===");
    console.log("User ID (auth.users):", userId);

    // Cliente com service role para operações no banco (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do usuário na tabela users para obter o client_id
    // Usamos array para evitar erro PGRST116 (múltiplas ou zero linhas)
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, client_id, user_level")
      .eq("id", userId);

    console.log("Query users resultado:", { usersData, usersError });

    if (usersError) {
      console.error("Erro ao buscar dados do usuário:", usersError);
      throw new Error("Erro ao buscar usuário: " + usersError.message);
    }

    let userData = Array.isArray(usersData) ? usersData[0] : null;

    if (!userData) {
      console.warn("Usuário não encontrado em public.users; criando registro básico para:", userId);

      // Garantir client de fallback
      const fallbackClientId = userId;
      const { data: existingClient } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("id", fallbackClientId)
        .maybeSingle();

      if (!existingClient) {
        const nome = (user.user_metadata as Record<string, any> | null)?.nome ?? user.email ?? "User";
        const nome_empresa = (user.user_metadata as Record<string, any> | null)?.nome_empresa ?? "Minha Empresa";
        const telefone = (user.user_metadata as Record<string, any> | null)?.telefone;

        const { error: insertClientError } = await supabaseAdmin
          .from("clients")
          .insert({
            id: fallbackClientId,
            email: user.email ?? "",
            nome,
            nome_empresa,
            telefone,
          });

        if (insertClientError) {
          console.error("Erro ao criar client de fallback:", insertClientError);
          throw new Error("Não foi possível criar empresa para o usuário");
        }
      }

      // Criar usuário minimal
      const nomeUser = (user.user_metadata as Record<string, any> | null)?.nome ?? user.email ?? "User";
      const { error: insertUserError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: user.email ?? "",
          nome: nomeUser,
          client_id: fallbackClientId,
          user_level: "user",
        });

      if (insertUserError) {
        console.error("Erro ao criar usuário na tabela users:", insertUserError);
        throw new Error("Não foi possível criar registro de usuário.");
      }

      userData = {
        id: userId,
        client_id: fallbackClientId,
        user_level: "user",
      };
    }

    console.log("✅ Dados do usuário encontrados/criados:", JSON.stringify(userData, null, 2));

    let clientId = userData.client_id;

    if (!clientId) {
      console.log("client_id ausente para usuário. Tentando autocriar empresa e vincular...");

      // Tentar usar o próprio id do usuário como client_id
      const fallbackClientId = userId;

      // Verificar se já existe client com esse id
      const { data: existingClient, error: existingClientError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("id", fallbackClientId)
        .maybeSingle();

      if (existingClientError) {
        console.error("Erro ao verificar cliente existente:", existingClientError);
      }

      // Criar client se não existir
      if (!existingClient) {
        const nome = (user.user_metadata as Record<string, any> | null)?.nome ?? user.email ?? "User";
        const nome_empresa = (user.user_metadata as Record<string, any> | null)?.nome_empresa ?? "Minha Empresa";
        const telefone = (user.user_metadata as Record<string, any> | null)?.telefone;

        const { error: insertClientError } = await supabaseAdmin
          .from("clients")
          .insert({
            id: fallbackClientId,
            email: user.email ?? "",
            nome,
            nome_empresa,
            telefone,
          });

        if (insertClientError) {
          console.error("Erro ao criar client de fallback:", insertClientError);
          throw new Error("Não foi possível criar empresa para o usuário");
        }

        console.log("Client criado com id (fallback):", fallbackClientId);
      } else {
        console.log("Client já existia para o usuário:", fallbackClientId);
      }

      // Atualizar usuário com o client_id criado/encontrado
      const { error: updateUserError } = await supabaseAdmin
        .from("users")
        .update({ client_id: fallbackClientId })
        .eq("id", userId);

      if (updateUserError) {
        console.error("Erro ao atualizar client_id no usuário:", updateUserError);
        throw new Error("Não foi possível vincular o usuário à empresa");
      }

      clientId = fallbackClientId;
      console.log("client_id vinculado ao usuário:", clientId);
    }

    console.log("Client ID do usuário:", clientId);

    // Verificar se o client existe
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    console.log("Query clients resultado:", { clientData, clientError });

    if (!clientData) {
      throw new Error("Cliente não encontrado com id: " + clientId);
    }

    console.log("✅ Cliente encontrado:", JSON.stringify(clientData, null, 2));

    // Se ação for disconnect, limpar dados e retornar
    if (action === "disconnect") {
      const { data: updatedClient, error: updateError } = await supabaseAdmin
        .from("clients")
        .update({
          shopify_store_name: null,
          shopify_access_token: null,
          shopify_connected_at: null,
          shopify_status: null,
        })
        .eq("id", clientId)
        .select("id, shopify_store_name, shopify_connected_at")
        .maybeSingle();

      if (updateError) {
        console.error("Erro ao desconectar Shopify:", updateError);
        throw new Error("Erro ao desconectar Shopify: " + updateError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          client: updatedClient,
          message: "Shopify desconectado com sucesso",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!shopUrl || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Shop URL e Access Token são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Atualizar o registro em clients usando o client_id
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        shopify_store_name: shopUrl.trim(),
        shopify_access_token: accessToken.trim(),
        shopify_connected_at: new Date().toISOString(),
        shopify_status: 'active',
      })
      .eq("id", clientId)
      .select("id, shopify_store_name, shopify_connected_at")
      .maybeSingle();

    if (updateError) {
      console.error("Erro ao atualizar dados do cliente:", updateError);
      console.error("Detalhes do erro:", JSON.stringify(updateError, null, 2));
      throw new Error("Erro ao atualizar cliente: " + updateError.message);
    }

    if (!updatedClient) {
      console.error("Update não retornou resultado. Client ID:", clientId);
      throw new Error("Cliente não encontrado ou não atualizado");
    }

    console.log("Shopify conectado com sucesso:", updatedClient.id);

    // Tentar obter dados da loja para atualizar nome_empresa, telefone e notifications_menu
    try {
      let normalizedStoreUrl = shopUrl.trim();
      normalizedStoreUrl = normalizedStoreUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      if (!normalizedStoreUrl.includes(".myshopify.com")) {
        normalizedStoreUrl = `${normalizedStoreUrl}.myshopify.com`;
      }

      const shopHeaders = {
        "X-Shopify-Access-Token": accessToken.trim(),
        "Content-Type": "application/json",
      };

      // Shop info
      try {
        const shopResponse = await fetch(`https://${normalizedStoreUrl}/admin/api/2024-07/shop.json`, {
          headers: shopHeaders,
        });

        if (shopResponse.ok) {
          const shopPayload = await shopResponse.json();
          const shopData = shopPayload?.shop;

          if (shopData) {
            const nome_empresa = shopData.name || null;
            const telefone = shopData.phone || null;

            await supabaseAdmin
              .from("clients")
              .update({
                nome_empresa,
                telefone,
              })
              .eq("id", clientId);
          }
        } else {
          console.warn("Não foi possível obter dados da loja Shopify para atualizar nome_empresa/telefone. Status:", shopResponse.status);
        }
      } catch (shopInfoError) {
        console.warn("Erro ao buscar/atualizar dados da loja Shopify:", shopInfoError);
      }

      // Contar disputas (melhor esforço; se falhar, salva 0)
      let disputesCount = 0;
      try {
        const disputesResp = await fetch(
          `https://${normalizedStoreUrl}/admin/api/2024-01/shopify_payments/disputes.json?limit=250`,
          { headers: shopHeaders },
        );
        if (disputesResp.ok) {
          const disputesPayload = await disputesResp.json();
          disputesCount = Array.isArray(disputesPayload?.disputes) ? disputesPayload.disputes.length : 0;
        } else {
          console.warn("Não foi possível obter disputas (status):", disputesResp.status);
        }
      } catch (disputesErr) {
        console.warn("Erro ao buscar disputas para notifications_menu:", disputesErr);
      }

      // Upsert notifications_menu com user_id e contagem de disputas
      const { error: notifError } = await supabaseAdmin
        .from("notifications_menu")
        .upsert(
          {
            user_id: userId,
            disputes: disputesCount,
            last_login: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (notifError) {
        console.warn("Erro ao atualizar notifications_menu:", notifError);
      }
    } catch (infoErr) {
      console.warn("Falha ao atualizar dados complementares (shop info/notifications_menu):", infoErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        client: updatedClient,
        message: "Shopify conectado com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro na função shopify-connect:", error);

    // Fornecer mais detalhes do erro
    let errorDetails = "Erro interno";
    if (error instanceof Error) {
      errorDetails = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorDetails = JSON.stringify(error);
    }

    console.error("Detalhes completos do erro:", errorDetails);

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro interno",
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
