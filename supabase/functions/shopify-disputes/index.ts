import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type MappedDispute = {
  id: string;
  orderId?: string | number | null;
  type?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  reason?: string | null;
  status?: string | null;
  evidenceDueBy?: string | null;
  initiatedAt?: string | null;
};

function mapShopifyDisputeToApp(dispute: any): MappedDispute {
  return {
    id: String(dispute?.id ?? ""),
    orderId: dispute?.order_id ?? null,
    type: dispute?.type ?? null,
    amount: dispute?.amount ?? null,
    currency: dispute?.currency ?? null,
    reason: dispute?.reason ?? null,
    status: dispute?.status ?? null,
    evidenceDueBy: dispute?.evidence_due_by ?? null,
    initiatedAt: dispute?.initiated_at ?? null,
  };
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
console.log("=== SHOPIFY DISPUTES FUNCTION v2.0 LOADED ===");

function getNextUrlFromLink(link?: string | null): string | null {
  if (!link) return null;
  const nextPart = link.split(",").find((p) => p.includes('rel="next"'));
  if (!nextPart) return null;
  const m = nextPart.match(/<([^>]+)>/);
  return m ? m[1] : null;
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAllJsonPages<T = any>(
  startUrl: string,
  headers: Record<string, string>,
  // extractor: caminho do array dentro do JSON (ex.: "orders" | "disputes")
  arrayKey: keyof T,
): Promise<any[]> {
  const all: any[] = [];
  let url: string | null = startUrl;

  while (url) {
    let attempts = 0;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const txt = await res.text();
        // Se for 429, respeitar rate limit da Shopify (2 rps) com pequeno atraso e retry
        if (res.status === 429) {
          attempts += 1;
          if (attempts > 5) {
            throw new Error(`429 excedeu tentativas: ${txt}`);
          }
          const backoff = 1200 * attempts; // aumenta a cada tentativa
          console.warn(`Rate limit 429 recebido, aguardando ${backoff}ms para retry...`);
          await sleep(backoff);
          continue;
        }
        throw new Error(`${res.status} ${txt}`);
      }

      const data = await res.json();
      const chunk = (data?.[arrayKey as string] as any[]) ?? [];

      all.push(...chunk);
      // Aguardar um pouco entre páginas para não estourar 2 rps
      await sleep(1200);
      url = getNextUrlFromLink(res.headers.get("Link"));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Request timeout:", url);
        throw new Error("Request timeout - API demorou muito para responder");
      }
      // Se for rate limit detectado na mensagem, tenta novamente com backoff
      const msg = String((error as Error)?.message ?? "");
      if (msg.startsWith("429")) {
        attempts += 1;
        if (attempts > 5) {
          throw new Error(`429 excedeu tentativas (mensagem): ${msg}`);
        }
        const backoff = 1200 * attempts;
        console.warn(`Rate limit 429 (mensagem). Aguardando ${backoff}ms para retry...`);
        await sleep(backoff);
        continue;
      }
      throw error;
    }
  }
  return all;
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Configuração do Supabase ausente");
    }

    // Cliente para autenticação do usuário (usa token recebido)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Cliente com service role para acessar credenciais do cliente (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Erro ao obter usuário:", userError);
      throw new Error("Usuário não autenticado");
    }

    // Buscar client_id do usuário na tabela users (service role para evitar RLS)
    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRowError) {
      console.error("Erro ao buscar usuário:", userRowError);
      throw new Error("Erro ao buscar dados do usuário");
    }

    if (!userRow || !userRow.client_id) {
      throw new Error("Usuário não vinculado a uma empresa. Por favor, configure sua empresa nas configurações.");
    }

    const clientId = userRow.client_id;

    // Buscar dados da Shopify do cliente usando o client_id (service role)
    // Ler body da requisição
    const body = await req.json().catch(() => ({}));
    const { startDate, endDate, shop } = body;

    const normalizeShop = (raw?: string | null): string => {
      if (!raw) return "";
      let s = raw.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      if (!s.includes(".myshopify.com")) {
        s = `${s}.myshopify.com`;
      }
      return s;
    };

    // Buscar cliente padrão do usuário
    let resolvedClientId = clientId;
    let clientData = await supabaseAdmin
      .from("clients")
      .select("id, shopify_store_name, shopify_access_token, shopify_connected_at")
      .eq("id", clientId)
      .maybeSingle();

    if (clientData.error) {
      console.error("Erro ao buscar dados do cliente:", clientData.error);
      throw new Error("Erro ao buscar dados da empresa");
    }

    // Se foi passado um shop no body, tentar resolver o cliente por ele (multi-tenant)
    if (shop) {
      const normalizedShop = normalizeShop(shop);
      const { data: shopClient, error: shopErr } = await supabaseAdmin
        .from("clients")
        .select("id, shopify_store_name, shopify_access_token, shopify_connected_at")
        .ilike("shopify_store_name", normalizedShop)
        .maybeSingle();
      if (shopErr) {
        console.error("Erro ao buscar cliente pelo shop:", shopErr);
        throw new Error("Erro ao buscar empresa pelo domínio informado.");
      }
      if (!shopClient) {
        throw new Error("Empresa não encontrada para o shop informado.");
      }
      clientData = { data: shopClient, error: null } as any;
      resolvedClientId = shopClient.id;
    }

    const client = clientData.data;
    if (!client) {
      throw new Error("Empresa não encontrada. Por favor, configure sua empresa nas configurações.");
    }

    let shopifyStoreUrl = client.shopify_store_name || "";
    shopifyStoreUrl = normalizeShop(shopifyStoreUrl);
    const shopifyAccessToken = client.shopify_access_token || "";
    const shopifyConnectedAt = client.shopify_connected_at
      ? new Date(client.shopify_connected_at)
      : null;

    if (!shopifyStoreUrl || !shopifyAccessToken) {
      throw new Error(
        "Credenciais da Shopify não configuradas. Por favor, configure a integração Shopify nas configurações.",
      );
    }

    console.log("=== DATAS RECEBIDAS ===");
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    // Normaliza domínio da loja: remove http/https e barras finais
    shopifyStoreUrl = shopifyStoreUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");

    // Se não tiver .myshopify.com, adiciona
    if (!shopifyStoreUrl.includes(".myshopify.com")) {
      shopifyStoreUrl = `${shopifyStoreUrl}.myshopify.com`;
    }

    const apiVersion = "2024-01";
    const headers = {
      "X-Shopify-Access-Token": shopifyAccessToken,
      "Content-Type": "application/json",
    };
    let disputesData: any[] = [];
    let mappedDisputes: any[] = [];
    const disputesUrl = `https://${shopifyStoreUrl}/admin/api/${apiVersion}/shopify_payments/disputes.json?limit=250`;
    try {
      console.log("CAIU NA CONSULTA");
      disputesData = await fetchAllJsonPages(disputesUrl, headers, "disputes");
      mappedDisputes = (disputesData || []).map((d: any) => mapShopifyDisputeToApp(d));

      // Persist mapped disputes (best-effort)
      try {
        const mappedForDb = mappedDisputes.map((d: any) => ({
          ...d,
          shopify_dispute_id: d.id,
          client_id: resolvedClientId,
          shop_domain: shopifyStoreUrl,
        }));
        const { error: upsertError } = await supabaseAdmin
          .from("disputes")
          .upsert(mappedForDb, { onConflict: "shopify_dispute_id" });
        if (upsertError) {
          console.error("Failed to upsert mapped disputes:", upsertError.message);
        }
      } catch (dbErr) {
        console.error("Unexpected error while upserting mapped disputes:", dbErr);
      }
    } catch (e) {
      // 401/404: loja sem Shopify Payments ou sem escopo → trata como "sem disputas"
      const msg = String((e as Error)?.message ?? "");
      if (msg.startsWith("401") || msg.startsWith("404")) {
        console.warn("Sem acesso a disputes (401/404). Continuando com lista vazia.");
        disputesData = [];
      } else {
        throw e;
      }
    }

    // Buscar informações de pedidos relacionados
    let ordersData: any[] = [];
    const ordersUrl = `https://${shopifyStoreUrl}/admin/api/${apiVersion}/orders.json?status=any&limit=250`;
    try {
      ordersData = await fetchAllJsonPages(ordersUrl, headers, "orders");
    } catch (e) {
      // 401/404: loja sem Shopify Payments ou sem escopo → trata como "sem disputas"
      const msg = String((e as Error)?.message ?? "");
      if (msg.startsWith("401") || msg.startsWith("404")) {
        console.warn("Sem acesso a orders (401/404). Continuando com lista vazia.");
        ordersData = [];
      } else {
        throw e;
      }
    }

    // Buscar taxas de câmbio
    const exchangeRatesResponse = await fetch("https://api.frankfurter.app/latest?from=USD");
    const exchangeRatesData = await exchangeRatesResponse.json();
    const exchangeRates = exchangeRatesData.rates || {};

    const disp = {
      disputes: [
        {
          id: 9424470222,
          order_id: 4630516760782,
          type: "chargeback",
          amount: "87.00",
          currency: "USD",
          reason: "product_not_received",
          network_reason_code: null,
          status: "needs_response",
          evidence_due_by: "2025-11-27T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-17T18:06:58-03:00",
        },
        {
          id: 9424109774,
          order_id: 4627806159054,
          type: "chargeback",
          amount: "79.68",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "needs_response",
          evidence_due_by: "2025-11-27T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-17T03:01:09-03:00",
        },
        {
          id: 9424044238,
          order_id: 4622582579406,
          type: "chargeback",
          amount: "122.66",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "needs_response",
          evidence_due_by: "2025-11-27T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-17T02:12:31-03:00",
        },
        {
          id: 9423847630,
          order_id: 4632305565902,
          type: "chargeback",
          amount: "72.79",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "needs_response",
          evidence_due_by: "2025-11-26T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-16T16:38:30-03:00",
        },
        {
          id: 9423716558,
          order_id: 4633376129230,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-12-01T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-16T09:34:08-03:00",
        },
        {
          id: 9422897358,
          order_id: 4629691236558,
          type: "chargeback",
          amount: "52.49",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-25T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-15T06:49:11-03:00",
        },
        {
          id: 9422274766,
          order_id: 4634414088398,
          type: "chargeback",
          amount: "112.28",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-29T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-14T21:24:51-03:00",
        },
        {
          id: 9421914318,
          order_id: 4631545184462,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-29T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-14T13:43:33-03:00",
        },
        {
          id: 9421848782,
          order_id: 4634414088398,
          type: "chargeback",
          amount: "34.93",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-29T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-14T11:30:33-03:00",
        },
        {
          id: 9421717710,
          order_id: 4629230092494,
          type: "chargeback",
          amount: "59.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-24T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-14T09:35:21-03:00",
        },
        {
          id: 9421422798,
          order_id: 4626288705742,
          type: "chargeback",
          amount: "54.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "needs_response",
          evidence_due_by: "2025-12-23T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-14T00:00:05-03:00",
        },
        {
          id: 9421291726,
          order_id: 4627683246286,
          type: "chargeback",
          amount: "74.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "needs_response",
          evidence_due_by: "2025-12-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-13T23:42:17-03:00",
        },
        {
          id: 9421029582,
          order_id: 4628990427342,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-28T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-13T17:23:08-03:00",
        },
        {
          id: 9420964046,
          order_id: 4621470662862,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-28T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-13T16:47:14-03:00",
        },
        {
          id: 9420734670,
          order_id: 4624005267662,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "needs_response",
          evidence_due_by: "2025-11-28T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-13T11:35:53-03:00",
        },
        {
          id: 9420341454,
          order_id: 4626899304654,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "needs_response",
          evidence_due_by: "2025-12-21T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T23:52:29-03:00",
        },
        {
          id: 9420210382,
          order_id: 4627803668686,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "needs_response",
          evidence_due_by: "2025-12-21T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T23:44:03-03:00",
        },
        {
          id: 9419948238,
          order_id: 4629351661774,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-27T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T20:53:06-03:00",
        },
        {
          id: 9419686094,
          order_id: 4629791310030,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-22T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T15:36:48-03:00",
        },
        {
          id: 9419161806,
          order_id: 4626920669390,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "4554",
          status: "under_review",
          evidence_due_by: "2025-11-27T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T04:45:42-03:00",
        },
        {
          id: 9419129038,
          order_id: 4626991120590,
          type: "chargeback",
          amount: "67.85",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "4554",
          status: "under_review",
          evidence_due_by: "2025-11-27T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T04:45:41-03:00",
        },
        {
          id: 9419194574,
          order_id: 4629231239374,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "4554",
          status: "under_review",
          evidence_due_by: "2025-11-27T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T04:45:32-03:00",
        },
        {
          id: 9419096270,
          order_id: 4617716400334,
          type: "chargeback",
          amount: "40.89",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4553",
          status: "needs_response",
          evidence_due_by: "2025-11-27T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-12T04:45:10-03:00",
        },
        {
          id: 9418604750,
          order_id: 4621633650894,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "needs_response",
          evidence_due_by: "2025-11-26T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-11T21:21:43-03:00",
        },
        {
          id: 9418506446,
          order_id: 4629393866958,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-26T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-11T18:56:42-03:00",
        },
        {
          id: 9418277070,
          order_id: 4626881446094,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "needs_response",
          evidence_due_by: "2025-12-20T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-11T00:23:44-03:00",
        },
        {
          id: 9416802510,
          order_id: 4631736418510,
          type: "chargeback",
          amount: "84.81",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-19T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-09T12:56:43-03:00",
        },
        {
          id: 9416376526,
          order_id: 4629180022990,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-23T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-08T19:01:40-03:00",
        },
        {
          id: 9416278222,
          order_id: 4634576879822,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-23T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-08T17:21:33-03:00",
        },
        {
          id: 9416212686,
          order_id: 4628980629710,
          type: "inquiry",
          amount: "119.00",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-27T16:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-08T16:02:02-03:00",
        },
        {
          id: 9415753934,
          order_id: 4627019890894,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "needs_response",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-08T04:26:56-03:00",
        },
        {
          id: 9415131342,
          order_id: 4621321797838,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T21:27:15-03:00",
        },
        {
          id: 9414836430,
          order_id: 4620591792334,
          type: "chargeback",
          amount: "115.18",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "needs_response",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T13:53:58-03:00",
        },
        {
          id: 9414803662,
          order_id: 4629276786894,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T13:50:05-03:00",
        },
        {
          id: 9414738126,
          order_id: 4629716730062,
          type: "chargeback",
          amount: "94.73",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T12:54:02-03:00",
        },
        {
          id: 9414672590,
          order_id: 4629073625294,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T10:35:15-03:00",
        },
        {
          id: 9414639822,
          order_id: 4629285535950,
          type: "chargeback",
          amount: "62.89",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-11-17T01:00:00-03:00",
          evidence_sent_on: "2025-11-17T03:26:18-03:00",
          finalized_on: null,
          initiated_at: "2025-11-07T08:38:22-03:00",
        },
        {
          id: 9414508750,
          order_id: 4629172912334,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "4554",
          status: "under_review",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T05:08:22-03:00",
        },
        {
          id: 9414475982,
          order_id: 4632087527630,
          type: "chargeback",
          amount: "94.73",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "4554",
          status: "under_review",
          evidence_due_by: "2025-11-22T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-07T05:08:12-03:00",
        },
        {
          id: 9413722318,
          order_id: 4629199814862,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-21T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-06T08:54:39-03:00",
        },
        {
          id: 9413656782,
          order_id: 4629761032398,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-20T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-06T02:40:08-03:00",
        },
        {
          id: 9412935886,
          order_id: 4627153617102,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-20T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-05T15:37:52-03:00",
        },
        {
          id: 9412837582,
          order_id: 4626928632014,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-20T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-05T13:03:04-03:00",
        },
        {
          id: 9411920078,
          order_id: 4628338606286,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-19T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-04T17:30:56-03:00",
        },
        {
          id: 9411854542,
          order_id: 4622002553038,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "under_review",
          evidence_due_by: "2025-11-19T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-04T16:29:25-03:00",
        },
        {
          id: 9411592398,
          order_id: 4628328480974,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-11-14T01:00:00-03:00",
          evidence_sent_on: "2025-11-14T04:57:39-03:00",
          finalized_on: null,
          initiated_at: "2025-11-04T08:04:06-03:00",
        },
        {
          id: 9411526862,
          order_id: 4629267349710,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-14T01:00:00-03:00",
          evidence_sent_on: "2025-11-14T05:35:18-03:00",
          finalized_on: null,
          initiated_at: "2025-11-04T04:00:54-03:00",
        },
        {
          id: 9411363022,
          order_id: 4629780955342,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-18T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-04T00:25:03-03:00",
        },
        {
          id: 9411330254,
          order_id: 4631450648782,
          type: "chargeback",
          amount: "99.14",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-12T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-04T00:16:17-03:00",
        },
        {
          id: 9411297486,
          order_id: 4624833151182,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-13T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-04T00:15:13-03:00",
        },
        {
          id: 9411199182,
          order_id: 4621502906574,
          type: "chargeback",
          amount: "50.32",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-12T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-04T00:06:53-03:00",
        },
        {
          id: 9411002574,
          order_id: 4619819876558,
          type: "chargeback",
          amount: "53.52",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-12T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-03T23:58:59-03:00",
        },
        {
          id: 9414541518,
          order_id: 4631266820302,
          type: "chargeback",
          amount: "52.20",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-17T01:00:00-03:00",
          evidence_sent_on: "2025-11-17T06:16:40-03:00",
          finalized_on: null,
          initiated_at: "2025-11-03T15:05:39-03:00",
        },
        {
          id: 9410871502,
          order_id: 4631173431502,
          type: "chargeback",
          amount: "52.20",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-13T01:00:00-03:00",
          evidence_sent_on: "2025-11-13T04:09:13-03:00",
          finalized_on: null,
          initiated_at: "2025-11-03T15:03:00-03:00",
        },
        {
          id: 9410838734,
          order_id: 4629094039758,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-18T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-11-03T14:46:52-03:00",
        },
        {
          id: 9410412750,
          order_id: 4629127921870,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-12T01:00:00-03:00",
          evidence_sent_on: "2025-11-12T05:42:49-03:00",
          finalized_on: null,
          initiated_at: "2025-11-02T19:19:10-03:00",
        },
        {
          id: 9410379982,
          order_id: 4629209972942,
          type: "chargeback",
          amount: "52.79",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-12T01:00:00-03:00",
          evidence_sent_on: "2025-11-12T03:34:44-03:00",
          finalized_on: null,
          initiated_at: "2025-11-02T18:23:23-03:00",
        },
        {
          id: 9410117838,
          order_id: 4632299700430,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-12T01:00:00-03:00",
          evidence_sent_on: "2025-11-12T07:27:12-03:00",
          finalized_on: null,
          initiated_at: "2025-11-02T13:31:22-03:00",
        },
        {
          id: 9410052302,
          order_id: 4632105287886,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-12T01:00:00-03:00",
          evidence_sent_on: "2025-11-12T07:19:20-03:00",
          finalized_on: null,
          initiated_at: "2025-11-02T12:55:21-03:00",
        },
        {
          id: 9409921230,
          order_id: 4626934595790,
          type: "chargeback",
          amount: "84.00",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-12T01:00:00-03:00",
          evidence_sent_on: "2025-11-12T07:13:12-03:00",
          finalized_on: null,
          initiated_at: "2025-11-02T09:20:47-03:00",
        },
        {
          id: 9409003726,
          order_id: 4628407124174,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-16T20:00:00-03:00",
          evidence_sent_on: "2025-11-17T03:26:05-03:00",
          finalized_on: null,
          initiated_at: "2025-11-01T12:05:53-03:00",
        },
        {
          id: 9408938190,
          order_id: 4632994939086,
          type: "chargeback",
          amount: "83.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-11T01:00:00-03:00",
          evidence_sent_on: "2025-11-11T06:38:01-03:00",
          finalized_on: null,
          initiated_at: "2025-11-01T10:53:25-03:00",
        },
        {
          id: 9408807118,
          order_id: 4628508934350,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-16T20:00:00-03:00",
          evidence_sent_on: "2025-11-17T02:04:04-03:00",
          finalized_on: null,
          initiated_at: "2025-11-01T08:09:58-03:00",
        },
        {
          id: 9407889614,
          order_id: 4635048247502,
          type: "chargeback",
          amount: "89.82",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-10T01:00:00-03:00",
          evidence_sent_on: "2025-11-10T04:36:24-03:00",
          finalized_on: null,
          initiated_at: "2025-10-31T17:57:17-03:00",
        },
        {
          id: 9407824078,
          order_id: 4632104042702,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-15T20:00:00-03:00",
          evidence_sent_on: "2025-11-16T03:48:58-03:00",
          finalized_on: null,
          initiated_at: "2025-10-31T17:22:51-03:00",
        },
        {
          id: 9412640974,
          order_id: 4632144117966,
          type: "chargeback",
          amount: "94.73",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-15T01:00:00-03:00",
          evidence_sent_on: "2025-11-15T06:08:56-03:00",
          finalized_on: null,
          initiated_at: "2025-10-31T16:28:53-03:00",
        },
        {
          id: 9407693006,
          order_id: 4626934563022,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-15T20:00:00-03:00",
          evidence_sent_on: "2025-11-16T05:59:43-03:00",
          finalized_on: null,
          initiated_at: "2025-10-31T16:02:51-03:00",
        },
        {
          id: 9412575438,
          order_id: 4630472097998,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-15T01:00:00-03:00",
          evidence_sent_on: "2025-11-15T03:22:06-03:00",
          finalized_on: null,
          initiated_at: "2025-10-31T11:14:18-03:00",
        },
        {
          id: 9407561934,
          order_id: 4627643531470,
          type: "inquiry",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-19T09:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-10-31T09:27:02-03:00",
        },
        {
          id: 9407168718,
          order_id: 4619996233934,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-08T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-10-30T23:31:09-03:00",
        },
        {
          id: 9406709966,
          order_id: 4616765472974,
          type: "chargeback",
          amount: "70.89",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "under_review",
          evidence_due_by: "2025-11-14T20:00:00-03:00",
          evidence_sent_on: "2025-11-15T06:50:44-03:00",
          finalized_on: null,
          initiated_at: "2025-10-30T16:13:53-03:00",
        },
        {
          id: 9406480590,
          order_id: 4629288452302,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-11-14T20:00:00-03:00",
          evidence_sent_on: "2025-11-15T06:54:47-03:00",
          finalized_on: null,
          initiated_at: "2025-10-30T13:42:00-03:00",
        },
        {
          id: 9405628622,
          order_id: 4635185381582,
          type: "chargeback",
          amount: "59.87",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-07T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-10-29T23:48:09-03:00",
        },
        {
          id: 9411494094,
          order_id: 4629930148046,
          type: "chargeback",
          amount: "52.79",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-14T01:00:00-03:00",
          evidence_sent_on: "2025-11-14T04:37:52-03:00",
          finalized_on: null,
          initiated_at: "2025-10-29T17:12:22-03:00",
        },
        {
          id: 9405071566,
          order_id: 4619910119630,
          type: "chargeback",
          amount: "87.73",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "under_review",
          evidence_due_by: "2025-11-13T20:00:00-03:00",
          evidence_sent_on: "2025-11-14T03:19:33-03:00",
          finalized_on: null,
          initiated_at: "2025-10-29T14:31:51-03:00",
        },
        {
          id: 9404940494,
          order_id: 4631525785806,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-13T20:00:00-03:00",
          evidence_sent_on: "2025-11-14T05:01:17-03:00",
          finalized_on: "2025-11-17T08:55:03-03:00",
          initiated_at: "2025-10-29T09:18:33-03:00",
        },
        {
          id: 9404907726,
          order_id: 4633756434638,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-08T01:00:00-03:00",
          evidence_sent_on: "2025-11-08T02:38:49-03:00",
          finalized_on: null,
          initiated_at: "2025-10-29T04:52:16-03:00",
        },
        {
          id: 9404711118,
          order_id: 4626923946190,
          type: "chargeback",
          amount: "62.88",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-12-06T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-10-28T23:54:28-03:00",
        },
        {
          id: 9404514510,
          order_id: 4628396671182,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-07T01:00:00-03:00",
          evidence_sent_on: "2025-11-07T02:11:54-03:00",
          finalized_on: null,
          initiated_at: "2025-10-28T19:19:18-03:00",
        },
        {
          id: 9404448974,
          order_id: 4623977808078,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-11-07T01:00:00-03:00",
          evidence_sent_on: "2025-11-07T03:06:54-03:00",
          finalized_on: "2025-11-10T03:33:05-03:00",
          initiated_at: "2025-10-28T18:14:05-03:00",
        },
        {
          id: 9404383438,
          order_id: 4629150367950,
          type: "chargeback",
          amount: "54.80",
          currency: "GBP",
          reason: "credit_not_processed",
          network_reason_code: "13.7",
          status: "under_review",
          evidence_due_by: "2025-11-12T20:00:00-03:00",
          evidence_sent_on: "2025-11-13T03:15:01-03:00",
          finalized_on: null,
          initiated_at: "2025-10-28T15:12:12-03:00",
        },
        {
          id: 9404350670,
          order_id: 4627006521550,
          type: "chargeback",
          amount: "50.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-11-07T01:00:00-03:00",
          evidence_sent_on: "2025-11-07T07:05:32-03:00",
          finalized_on: "2025-11-15T21:04:11-03:00",
          initiated_at: "2025-10-28T14:54:18-03:00",
        },
        {
          id: 9404154062,
          order_id: 4628339196110,
          type: "chargeback",
          amount: "59.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-12T20:00:00-03:00",
          evidence_sent_on: "2025-11-13T03:05:53-03:00",
          finalized_on: "2025-11-15T10:07:10-03:00",
          initiated_at: "2025-10-28T11:55:24-03:00",
        },
        {
          id: 9404121294,
          order_id: 4625108041934,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "fraudulent",
          network_reason_code: "10.4",
          status: "under_review",
          evidence_due_by: "2025-11-12T20:00:00-03:00",
          evidence_sent_on: "2025-11-13T03:32:12-03:00",
          finalized_on: null,
          initiated_at: "2025-10-28T11:48:51-03:00",
        },
        {
          id: 9404022990,
          order_id: 4628690960590,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-07T01:00:00-03:00",
          evidence_sent_on: "2025-11-07T05:53:39-03:00",
          finalized_on: null,
          initiated_at: "2025-10-28T09:48:51-03:00",
        },
        {
          id: 9403891918,
          order_id: 4628337328334,
          type: "chargeback",
          amount: "97.82",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-12T20:00:00-03:00",
          evidence_sent_on: "2025-11-13T07:03:20-03:00",
          finalized_on: "2025-11-16T10:05:05-03:00",
          initiated_at: "2025-10-28T08:33:55-03:00",
        },
        {
          id: 9406152910,
          order_id: 4620777357518,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-09T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-11-14T10:19:28-03:00",
          initiated_at: "2025-10-28T08:31:31-03:00",
        },
        {
          id: 9407430862,
          order_id: 4629992079566,
          type: "chargeback",
          amount: "144.66",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-10T01:00:00-03:00",
          evidence_sent_on: "2025-11-10T03:45:32-03:00",
          finalized_on: "2025-11-14T08:51:16-03:00",
          initiated_at: "2025-10-28T02:36:29-03:00",
        },
        {
          id: 9403760846,
          order_id: 4619513987278,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "13.3",
          status: "under_review",
          evidence_due_by: "2025-11-11T20:00:00-03:00",
          evidence_sent_on: "2025-11-12T03:11:10-03:00",
          finalized_on: null,
          initiated_at: "2025-10-28T01:07:40-03:00",
        },
        {
          id: 9403334862,
          order_id: 4629006450894,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-11T20:00:00-03:00",
          evidence_sent_on: "2025-11-12T04:00:17-03:00",
          finalized_on: "2025-11-14T08:53:43-03:00",
          initiated_at: "2025-10-27T20:46:40-03:00",
        },
        {
          id: 9403203790,
          order_id: 4631525392590,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-11T20:00:00-03:00",
          evidence_sent_on: "2025-11-12T06:04:32-03:00",
          finalized_on: "2025-11-14T08:50:21-03:00",
          initiated_at: "2025-10-27T18:43:48-03:00",
        },
        {
          id: 9403072718,
          order_id: 4621320454350,
          type: "inquiry",
          amount: "89.73",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-15T16:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-10-27T16:44:08-03:00",
        },
        {
          id: 9403007182,
          order_id: 4627914457294,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-06T01:00:00-03:00",
          evidence_sent_on: "2025-11-06T02:43:46-03:00",
          finalized_on: null,
          initiated_at: "2025-10-27T12:41:20-03:00",
        },
        {
          id: 9402941646,
          order_id: 4628753973454,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-11T20:00:00-03:00",
          evidence_sent_on: "2025-11-12T07:20:25-03:00",
          finalized_on: "2025-11-15T10:07:26-03:00",
          initiated_at: "2025-10-27T11:07:54-03:00",
        },
        {
          id: 9406349518,
          order_id: 4632157257934,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-09T01:00:00-03:00",
          evidence_sent_on: "2025-11-09T07:26:53-03:00",
          finalized_on: "2025-11-13T11:08:04-03:00",
          initiated_at: "2025-10-27T10:24:51-03:00",
        },
        {
          id: 9405989070,
          order_id: 4627710279886,
          type: "chargeback",
          amount: "88.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-09T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-11-13T12:35:03-03:00",
          initiated_at: "2025-10-26T08:53:16-03:00",
        },
        {
          id: 9402515662,
          order_id: 4620679643342,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-13T01:00:00-03:00",
          evidence_sent_on: "2025-11-05T04:38:06-03:00",
          finalized_on: null,
          initiated_at: "2025-10-26T08:38:50-03:00",
        },
        {
          id: 9402450126,
          order_id: 4631532503246,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-05T01:00:00-03:00",
          evidence_sent_on: "2025-11-05T06:26:36-03:00",
          finalized_on: "2025-11-17T06:57:27-03:00",
          initiated_at: "2025-10-26T06:29:52-03:00",
        },
        {
          id: 9405956302,
          order_id: 4627990610126,
          type: "chargeback",
          amount: "52.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-16T01:00:00-03:00",
          evidence_sent_on: "2025-11-09T03:05:26-03:00",
          finalized_on: null,
          initiated_at: "2025-10-25T09:40:57-03:00",
        },
        {
          id: 9401368782,
          order_id: 4627936313550,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-11-07T01:00:00-03:00",
          evidence_sent_on: "2025-11-07T06:05:13-03:00",
          finalized_on: null,
          initiated_at: "2025-10-24T21:27:10-03:00",
        },
        {
          id: 9401336014,
          order_id: 4627936313550,
          type: "chargeback",
          amount: "42.42",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-11-07T01:00:00-03:00",
          evidence_sent_on: "2025-11-07T05:25:16-03:00",
          finalized_on: null,
          initiated_at: "2025-10-24T21:10:45-03:00",
        },
        {
          id: 9401303246,
          order_id: 4632441356494,
          type: "chargeback",
          amount: "54.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-08T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-24T20:14:17-03:00",
          initiated_at: "2025-10-24T20:13:58-03:00",
        },
        {
          id: 9405104334,
          order_id: 4627634618574,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-08T01:00:00-03:00",
          evidence_sent_on: "2025-11-08T04:13:12-03:00",
          finalized_on: null,
          initiated_at: "2025-10-24T16:14:29-03:00",
        },
        {
          id: 9401008334,
          order_id: 4626417057998,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-08T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-24T14:33:56-03:00",
          initiated_at: "2025-10-24T14:33:37-03:00",
        },
        {
          id: 9404973262,
          order_id: 4627776110798,
          type: "chargeback",
          amount: "50.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-08T01:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-11-13T11:37:22-03:00",
          initiated_at: "2025-10-24T11:05:30-03:00",
        },
        {
          id: 9400844494,
          order_id: 4627866910926,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "1310",
          status: "lost",
          evidence_due_by: "2025-11-03T01:00:00-03:00",
          evidence_sent_on: "2025-11-03T03:55:20-03:00",
          finalized_on: "2025-11-11T09:43:10-03:00",
          initiated_at: "2025-10-24T10:55:22-03:00",
        },
        {
          id: 9400811726,
          order_id: 4627003572430,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-08T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-24T10:11:21-03:00",
          initiated_at: "2025-10-24T10:11:03-03:00",
        },
        {
          id: 9400549582,
          order_id: 4627194151118,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-07T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-24T01:11:48-03:00",
          initiated_at: "2025-10-24T01:11:35-03:00",
        },
        {
          id: 9400058062,
          order_id: 4629823848654,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-02T01:00:00-03:00",
          evidence_sent_on: "2025-11-02T10:00:21-03:00",
          finalized_on: "2025-11-14T10:28:06-03:00",
          initiated_at: "2025-10-23T14:35:58-03:00",
        },
        {
          id: 9399795918,
          order_id: 4627150799054,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-18T01:00:00-03:00",
          evidence_sent_on: "2025-11-02T10:06:27-03:00",
          finalized_on: null,
          initiated_at: "2025-10-23T08:27:15-03:00",
        },
        {
          id: 9399763150,
          order_id: 4627150799054,
          type: "chargeback",
          amount: "42.42",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-02T01:00:00-03:00",
          evidence_sent_on: "2025-11-02T11:07:49-03:00",
          finalized_on: "2025-11-02T11:32:25-03:00",
          initiated_at: "2025-10-23T08:20:52-03:00",
        },
        {
          id: 9399697614,
          order_id: 4622640251086,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4553",
          status: "under_review",
          evidence_due_by: "2025-11-07T20:00:00-03:00",
          evidence_sent_on: "2025-11-08T03:50:25-03:00",
          finalized_on: null,
          initiated_at: "2025-10-23T05:57:58-03:00",
        },
        {
          id: 9399173326,
          order_id: 4627632062670,
          type: "chargeback",
          amount: "54.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-16T01:00:00-03:00",
          evidence_sent_on: "2025-11-16T02:31:22-03:00",
          finalized_on: null,
          initiated_at: "2025-10-22T14:09:26-03:00",
        },
        {
          id: 9402843342,
          order_id: 4630730965198,
          type: "chargeback",
          amount: "62.89",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-14T01:00:00-03:00",
          evidence_sent_on: "2025-11-06T05:40:25-03:00",
          finalized_on: null,
          initiated_at: "2025-10-22T06:41:08-03:00",
        },
        {
          id: 9398812878,
          order_id: 4626767544526,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-05T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-22T01:28:57-03:00",
          initiated_at: "2025-10-22T01:28:37-03:00",
        },
        {
          id: 9398485198,
          order_id: 4621454606542,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-11T01:00:00-03:00",
          evidence_sent_on: "2025-10-31T02:53:21-03:00",
          finalized_on: null,
          initiated_at: "2025-10-21T18:08:54-03:00",
        },
        {
          id: 9398223054,
          order_id: 4630827565262,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-31T00:00:00-03:00",
          evidence_sent_on: "2025-10-31T03:42:19-03:00",
          finalized_on: "2025-11-12T04:14:28-03:00",
          initiated_at: "2025-10-21T14:18:57-03:00",
        },
        {
          id: 9397862606,
          order_id: 4619902648526,
          type: "chargeback",
          amount: "89.73",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: "4853",
          status: "under_review",
          evidence_due_by: "2025-11-28T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: null,
          initiated_at: "2025-10-21T00:11:29-03:00",
        },
        {
          id: 9397731534,
          order_id: 4630373171406,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-04T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-20T21:54:12-03:00",
          initiated_at: "2025-10-20T21:53:54-03:00",
        },
        {
          id: 9397502158,
          order_id: 4627020382414,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-13T01:00:00-03:00",
          evidence_sent_on: "2025-11-05T07:07:34-03:00",
          finalized_on: null,
          initiated_at: "2025-10-20T18:02:28-03:00",
        },
        {
          id: 9397403854,
          order_id: 4626954027214,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-09T01:00:00-03:00",
          evidence_sent_on: "2025-11-01T02:54:34-03:00",
          finalized_on: null,
          initiated_at: "2025-10-20T12:50:15-03:00",
        },
        {
          id: 9397338318,
          order_id: 4626877645006,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-04T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-20T11:01:55-03:00",
          initiated_at: "2025-10-20T11:01:38-03:00",
        },
        {
          id: 9397207246,
          order_id: 4622703689934,
          type: "chargeback",
          amount: "87.73",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-30T00:00:00-03:00",
          evidence_sent_on: "2025-10-30T01:04:06-03:00",
          finalized_on: "2025-10-30T01:31:30-03:00",
          initiated_at: "2025-10-20T04:03:41-03:00",
        },
        {
          id: 9397108942,
          order_id: 4627942211790,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "under_review",
          evidence_due_by: "2025-10-30T00:00:00-03:00",
          evidence_sent_on: "2025-10-30T04:15:28-03:00",
          finalized_on: null,
          initiated_at: "2025-10-20T02:02:35-03:00",
        },
        {
          id: 9396846798,
          order_id: 4631714791630,
          type: "chargeback",
          amount: "84.83",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-03T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-19T18:21:19-03:00",
          initiated_at: "2025-10-19T18:20:58-03:00",
        },
        {
          id: 9396748494,
          order_id: 4629802123470,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-29T00:00:00-03:00",
          evidence_sent_on: "2025-10-29T03:15:13-03:00",
          finalized_on: "2025-11-13T23:57:07-03:00",
          initiated_at: "2025-10-19T15:04:53-03:00",
        },
        {
          id: 9396682958,
          order_id: 4622616002766,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-16T01:00:00-03:00",
          evidence_sent_on: "2025-11-16T07:25:24-03:00",
          finalized_on: null,
          initiated_at: "2025-10-19T13:19:28-03:00",
        },
        {
          id: 9395962062,
          order_id: 4624127131854,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-02T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-18T20:15:48-03:00",
          initiated_at: "2025-10-18T20:15:28-03:00",
        },
        {
          id: 9395536078,
          order_id: 4622222950606,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-09T01:00:00-03:00",
          evidence_sent_on: "2025-10-28T01:02:45-03:00",
          finalized_on: null,
          initiated_at: "2025-10-18T12:09:07-03:00",
        },
        {
          id: 9395503310,
          order_id: 4622222983374,
          type: "chargeback",
          amount: "45.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-04T01:00:00-03:00",
          evidence_sent_on: "2025-10-28T04:54:45-03:00",
          finalized_on: null,
          initiated_at: "2025-10-18T11:36:01-03:00",
        },
        {
          id: 9395437774,
          order_id: 4629205319886,
          type: "chargeback",
          amount: "84.82",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-28T00:00:00-03:00",
          evidence_sent_on: "2025-10-28T01:39:10-03:00",
          finalized_on: "2025-11-13T01:07:09-03:00",
          initiated_at: "2025-10-18T10:50:29-03:00",
        },
        {
          id: 9395339470,
          order_id: 4619785240782,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-17T01:00:00-03:00",
          evidence_sent_on: "2025-11-05T05:41:15-03:00",
          finalized_on: null,
          initiated_at: "2025-10-18T07:13:46-03:00",
        },
        {
          id: 9395273934,
          order_id: 4630790865102,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-01T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-18T06:39:31-03:00",
          initiated_at: "2025-10-18T06:39:14-03:00",
        },
        {
          id: 9395241166,
          order_id: 4621330383054,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-11-01T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-18T06:38:00-03:00",
          initiated_at: "2025-10-18T06:37:39-03:00",
        },
        {
          id: 9395142862,
          order_id: 4621450346702,
          type: "chargeback",
          amount: "119.76",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "4554",
          status: "under_review",
          evidence_due_by: "2025-11-02T20:00:00-03:00",
          evidence_sent_on: "2025-11-03T05:32:37-03:00",
          finalized_on: null,
          initiated_at: "2025-10-18T04:33:52-03:00",
        },
        {
          id: 9394684110,
          order_id: 4621369868494,
          type: "chargeback",
          amount: "49.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-11-05T15:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-11-06T16:28:00-03:00",
          initiated_at: "2025-10-17T15:18:24-03:00",
        },
        {
          id: 9394553038,
          order_id: 4621946814670,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "fraudulent",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-27T00:00:00-03:00",
          evidence_sent_on: "2025-10-27T05:33:29-03:00",
          finalized_on: "2025-10-27T21:07:16-03:00",
          initiated_at: "2025-10-17T05:19:40-03:00",
        },
        {
          id: 9394520270,
          order_id: 4627734266062,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-27T00:00:00-03:00",
          evidence_sent_on: "2025-10-27T06:23:44-03:00",
          finalized_on: "2025-11-03T23:47:45-03:00",
          initiated_at: "2025-10-17T05:14:47-03:00",
        },
        {
          id: 9394389198,
          order_id: 4620964921550,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-19T01:00:00-03:00",
          evidence_sent_on: "2025-11-13T02:09:45-03:00",
          finalized_on: null,
          initiated_at: "2025-10-17T03:59:14-03:00",
        },
        {
          id: 9393733838,
          order_id: 4620645138638,
          type: "chargeback",
          amount: "65.79",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-10-31T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-16T14:59:57-03:00",
          initiated_at: "2025-10-16T14:59:39-03:00",
        },
        {
          id: 9393668302,
          order_id: 4621554581710,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-26T00:00:00-03:00",
          evidence_sent_on: "2025-10-26T02:53:02-03:00",
          finalized_on: "2025-10-26T03:17:20-03:00",
          initiated_at: "2025-10-16T13:33:31-03:00",
        },
        {
          id: 9393635534,
          order_id: 4621483507918,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-26T00:00:00-03:00",
          evidence_sent_on: "2025-10-26T05:49:43-03:00",
          finalized_on: "2025-10-26T06:14:00-03:00",
          initiated_at: "2025-10-16T12:04:16-03:00",
        },
        {
          id: 9398091982,
          order_id: 4621393625294,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-08T01:00:00-03:00",
          evidence_sent_on: "2025-10-31T06:17:10-03:00",
          finalized_on: null,
          initiated_at: "2025-10-16T11:07:35-03:00",
        },
        {
          id: 9393569998,
          order_id: 4621379698894,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-10-31T20:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-16T10:26:08-03:00",
          initiated_at: "2025-10-16T10:25:50-03:00",
        },
        {
          id: 9392619726,
          order_id: 4620784894158,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-25T00:00:00-03:00",
          evidence_sent_on: "2025-10-25T02:33:54-03:00",
          finalized_on: "2025-11-07T21:03:55-03:00",
          initiated_at: "2025-10-15T03:20:54-03:00",
        },
        {
          id: 9392259278,
          order_id: 4619912708302,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "subscription_canceled",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-26T01:00:00-03:00",
          evidence_sent_on: "2025-10-24T03:10:10-03:00",
          finalized_on: null,
          initiated_at: "2025-10-14T20:33:42-03:00",
        },
        {
          id: 9397141710,
          order_id: 4613853413582,
          type: "chargeback",
          amount: "101.98",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-15T01:00:00-03:00",
          evidence_sent_on: "2025-10-30T06:26:54-03:00",
          finalized_on: null,
          initiated_at: "2025-10-14T13:03:54-03:00",
        },
        {
          id: 9391964366,
          order_id: 4629005893838,
          type: "chargeback",
          amount: "84.00",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-24T00:00:00-03:00",
          evidence_sent_on: "2025-10-24T01:05:33-03:00",
          finalized_on: "2025-11-05T01:48:00-03:00",
          initiated_at: "2025-10-14T10:21:29-03:00",
        },
        {
          id: 9394487502,
          order_id: 4627829948622,
          type: "chargeback",
          amount: "110.75",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-27T00:00:00-03:00",
          evidence_sent_on: "2025-10-27T01:03:07-03:00",
          finalized_on: "2025-10-31T06:26:27-03:00",
          initiated_at: "2025-10-14T01:53:36-03:00",
        },
        {
          id: 9391538382,
          order_id: 4623188754638,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-10-28T20:00:00-03:00",
          evidence_sent_on: "2025-10-29T02:21:45-03:00",
          finalized_on: "2025-11-04T08:56:28-03:00",
          initiated_at: "2025-10-13T23:41:46-03:00",
        },
        {
          id: 9391243470,
          order_id: 4621331071182,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-23T00:00:00-03:00",
          evidence_sent_on: "2025-10-23T01:25:00-03:00",
          finalized_on: "2025-10-23T02:08:41-03:00",
          initiated_at: "2025-10-13T08:26:00-03:00",
        },
        {
          id: 9391210702,
          order_id: 4619956388046,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-23T00:00:00-03:00",
          evidence_sent_on: "2025-10-23T04:17:01-03:00",
          finalized_on: "2025-10-23T04:59:54-03:00",
          initiated_at: "2025-10-13T07:58:13-03:00",
        },
        {
          id: 9390489806,
          order_id: 4610549842126,
          type: "chargeback",
          amount: "175.15",
          currency: "USD",
          reason: "fraudulent",
          network_reason_code: "10.4",
          status: "under_review",
          evidence_due_by: "2025-10-26T20:00:00-03:00",
          evidence_sent_on: "2025-10-27T03:17:59-03:00",
          finalized_on: null,
          initiated_at: "2025-10-11T14:01:57-03:00",
        },
        {
          id: 9390424270,
          order_id: 4619115659470,
          type: "chargeback",
          amount: "52.00",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-30T11:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-10-31T11:19:40-03:00",
          initiated_at: "2025-10-11T11:09:18-03:00",
        },
        {
          id: 9390391502,
          order_id: 4619332255950,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-09T01:00:00-03:00",
          evidence_sent_on: "2025-10-27T01:53:31-03:00",
          finalized_on: null,
          initiated_at: "2025-10-11T08:14:39-03:00",
        },
        {
          id: 9389572302,
          order_id: 4621335888078,
          type: "chargeback",
          amount: "84.82",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-20T00:00:00-03:00",
          evidence_sent_on: "2025-10-20T05:30:03-03:00",
          finalized_on: "2025-10-20T06:11:42-03:00",
          initiated_at: "2025-10-10T05:30:00-03:00",
        },
        {
          id: 9391866062,
          order_id: 4619433869518,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-24T00:00:00-03:00",
          evidence_sent_on: null,
          finalized_on: "2025-11-07T12:15:20-03:00",
          initiated_at: "2025-10-09T12:41:54-03:00",
        },
        {
          id: 9388622030,
          order_id: 4610246672590,
          type: "chargeback",
          amount: "109.73",
          currency: "USD",
          reason: "incorrect_account_details",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-11-13T01:00:00-03:00",
          evidence_sent_on: "2025-10-18T05:30:42-03:00",
          finalized_on: "2025-11-14T02:05:11-03:00",
          initiated_at: "2025-10-08T17:43:14-03:00",
        },
        {
          id: 9388261582,
          order_id: 4619085054158,
          type: "chargeback",
          amount: "52.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "under_review",
          evidence_due_by: "2025-11-16T01:00:00-03:00",
          evidence_sent_on: "2025-10-22T02:13:06-03:00",
          finalized_on: null,
          initiated_at: "2025-10-08T10:56:18-03:00",
        },
        {
          id: 9387507918,
          order_id: 4621392150734,
          type: "chargeback",
          amount: "49.90",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "lost",
          evidence_due_by: "2025-10-29T00:00:00-03:00",
          evidence_sent_on: "2025-10-17T04:00:24-03:00",
          finalized_on: "2025-10-30T01:07:09-03:00",
          initiated_at: "2025-10-07T09:00:56-03:00",
        },
        {
          id: 9387475150,
          order_id: 4617283174606,
          type: "chargeback",
          amount: "37.89",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-17T00:00:00-03:00",
          evidence_sent_on: "2025-10-17T05:54:15-03:00",
          finalized_on: "2025-10-20T06:41:03-03:00",
          initiated_at: "2025-10-07T08:17:07-03:00",
        },
        {
          id: 9387278542,
          order_id: 4619449696462,
          type: "chargeback",
          amount: "54.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-16T00:00:00-03:00",
          evidence_sent_on: "2025-10-16T02:14:43-03:00",
          finalized_on: "2025-10-16T02:39:23-03:00",
          initiated_at: "2025-10-06T16:49:28-03:00",
        },
        {
          id: 9387245774,
          order_id: 4620209094862,
          type: "chargeback",
          amount: "54.80",
          currency: "GBP",
          reason: "product_unacceptable",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-16T00:00:00-03:00",
          evidence_sent_on: "2025-10-16T05:18:54-03:00",
          finalized_on: "2025-10-20T06:41:11-03:00",
          initiated_at: "2025-10-06T15:28:00-03:00",
        },
        {
          id: 9386262734,
          order_id: 4619449761998,
          type: "chargeback",
          amount: "87.73",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-10-18T20:00:00-03:00",
          evidence_sent_on: "2025-10-19T05:42:21-03:00",
          finalized_on: "2025-11-11T09:02:37-03:00",
          initiated_at: "2025-10-03T22:48:59-03:00",
        },
        {
          id: 9384952014,
          order_id: 4622245757134,
          type: "chargeback",
          amount: "54.80",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: null,
          status: "won",
          evidence_due_by: "2025-10-12T00:00:00-03:00",
          evidence_sent_on: "2025-10-12T05:45:34-03:00",
          finalized_on: "2025-10-18T06:26:44-03:00",
          initiated_at: "2025-10-02T13:23:00-03:00",
        },
        {
          id: 9384460494,
          order_id: 4621355057358,
          type: "chargeback",
          amount: "99.63",
          currency: "GBP",
          reason: "product_not_received",
          network_reason_code: "13.1",
          status: "lost",
          evidence_due_by: "2025-10-16T20:00:00-03:00",
          evidence_sent_on: "2025-10-17T01:44:52-03:00",
          finalized_on: "2025-10-21T07:49:21-03:00",
          initiated_at: "2025-10-01T18:13:50-03:00",
        },
      ],
    };

    const ord = {
      orders: [
        {
          id: 4635251474638,
          admin_graphql_api_id: "gid:\/\/shopify\/Order\/4635251474638",
          app_id: 580111,
          browser_ip: "5.81.252.136",
          buyer_accepts_marketing: false,
          cancel_reason: null,
          cancelled_at: null,
          cart_token: "hWN49ObV8HzptlH0x04w80hv",
          checkout_id: 33492948517070,
          checkout_token: "987b172c38cc4a50a19678b883bac172",
          client_details: {
            accept_language: "en-GB",
            browser_height: null,
            browser_ip: "5.81.252.136",
            browser_width: null,
            session_hash: null,
            user_agent:
              "Mozilla\/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit\/605.1.15 (KHTML, like Gecko) Version\/17.6.1 Mobile\/15E148 Safari\/604.1 musical_ly_41.8.0 JsSdk\/2.0 NetType\/WIFI Channel\/App Store ByteLocale\/en Region\/GB isDarkMode\/0 WKWebView\/1 RevealType\/Dialog",
          },
          closed_at: "2025-10-15T18:15:03-03:00",
          confirmation_number: "51RPCKVTH",
          confirmed: true,
          created_at: "2025-10-15T14:11:27-03:00",
          currency: "GBP",
          current_subtotal_price: "49.90",
          current_subtotal_price_set: {
            shop_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
          },
          current_total_additional_fees_set: null,
          current_total_discounts: "0.00",
          current_total_discounts_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          current_total_duties_set: null,
          current_total_price: "52.80",
          current_total_price_set: {
            shop_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
          },
          current_total_tax: "0.00",
          current_total_tax_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          customer_locale: "en-GB",
          device_id: null,
          discount_codes: [],
          duties_included: false,
          estimated_taxes: false,
          financial_status: "partially_refunded",
          fulfillment_status: "fulfilled",
          landing_site:
            "\/products\/adidas®-lifestyle-duo-set?utm_source=tiktok&utm_medium=paid&utm_id=1845821818257457&utm_campaign=Smart \/ TK 121F \/ Adidas® Lifestyle Duo Set - Teste de criativos 10&ttclid=E_C_P_Ct4BEcDhBQVeQhRjHFRzU7ZMzSuJY3Hyv06ZeiaMFLLnfYeks_kPUwEVyD8qDy0Gh",
          landing_site_ref: null,
          location_id: null,
          merchant_business_entity_id: "11209703630",
          merchant_of_record_app_id: null,
          name: "#2064",
          note: null,
          note_attributes: [
            {
              name: "country",
              value: "GB",
            },
            {
              name: "fbp",
              value: "fb.1.1760547498837.264023474",
            },
            {
              name: "host",
              value: "https:\/\/rivelleoutlet.com",
            },
            {
              name: "locale",
              value: "en",
            },
            {
              name: "sh",
              value: "896",
            },
            {
              name: "sw",
              value: "414",
            },
            {
              name: "ttclid",
              value:
                "E_C_P_Ct4BHXhMZ3CHdDzEr0my24Yq6sfOOParAlYMEDoQhrAJzJaTH2ejt-9L1VtJxxQVRvEMByFKjXIoBn74Nt6diB4WaqaWXKvtTmw98QA0WREyAXsVh2FtlS13P8TWgrL7anjC434RoExpHH8bNXNhCe39xEmqD7cS-0zX6Pv9bIxVFCFFBmoR_ywOOACC3skgWtzYfkbiiNjK5W4kHbcizL6XoDofBBaCTJhMo-dk-ybZa6hbaRXb7vAkr8AW7qwVEx-zI8d7-FfUAqe0AGS2xRSOUZ9GjaRMWGKQyIGpqcXBEgR2Mi4w",
            },
            {
              name: "ttp",
              value: "4QDbjn7XYwyDHKbepJPXfd0eTic.tt.0",
            },
            {
              name: "utm_campaign",
              value: "CP Smart \/ Adidas Lifestyle Duo Set - 14",
            },
            {
              name: "utm_id",
              value: "1845545737657425",
            },
            {
              name: "utm_medium",
              value: "paid",
            },
            {
              name: "utm_source",
              value: "tiktok",
            },
            {
              name: "auid",
              value: "961981830.1760547500",
            },
            {
              name: "scid",
              value: "2_jovwVoQL4HDNGApr3RDssNpDD6ZI2Y",
            },
          ],
          number: 1064,
          order_number: 2064,
          original_total_additional_fees_set: null,
          original_total_duties_set: null,
          payment_gateway_names: ["shopify_payments"],
          po_number: null,
          presentment_currency: "GBP",
          processed_at: "2025-10-15T14:11:23-03:00",
          reference: null,
          referring_site:
            "https:\/\/shop.app\/accounts\/login\/embedded?analytics_context=loginWithShopCheckoutModal&analytics_trace_id=f8c35370-b888-424c-b5a6-a76ff0e27f42&auth_state=_rh9-2o_FoTr56F875umgg&authentication_level=phone&avoid_sdk_session=true&checkout_redirect_url=VU40THN",
          source_identifier: null,
          source_name: "web",
          source_url: null,
          subtotal_price: "49.90",
          subtotal_price_set: {
            shop_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
          },
          tags: "",
          tax_exempt: false,
          tax_lines: [],
          taxes_included: false,
          test: false,
          token: "41cce16370f9a4ebb61bc4a797e5f36a",
          total_cash_rounding_payment_adjustment_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_cash_rounding_refund_adjustment_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_discounts: "0.00",
          total_discounts_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_line_items_price: "49.90",
          total_line_items_price_set: {
            shop_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
          },
          total_outstanding: "0.00",
          total_price: "52.80",
          total_price_set: {
            shop_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
          },
          total_shipping_price_set: {
            shop_money: {
              amount: "2.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "2.90",
              currency_code: "GBP",
            },
          },
          total_tax: "0.00",
          total_tax_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_tip_received: "0.00",
          total_weight: 1000,
          updated_at: "2025-10-28T06:10:28-03:00",
          user_id: null,
          billing_address: {
            province: "England",
            country: "United Kingdom",
            country_code: "GB",
            province_code: "ENG",
          },
          customer: {
            id: 6877132423374,
            created_at: "2025-10-15T14:11:08-03:00",
            updated_at: "2025-10-28T06:10:31-03:00",
            state: "enabled",
            note: null,
            verified_email: true,
            multipass_identifier: null,
            tax_exempt: false,
            email_marketing_consent: {
              state: "not_subscribed",
              opt_in_level: "single_opt_in",
              consent_updated_at: null,
            },
            sms_marketing_consent: {
              state: "not_subscribed",
              opt_in_level: "single_opt_in",
              consent_updated_at: null,
              consent_collected_from: "OTHER",
            },
            tags: "Login with Shop, Shop",
            currency: "GBP",
            tax_exemptions: [],
            admin_graphql_api_id: "gid:\/\/shopify\/Customer\/6877132423374",
            default_address: {
              id: 7803958493390,
              customer_id: 6877132423374,
              company: null,
              province: "England",
              country: "United Kingdom",
              province_code: "ENG",
              country_code: "GB",
              country_name: "United Kingdom",
              default: true,
            },
          },
          discount_applications: [],
          fulfillments: [
            {
              id: 4144866033870,
              admin_graphql_api_id: "gid:\/\/shopify\/Fulfillment\/4144866033870",
              created_at: "2025-10-15T18:15:02-03:00",
              location_id: 71835844814,
              name: "#2064.1",
              order_id: 4635251474638,
              origin_address: {
                city: "Miami",
                zip: "33101",
                country_code: "US",
              },
              receipt: {},
              service: "manual",
              shipment_status: null,
              status: "success",
              tracking_company: "DHL Express",
              tracking_number: "JD945466100392279933",
              tracking_numbers: ["JD945466100392279933"],
              tracking_url: "https:\/\/rivelle.trackship17.com\/?tracking=JD945466100392279933",
              tracking_urls: ["https:\/\/rivelle.trackship17.com\/?tracking=JD945466100392279933"],
              updated_at: "2025-10-15T18:15:03-03:00",
              line_items: [
                {
                  id: 11571993116878,
                  admin_graphql_api_id: "gid:\/\/shopify\/LineItem\/11571993116878",
                  attributed_staffs: [],
                  current_quantity: 1,
                  fulfillable_quantity: 0,
                  fulfillment_service: "manual",
                  fulfillment_status: "fulfilled",
                  gift_card: false,
                  grams: 1000,
                  name: "Adidas® Lifestyle Duo Set - Brown \/ S",
                  price: "49.90",
                  price_set: {
                    shop_money: {
                      amount: "49.90",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "49.90",
                      currency_code: "GBP",
                    },
                  },
                  product_exists: false,
                  product_id: null,
                  properties: [
                    {
                      name: "__kaching_bundles",
                      value: '{"deal":"bzVa","main":true}',
                    },
                  ],
                  quantity: 1,
                  requires_shipping: true,
                  sku: null,
                  taxable: true,
                  title: "Adidas® Lifestyle Duo Set",
                  total_discount: "0.00",
                  total_discount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                  variant_id: null,
                  variant_inventory_management: null,
                  variant_title: "Brown \/ S",
                  vendor: "RIVELLE",
                  tax_lines: [],
                  duties: [],
                  discount_allocations: [],
                },
              ],
            },
          ],
          line_items: [
            {
              id: 11571993116878,
              admin_graphql_api_id: "gid:\/\/shopify\/LineItem\/11571993116878",
              attributed_staffs: [],
              current_quantity: 1,
              fulfillable_quantity: 0,
              fulfillment_service: "manual",
              fulfillment_status: "fulfilled",
              gift_card: false,
              grams: 1000,
              name: "Adidas® Lifestyle Duo Set - Brown \/ S",
              price: "49.90",
              price_set: {
                shop_money: {
                  amount: "49.90",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "49.90",
                  currency_code: "GBP",
                },
              },
              product_exists: false,
              product_id: null,
              properties: [
                {
                  name: "__kaching_bundles",
                  value: '{"deal":"bzVa","main":true}',
                },
              ],
              quantity: 1,
              requires_shipping: true,
              sku: null,
              taxable: true,
              title: "Adidas® Lifestyle Duo Set",
              total_discount: "0.00",
              total_discount_set: {
                shop_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
              },
              variant_id: null,
              variant_inventory_management: null,
              variant_title: "Brown \/ S",
              vendor: "RIVELLE",
              tax_lines: [],
              duties: [],
              discount_allocations: [],
            },
          ],
          payment_terms: null,
          refunds: [
            {
              id: 844385714382,
              admin_graphql_api_id: "gid:\/\/shopify\/Refund\/844385714382",
              created_at: "2025-10-27T05:28:21-03:00",
              note: "Refund request submitted via portal - ID: RF-BRGBUL0X",
              order_id: 4635251474638,
              processed_at: "2025-10-27T05:28:21-03:00",
              restock: false,
              total_duties_set: {
                shop_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
              },
              user_id: null,
              order_adjustments: [
                {
                  id: 225768145102,
                  amount: "-0.01",
                  amount_set: {
                    shop_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                  },
                  kind: "refund_discrepancy",
                  order_id: 4635251474638,
                  reason: "Refund discrepancy",
                  refund_id: 844385714382,
                  tax_amount: "0.00",
                  tax_amount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                },
                {
                  id: 225768177870,
                  amount: "0.01",
                  amount_set: {
                    shop_money: {
                      amount: "0.01",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.01",
                      currency_code: "GBP",
                    },
                  },
                  kind: "refund_discrepancy",
                  order_id: 4635251474638,
                  reason: "Refund discrepancy",
                  refund_id: 844385714382,
                  tax_amount: "0.00",
                  tax_amount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                },
                {
                  id: 225823850702,
                  amount: "-0.01",
                  amount_set: {
                    shop_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                  },
                  kind: "refund_discrepancy",
                  order_id: 4635251474638,
                  reason: "Pending refund discrepancy",
                  refund_id: 844385714382,
                  tax_amount: "0.00",
                  tax_amount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                },
              ],
              transactions: [
                {
                  id: 6016700121294,
                  admin_graphql_api_id: "gid:\/\/shopify\/OrderTransaction\/6016700121294",
                  amount: "0.01",
                  authorization: "ch_3SIYESJm64tOGR341hS2eWsc",
                  created_at: "2025-10-27T05:28:20-03:00",
                  currency: "GBP",
                  device_id: null,
                  error_code: null,
                  gateway: "shopify_payments",
                  kind: "refund",
                  location_id: null,
                  message: null,
                  order_id: 4635251474638,
                  parent_id: 6004081459406,
                  payment_id: "zenCdH6tRNAEYeUHYXqmfQvmE",
                  payments_refund_attributes: {
                    status: "success",
                    acquirer_reference_number: "24011345301100117748053",
                  },
                  processed_at: "2025-10-27T05:28:20-03:00",
                  receipt: {
                    id: "re_3SIYESJm64tOGR341sYtFssp",
                    amount: 1,
                    balance_transaction: "txn_3SIYESJm64tOGR341qDkMyUE",
                    charge: {
                      id: "ch_3SIYESJm64tOGR341hS2eWsc",
                      object: "charge",
                      amount: 5280,
                      application_fee: "fee_1SIYETJm64tOGR34U5sP8YbR",
                      balance_transaction: "txn_3SIYESJm64tOGR3412YUIayn",
                      captured: true,
                      created: 1760548284,
                      currency: "gbp",
                      failure_code: null,
                      failure_message: null,
                      fraud_details: {},
                      livemode: true,
                      metadata: {
                        payment_id: "rJLwHg260uyAOc52fAiM6SwyL",
                        payments_extension: "true",
                        payments_extension_type: "card",
                        reconciliation_flow: "payments_api",
                        shop_id: "65778745550",
                      },
                      outcome: {
                        advice_code: null,
                        network_advice_code: null,
                        network_decline_code: null,
                        network_status: "approved_by_network",
                        reason: null,
                        risk_level: "normal",
                        seller_message: "Payment complete.",
                        type: "authorized",
                      },
                      paid: true,
                      payment_intent: "pi_3SIYESJm64tOGR3416GsKstb",
                      payment_method: "pm_1SIYESJm64tOGR34oKh0TqYQ",
                      payment_method_details: {
                        card: {
                          amount_authorized: 5280,
                          authorization_code: "192349",
                          brand: "visa",
                          checks: {
                            address_line1_check: "pass",
                            address_postal_code_check: "pass",
                            cvc_check: null,
                          },
                          country: "GB",
                          description: "Visa Gold",
                          ds_transaction_id: null,
                          exp_month: 2,
                          exp_year: 2030,
                          extended_authorization: {
                            status: "disabled",
                          },
                          fingerprint: "4gy3ykry3G4TGQXM",
                          funding: "credit",
                          iin: "402396",
                          incremental_authorization: {
                            status: "unavailable",
                          },
                          installments: null,
                          issuer: "VANQUIS BANK LIMITED",
                          last4: "2670",
                          mandate: null,
                          moto: false,
                          multicapture: {
                            status: "unavailable",
                          },
                          network: "visa",
                          network_token: {
                            used: true,
                          },
                          network_transaction_id: "585288618841652",
                          overcapture: {
                            maximum_amount_capturable: 6072,
                            status: "available",
                          },
                          overcapture_supported: true,
                          payment_account_reference: "V0010013824238482786156262072",
                          regulated_status: "unregulated",
                          three_d_secure: null,
                          wallet: null,
                        },
                        type: "card",
                      },
                      refunded: false,
                      source: null,
                      status: "succeeded",
                      mit_params: {
                        network_transaction_id: "585288618841652",
                      },
                    },
                    object: "refund",
                    reason: null,
                    status: "succeeded",
                    created: 1761640835,
                    currency: "gbp",
                    metadata: {
                      payments_extension: "true",
                      payments_extension_type: "card",
                      reconciliation_flow: "payments_api",
                      refund_id: "zenCdH6tRNAEYeUHYXqmfQvmE",
                    },
                    payment_method_details: {
                      card: {
                        acquirer_reference_number: null,
                        acquirer_reference_number_status: "pending",
                      },
                      type: "card",
                    },
                    mit_params: {},
                  },
                  source_name: "287739805697",
                  status: "success",
                  test: false,
                  user_id: null,
                  payment_details: {
                    credit_card_bin: "402396",
                    avs_result_code: "Y",
                    cvv_result_code: null,
                    credit_card_number: "•••• •••• •••• 2670",
                    credit_card_company: "Visa",
                    buyer_action_info: null,
                    credit_card_name: "Barry Slade",
                    credit_card_wallet: "shopify_pay",
                    credit_card_expiration_month: 2,
                    credit_card_expiration_year: 2030,
                    payment_method_name: "visa",
                  },
                },
              ],
              refund_line_items: [],
              duties: [],
            },
            {
              id: 844386009294,
              admin_graphql_api_id: "gid:\/\/shopify\/Refund\/844386009294",
              created_at: "2025-10-27T05:45:28-03:00",
              note: "Refund request submitted via portal - ID: RF-3QHI9INJ",
              order_id: 4635251474638,
              processed_at: "2025-10-27T05:45:28-03:00",
              restock: false,
              total_duties_set: {
                shop_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
              },
              user_id: null,
              order_adjustments: [
                {
                  id: 225768571086,
                  amount: "-0.01",
                  amount_set: {
                    shop_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                  },
                  kind: "refund_discrepancy",
                  order_id: 4635251474638,
                  reason: "Refund discrepancy",
                  refund_id: 844386009294,
                  tax_amount: "0.00",
                  tax_amount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                },
                {
                  id: 225768603854,
                  amount: "0.01",
                  amount_set: {
                    shop_money: {
                      amount: "0.01",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.01",
                      currency_code: "GBP",
                    },
                  },
                  kind: "refund_discrepancy",
                  order_id: 4635251474638,
                  reason: "Refund discrepancy",
                  refund_id: 844386009294,
                  tax_amount: "0.00",
                  tax_amount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                },
                {
                  id: 225824276686,
                  amount: "-0.01",
                  amount_set: {
                    shop_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "-0.01",
                      currency_code: "GBP",
                    },
                  },
                  kind: "refund_discrepancy",
                  order_id: 4635251474638,
                  reason: "Pending refund discrepancy",
                  refund_id: 844386009294,
                  tax_amount: "0.00",
                  tax_amount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                },
              ],
              transactions: [
                {
                  id: 6016706969806,
                  admin_graphql_api_id: "gid:\/\/shopify\/OrderTransaction\/6016706969806",
                  amount: "0.01",
                  authorization: "ch_3SIYESJm64tOGR341hS2eWsc",
                  created_at: "2025-10-27T05:45:28-03:00",
                  currency: "GBP",
                  device_id: null,
                  error_code: null,
                  gateway: "shopify_payments",
                  kind: "refund",
                  location_id: null,
                  message: null,
                  order_id: 4635251474638,
                  parent_id: 6004081459406,
                  payment_id: "z1sQmEBo489U6lw7K0jlt0k5w",
                  payments_refund_attributes: {
                    status: "success",
                    acquirer_reference_number: "24011345301100120178884",
                  },
                  processed_at: "2025-10-27T05:45:28-03:00",
                  receipt: {
                    id: "re_3SIYESJm64tOGR341fzIPdIN",
                    amount: 1,
                    balance_transaction: "txn_3SIYESJm64tOGR341hAk3zTO",
                    charge: {
                      id: "ch_3SIYESJm64tOGR341hS2eWsc",
                      object: "charge",
                      amount: 5280,
                      application_fee: "fee_1SIYETJm64tOGR34U5sP8YbR",
                      balance_transaction: "txn_3SIYESJm64tOGR3412YUIayn",
                      captured: true,
                      created: 1760548284,
                      currency: "gbp",
                      failure_code: null,
                      failure_message: null,
                      fraud_details: {},
                      livemode: true,
                      metadata: {
                        payment_id: "rJLwHg260uyAOc52fAiM6SwyL",
                        payments_extension: "true",
                        payments_extension_type: "card",
                        reconciliation_flow: "payments_api",
                        shop_id: "65778745550",
                      },
                      outcome: {
                        advice_code: null,
                        network_advice_code: null,
                        network_decline_code: null,
                        network_status: "approved_by_network",
                        reason: null,
                        risk_level: "normal",
                        seller_message: "Payment complete.",
                        type: "authorized",
                      },
                      paid: true,
                      payment_intent: "pi_3SIYESJm64tOGR3416GsKstb",
                      payment_method: "pm_1SIYESJm64tOGR34oKh0TqYQ",
                      payment_method_details: {
                        card: {
                          amount_authorized: 5280,
                          authorization_code: "192349",
                          brand: "visa",
                          checks: {
                            address_line1_check: "pass",
                            address_postal_code_check: "pass",
                            cvc_check: null,
                          },
                          country: "GB",
                          description: "Visa Gold",
                          ds_transaction_id: null,
                          exp_month: 2,
                          exp_year: 2030,
                          extended_authorization: {
                            status: "disabled",
                          },
                          fingerprint: "4gy3ykry3G4TGQXM",
                          funding: "credit",
                          iin: "402396",
                          incremental_authorization: {
                            status: "unavailable",
                          },
                          installments: null,
                          issuer: "VANQUIS BANK LIMITED",
                          last4: "2670",
                          mandate: null,
                          moto: false,
                          multicapture: {
                            status: "unavailable",
                          },
                          network: "visa",
                          network_token: {
                            used: true,
                          },
                          network_transaction_id: "585288618841652",
                          overcapture: {
                            maximum_amount_capturable: 6072,
                            status: "available",
                          },
                          overcapture_supported: true,
                          payment_account_reference: "V0010013824238482786156262072",
                          regulated_status: "unregulated",
                          three_d_secure: null,
                          wallet: null,
                        },
                        type: "card",
                      },
                      refunded: false,
                      source: null,
                      status: "succeeded",
                      mit_params: {
                        network_transaction_id: "585288618841652",
                      },
                    },
                    object: "refund",
                    reason: null,
                    status: "succeeded",
                    created: 1761642626,
                    currency: "gbp",
                    metadata: {
                      payments_extension: "true",
                      payments_extension_type: "card",
                      reconciliation_flow: "payments_api",
                      refund_id: "z1sQmEBo489U6lw7K0jlt0k5w",
                    },
                    payment_method_details: {
                      card: {
                        acquirer_reference_number: null,
                        acquirer_reference_number_status: "pending",
                      },
                      type: "card",
                    },
                    mit_params: {},
                  },
                  source_name: "287739805697",
                  status: "success",
                  test: false,
                  user_id: null,
                  payment_details: {
                    credit_card_bin: "402396",
                    avs_result_code: "Y",
                    cvv_result_code: null,
                    credit_card_number: "•••• •••• •••• 2670",
                    credit_card_company: "Visa",
                    buyer_action_info: null,
                    credit_card_name: "Barry Slade",
                    credit_card_wallet: "shopify_pay",
                    credit_card_expiration_month: 2,
                    credit_card_expiration_year: 2030,
                    payment_method_name: "visa",
                  },
                },
              ],
              refund_line_items: [],
              duties: [],
            },
          ],
          shipping_address: {
            province: "England",
            country: "United Kingdom",
            country_code: "GB",
            province_code: "ENG",
          },
          shipping_lines: [
            {
              id: 3802895679694,
              carrier_identifier: null,
              code: "Royal Mail 48 (4–7 days)",
              discounted_price: "2.90",
              discounted_price_set: {
                shop_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
              },
              is_removed: false,
              phone: null,
              price: "2.90",
              price_set: {
                shop_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
              },
              requested_fulfillment_service_id: null,
              source: "shopify",
              title: "Royal Mail 48 (4–7 days)",
              tax_lines: [],
              discount_allocations: [],
            },
          ],
        },
        {
          id: 4635202617550,
          admin_graphql_api_id: "gid:\/\/shopify\/Order\/4635202617550",
          app_id: 580111,
          browser_ip: "109.148.103.134",
          buyer_accepts_marketing: false,
          cancel_reason: null,
          cancelled_at: null,
          cart_token: "hWN49EIkh6BgLG1GKsSzjxyd",
          checkout_id: 33492790706382,
          checkout_token: "a7690048e7e74f4cad1a513b12bb7545",
          client_details: {
            accept_language: "en-GB",
            browser_height: null,
            browser_ip: "109.148.103.134",
            browser_width: null,
            session_hash: null,
            user_agent:
              "Mozilla\/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit\/605.1.15 (KHTML, like Gecko) Version\/18.6.2 Mobile\/15E148 Safari\/604.1 musical_ly_40.8.0 JsSdk\/2.0 NetType\/WIFI Channel\/App Store ByteLocale\/en Region\/GB isDarkMode\/0 WKWebView\/1 RevealType\/Dialog",
          },
          closed_at: "2025-10-15T16:40:03-03:00",
          confirmation_number: "UN2XQ60JR",
          confirmed: true,
          created_at: "2025-10-15T12:35:12-03:00",
          currency: "GBP",
          current_subtotal_price: "49.90",
          current_subtotal_price_set: {
            shop_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
          },
          current_total_additional_fees_set: null,
          current_total_discounts: "0.00",
          current_total_discounts_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          current_total_duties_set: null,
          current_total_price: "52.80",
          current_total_price_set: {
            shop_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
          },
          current_total_tax: "0.00",
          current_total_tax_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          customer_locale: "en-GB",
          device_id: null,
          discount_codes: [],
          duties_included: false,
          estimated_taxes: false,
          financial_status: "paid",
          fulfillment_status: "fulfilled",
          landing_site:
            "\/products\/maribel?utm_source=tiktok&utm_medium=paid&utm_id=1845615933937698&utm_campaign=CP Smart \/ TK 121F \/ Νіkе® Tall Essential 2-Piece Set - Teste de criativos 01&ttclid=E_C_P_Ct4BU6aXsHyXb4a_ZKlFoy-LGB-ZQpORJikL0d2HeFlIsJHExci3JFZ8xBzJMWHAf4TALm1",
          landing_site_ref: null,
          location_id: null,
          merchant_business_entity_id: "11209703630",
          merchant_of_record_app_id: null,
          name: "#2063",
          note: null,
          note_attributes: [
            {
              name: "country",
              value: "GB",
            },
            {
              name: "fbp",
              value: "fb.1.1760541398666.1796075079",
            },
            {
              name: "host",
              value: "https:\/\/rivelleoutlet.com",
            },
            {
              name: "locale",
              value: "en",
            },
            {
              name: "sh",
              value: "956",
            },
            {
              name: "sw",
              value: "440",
            },
            {
              name: "ttclid",
              value:
                "E_C_P_Ct4BU6aXsHyXb4a_ZKlFoy-LGB-ZQpORJikL0d2HeFlIsJHExci3JFZ8xBzJMWHAf4TALm1FKtSFRsg7_mJPlOZF-FSq2BccRvtb8m0MBxZk4SoxBnrK1n5KZH98tjKuTJbHVyH6pRBVRqEeTMm9ezZtcjVfk5aydeY-y8YtLYMPxR43hUWvp0mGYJ6CnGkDXtcab_MfPo-oHhyYX5BcfkOh3aveipJg-ApyVxgUU0pBQrTdY0A7V6jhxH3ZH-pUTbO_bbJp-CPG9wFek8_lEPaq88Kwr70mrJGnl0L0guXbEgR2Mi4w",
            },
            {
              name: "ttp",
              value: "7ZuiRbIhlYt0zmcPUurWo9nWarA.tt.0",
            },
            {
              name: "utm_campaign",
              value: "CP Smart \/ TK 121F \/ Νіkе® Tall Essential 2-Piece Set - Teste de criativos 01",
            },
            {
              name: "utm_id",
              value: "1845615933937698",
            },
            {
              name: "utm_medium",
              value: "paid",
            },
            {
              name: "utm_source",
              value: "tiktok",
            },
            {
              name: "auid",
              value: "477874076.1760541400",
            },
            {
              name: "scid",
              value: "DLPsKCipw66_vPaSL28f6NvIqKkdWOJ6",
            },
          ],
          number: 1063,
          order_number: 2063,
          original_total_additional_fees_set: null,
          original_total_duties_set: null,
          payment_gateway_names: ["shopify_payments"],
          po_number: null,
          presentment_currency: "GBP",
          processed_at: "2025-10-15T12:35:07-03:00",
          reference: null,
          referring_site: "https:\/\/www.tiktok.com\/",
          source_identifier: null,
          source_name: "web",
          source_url: null,
          subtotal_price: "49.90",
          subtotal_price_set: {
            shop_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
          },
          tags: "",
          tax_exempt: false,
          tax_lines: [],
          taxes_included: false,
          test: false,
          token: "09222bb4597101fd74f7ca58d2156157",
          total_cash_rounding_payment_adjustment_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_cash_rounding_refund_adjustment_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_discounts: "0.00",
          total_discounts_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_line_items_price: "49.90",
          total_line_items_price_set: {
            shop_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "49.90",
              currency_code: "GBP",
            },
          },
          total_outstanding: "0.00",
          total_price: "52.80",
          total_price_set: {
            shop_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "52.80",
              currency_code: "GBP",
            },
          },
          total_shipping_price_set: {
            shop_money: {
              amount: "2.90",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "2.90",
              currency_code: "GBP",
            },
          },
          total_tax: "0.00",
          total_tax_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "GBP",
            },
          },
          total_tip_received: "0.00",
          total_weight: 1000,
          updated_at: "2025-10-15T20:01:49-03:00",
          user_id: null,
          billing_address: {
            province: "England",
            country: "United Kingdom",
            country_code: "GB",
            province_code: "ENG",
          },
          customer: {
            id: 6877064298702,
            created_at: "2025-10-15T12:35:07-03:00",
            updated_at: "2025-10-28T07:29:55-03:00",
            state: "disabled",
            note: null,
            verified_email: true,
            multipass_identifier: null,
            tax_exempt: false,
            email_marketing_consent: {
              state: "not_subscribed",
              opt_in_level: "single_opt_in",
              consent_updated_at: null,
            },
            sms_marketing_consent: null,
            tags: "Login with Shop, Shop",
            currency: "GBP",
            tax_exemptions: [],
            admin_graphql_api_id: "gid:\/\/shopify\/Customer\/6877064298702",
            default_address: {
              id: 7803907539150,
              customer_id: 6877064298702,
              company: null,
              province: "England",
              country: "United Kingdom",
              province_code: "ENG",
              country_code: "GB",
              country_name: "United Kingdom",
              default: true,
            },
          },
          discount_applications: [],
          fulfillments: [
            {
              id: 4144828711118,
              admin_graphql_api_id: "gid:\/\/shopify\/Fulfillment\/4144828711118",
              created_at: "2025-10-15T16:40:02-03:00",
              location_id: 71835844814,
              name: "#2063.1",
              order_id: 4635202617550,
              origin_address: {
                city: "Miami",
                zip: "33101",
                country_code: "US",
              },
              receipt: {},
              service: "manual",
              shipment_status: null,
              status: "success",
              tracking_company: "DHL Express",
              tracking_number: "JD262915657647840931",
              tracking_numbers: ["JD262915657647840931"],
              tracking_url: "https:\/\/rivelle.trackship17.com\/?tracking=JD262915657647840931",
              tracking_urls: ["https:\/\/rivelle.trackship17.com\/?tracking=JD262915657647840931"],
              updated_at: "2025-10-15T16:40:03-03:00",
              line_items: [
                {
                  id: 11571888914638,
                  admin_graphql_api_id: "gid:\/\/shopify\/LineItem\/11571888914638",
                  attributed_staffs: [],
                  current_quantity: 1,
                  fulfillable_quantity: 0,
                  fulfillment_service: "manual",
                  fulfillment_status: "fulfilled",
                  gift_card: false,
                  grams: 1000,
                  name: "Νіkе®  Tall Essential 2-Piece Set - Black \/ S",
                  price: "49.90",
                  price_set: {
                    shop_money: {
                      amount: "49.90",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "49.90",
                      currency_code: "GBP",
                    },
                  },
                  product_exists: false,
                  product_id: null,
                  properties: [
                    {
                      name: "__kaching_bundles",
                      value: '{"deal":"0xY4","main":true}',
                    },
                  ],
                  quantity: 1,
                  requires_shipping: true,
                  sku: null,
                  taxable: true,
                  title: "Νіkе®  Tall Essential 2-Piece Set",
                  total_discount: "0.00",
                  total_discount_set: {
                    shop_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                    presentment_money: {
                      amount: "0.00",
                      currency_code: "GBP",
                    },
                  },
                  variant_id: null,
                  variant_inventory_management: null,
                  variant_title: "Black \/ S",
                  vendor: "RIVELLE",
                  tax_lines: [],
                  duties: [],
                  discount_allocations: [],
                },
              ],
            },
          ],
          line_items: [
            {
              id: 11571888914638,
              admin_graphql_api_id: "gid:\/\/shopify\/LineItem\/11571888914638",
              attributed_staffs: [],
              current_quantity: 1,
              fulfillable_quantity: 0,
              fulfillment_service: "manual",
              fulfillment_status: "fulfilled",
              gift_card: false,
              grams: 1000,
              name: "Νіkе®  Tall Essential 2-Piece Set - Black \/ S",
              price: "49.90",
              price_set: {
                shop_money: {
                  amount: "49.90",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "49.90",
                  currency_code: "GBP",
                },
              },
              product_exists: false,
              product_id: null,
              properties: [
                {
                  name: "__kaching_bundles",
                  value: '{"deal":"0xY4","main":true}',
                },
              ],
              quantity: 1,
              requires_shipping: true,
              sku: null,
              taxable: true,
              title: "Νіkе®  Tall Essential 2-Piece Set",
              total_discount: "0.00",
              total_discount_set: {
                shop_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "0.00",
                  currency_code: "GBP",
                },
              },
              variant_id: null,
              variant_inventory_management: null,
              variant_title: "Black \/ S",
              vendor: "RIVELLE",
              tax_lines: [],
              duties: [],
              discount_allocations: [],
            },
          ],
          payment_terms: null,
          refunds: [],
          shipping_address: {
            province: "England",
            country: "United Kingdom",
            country_code: "GB",
            province_code: "ENG",
          },
          shipping_lines: [
            {
              id: 3802856095950,
              carrier_identifier: null,
              code: "Royal Mail 48 (4–7 days)",
              discounted_price: "2.90",
              discounted_price_set: {
                shop_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
              },
              is_removed: false,
              phone: null,
              price: "2.90",
              price_set: {
                shop_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
                presentment_money: {
                  amount: "2.90",
                  currency_code: "GBP",
                },
              },
              requested_fulfillment_service_id: null,
              source: "shopify",
              title: "Royal Mail 48 (4–7 days)",
              tax_lines: [],
              discount_allocations: [],
            },
          ],
        },
      ],
    };
    // Processar e agregar os dados
    //let disputes = disp.disputes || [];
    //let orders = ord.orders || [];
    // Mantém cópias completas para métricas "all time" (ignoram filtro de data)
    const addByChargemindFlag = (d: any) => {
      const initiatedAt = d?.initiated_at ? new Date(d.initiated_at) : null;
      const by_chargemind =
        shopifyConnectedAt && initiatedAt ? initiatedAt >= shopifyConnectedAt : false;
      return { ...d, by_chargemind };
    };

    const disputesAllTime = Array.isArray(mappedDisputes)
      ? mappedDisputes.map(addByChargemindFlag)
      : [];
    const ordersAllTime = Array.isArray(ordersData) ? [...ordersData] : [];

    let disputes = (mappedDisputes || []).map(addByChargemindFlag);
    let orders = ordersData || [];
    // Totais brutos (sem filtro de datas) para Account Health
    const totalDisputesAllTime = disputes.length;
    const totalOrdersAllTime = orders.length;

    console.log(disputes);


    console.log("Disputas antes filtro:", disputes.length);
    console.log("Pedidos antes filtro:", orders.length);

    // Filtrar disputas por data e converter valores para USD
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      console.log("Filtrando disputas entre:", start, "e", end);

      disputes = disputes.filter((d: any) => {
        if (!d.initiated_at) return false;
        const disputeDate = new Date(d.initiated_at);
        return disputeDate >= start && disputeDate <= end;
      });

      console.log("Disputas após filtro:", disputes.length);
    }

    // Converter todos os amounts para USD e adicionar dados do pedido
    disputes = disputes.map((d: any) => {
      const currency = d.currency || "USD";
      const amount = Number(d.amount) || 0;
      let amountInUSD = amount;
      if (currency !== "USD" && exchangeRates[currency]) {
        // Converter de USD para a moeda original, depois inverter
        amountInUSD = amount / exchangeRates[currency];
      }

      // Buscar pedido relacionado
      const relatedOrder = orders.find((o: any) => o.id === d.order_id);

      return {
        ...d,
        amount: amountInUSD.toFixed(2),
        original_amount: amount,
        original_currency: currency,
        order: relatedOrder
          ? {
              tracking_number: relatedOrder.fulfillments?.[0]?.tracking_number || null,
              tracking_url: relatedOrder.fulfillments?.[0]?.tracking_url || null,
              tracking_company: relatedOrder.fulfillments?.[0]?.tracking_company || null,
              shipping_address: relatedOrder.shipping_address || null,
            }
          : null,
      };
    });
    const usd = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Calcular métricas
    const activeDisputes = disputes.filter((d: any) => d.status !== "won" && d.status !== "lost").length;
    const activeDisputeAmount = disputes.reduce((sum: number, d: any) => {
      const status = String(d?.status).toLowerCase();
      if (status === "won" || status === "lost") return sum;
      return sum + (Number(d?.amount) || 0);
    }, 0);

    const wonDisputes = disputes.filter((d: any) => d.status === "won").length;
    const lostDisputes = disputes.filter((d: any) => d.status === "lost").length;

    const totalDisputes = disputes.length;
    const totalDisputesAmount = disputes.reduce((sum: number, d: any) => {
      const val = Number(d?.amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const totalFinishedQnt = disputes.filter((d: any) => {
      const status = String(d?.status ?? "")
        .toLowerCase()
        .trim();
      return (status === "won" || status === "lost") && d?.finalized_on != null;
    }).length;
    const winRate = totalFinishedQnt > 0 ? (wonDisputes / totalFinishedQnt) * 100 : 0;

    const wonDisputesAmount = disputes.reduce((sum: number, d: any) => {
      const status = String(d?.status ?? "")
        .toLowerCase()
        .trim();
      if (status === "won") {
        const val = Number(d?.amount);
        return sum + (isNaN(val) ? 0 : val);
      }
      return sum;
    }, 0);

    const totalFinishedAmount = disputes.reduce((sum: number, d: any) => {
      const status = String(d?.status ?? "")
        .toLowerCase()
        .trim();
      const finalized = d?.finalized_on != null;
      if ((status === "won" || status === "lost") && finalized) {
        const val = Number(d?.amount);
        return sum + (isNaN(val) ? 0 : val);
      }
      return sum;
    }, 0);
    const winRateAmount = totalFinishedQnt > 0 ? (wonDisputesAmount / totalFinishedAmount) * 100 : 0;

    const healthAccountBase =
      totalOrdersAllTime > 0 ? (totalDisputesAllTime / totalOrdersAllTime) * 100 : 0;
    let healthAccount = healthAccountBase;
    let healthAccountStatus = "Crítico";
    if (healthAccount <= 0.75) {
      healthAccountStatus = "Saudável";
    } else if (healthAccount > 0.75 && healthAccount <= 0.99) {
      healthAccountStatus = "Atenção";
    }
    // Guardar os valores de período completo para uso no dashboard (ignorando filtros de data)
    const healthAccountAllTime = healthAccountBase;
    const healthAccountStatusAllTime = healthAccountStatus;

    const evidenceSubmitted = disputes.filter((d: any) => d.evidence_sent_on !== null).length;
    const evidenceSubmittedAmount = disputes.reduce((sum: number, d: any) => {
      if (d.evidence_sent_on == null) return sum;
      return sum + (Number(d?.amount) || 0);
    }, 0);

    const review = disputes.filter((d: any) => d.status === "under_review").length;
    const reviewAmount = disputes.reduce((sum: number, d: any) => {
      if (d.status !== "under_review") return sum;
      return sum + (Number(d?.amount) || 0);
    }, 0);

    function formatMinutesHM(totalMinutes: number) {
      // arredonda para o minuto mais próximo
      const mins = Math.round(totalMinutes);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
    }
    const savedTime = formatMinutesHM((totalDisputes ?? 0) * 8.7);

    // Tradução dos motivos
    const reasonTranslations: Record<string, string> = {
      fraudulent: "Fraudulenta",
      unrecognized: "Não reconhecida",
      duplicate: "Cobrança duplicada",
      subscription_cancelled: "Cobrança recorrente cancelada",
      product_unacceptable: "Produto diferente do descrito",
      product_not_received: "Produto não recebido",
      credit_not_processed: "Crédito não processado",
      general: "Outro",
      incorrect_account_details: "Detalhes de conta incorretos",
      insufficient_funds: "Fundos insuficientes",
      bank_cannot_process_charge: "Banco não pode processar",
      debit_not_authorized: "Débito não autorizado",
      customer_initiated: "Iniciado pelo cliente",
      unknown: "Desconhecido",
      subscription_canceled: "Assinatura cancelada"
    };

    // Agrupar por motivo com contagem e valor total
    // helper para normalizar amount
    const normalizeAmount = (d: any): number => {
      // tenta várias chaves comuns
      let raw: any = d?.amount ?? d?.currency_amount ?? d?.amount_in_cents ?? d?.amount_cents ?? 0;

      // string tipo "R$ 1.234,56"
      if (typeof raw === "string") {
        const s = raw
          .replace(/[^\d,.-]+/g, "") // remove R$, espaços etc.
          .replace(/\.(?=\d{3}(?:\D|$))/g, "") // tira pontos de milhar
          .replace(",", "."); // vírgula -> ponto
        raw = parseFloat(s);
      }

      let n = Number(raw);
      if (!Number.isFinite(n)) n = 0;

      // Se veio em centavos, divide por 100
      if ("amount_in_cents" in d || "amount_cents" in d) n = n / 100;

      return n;
    };

    // ---- Agregar por motivo: count + amount (normalizado) ----
    type Agg = { count: number; amount: number };
    const reasonsAgg: Record<string, Agg> = {};

    disputes.forEach((d: any) => {
      const reason = d?.reason || "unknown";
      if (reason === "incorrect_account_details") {
        return;
      }
      const translated = reasonTranslations[reason] || reason;
      const amount = normalizeAmount(d);
      if (!reasonsAgg[translated]) reasonsAgg[translated] = { count: 0, amount: 0 };
      reasonsAgg[translated].count += 1;
      reasonsAgg[translated].amount += amount;
    });
    const disputesByReason = Object.entries(reasonsAgg).map(([name, data]) => ({
      name,
      value: data.count, // para gráficos que usam "value"
      count: data.count, // se quiser usar explicitamente
      amount: Number(data.amount.toFixed(2)),
    }));

    // Tipos para agregação por mês
    type MonthAgg = { count: number; amount: number };

    // Nomes dos meses para usar em várias agregações
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Agrupar por processador de pagamento por mês
    type ProcessorMonthAgg = Record<string, MonthAgg>; // Dinâmico por processador
    const processorMonthsAgg: Record<string, ProcessorMonthAgg> = {};

    // Primeiro, descobrir todos os processadores únicos
    const uniqueProcessors = new Set<string>();
    disputes.forEach((d: any) => {
      const orderId = d.order_id;
      const order = orders.find((o: any) => o.id === orderId);
      const gateway = order?.payment_gateway_names?.[0] || "Desconhecido";
      const pedidoId = order?.name || "";
      d.reasonTranslated = reasonTranslations[d.reason];
      d.pedidoId = pedidoId;
      d.gateway = gateway;
      d.createAt = order?.created_at || "-";
      if (order && Array.isArray(order.line_items)) {
        const totalQuantity = order.line_items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        d.ordersQnt = totalQuantity;
      } else {
        d.ordersQnt = 0;
      }
      d.amountOrdem = order?.current_subtotal_price || "0";

      uniqueProcessors.add(gateway);

      if (d.initiated_at) {
        const date = new Date(d.initiated_at);
        const year = date.getFullYear().toString().slice(-2);
        const monthKey = `${monthNames[date.getMonth()]} '${year}`;
        const amount = normalizeAmount(d);

        if (!processorMonthsAgg[monthKey]) {
          processorMonthsAgg[monthKey] = {
            all: { count: 0, amount: 0 },
          };
          // Inicializar todos os processadores
          uniqueProcessors.forEach((p) => {
            processorMonthsAgg[monthKey][p] = { count: 0, amount: 0 };
          });
        }

        // Garantir que o processador existe no mês
        if (!processorMonthsAgg[monthKey][gateway]) {
          processorMonthsAgg[monthKey][gateway] = { count: 0, amount: 0 };
        }

        // Adiciona a todos
        processorMonthsAgg[monthKey].all.count += 1;
        processorMonthsAgg[monthKey].all.amount += amount;

        // Adiciona ao processador específico
        processorMonthsAgg[monthKey][gateway].count += 1;
        processorMonthsAgg[monthKey][gateway].amount += amount;
      }
    });
    // console.log(disputes)
    type Network = "Visa" | "Mastercard" | "Discover" | "Amex" | "Outros";
    function detectNetwork(code?: string | null): Network {
      if (!code) return "Outros";
      const c = String(code).trim();

      if (/^(1[0-3])\.\d+$/.test(c) || /^(1[0-3])\d{2}$/.test(c)) return "Visa";
      if (/^48\d{2}$/.test(c)) return "Mastercard";
      if (/^45\d{2}$/.test(c)) return "Discover";
      if (/^[ACFM]\d{1,2}$/i.test(c)) return "Amex";

      return "Outros";
    }

    const disputesByNetwork: Record<string, { count: number; amount: number }> = {};
    disputes.forEach((d: any) => {
      const cardNetwork = detectNetwork(d.network_reason_code) || "other";
      // const network = d.network_reason_code?.substring(0, 4) || "other";
      // let cardNetwork = "Outros";
      // if (network.startsWith("4")) cardNetwork = "Visa";
      // else if (network.startsWith("5")) cardNetwork = "Mastercard";
      // else if (network.startsWith("3")) cardNetwork = "Amex";

      const amount = normalizeAmount(d);

      if (!disputesByNetwork[cardNetwork]) {
        disputesByNetwork[cardNetwork] = { count: 0, amount: 0 };
      }
      disputesByNetwork[cardNetwork].count += 1;
      disputesByNetwork[cardNetwork].amount += amount;
    });
    // Disputas por mês (últimos 6 meses) - agregado por count + amount e status dinâmicos
    type MonthStatusAgg = Record<string, MonthAgg>; // Dinâmico por status
    const monthsAgg: Record<string, MonthStatusAgg> = {};

    // Primeiro, descobrir todos os status únicos
    const uniqueStatuses = new Set<string>();
    disputes.forEach((d: any) => {
      if (d.status) uniqueStatuses.add(d.status);
    });

    disputes.forEach((d: any) => {
      if (d.initiated_at) {
        const date = new Date(d.initiated_at);
        const year = date.getFullYear().toString().slice(-2);
        const monthKey = `${monthNames[date.getMonth()]} '${year}`;
        const amount = normalizeAmount(d);
        const status = d.status || "unknown";

        if (!monthsAgg[monthKey]) {
          monthsAgg[monthKey] = {
            all: { count: 0, amount: 0 },
          };
          // Inicializar todos os status
          uniqueStatuses.forEach((s) => {
            monthsAgg[monthKey][s] = { count: 0, amount: 0 };
          });
        }

        // Adiciona a todos
        monthsAgg[monthKey].all.count += 1;
        monthsAgg[monthKey].all.amount += amount;

        // Adiciona ao status específico
        if (monthsAgg[monthKey][status]) {
          monthsAgg[monthKey][status].count += 1;
          monthsAgg[monthKey][status].amount += amount;
        }
      }
    });

    // Disputadores reincidentes (clientes com múltiplas disputas)
    const customerDisputes: Record<string, number> = {};
    disputes.forEach((d: any) => {
      const orderId = d.order_id;
      const order = orders.find((o: any) => o.id === orderId);
      if (order?.customer && (order.customer as any).email) {
        const email = (order.customer as any).email;
        customerDisputes[email] = (customerDisputes[email] || 0) + 1;
      }
    });

    const repeatDisputers = Object.entries(customerDisputes)
      .filter(([_, count]) => count > 1)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Disputas por país
    const disputesByCountry: Record<string, { country_code: string; count: number; amount: number; won: number }> = {};
    disputes.forEach((d: any) => {
      const orderId = d.order_id;
      const order = orders.find((o: any) => o.id === orderId);
      if (order?.shipping_address?.country) {
        const country = order.shipping_address.country;
        if (!disputesByCountry[country]) {
          disputesByCountry[country] = { country_code: "", count: 0, amount: 0, won: 0 };
        }
        disputesByCountry[country].count += 1;
        disputesByCountry[country].country_code = order.shipping_address.country_code;
        disputesByCountry[country].amount += parseFloat(d.amount || 0);
        if (d.status === "won") {
          disputesByCountry[country].won += 1;
        }
      }
    });

    // Disputas por categoria (baseado em produtos)
    const disputesByCategory: Record<string, number> = {
      Eletrônicos: 0,
      Roupas: 0,
      Alimentos: 0,
      Outros: 0,
    };

    disputes.forEach((d: any) => {
      const orderId = d.order_id;
      const order = orders.find((o: any) => o.id === orderId);
      let calculatedTotal = 0;
      if (order && Array.isArray(order.line_items)) {
        d.products = order.line_items.map((item: any) => ({
          name: item.name,
          price: item.price,
        }));
        calculatedTotal = order.line_items.reduce((sum: number, item: any) => {
          return sum + parseFloat(item.price);
        }, 0);
        d.totalProductsValue = calculatedTotal;
      } else {
        d.products = [];
        d.totalProductsValue = 0;
      }
      if (order?.line_items?.[0]?.product_id) {
        disputesByCategory["Outros"]++;
      }
    });
    const orderCustomerMap = new Map(orders.map((order) => [order.id, order.customer]));

    // 2b. Use .map() para criar um NOVO array de disputas em O(m)
    const disputesWithCustomer = disputes.map((dispute) => {
      // Procura o cliente no Mapa (instantâneo)
      const customer = orderCustomerMap.get(dispute.order_id);

      // Retorna uma CÓPIA da disputa, com a nova chave 'customer'
      return {
        ...dispute, // Mantém todas as chaves antigas (id, order_id, etc.)
        customer: customer || null, // Adiciona a chave 'customer', ou null se não for encontrada
      };
    });

    // // Criar objeto dinâmico de disputas por mês para cada status
    // const disputesByMonthByStatus: Record<string, any[]> = {};

    // // Adicionar "all" primeiro
    // disputesByMonthByStatus.all = Object.entries(monthsAgg).map(([month, data]) => ({
    //   month,
    //   count: data.all.count,
    //   amount: Number(data.all.amount.toFixed(2)),
    // }));

    // // Adicionar cada status único
    // uniqueStatuses.forEach(status => {
    //   disputesByMonthByStatus[status] = Object.entries(monthsAgg).map(([month, data]) => ({
    //     month,
    //     count: data[status]?.count || 0,
    //     amount: Number((data[status]?.amount || 0).toFixed(2)),
    //   }));
    // });

    // Criar objeto dinâmico de disputas por mês para cada status
    const disputesByMonthByStatus: Record<string, any[]> = {};

    // Adicionar "all" primeiro
    disputesByMonthByStatus.all = Object.entries(monthsAgg).map(([month, data]) => ({
      month,
      count: data.all.count,
      amount: Number(data.all.amount.toFixed(2)),
    }));

    // Adicionar cada status único
    uniqueStatuses.forEach((status) => {
      disputesByMonthByStatus[status] = Object.entries(monthsAgg).map(([month, data]) => ({
        month,
        count: data[status]?.count || 0,
        amount: Number((data[status]?.amount || 0).toFixed(2)),
      }));
    });

    const disputesByMonth = disputesByMonthByStatus;

    // Calcular taxa de disputas por mês usando dados reais
    let disputesRateByMonth: Array<{ month: string; count: number; amount: number; rate: number }> = [];
    if (orders && orders.length > 0 && disputesByMonthByStatus.all) {
      disputesRateByMonth = disputesByMonthByStatus.all.map(
        (item: { month: string; count: number; amount: number }) => {
          const disputeRate = (item.count / orders.length) * 100;
          return {
            ...item,
            amount: Number(disputeRate.toFixed(2)),
            rate: disputeRate,
          };
        },
      );
      // console.log(disputesRateByMonth);
    }

    // Função para formatar nome do gateway
    const formatGatewayName = (name: string): string => {
      if (!name || name === "Desconhecido") return name;

      return name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    };

    // Agrupar disputas por gateway (processador de pagamento)
    const disputesByGateway: Record<string, { count: number; amount: number }> = {};

    disputes.forEach((d: any) => {
      const orderId = d.order_id;
      const order = orders.find((o: any) => o.id === orderId);

      const rawGateway = order?.payment_gateway_names?.[0] || "Desconhecido";
      const gateway = formatGatewayName(rawGateway);
      const amount = normalizeAmount(d);

      if (!disputesByGateway[gateway]) {
        disputesByGateway[gateway] = { count: 0, amount: 0 };
      }
      disputesByGateway[gateway].count += 1;
      disputesByGateway[gateway].amount += amount;
    });

    // Converter para array para o gráfico
    const disputesByGatewayArray = Object.entries(disputesByGateway).map(([name, data]) => ({
      name,
      count: data.count,
      amount: Number(data.amount.toFixed(2)),
    }));

    const processorByMonth: Record<string, any[]> = {};
    // Adicionar "all" primeiro
    // processorByMonth.all = Object.entries(processorMonthsAgg).map(([month, data]) => ({
    //   month,
    //   count: data.all.count,
    //   amount: Number(data.all.amount.toFixed(2)),
    // }));

    // Adicionar cada processador único
    uniqueProcessors.forEach((processor) => {
      processorByMonth[processor] = Object.entries(processorMonthsAgg).map(([month, data]) => ({
        month,
        count: data[processor]?.count || 0,
        amount: Number((data[processor]?.amount || 0).toFixed(2)),
      }));
    });

    // Mapear status para labels amigáveis
    const statusLabels: Record<string, string> = {
      needs_response: "Processamento",
      under_review: "Em revisão",
      won: "Ganho",
      lost: "Perdido",
      accepted: "Aceito",
      charge_refunded: "Reembolsado",
      unknown: "Desconhecido",
    };

    const dashboardData = {
      metrics: {
        activeDisputes,
        activeDisputeAmount: usd.format(activeDisputeAmount),
        evidenceSubmitted,
        evidenceSubmittedAmount: `${usd.format(evidenceSubmittedAmount)}`,
        winRate: Number(winRate),
        winRateAmount: Number(winRateAmount),
        totalWon: wonDisputes,
        totalLost: lostDisputes,
        disputeAmount: `${usd.format(activeDisputeAmount)}`,
        review: review,
        totalDisputes,
        totalDisputesAmount: `${usd.format(totalDisputesAmount)}`,
        reviewAmount: `${usd.format(reviewAmount)}`,
        recoveredAmount: `${usd.format(wonDisputesAmount)}`,
        pendingAmount: `${usd.format((activeDisputeAmount / totalDisputes) * (totalDisputes - wonDisputes - lostDisputes))}`,
        savedTime: savedTime,
        savedTimeAmount: `${usd.format(totalDisputes * 4.2)}`,
        healthAccountStatus: healthAccountStatus,
        healthAccount: Number(healthAccount),
        healthAccountAllTime: Number(healthAccountAllTime),
        healthAccountStatusAllTime,
      },
      charts: {
        disputesByReason: disputesByReason,
        disputesByMonth: disputesByMonth,
        disputesRateByMonth: disputesRateByMonth,
        availableStatuses: ["all", ...Array.from(uniqueStatuses)],
        disputesByProcessor: disputesByGatewayArray,
        availableProcessors: ["all", ...Array.from(uniqueProcessors)],
        statusLabels: statusLabels,
        disputesByNetwork: Object.entries(disputesByNetwork).map(([name, data]) => ({
          name,
          count: data.count,
          amount: Number(data.amount.toFixed(2)),
        })),
        disputesByCategory: Object.entries(disputesByCategory).map(([name, value]) => ({
          name,
          value,
        })),
        disputesByCountry: Object.entries(disputesByCountry)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([country, data]) => ({
            country,
            count: data.count,
            amount: Number(data.amount.toFixed(2)),
            code: data.country_code,
            winRate: data.count > 0 ? Math.round((data.won / data.count) * 100) : 0,
          })),
        repeatDisputers,
      },
        rawData: {
        // disputes: disputes.slice(0, 50), // Limitar para performance
        // orders: orders.slice(0, 50),
        disputes: disputes, // Limitar para performance
        orders: orders,
      },
      // Mantém dados completos (sem filtro de data) para métricas all time
      rawDataAllTime: {
        disputes: disputesAllTime,
        orders: ordersAllTime,
      },
    };

    return new Response(JSON.stringify(dashboardData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    //console.error("Erro na função shopify-disputes:", error);
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
