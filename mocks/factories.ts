// Helpers para gerar objetos válidos de order, line_item, fulfillment e transaction
// mantendo compatibilidade com o schema Zod em scripts/validateMocks.ts

type MoneyString = string;

export interface LineItem {
  id: string | number;
  variant_id?: string | number | null;
  title: string;
  quantity: number;
  price: MoneyString;
  total_discount: MoneyString;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  properties: any[];
  product_exists?: boolean;
  fulfillable_quantity?: number;
  grams?: number;
  fulfillment_status?: string | null;
  price_set: any;
  total_discount_set: any;
  discount_allocations: any[];
  duties: any[];
  tax_lines: any[];
}

export interface Fulfillment {
  id: string | number;
  status?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  created_at: string;
  updated_at?: string;
  tracking_company?: string | null;
  tracking_numbers?: string[];
  tracking_url?: string | null;
  tracking_urls?: string[];
  shipment_status?: string | null;
  receipt?: any;
  line_items?: LineItem[];
}

export interface PaymentDetails {
  credit_card_bin?: string | null;
  avs_result_code?: string | null;
  cvv_result_code?: string | null;
  credit_card_number?: string | null;
  credit_card_company?: string | null;
  buyer_action_info?: any | null;
}

export interface Transaction {
  id: string | number;
  order_id?: string | number;
  kind: string;
  gateway: string;
  status: string;
  message?: string | null;
  created_at: string;
  test: boolean;
  authorization?: string;
  location_id?: any;
  user_id?: any;
  parent_id?: any | null;
  processed_at?: string;
  device_id?: any;
  receipt: any;
  error_code?: string | null;
  source_name?: string;
  payment_details?: PaymentDetails | null;
  amount: MoneyString;
  currency: string;
  authorization_expires_at?: any;
  extended_authorization_attributes?: any;
  gateway_transaction_id?: string;
  admin_graphql_api_id?: string;
}

