import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuração CORRETA dos Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lidar com a requisição "Preflight" (OPTIONS)
  // O navegador manda isso antes do POST para saber se pode conectar
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const isUuid = (value: string | null | undefined) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  try {
    // 2. Parse do JSON (com tratamento de erro se vier vazio)
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("O corpo da requisição está vazio ou não é JSON válido.");
    }

    const { code, shop, hmac, state } = body;

    console.log(`Recebido request para shop: ${shop}`); // Log para o painel do Supabase

    if (!shop || !code) {
      throw new Error("Parâmetros 'shop' ou 'code' faltando no JSON.");
    }

    // 3. Troca do Token
    const apiKey = Deno.env.get('SHOPIFY_API_KEY')
    const apiSecret = Deno.env.get('SHOPIFY_API_SECRET')
    
    // Verificação de Segurança das Variáveis
    if (!apiKey || !apiSecret) {
      console.error("Variáveis de ambiente faltando no Supabase!");
      throw new Error("Configuração do servidor incompleta (API Keys).");
    }

    const accessTokenUrl = `https://${shop}/admin/oauth/access_token`
    
    console.log("Solicitando token para Shopify...");
    const tokenResponse = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code: code
      })
    })

    // Lê o corpo uma única vez para evitar "Body already consumed"
    const rawTokenBody = await tokenResponse.text();
    let tokenData: any = null;
    try {
      tokenData = JSON.parse(rawTokenBody);
    } catch (parseErr) {
      console.error("Erro ao parsear tokenResponse da Shopify:", rawTokenBody);
      throw new Error(`Shopify access_token response inválida (status ${tokenResponse.status}): ${rawTokenBody}`);
    }
    
    if (!tokenData.access_token) {
      console.error("Erro Shopify:", JSON.stringify(tokenData));
      throw new Error('Shopify recusou o código: ' + JSON.stringify(tokenData))
    }

    // 4. Salvar no Banco
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const nowIso = new Date().toISOString();
    // Buscar dados da loja para obter email/nome
    let shopEmail = "";
    let shopName = shop;
    try {
      const shopResp = await fetch(`https://${shop}/admin/api/2024-07/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": tokenData.access_token,
          "Content-Type": "application/json",
        },
      });
      if (shopResp.ok) {
        const shopPayload = await shopResp.json();
        const shopData = shopPayload?.shop;
        shopEmail = shopData?.customer_email ?? shopData?.email ?? "";
        shopName = shopData?.name ?? shopName;
      } else {
        console.warn("shopify-callback: shop.json falhou", shopResp.status);
      }
    } catch (shopErr) {
      console.warn("shopify-callback: erro ao buscar shop.json:", shopErr);
    }

    // Resolver/garantir usuário em auth.users
    const userEmail = shopEmail || `${shop}@no-email.shop`;
    const tempPassword = crypto.randomUUID();
    let resolvedUserId: string | null = isUuid(state) ? state : null;

    // Helper para buscar usuário existente por email
    const findUserByEmail = async (email: string): Promise<string | null> => {
      // Tenta buscar em clients primeiro
      const { data: clientMatch } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (clientMatch?.id) return clientMatch.id as string;

      // Tenta buscar em users
      const { data: userMatch } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (userMatch?.id) return userMatch.id as string;

      // Tenta buscar via auth.admin.listUsers
      const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = listed?.users?.find(
        (u: any) => (u.email || "").toLowerCase() === email.toLowerCase()
      );
      return found?.id ?? null;
    };

    if (resolvedUserId) {
      const { data: existingUser } = await supabase.auth.admin.getUserById(resolvedUserId);
      if (existingUser?.user) {
        const { error: updateUserError } = await supabase.auth.admin.updateUserById(resolvedUserId, {
          email: userEmail,
          user_metadata: { client_id: resolvedUserId, nome: shopName },
        });
        if (updateUserError) {
          console.error("Erro ao atualizar usuário em auth:", updateUserError);
          throw updateUserError;
        }
      } else {
        const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
          email: userEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { client_id: resolvedUserId, nome: shopName },
        });
        if (createUserError) {
          // Se o erro é "already registered", tenta buscar o usuário existente
          if (createUserError.message?.toLowerCase().includes("already been registered")) {
            const existingId = await findUserByEmail(userEmail);
            if (existingId) {
              resolvedUserId = existingId;
              console.log(`Usuário já existe, usando ID existente: ${existingId}`);
            } else {
              console.error("Erro ao criar usuário em auth:", createUserError);
              throw createUserError;
            }
          } else {
            console.error("Erro ao criar usuário em auth:", createUserError);
            throw createUserError;
          }
        } else {
          resolvedUserId = createdUser?.user?.id ?? resolvedUserId;
        }
      }
    } else {
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { nome: shopName },
      });
      if (createUserError) {
        // Se o erro é "already registered", tenta buscar o usuário existente
        if (createUserError.message?.toLowerCase().includes("already been registered")) {
          const existingId = await findUserByEmail(userEmail);
          if (existingId) {
            resolvedUserId = existingId;
            console.log(`Usuário já existe, usando ID existente: ${existingId}`);
          } else {
            console.error("Erro ao criar usuário em auth (novo):", createUserError);
            throw createUserError;
          }
        } else {
          console.error("Erro ao criar usuário em auth (novo):", createUserError);
          throw createUserError;
        }
      } else {
        resolvedUserId = createdUser?.user?.id ?? null;
      }
    }

    if (!resolvedUserId) {
      throw new Error("Não foi possível resolver o user_id para vincular ao client.");
    }

    // Verifica se o client já existe para determinar se é criação ou atualização
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, created_at')
      .eq('id', resolvedUserId)
      .maybeSingle();

    const isNewClient = !existingClient;
    const clientData: any = {
      id: resolvedUserId,
      email: userEmail,
      nome: shopName,
      nome_empresa: shopName,
      shopify_store_name: shop, 
      shopify_access_token: tokenData.access_token,
      shopify_connected_at: nowIso,
      shopify_status: 'active',
      updated_at: nowIso, // Sempre atualiza o updated_at
    };

    // Se é um novo client, seta o created_at
    if (isNewClient) {
      clientData.created_at = nowIso;
    }

    const { data: clientRow, error: dbError } = await supabase
      .from('clients')
      .upsert(clientData, { onConflict: 'id' })
      .select('id, created_at, updated_at')
      .maybeSingle()

    if (dbError) {
      console.error("Erro DB ao salvar client:", dbError);
      throw dbError;
    }
    
    if (clientRow) {
      console.log(`✅ Client ${isNewClient ? 'criado' : 'atualizado'} com sucesso:`, {
        id: clientRow.id,
        shop: shop,
        created_at: clientRow.created_at,
        updated_at: clientRow.updated_at
      });
    } else {
      console.warn("⚠️ Client upsert retornou null");
    }

    // Verifica se o user já existe para determinar se é criação ou atualização
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('id', resolvedUserId)
      .maybeSingle();

    const isNewUser = !existingUser;
    const userData: any = {
      id: resolvedUserId,
      email: userEmail,
      nome: shopName,
      client_id: resolvedUserId,
      user_level: 'admin',
      updated_at: nowIso, // Sempre atualiza o updated_at
    };

    // Se é um novo user, seta o created_at
    if (isNewUser) {
      userData.created_at = nowIso;
    }

    // Upsert em users para vincular o client recém-criado
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select('id, created_at, updated_at')
      .maybeSingle();

    if (userError) {
      console.error("Erro ao upsert users:", userError);
      throw userError;
    }
    
    if (userRow) {
      console.log(`✅ User ${isNewUser ? 'criado' : 'atualizado'} com sucesso:`, {
        id: userRow.id,
        email: userEmail,
        client_id: resolvedUserId,
        created_at: userRow.created_at,
        updated_at: userRow.updated_at
      });
    } else {
      console.warn("⚠️ User upsert retornou null");
    }

    // Garantir que o usuário tenha uma senha temporária para login automático no app embed
    // Isso é crítico para manter o usuário logado após a instalação
    // Primeiro, atualiza metadados e email
    const { error: updateError } = await supabase.auth.admin.updateUserById(resolvedUserId, {
      email: userEmail,
      user_metadata: { 
        client_id: resolvedUserId, 
        nome: shopName,
        shopify_store: shop 
      },
    });
    
    if (updateError) {
      console.warn("Aviso ao atualizar metadados do usuário:", updateError);
    }
    
    // Gera um link de magic link que pode ser usado para login automático
    // Isso é mais confiável que senha temporária
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://app.chargemind.io'}/auth/callback`,
      }
    });
    
    let magicLink = null;
    if (!linkError && linkData?.properties?.action_link) {
      magicLink = linkData.properties.action_link;
      console.log(`Link de magic link gerado para usuário ${resolvedUserId}`);
    } else {
      console.warn("Não foi possível gerar magic link, usando senha temporária:", linkError);
      
      // Fallback: tenta atualizar senha temporária
      const { error: passwordError } = await supabase.auth.admin.updateUserById(resolvedUserId, {
        password: tempPassword,
      });
      
      if (passwordError) {
        console.error("ERRO CRÍTICO: Não foi possível atualizar senha temporária:", passwordError);
        // Tenta novamente após um pequeno delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const { error: retryError } = await supabase.auth.admin.updateUserById(resolvedUserId, {
          password: tempPassword,
        });
        if (retryError) {
          console.error("ERRO: Falha ao atualizar senha mesmo após retry:", retryError);
        } else {
          console.log(`Senha temporária atualizada após retry para usuário ${resolvedUserId}`);
        }
      } else {
        console.log(`Senha temporária atualizada com sucesso para usuário ${resolvedUserId}`);
      }
    }
    
    // Aguarda um momento para garantir que as mudanças foram propagadas
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Retorna Sucesso
    return new Response(JSON.stringify({ 
      success: true, 
      shop, 
      client_id: clientRow?.id ?? resolvedUserId,
      user_id: resolvedUserId,
      email: userEmail,
      temp_password: tempPassword, // Mantém para compatibilidade
      magic_link: magicLink, // Link de magic link para login automático
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("Erro Geral na Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})