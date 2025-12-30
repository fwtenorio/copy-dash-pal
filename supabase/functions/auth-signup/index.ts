import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

type SignupPayload = {
  email?: string;
  password?: string;
  nome?: string;
  nome_empresa?: string;
  telefone?: string;
};

serve(async (req) => {
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
    const {
      email,
      password,
      nome,
      nome_empresa,
      telefone,
    }: SignupPayload = await req.json().catch(() => ({}));

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const safePassword = typeof password === "string" ? password.trim() : "";

    if (!normalizedEmail || !safePassword) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do Supabase ausente" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1) Validação de email duplicado na tabela users
    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError;
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email já está em uso" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2) Criação do usuário no Auth (trigger handle_new_user cria clients e users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: safePassword,
      email_confirm: true,
      user_metadata: {
        nome: nome?.trim() || normalizedEmail,
        nome_empresa: nome_empresa?.trim(),
        telefone: telefone?.trim(),
      },
    });

    if (authError || !authData?.user) {
      throw authError ?? new Error("Não foi possível criar o usuário");
    }

    const userId = authData.user.id;

    // 3) Buscar registros criados pelas triggers para retornar client_id e dados básicos
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id, email, nome, nome_empresa, telefone, language")
      .eq("id", userId)
      .single();

    if (clientError) {
      throw clientError;
    }

    const { data: userRecord, error: userRecordError } = await supabaseAdmin
      .from("users")
      .select("id, client_id, email, nome, user_level")
      .eq("id", userId)
      .single();

    if (userRecordError) {
      throw userRecordError;
    }

    return new Response(
      JSON.stringify({
        user: userRecord,
        client,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro na função auth-signup:", error);

    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
