// Utilitário para mapear o payload cru do Webhook de Dispute da Shopify
// para o formato esperado pelo disputeSchema (dados enriquecidos).

type MoneyString = string;

// Tipos mínimos do webhook de dispute da Shopify (parciais para defesa).
export interface ShopifyLineItem {
  id?: string | number;
  title?: string;
  name?: string;
  quantity?: number;
  price?: MoneyString;
}

export interface ShopifyCustomer {
  id?: string | number;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  orders_count?: number;
  verified_email?: boolean;
  accepts_marketing?: boolean;
  default_address?: any;
}

export interface ShopifyOrder {
  id?: string | number;
  name?: string;
  order_number?: number;
  order_id?: string;
  email?: string | null;
  subtotal_price?: MoneyString;
  total_price?: MoneyString;
  // Some Shopify payloads include these fields; keep optional for compatibility
  total_line_items_price?: MoneyString;
  total_discounts?: MoneyString;
  currency?: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  created_at?: string;
  updated_at?: string;
  processed_at?: string;
  payment_gateway_names?: string[];
  discount_applications?: any[];
  discount_codes?: any[];
  note_attributes?: any[];
  tax_lines?: any[];
  customer?: ShopifyCustomer | null;
  billing_address?: any;
  shipping_address?: any;
  line_items?: ShopifyLineItem[];
  shipping_lines?: any[];
  fulfillments?: any[];
  refunds?: any[];
  transactions?: any[];
}

export interface ShopifyDisputeWebhook {
  id?: string | number;
  charge_id?: string;
  order_id?: string;
  type?: string;
  status?: string;
  reason?: string;
  amount?: MoneyString;
  currency?: string;
  created_at?: string;
  evidence_due_by?: string | null;
  order?: ShopifyOrder | null;
}

// Tipo compatível com disputeSchema (simplificado aqui para o retorno).
export interface AppProduct {
  name: string;
  quantity: number;
  price: MoneyString;
}

export interface AppDispute {
  id: string;
  gateway_dispute_id?: string;
  charge_id: string;
  order_id: string;
  type: string;
  amount: MoneyString;
  currency: string;
  reason: string;
  network_reason_code?: string | null;
  status: string;
  evidence_due_by?: string | null;
  evidence_sent_on?: string | null;
  finalized_on?: string | null;
  initiated_at?: string;
  dispute_opened_at?: string;
  cardholder_name?: string;
  card_brand?: string;
  card_last4?: string;
  card_bin?: string;
  network?: string;
  shop_domain?: string;
  shop_name?: string;
  original_amount?: number;
  original_currency?: string;

  order: ShopifyOrder;
  reasonTranslated?: string;
  pedidoId?: string;
  gateway?: string;
  createAt?: string;
  ordersQnt?: number | null;
  amountOrdem?: MoneyString | null;
  products?: AppProduct[];
  totalProductsValue?: number;
}

// Tradução de motivos para Português.
const reasonTranslationMap: Record<string, string> = {
  fraudulent: "Fraudulenta",
  unrecognized: "Não reconhecida",
  product_not_received: "Produto não recebido",
  product_unacceptable: "Produto inaceitável",
  credit_not_processed: "Crédito não processado",
  duplicate: "Cobrança duplicada",
  general: "Geral",
};

const toMoney = (value: any): MoneyString => {
  if (value === undefined || value === null) return "0.00";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export function mapShopifyDisputeToApp(payload: ShopifyDisputeWebhook): AppDispute {
  const order = payload.order || null;

  // Produtos
  const lineItems = order?.line_items ?? [];
  const products: AppProduct[] = lineItems.map((li) => ({
    name: li.title || li.name || "Item",
    quantity: li.quantity ?? 0,
    price: toMoney(li.price ?? "0"),
  }));

  const totalProductsValue = products.reduce((sum, p) => sum + Number(p.price) * (p.quantity || 0), 0);

  // Campos defensivos
  const safeOrder: ShopifyOrder = {
    id: order?.id ?? payload.order_id ?? "order_unknown",
    email: order?.email ?? null,
    subtotal_price: order?.subtotal_price ?? toMoney(payload.amount ?? "0"),
    total_price: order?.total_price ?? toMoney(payload.amount ?? "0"),
    total_line_items_price: order?.total_price ?? toMoney(payload.amount ?? "0"),
    total_discounts: order?.total_discounts ?? "0.00",
    currency: order?.currency ?? payload.currency ?? "USD",
    financial_status: order?.financial_status ?? "paid",
    fulfillment_status: order?.fulfillment_status ?? null,
    name: order?.name ?? "#unknown",
    order_number: order?.order_number ?? 0,
    created_at: order?.created_at ?? payload.created_at ?? null,
    updated_at: order?.updated_at ?? payload.created_at ?? null,
    processed_at: order?.processed_at ?? payload.created_at ?? null,
    payment_gateway_names: order?.payment_gateway_names ?? [],
    discount_applications: order?.discount_applications ?? [],
    discount_codes: order?.discount_codes ?? [],
    note_attributes: order?.note_attributes ?? [],
    tax_lines: order?.tax_lines ?? [],
    customer: order?.customer ?? {
      id: "customer_unknown",
      email: null,
      first_name: null,
      last_name: null,
      orders_count: null as any,
      verified_email: false,
      accepts_marketing: false,
      default_address: null,
    },
    billing_address: order?.billing_address ?? {
      address1: "",
      city: "",
      country: "",
      zip: "",
    },
    shipping_address: order?.shipping_address ?? null,
    line_items: lineItems as any, // já foi processado acima para products; mantemos raw aqui
    shipping_lines: order?.shipping_lines ?? [],
    fulfillments: order?.fulfillments ?? [],
    refunds: order?.refunds ?? [],
    transactions: order?.transactions ?? [],
  };

  return {
    id: String(payload.id ?? "0"),
    gateway_dispute_id: payload.id ? String(payload.id) : undefined,
    charge_id: payload.charge_id ?? "",
    order_id: payload.order_id ?? "",
    type: payload.type ?? "chargeback",
    amount: toMoney(payload.amount ?? "0"),
    currency: payload.currency ?? "USD",
    reason: payload.reason ?? "general",
    network_reason_code: null,
    status: payload.status ?? "open",
    evidence_due_by: payload.evidence_due_by ?? null,
    evidence_sent_on: null,
    finalized_on: null,
    initiated_at: payload.created_at ?? undefined,
    dispute_opened_at: payload.created_at ?? undefined,
    cardholder_name: undefined,
    card_brand: undefined,
    card_last4: undefined,
    card_bin: undefined,
    network: undefined,
    shop_domain: undefined,
    shop_name: undefined,
    original_amount: payload.amount ? Number(payload.amount) : undefined,
    original_currency: payload.currency ?? undefined,

    order: safeOrder,

    reasonTranslated: reasonTranslationMap[payload.reason ?? "general"] ?? payload.reason ?? "Geral",
    pedidoId: payload.order_id ?? undefined,
    gateway: safeOrder.payment_gateway_names?.[0],
    createAt: payload.created_at ?? undefined,
    ordersQnt: order?.customer?.orders_count ?? null,
    amountOrdem: order?.total_price ?? null,
    products,
    totalProductsValue,
  };
}
