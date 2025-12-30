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
    // Autenticar usuário que está fazendo a requisição
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização necessária");
    }

    const token = authHeader.replace(/Bearer\s+/i, "").trim();
    if (!token) {
      throw new Error("Token de autenticação inválido");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Cliente para verificar o usuário autenticado
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Verificar se o usuário é admin
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('client_id, user_level')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      throw new Error("Erro ao buscar dados do usuário");
    }

    if (currentUser.user_level !== 'admin' && currentUser.user_level !== 'owner') {
      throw new Error("Apenas administradores e proprietários podem adicionar usuários");
    }

    if (!currentUser.client_id) {
      throw new Error("Empresa não vinculada");
    }

    // Obter dados do corpo da requisição
    const { nome, email, user_level } = await req.json();

    if (!nome || !email) {
      throw new Error("Nome e email são obrigatórios");
    }

    console.log("Criando novo usuário:", { nome, email, user_level });

    // Cliente com service role para criar usuário
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    // Criar usuário no auth (isso vai acionar o trigger)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nome: nome,
        client_id: currentUser.client_id,
        user_level: user_level || 'user',
      },
    });

    if (authError) {
      console.error("Erro ao criar usuário no auth:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Falha ao criar usuário");
    }

    console.log("Usuário criado no auth:", authData.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função create-team-member:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
