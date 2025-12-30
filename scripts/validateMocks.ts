/**
 * Validação dos mocks com Zod para aderência à API da Shopify.
 *
 * Como rodar:
 *   npx ts-node scripts/validateMocks.ts
 *
 * Requer:
 *   - zod (já presente nas dependencies)
 *   - ts-node (caso não tenha, instale: npm i -D ts-node)
 */

import { z } from "zod";
import { mockDisputes } from "../mocks/disputes.mock.js";

// Helpers
const stringOrNumber = z.union([z.string(), z.number()]);
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}T/i, "deve ser ISO-8601");
const moneyString = z.string(); // Shopify retorna string monetária; não forçamos regex para tolerar mocks

const addressSchema = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  address1: z.string().optional(),
  address2: z.string().nullable().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  province_code: z.string().optional().nullable(),
  country: z.string().optional(),
  country_code: z.string().optional().nullable(),
  zip: z.string().optional(),
  phone: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const nullableAddressSchema = addressSchema.nullable();

const lineItemSchema = z.object({
  id: stringOrNumber,
  variant_id: stringOrNumber.nullable().optional(),
  title: z.string(),
  quantity: z.number(),
  sku: z.string().optional(),
  variant_title: z.string().nullable().optional(),
  vendor: z.string().optional(),
  fulfillment_service: z.string().optional(),
  product_id: stringOrNumber.nullable().optional(),
  requires_shipping: z.boolean(),
  taxable: z.boolean(),
  gift_card: z.boolean(),
  name: z.string(),
  variant_inventory_management: z.string().nullable().optional(),
  properties: z.array(z.any()),
  product_exists: z.boolean().optional(),
  fulfillable_quantity: z.number().optional(),
  grams: z.number().optional(),
  price: moneyString,
  total_discount: moneyString,
  fulfillment_status: z.string().nullable().optional(),
  price_set: z.any(),
  total_discount_set: z.any(),
  discount_allocations: z.array(z.any()),
  duties: z.array(z.any()),
  admin_graphql_api_id: z.string().optional(),
  tax_lines: z.array(z.any()),
});

const shippingLineSchema = z.object({
  id: stringOrNumber,
  title: z.string(),
  price: moneyString,
  code: z.string().nullable().optional(),
  source: z.string().optional(),
  phone: z.string().nullable().optional(),
  requested_fulfillment_service_id: z.any().optional(),
  delivery_category: z.any().optional(),
  carrier_identifier: z.any().optional(),
  discounted_price: moneyString.optional(),
  price_set: z.any().optional(),
  discounted_price_set: z.any().optional(),
  discount_allocations: z.array(z.any()).optional(),
  tax_lines: z.array(z.any()).optional(),
});

const fulfillmentSchema = z.object({
  id: stringOrNumber,
  order_id: stringOrNumber.optional(),
  status: z.string().nullable().optional(),
  created_at: isoDateString,
  service: z.string().optional(),
  updated_at: isoDateString.optional(),
  tracking_company: z.string().nullable().optional(),
  shipment_status: z.string().nullable().optional(),
  location_id: z.any().optional(),
  tracking_number: z.string().nullable().optional(),
  tracking_numbers: z.array(z.string()).optional(),
  tracking_url: z.string().nullable().optional(),
  tracking_urls: z.array(z.string()).optional(),
  receipt: z.any().optional(),
  name: z.string().optional(),
  admin_graphql_api_id: z.string().optional(),
  line_items: z.array(lineItemSchema).optional(),
});

const paymentDetailsSchema = z.object({
  credit_card_bin: z.string().nullable().optional(),
  avs_result_code: z.string().nullable().optional(),
  cvv_result_code: z.string().nullable().optional(),
  credit_card_number: z.string().nullable().optional(),
  credit_card_company: z.string().nullable().optional(),
  buyer_action_info: z.any().nullable().optional(),
});

const transactionSchema = z.object({
  id: stringOrNumber,
  order_id: stringOrNumber.optional(),
  kind: z.string(), // authorization | capture | sale | refund | void
  gateway: z.string(),
  status: z.string(),
  message: z.string().nullable().optional(),
  created_at: isoDateString,
  test: z.boolean(),
  authorization: z.string().optional(),
  location_id: z.any().optional(),
  user_id: z.any().optional(),
  parent_id: z.any().nullable().optional(),
  processed_at: isoDateString.optional(),
  device_id: z.any().optional(),
  receipt: z.any(), // pode ser {}
  error_code: z.string().nullable().optional(),
  source_name: z.string().optional(),
  payment_details: paymentDetailsSchema.nullable().optional(),
  amount: moneyString,
  currency: z.string(),
  authorization_expires_at: z.any().optional(),
  extended_authorization_attributes: z.any().optional(),
  gateway_transaction_id: z.string().optional(),
  admin_graphql_api_id: z.string().optional(),
});

const customerSchema = z.object({
  id: stringOrNumber.optional(),
  email: z.string().nullable().optional(),
  accepts_marketing: z.boolean().optional(),
  created_at: isoDateString.optional(),
  updated_at: isoDateString.optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  orders_count: z.number().optional(),
  state: z.string().optional(),
  total_spent: moneyString.optional(),
  last_order_id: stringOrNumber.nullable().optional(),
  note: z.string().nullable().optional(),
  verified_email: z.boolean().optional(),
  multipass_identifier: z.any().nullable().optional(),
  tax_exempt: z.boolean().optional(),
  phone: z.string().nullable().optional(),
  tags: z.string().optional(),
  last_order_name: z.string().optional(),
  currency: z.string().optional(),
  accepts_marketing_updated_at: isoDateString.optional(),
  marketing_opt_in_level: z.string().nullable().optional(),
  tax_exemptions: z.array(z.any()).optional(),
  admin_graphql_api_id: z.string().optional(),
  default_address: nullableAddressSchema.optional(),
});