export interface Address {
  first_name?: string | null;
  last_name?: string | null;
  address1?: string;
  address2?: string | null;
  city?: string;
  province?: string;
  province_code?: string | null;
  country?: string;
  country_code?: string | null;
  zip?: string;
  phone?: string | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Customer {
  id?: string | number;
  email?: string | null;
  accepts_marketing?: boolean;
  created_at?: string;
  updated_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  orders_count?: number;
  state?: string;
  total_spent?: MoneyString;
  last_order_id?: string | number | null;
  note?: string | null;
  verified_email?: boolean;
  multipass_identifier?: any | null;
  tax_exempt?: boolean;
  phone?: string | null;
  tags?: string;
  last_order_name?: string;
  currency?: string;
  accepts_marketing_updated_at?: string;
  marketing_opt_in_level?: string | null;
  tax_exemptions?: any[];
  admin_graphql_api_id?: string;
  default_address?: Address | null;
}

export interface Order {
  id: string | number;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
  number?: number;
  note?: string | null;
  token?: string;
  gateway?: string;
  test?: boolean;
  total_price: MoneyString;
  subtotal_price: MoneyString;
  total_weight?: number;
  total_tax?: MoneyString;
  taxes_included?: boolean;
  currency: string;
  financial_status?: string;
  confirmed?: boolean;
  total_discounts?: MoneyString;
  total_line_items_price?: MoneyString;
  cart_token?: string | null;
  buyer_accepts_marketing?: boolean;
  name?: string;
  referring_site?: string | null;
  landing_site?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  total_price_usd?: MoneyString;
  checkout_token?: string | null;
  reference?: string | null;
  user_id?: any | null;
  location_id?: any | null;
  source_identifier?: string | null;
  source_url?: string | null;
  processed_at?: string;
  device_id?: any | null;
  phone?: string | null;
  customer_locale?: string | null;
  app_id?: any;
  browser_ip?: string | null;
  landing_site_ref?: string | null;
  order_number?: number;
  discount_applications?: any[];
  discount_codes?: any[];
  note_attributes?: any[];
  payment_gateway_names?: string[];
  processing_method?: string | null;
  checkout_id?: any;
  source_name?: string;
  fulfillment_status?: string | null;
  tax_lines?: any[];
  tags?: string;
  contact_email?: string | null;
  order_status_url?: string | null;
  presentment_currency?: string;
  total_line_items_price_set?: any;
  total_discounts_set?: any;
  total_shipping_price_set?: any;
  subtotal_price_set?: any;
  total_price_set?: any;
  total_tax_set?: any;
  customer: Customer;
  billing_address: Address;
  shipping_address: Address | null;
  line_items: LineItem[];
  shipping_lines?: any[];
  fulfillments: Fulfillment[];
  refunds?: any[];
  transactions: Transaction[];
}

const iso = () => new Date().toISOString();

export function createLineItem(overrides: Partial<LineItem> = {}): LineItem {
  const base: LineItem = {
    id: "li_default",
    variant_id: "var_default",
    title: "Default Item",
    quantity: 1,
    price: "10.00",
    total_discount: "0.00",
    requires_shipping: true,
    taxable: true,
    gift_card: false,
    name: "Default Item",
    properties: [],
    product_exists: true,
    fulfillable_quantity: 1,
    grams: 100,
    fulfillment_status: "fulfilled",
    price_set: {
      shop_money: { amount: "10.00", currency_code: "USD" },
      presentment_money: { amount: "10.00", currency_code: "USD" },
    },
    total_discount_set: {
      shop_money: { amount: "0.00", currency_code: "USD" },
      presentment_money: { amount: "0.00", currency_code: "USD" },
    },
    discount_allocations: [],
    duties: [],
    tax_lines: [],
  };
  return { ...base, ...overrides };
}

export function createFulfillment(overrides: Partial<Fulfillment> = {}): Fulfillment {
  const base: Fulfillment = {
    id: "ful_default",
    status: "delivered",
    tracking_number: "TRACKDEFAULT",
    carrier: "UPS",
    created_at: iso(),
    updated_at: iso(),
    tracking_company: "UPS",
    tracking_numbers: ["TRACKDEFAULT"],
    tracking_url: "https://tracking.ups.com/TRACKDEFAULT",
    tracking_urls: ["https://tracking.ups.com/TRACKDEFAULT"],
    shipment_status: "delivered",
    receipt: {},
    line_items: [],
  };
  return { ...base, ...overrides };
}

export function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const base: Transaction = {
    id: "tx_default",
    kind: "sale",
    gateway: "shopify_payments",
    status: "success",
    message: "",
    created_at: iso(),
    test: false,
    authorization: "auth_default",
    receipt: {},
    amount: "10.00",
    currency: "USD",
    gateway_transaction_id: "pi_default",
    processed_at: iso(),
    payment_details: {
      credit_card_bin: "424242",
      avs_result_code: "Y",
      cvv_result_code: "M",
      credit_card_number: "**** **** **** 4242",
      credit_card_company: "Visa",
      buyer_action_info: null,
    },
  };
  return { ...base, ...overrides };
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  const baseLineItems = overrides.line_items ?? [createLineItem()];
  const baseFulfillments = overrides.fulfillments ?? [createFulfillment()];
  const baseTransactions = overrides.transactions ?? [createTransaction()];

  const base: Order = {
    id: "ord_default",
    email: "customer@example.com",
    subtotal_price: "10.00",
    total_price: "10.00",
    total_line_items_price: "10.00",
    total_discounts: "0.00",
    currency: "USD",
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    name: "#1000",
    order_number: 1000,
    created_at: iso(),
    updated_at: iso(),
    processed_at: iso(),
    payment_gateway_names: ["shopify_payments"],
    discount_applications: [],
    discount_codes: [],
    note_attributes: [],
    tax_lines: [],
    customer: {
      id: "cust_default",
      first_name: "Jane",
      last_name: "Doe",
      email: "customer@example.com",
      accepts_marketing: false,
      verified_email: true,
      created_at: iso(),
      updated_at: iso(),
      orders_count: 1,
      total_spent: "10.00",
      default_address: null,
    },
    billing_address: {
      first_name: "Jane",
      last_name: "Doe",
      address1: "123 Default St",
      address2: null,
      city: "Default City",
      province: "CA",
      province_code: "CA",
      country: "United States",
      country_code: "US",
      zip: "90001",
      phone: "+15555550100",
      latitude: 34.05,
      longitude: -118.24,
      name: "Jane Doe",
    },
    shipping_address: {
      first_name: "Jane",
      last_name: "Doe",
      address1: "123 Default St",
      address2: null,
      city: "Default City",
      province: "CA",
      province_code: "CA",
      country: "United States",
      country_code: "US",
      zip: "90001",
      phone: "+15555550100",
      latitude: 34.05,
      longitude: -118.24,
      name: "Jane Doe",
    },
    line_items: baseLineItems,
    shipping_lines: [],
    fulfillments: baseFulfillments,
    refunds: [],
    transactions: baseTransactions,
  };

  return { ...base, ...overrides, line_items: baseLineItems, fulfillments: baseFulfillments, transactions: baseTransactions };
}
