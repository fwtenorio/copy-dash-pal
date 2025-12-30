import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ClientRow = {
  id: string;
  shopify_store_name: string | null;
  shopify_access_token: string | null;
  shopify_status: string | null;
};

async function sendEmailResend(apiKey: string, to: string, subject: string, text: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "charge-mind.lovable.app",
      to: [to],
      subject,
      text,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.warn("Falha ao enviar email:", resp.status, body);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL ou SERVICE_ROLE ausentes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Buscar clientes com Shopify conectada E ativa (não pausada)
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from("clients")
      .select("id, shopify_store_name, shopify_access_token, shopify_status")
      .not("shopify_connected_at", "is", null);

    if (clientsError) {
      throw clientsError;
    }

    let processed = 0;
    let notified = 0;

    for (const client of (clients || []) as ClientRow[]) {
      processed++;
      const shopNameRaw = client.shopify_store_name?.trim();
      const accessToken = client.shopify_access_token?.trim();
      const status = client.shopify_status;
      
      if (!shopNameRaw || !accessToken) {
        continue;
      }

      // Skip paused integrations
      if (status === 'paused') {
        console.log(`Skipping client ${client.id} - integration is paused`);
        continue;
      }

      let shopUrl = shopNameRaw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      if (!shopUrl.includes(".myshopify.com")) {
        shopUrl = `${shopUrl}.myshopify.com`;
      }

      // Obter disputas da Shopify
      let disputesCount = 0;
      try {
        const resp = await fetch(
          `https://${shopUrl}/admin/api/2024-01/shopify_payments/disputes.json?limit=250`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          },
        );
        if (resp.ok) {
          const body = await resp.json();
          disputesCount = Array.isArray(body?.disputes) ? body.disputes.length : 0;
        } else {
          console.warn("Shopify disputes status", resp.status, "para client", client.id);
        }
      } catch (err) {
        console.warn("Erro ao consultar disputas Shopify para", client.id, err);
      }

      // Ler valor anterior
      const { data: notif, error: notifErr } = await supabaseAdmin
        .from("notification_settings")
        .select("id, disputas_qnt")
        .eq("client_id", client.id)
        .maybeSingle();

      const prev = notif?.disputas_qnt ?? 0;

      // Atualizar disputas_qnt com o valor da API
      const { error: updateErr } = await supabaseAdmin
        .from("notification_settings")
        .upsert(
          {
            client_id: client.id,
            disputas_qnt: disputesCount,
          },
          { onConflict: "client_id" },
        );
      if (updateErr) {
        console.warn("Erro ao atualizar notification_settings para", client.id, updateErr);
        continue;
      }

      // Notificar se houve aumento
      if (disputesCount > prev) {
        notified++;
        if (resendKey) {
          await sendEmailResend(resendKey, "fwtenorio@gmail.com", "Nova disputa!!!", "Nova disputa!!!");
        } else {
          console.warn("RESEND_API_KEY ausente; não foi possível enviar email.");
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, notified }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro na função cron-shopify-disputes:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