const orderSchema = z.object({
  id: stringOrNumber,
  email: z.string().nullable().optional(),
  created_at: isoDateString.optional(),
  updated_at: isoDateString.optional(),
  number: z.number().optional(),
  note: z.string().nullable().optional(),
  token: z.string().optional(),
  gateway: z.string().optional(),
  test: z.boolean().optional(),
  total_price: moneyString,
  subtotal_price: moneyString,
  total_weight: z.number().optional(),
  total_tax: moneyString.optional(),
  taxes_included: z.boolean().optional(),
  currency: z.string(),
  financial_status: z.string().optional(),
  confirmed: z.boolean().optional(),
  total_discounts: moneyString.optional(),
  total_line_items_price: moneyString.optional(),
  cart_token: z.string().nullable().optional(),
  buyer_accepts_marketing: z.boolean().optional(),
  name: z.string().optional(),
  referring_site: z.string().nullable().optional(),
  landing_site: z.string().nullable().optional(),
  cancelled_at: isoDateString.nullable().optional(),
  cancel_reason: z.string().nullable().optional(),
  total_price_usd: moneyString.optional(),
  checkout_token: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  user_id: z.any().nullable().optional(),
  location_id: z.any().nullable().optional(),
  source_identifier: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  processed_at: isoDateString.optional(),
  device_id: z.any().nullable().optional(),
  phone: z.string().nullable().optional(),
  customer_locale: z.string().nullable().optional(),
  app_id: z.any().optional(),
  browser_ip: z.string().nullable().optional(),
  landing_site_ref: z.string().nullable().optional(),
  order_number: z.number().optional(),
  discount_applications: z.array(z.any()).optional(),
  discount_codes: z.array(z.any()).optional(),
  note_attributes: z.array(z.any()).optional(),
  payment_gateway_names: z.array(z.string()).optional(),
  processing_method: z.string().nullable().optional(),
  checkout_id: z.any().optional(),
  source_name: z.string().optional(),
  fulfillment_status: z.string().nullable().optional(),
  tax_lines: z.array(z.any()).optional(),
  tags: z.string().optional(),
  contact_email: z.string().nullable().optional(),
  order_status_url: z.string().nullable().optional(),
  presentment_currency: z.string().optional(),
  total_line_items_price_set: z.any().optional(),
  total_discounts_set: z.any().optional(),
  total_shipping_price_set: z.any().optional(),
  subtotal_price_set: z.any().optional(),
  total_price_set: z.any().optional(),
  total_tax_set: z.any().optional(),
  customer: customerSchema,
  billing_address: addressSchema,
  shipping_address: nullableAddressSchema,
  line_items: z.array(lineItemSchema),
  shipping_lines: z.array(shippingLineSchema).optional(),
  fulfillments: z.array(fulfillmentSchema),
  refunds: z.array(z.any()).optional(),
  transactions: z.array(transactionSchema),
});

const disputeSchema = z.object({
  id: z.string().regex(/^\d+$/, "id deve ser numérico (string)"),
  gateway_dispute_id: z.string().optional(),
  charge_id: z.string(),
  order_id: z.string(),
  type: z.string(),
  amount: moneyString,
  currency: z.string(),
  reason: z.string(),
  network_reason_code: z.string().nullable().optional(),
  status: z.string(),
  evidence_due_by: isoDateString.nullable().optional(),
  evidence_sent_on: z.string().nullable().optional(),
  finalized_on: z.string().nullable().optional(),
  initiated_at: z.string().optional(),
  dispute_opened_at: z.string().optional(),
  cardholder_name: z.string().optional(),
  card_brand: z.string().optional(),
  card_last4: z.string().optional(),
  card_bin: z.string().optional(),
  network: z.string().optional(),
  shop_domain: z.string().optional(),
  shop_name: z.string().optional(),
  original_amount: z.number().optional(),
  original_currency: z.string().optional(),
  order: orderSchema,
  reasonTranslated: z.string().optional(),
  pedidoId: z.string().optional(),
  gateway: z.string().optional(),
  createAt: z.string().optional(),
  ordersQnt: z.number().optional(),
  amountOrdem: z.string().optional(),
  products: z.array(z.any()).optional(),
  totalProductsValue: z.number().optional(),
});

function main() {
  const errors: { index: number; id: unknown; issues: string[] }[] = [];

  mockDisputes.forEach((dispute, index) => {
    const parsed = disputeSchema.safeParse(dispute);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      errors.push({ index, id: (dispute as any)?.id, issues });
    }
  });

  if (errors.length === 0) {
    console.log("✅ Todos os disputes mockados passaram na validação Zod.");
    process.exit(0);
  } else {
    console.error("❌ Falhas na validação dos mocks:");
    errors.forEach((e) => {
      console.error(`- Dispute index ${e.index} (id=${e.id}):`);
      e.issues.forEach((iss) => console.error(`  • ${iss}`));
    });
    process.exit(1);
  }
}

main();
