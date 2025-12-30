import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { shop, email, user_id } = body;

    if (!shop || !email || !user_id) {
      throw new Error("Parâmetros 'shop', 'email' ou 'user_id' faltando.");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Gerando magic link para login automático: shop=${shop}, email=${email}, user_id=${user_id}`);

    // Gera um link de magic link para login automático
    // O redirectTo deve apontar para o frontend de produção
    // Usa URL fixa de produção para evitar problemas com localhost
    const appUrl = 'https://app.chargemind.io';
    const redirectUrl = `${appUrl}/auth/callback?shop=${encodeURIComponent(shop)}&auto_login=true`;
    
    console.log(`Usando redirectTo: ${redirectUrl}`);
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Erro ao gerar magic link:", linkError);
      throw new Error(linkError?.message || "Não foi possível gerar magic link");
    }

    const magicLink = linkData.properties.action_link;
    console.log("✅ Magic link gerado com sucesso");

    return new Response(JSON.stringify({ 
      success: true, 
      magic_link: magicLink,
      email: email,
      shop: shop
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

