// Mock data for testing UI without API calls

export const mockMetrics = {
  activeDisputes: 45,
  activeDisputeAmount: "$4,250",
  evidenceSubmitted: 32,
  evidenceSubmittedAmount: "$3,100",
  winRate: 42.5,
  winRateAmount: 38.2,
  totalWon: 12,
  totalLost: 18,
  disputeAmount: "$4,250",
  review: 28,
  totalDisputes: 75,
  totalDisputesAmount: "$7,350",
  reviewAmount: "$2,800",
  recoveredAmount: "$1,890",
  pendingAmount: "$3,200",
  savedTime: "18h 30m",
  savedTimeAmount: "$520",
  healthAccountStatus: "Crítico",
  healthAccount: 11.9,
};

export const mockCharts = {
  disputesByReason: [
    { name: "Produto não recebido", value: 35, count: 35, amount: 3250.00 },
    { name: "Produto diferente do descrito", value: 22, count: 22, amount: 2100.50 },
    { name: "Crédito não processado", value: 8, count: 8, amount: 750.00 },
    { name: "Fraudulenta", value: 6, count: 6, amount: 890.00 },
    { name: "Cobrança duplicada", value: 4, count: 4, amount: 360.00 },
  ],
  disputesByMonth: {
    all: [
      { month: "Jul '25", count: 12, amount: 1100 },
      { month: "Ago '25", count: 15, amount: 1350 },
      { month: "Set '25", count: 18, amount: 1620 },
      { month: "Out '25", count: 14, amount: 1260 },
      { month: "Nov '25", count: 16, amount: 1440 },
    ],
    needs_response: [
      { month: "Jul '25", count: 3, amount: 280 },
      { month: "Ago '25", count: 4, amount: 360 },
      { month: "Set '25", count: 5, amount: 450 },
      { month: "Out '25", count: 3, amount: 270 },
      { month: "Nov '25", count: 4, amount: 360 },
    ],
    under_review: [
      { month: "Jul '25", count: 4, amount: 360 },
      { month: "Ago '25", count: 5, amount: 450 },
      { month: "Set '25", count: 6, amount: 540 },
      { month: "Out '25", count: 5, amount: 450 },
      { month: "Nov '25", count: 6, amount: 540 },
    ],
    won: [
      { month: "Jul '25", count: 3, amount: 270 },
      { month: "Ago '25", count: 4, amount: 360 },
      { month: "Set '25", count: 4, amount: 360 },
      { month: "Out '25", count: 3, amount: 270 },
      { month: "Nov '25", count: 3, amount: 270 },
    ],
    lost: [
      { month: "Jul '25", count: 2, amount: 190 },
      { month: "Ago '25", count: 2, amount: 180 },
      { month: "Set '25", count: 3, amount: 270 },
      { month: "Out '25", count: 3, amount: 270 },
      { month: "Nov '25", count: 3, amount: 270 },
    ],
  },
  disputesRateByMonth: [
    { month: "Jul '25", count: 12, amount: 600, rate: 600 },
    { month: "Ago '25", count: 15, amount: 750, rate: 750 },
    { month: "Set '25", count: 18, amount: 900, rate: 900 },
    { month: "Out '25", count: 14, amount: 700, rate: 700 },
    { month: "Nov '25", count: 16, amount: 800, rate: 800 },
  ],
  availableStatuses: ["all", "needs_response", "under_review", "lost", "won"],
  disputesByProcessor: [
    { name: "Shopify Payments", count: 45, amount: 4250.00 },
    { name: "Stripe", count: 18, amount: 1720.50 },
    { name: "PayPal", count: 12, amount: 1380.00 },
  ],
  availableProcessors: ["all", "Shopify Payments", "Stripe", "PayPal"],
  statusLabels: {
    needs_response: "Processamento",
    under_review: "Em revisão",
    won: "Ganho",
    lost: "Perdido",
    accepted: "Aceito",
    charge_refunded: "Reembolsado",
    unknown: "Desconhecido",
  },
  disputesByNetwork: [
    { name: "Visa", count: 32, amount: 3050.00 },
    { name: "Mastercard", count: 24, amount: 2280.00 },
    { name: "Outros", count: 12, amount: 1140.00 },
    { name: "Discover", count: 7, amount: 880.00 },
  ],
  disputesByCategory: [
    { name: "Eletrônicos", value: 25 },
    { name: "Roupas", value: 18 },
    { name: "Alimentos", value: 12 },
    { name: "Outros", value: 20 },
  ],
  disputesByCountry: [
    { country: "United States", code: "US", count: 28, amount: 2650.00, winRate: 45 },
    { country: "United Kingdom", code: "GB", count: 18, amount: 1720.00, winRate: 38 },
    { country: "Germany", code: "DE", count: 12, amount: 1140.00, winRate: 42 },
    { country: "Canada", code: "CA", count: 9, amount: 855.00, winRate: 50 },
    { country: "Australia", code: "AU", count: 8, amount: 985.00, winRate: 35 },
  ],
  repeatDisputers: [],
};

export const mockDisputes = [
  {
    id: "11084628336",
    gateway_dispute_id: "dp_1QYZ7aK2bC3dE4fG5h",
    charge_id: "ch_3QYZ6bK2bC3dE4fG1h234567",
    order_id: "5001234567890",
    type: "chargeback",
    amount: "125.00",
    currency: "USD",
    reason: "product_not_received",
    network_reason_code: "13.1",
    status: "needs_response",
    evidence_due_by: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_sent_on: null,
    finalized_on: null,
    initiated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 125,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Maria Silva",
    card_brand: "Visa",
    card_last4: "4242",
    card_bin: "424242",
    network: "visa",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567890,
      email: "maria.silva@exemplo.com",
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1234,
      note: null,
      token: "abcd1234efgh5678",
      gateway: "shopify_payments",
      test: false,
      total_price: "125.00",
      subtotal_price: "115.00",
      total_weight: 250,
      total_tax: "0.00",
      taxes_included: false,
      currency: "USD",
      financial_status: "paid",
      confirmed: true,
      total_discounts: "0.00",
      total_line_items_price: "115.00",
      cart_token: "cart_token_1234",
      buyer_accepts_marketing: false,
      name: "#1234",
      referring_site: "https://www.google.com",
      landing_site: "/products/premium-watch",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "125.00",
      checkout_token: "checkout_token_1234",
      reference: null,
      user_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      processed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: "+5519999999999",
      customer_locale: "pt-BR",
      app_id: 580111,
      browser_ip: "189.123.45.67",
      landing_site_ref: null,
      order_number: 1234,
      discount_applications: [],
      discount_codes: [],
      note_attributes: [],
      payment_gateway_names: ["shopify_payments"],
      processing_method: "direct",
      checkout_id: 30123456789,
      source_name: "web",
      fulfillment_status: "unfulfilled",
      tax_lines: [],
      tags: "",
      contact_email: "maria.silva@exemplo.com",
      order_status_url: "https://mystore.myshopify.com/12345/orders/abcd1234/authenticate?key=xyz789",
      presentment_currency: "USD",
      total_line_items_price_set: {
        shop_money: { amount: "115.00", currency_code: "USD" },
        presentment_money: { amount: "115.00", currency_code: "USD" }
      },
      total_discounts_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "10.00", currency_code: "USD" },
        presentment_money: { amount: "10.00", currency_code: "USD" }
      },
      subtotal_price_set: {
        shop_money: { amount: "115.00", currency_code: "USD" },
        presentment_money: { amount: "115.00", currency_code: "USD" }
      },
      total_price_set: {
        shop_money: { amount: "125.00", currency_code: "USD" },
        presentment_money: { amount: "125.00", currency_code: "USD" }
      },
      total_tax_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      customer: {
        id: 9876543210,
        email: "maria.silva@exemplo.com",
        accepts_marketing: false,
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "Maria",
        last_name: "Silva",
        orders_count: 3,
        state: "enabled",
        total_spent: "387.50",
        last_order_id: 5001234567890,
        note: null,
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: "+5519999999999",
        tags: "vip, brasil",
        last_order_name: "#1234",
        currency: "USD",
        accepts_marketing_updated_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: null,
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543210",
        default_address: {
          id: 12345678901,
          customer_id: 9876543210,
          first_name: "Maria",
          last_name: "Silva",
          company: null,
          address1: "Av. Rio Branco, 123",
          address2: "Apto 45",
          city: "Itapira",
          province: "São Paulo",
          country: "Brazil",
          zip: "13970-000",
          phone: "+5519999999999",
          name: "Maria Silva",
          province_code: "SP",
          country_code: "BR",
          country_name: "Brazil",
          default: true
        }
      },
      billing_address: {
        first_name: "Maria",
        last_name: "Silva",
        address1: "Av. Rio Branco, 123",
        address2: "Apto 45",
        city: "Itapira",
        province: "São Paulo",
        country: "Brazil",
        zip: "13970-000",
        phone: "+5519999999999",
        name: "Maria Silva",
        province_code: "SP",
        country_code: "BR",
        latitude: -22.4359,
        longitude: -46.8239
      },
      shipping_address: {
        first_name: "Maria",
        last_name: "Silva",
        address1: "Av. Rio Branco, 123",
        address2: "Apto 45",
        city: "Itapira",
        province: "São Paulo",
        country: "Brazil",
        zip: "13970-000",
        phone: "+5519999999999",
        name: "Maria Silva",
        province_code: "SP",
        country_code: "BR",
        latitude: -22.4359,
        longitude: -46.8239
      },
      line_items: [
        {
          id: 12345678901,
          variant_id: 40123456789,
          title: "Premium Watch",
          quantity: 1,
          sku: "WATCH-PREM-001",
          variant_title: "Silver",
          vendor: "Luxury Watches Co",
          fulfillment_service: "manual",
          product_id: 7654321098,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: "Premium Watch - Silver",
          variant_inventory_management: "shopify",
          properties: [],
          product_exists: true,
          fulfillable_quantity: 1,
          grams: 250,
          price: "115.00",
          total_discount: "0.00",
          fulfillment_status: "unfulfilled",
          price_set: {
            shop_money: { amount: "115.00", currency_code: "USD" },
            presentment_money: { amount: "115.00", currency_code: "USD" }
          },
          total_discount_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          discount_allocations: [],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678901",
          tax_lines: []
        }
      ],
      shipping_lines: [
        {
          id: 98765432101,
          title: "Standard Shipping",
          price: "10.00",
          code: "STANDARD",
          source: "shopify",
          phone: null,
          requested_fulfillment_service_id: null,
          delivery_category: null,
          carrier_identifier: null,
          discounted_price: "10.00",
          price_set: {
            shop_money: { amount: "10.00", currency_code: "USD" },
            presentment_money: { amount: "10.00", currency_code: "USD" }
          },
          discounted_price_set: {
            shop_money: { amount: "10.00", currency_code: "USD" },
            presentment_money: { amount: "10.00", currency_code: "USD" }
          },
          discount_allocations: [],
          tax_lines: []
        }
      ],
      fulfillments: [],
      refunds: [],
      transactions: [
        {
          id: 89234567890123,
          order_id: 5001234567890,
          kind: "sale",
          gateway: "shopify_payments",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "ch_3QYZ6bK2bC3dE4fG1h234567",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "125.00",
            charges: "ch_3QYZ6bK2bC3dE4fG1h234567",
            payment_method_details: {
              card: {
                brand: "visa",
                last4: "4242",
                exp_month: 12,
                exp_year: 2026,
                fingerprint: "7GHI8jKl9MNo0pQr",
                funding: "credit",
                network: "visa"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "424242",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 4242",
            credit_card_company: "Visa",
            buyer_action_info: null
          },
          amount: "125.00",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QYZ6bK2bC3dE4fG1h234567",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890123"
        }
      ]
    },
    reasonTranslated: "Produto não recebido",
    pedidoId: "#1234",
    gateway: "shopify_payments",
    createAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "125.00",
    products: [{ name: "Premium Watch", quantity: 1, price: 115.00 }],
    totalProductsValue: 115,
  },
  {
    id: "11084628337",
    gateway_dispute_id: "dp_1QXY8bL3cD4eF5gH6i",
    charge_id: "ch_3QXY7cL3cD4eF5gH2i345678",
    order_id: "5001234567891",
    type: "chargeback",
    amount: "89.50",
    currency: "USD",
    reason: "product_unacceptable",
    network_reason_code: "4853",
    status: "under_review",
    evidence_due_by: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_sent_on: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_on: null,
    initiated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 89.5,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "João Santos",
    card_brand: "Mastercard",
    card_last4: "5454",
    card_bin: "545454",
    network: "mastercard",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567891,
      email: "joao.santos@exemplo.com",
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1235,
      note: "Por favor, embale com cuidado",
      token: "ijkl5678mnop9012",
      gateway: "stripe",
      test: false,
      total_price: "89.50",
      subtotal_price: "79.90",
      total_weight: 150,
      total_tax: "0.00",
      taxes_included: false,
      currency: "USD",
      financial_status: "paid",
      confirmed: true,
      total_discounts: "0.00",
      total_line_items_price: "79.90",
      cart_token: "cart_token_1235",
      buyer_accepts_marketing: true,
      name: "#1235",
      referring_site: "https://www.facebook.com",
      landing_site: "/products/leather-wallet",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "89.50",
      checkout_token: "checkout_token_1235",
      reference: null,
      user_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      processed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: "+5511987654321",
      customer_locale: "pt-BR",
      app_id: 580111,
      browser_ip: "179.218.76.123",
      landing_site_ref: "fbclid=abc123",
      order_number: 1235,
      discount_applications: [],
      discount_codes: [],
      note_attributes: [],
      payment_gateway_names: ["stripe"],
      processing_method: "direct",
      checkout_id: 30123456790,
      source_name: "web",
      fulfillment_status: "fulfilled",
      tax_lines: [],
      tags: "",
      contact_email: "joao.santos@exemplo.com",
      order_status_url: "https://mystore.myshopify.com/12345/orders/ijkl5678/authenticate?key=xyz790",
      presentment_currency: "USD",
      total_line_items_price_set: {
        shop_money: { amount: "79.90", currency_code: "USD" },
        presentment_money: { amount: "79.90", currency_code: "USD" }
      },
      total_discounts_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "9.60", currency_code: "USD" },
        presentment_money: { amount: "9.60", currency_code: "USD" }
      },
      subtotal_price_set: {
        shop_money: { amount: "79.90", currency_code: "USD" },
        presentment_money: { amount: "79.90", currency_code: "USD" }
      },
      total_price_set: {
        shop_money: { amount: "89.50", currency_code: "USD" },
        presentment_money: { amount: "89.50", currency_code: "USD" }
      },
      total_tax_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      customer: {
        id: 9876543211,
        email: "joao.santos@exemplo.com",
        accepts_marketing: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "João",
        last_name: "Santos",
        orders_count: 2,
        state: "enabled",
        total_spent: "175.30",
        last_order_id: 5001234567891,
        note: null,
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: "+5511987654321",
        tags: "brasil",
        last_order_name: "#1235",
        currency: "USD",
        accepts_marketing_updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: "single_opt_in",
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543211",
        default_address: {
          id: 12345678902,
          customer_id: 9876543211,
          first_name: "João",
          last_name: "Santos",
          company: null,
          address1: "Rua das Palmeiras, 456",
          address2: "Casa 2",
          city: "São Paulo",
          province: "São Paulo",
          country: "Brazil",
          zip: "01310-100",
          phone: "+5511987654321",
          name: "João Santos",
          province_code: "SP",
          country_code: "BR",
          country_name: "Brazil",
          default: true
        }
      },
      billing_address: {
        first_name: "João",
        last_name: "Santos",
        address1: "Rua das Palmeiras, 456",
        address2: "Casa 2",
        city: "São Paulo",
        province: "São Paulo",
        country: "Brazil",
        zip: "01310-100",
        phone: "+5511987654321",
        name: "João Santos",
        province_code: "SP",
        country_code: "BR",
        latitude: -23.5505,
        longitude: -46.6333
      },
      shipping_address: {
        first_name: "João",
        last_name: "Santos",
        address1: "Rua das Palmeiras, 456",
        address2: "Casa 2",
        city: "São Paulo",
        province: "São Paulo",
        country: "Brazil",
        zip: "01310-100",
        phone: "+5511987654321",
        name: "João Santos",
        province_code: "SP",
        country_code: "BR",
        latitude: -23.5505,
        longitude: -46.6333
      },
      line_items: [
        {
          id: 12345678902,
          variant_id: 40123456790,
          title: "Leather Wallet",
          quantity: 1,
          sku: "WALLET-LEATH-001",
          variant_title: "Brown",
          vendor: "Leather Goods Inc",
          fulfillment_service: "manual",
          product_id: 7654321099,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: "Leather Wallet - Brown",
          variant_inventory_management: "shopify",
          properties: [],
          product_exists: true,
          fulfillable_quantity: 0,
          grams: 150,
          price: "79.90",
          total_discount: "0.00",
          fulfillment_status: "fulfilled",
          price_set: {
            shop_money: { amount: "79.90", currency_code: "USD" },
            presentment_money: { amount: "79.90", currency_code: "USD" }
          },
          total_discount_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          discount_allocations: [],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678902",
          tax_lines: []
        }
      ],
      shipping_lines: [
        {
          id: 98765432102,
          title: "Express Shipping",
          price: "9.60",
          code: "EXPRESS",
          source: "shopify",
          phone: null,
          requested_fulfillment_service_id: null,
          delivery_category: null,
          carrier_identifier: null,
          discounted_price: "9.60",
          price_set: {
            shop_money: { amount: "9.60", currency_code: "USD" },
            presentment_money: { amount: "9.60", currency_code: "USD" }
          },
          discounted_price_set: {
            shop_money: { amount: "9.60", currency_code: "USD" },
            presentment_money: { amount: "9.60", currency_code: "USD" }
          },
          discount_allocations: [],
          tax_lines: []
        }
      ],
      fulfillments: [
        {
          id: 56789012345,
          order_id: 5001234567891,
          status: "success",
          created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          service: "manual",
          updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          tracking_company: "Correios",
          shipment_status: "delivered",
          location_id: null,
          tracking_number: "BR123456789BR",
          tracking_numbers: ["BR123456789BR"],
          tracking_url: "https://tracking.correios.com.br/BR123456789BR",
          tracking_urls: ["https://tracking.correios.com.br/BR123456789BR"],
          receipt: {},
          name: "#1235.1",
          admin_graphql_api_id: "gid://shopify/Fulfillment/56789012345",
          line_items: [
            {
              id: 12345678902,
              variant_id: 40123456790,
              title: "Leather Wallet",
              quantity: 1,
              sku: "WALLET-LEATH-001",
              variant_title: "Brown",
              vendor: "Leather Goods Inc",
              fulfillment_service: "manual",
              product_id: 7654321099,
              requires_shipping: true,
              taxable: true,
              gift_card: false,
              name: "Leather Wallet - Brown",
              variant_inventory_management: "shopify",
              properties: [],
              product_exists: true,
              fulfillable_quantity: 0,
              grams: 150,
              price: "79.90",
              total_discount: "0.00",
              fulfillment_status: "fulfilled",
              price_set: {
                shop_money: { amount: "79.90", currency_code: "USD" },
                presentment_money: { amount: "79.90", currency_code: "USD" }
              },
              total_discount_set: {
                shop_money: { amount: "0.00", currency_code: "USD" },
                presentment_money: { amount: "0.00", currency_code: "USD" }
              },
              discount_allocations: [],
              duties: [],
              admin_graphql_api_id: "gid://shopify/LineItem/12345678902",
              tax_lines: []
            }
          ]
        }
      ],
      refunds: [],
      transactions: [
        {
          id: 89234567890124,
          order_id: 5001234567891,
          kind: "authorization",
          gateway: "stripe",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "py_3QXY7cL3cD4eF5gH2i345678",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "89.50",
            charges: "ch_3QXY7cL3cD4eF5gH2i345678",
            payment_method_details: {
              card: {
                brand: "mastercard",
                last4: "5454",
                exp_month: 8,
                exp_year: 2027,
                fingerprint: "8HIJ9kLm0NOpqRsT",
                funding: "credit",
                network: "mastercard"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "545454",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 5454",
            credit_card_company: "Mastercard",
            buyer_action_info: null
          },
          amount: "89.50",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QXY7cL3cD4eF5gH2i345678",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890124"
        },
        {
          id: 89234567890125,
          order_id: 5001234567891,
          kind: "capture",
          gateway: "stripe",
          status: "success",
          message: "Transaction captured",
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "py_3QXY7cL3cD4eF5gH2i345678",
          location_id: null,
          user_id: null,
          parent_id: 89234567890124,
          processed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {},
          error_code: null,
          source_name: "web",
          amount: "89.50",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QXY7cL3cD4eF5gH2i345678_capture",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890125"
        }
      ]
    },
    reasonTranslated: "Produto diferente do descrito",
    pedidoId: "#1235",
    gateway: "stripe",
    createAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "89.50",
    products: [{ name: "Leather Wallet", quantity: 1, price: 79.90 }],
    totalProductsValue: 79.90,
  },
  {
    id: "11084628338",
    gateway_dispute_id: "dp_1QWX9cM4dE5fG6hI7j",
    charge_id: "ch_3QWX8dM4dE5fG6hI3j456789",
    order_id: "5001234567892",
    type: "chargeback",
    amount: "245.00",
    currency: "USD",
    reason: "fraudulent",
    network_reason_code: "10.4",
    status: "won",
    evidence_due_by: null,
    evidence_sent_on: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_on: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    initiated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 245,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Ana Oliveira",
    card_brand: "Visa",
    card_last4: "1234",
    card_bin: "411111",
    network: "visa",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567892,
      email: "ana.oliveira@exemplo.com",
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1236,
      note: null,
      token: "qrst9012uvwx3456",
      gateway: "shopify_payments",
      test: false,
      total_price: "245.00",
      subtotal_price: "229.90",
      total_weight: 320,
      total_tax: "0.00",
      taxes_included: false,
      currency: "USD",
      financial_status: "paid",
      confirmed: true,
      total_discounts: "0.00",
      total_line_items_price: "229.90",
      cart_token: "cart_token_1236",
      buyer_accepts_marketing: false,
      name: "#1236",
      referring_site: null,
      landing_site: "/",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "245.00",
      checkout_token: "checkout_token_1236",
      reference: null,
      user_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      processed_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: "+5521998765432",
      customer_locale: "pt-BR",
      app_id: 580111,
      browser_ip: "191.34.87.210",
      landing_site_ref: null,
      order_number: 1236,
      discount_applications: [],
      discount_codes: [],
      note_attributes: [],
      payment_gateway_names: ["shopify_payments"],
      processing_method: "direct",
      checkout_id: 30123456791,
      source_name: "web",
      fulfillment_status: "fulfilled",
      tax_lines: [],
      tags: "",
      contact_email: "ana.oliveira@exemplo.com",
      order_status_url: "https://mystore.myshopify.com/12345/orders/qrst9012/authenticate?key=xyz791",
      presentment_currency: "USD",
      total_line_items_price_set: {
        shop_money: { amount: "229.90", currency_code: "USD" },
        presentment_money: { amount: "229.90", currency_code: "USD" }
      },
      total_discounts_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "15.10", currency_code: "USD" },
        presentment_money: { amount: "15.10", currency_code: "USD" }
      },
      subtotal_price_set: {
        shop_money: { amount: "229.90", currency_code: "USD" },
        presentment_money: { amount: "229.90", currency_code: "USD" }
      },
      total_price_set: {
        shop_money: { amount: "245.00", currency_code: "USD" },
        presentment_money: { amount: "245.00", currency_code: "USD" }
      },
      total_tax_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      customer: {
        id: 9876543212,
        email: "ana.oliveira@exemplo.com",
        accepts_marketing: false,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "Ana",
        last_name: "Oliveira",
        orders_count: 1,
        state: "enabled",
        total_spent: "245.00",
        last_order_id: 5001234567892,
        note: null,
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: "+5521998765432",
        tags: "",
        last_order_name: "#1236",
        currency: "USD",
        accepts_marketing_updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: null,
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543212",
        default_address: {
          id: 12345678903,
          customer_id: 9876543212,
          first_name: "Ana",
          last_name: "Oliveira",
          company: null,
          address1: "Av. Atlântica, 789",
          address2: "Apto 1201",
          city: "Rio de Janeiro",
          province: "Rio de Janeiro",
          country: "Brazil",
          zip: "22010-000",
          phone: "+5521998765432",
          name: "Ana Oliveira",
          province_code: "RJ",
          country_code: "BR",
          country_name: "Brazil",
          default: true
        }
      },
      billing_address: {
        first_name: "Ana",
        last_name: "Oliveira",
        address1: "Av. Atlântica, 789",
        address2: "Apto 1201",
        city: "Rio de Janeiro",
        province: "Rio de Janeiro",
        country: "Brazil",
        zip: "22010-000",
        phone: "+5521998765432",
        name: "Ana Oliveira",
        province_code: "RJ",
        country_code: "BR",
        latitude: -22.9711,
        longitude: -43.1825
      },
      shipping_address: {
        first_name: "Ana",
        last_name: "Oliveira",
        address1: "Av. Atlântica, 789",
        address2: "Apto 1201",
        city: "Rio de Janeiro",
        province: "Rio de Janeiro",
        country: "Brazil",
        zip: "22010-000",
        phone: "+5521998765432",
        name: "Ana Oliveira",
        province_code: "RJ",
        country_code: "BR",
        latitude: -22.9711,
        longitude: -43.1825
      },
      line_items: [
        {
          id: 12345678903,
          variant_id: 40123456791,
          title: "Wireless Headphones",
          quantity: 1,
          sku: "HEAD-WIRE-001",
          variant_title: "Black",
          vendor: "Audio Tech Co",
          fulfillment_service: "manual",
          product_id: 7654321100,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: "Wireless Headphones - Black",
          variant_inventory_management: "shopify",
          properties: [],
          product_exists: true,
          fulfillable_quantity: 0,
          grams: 320,
          price: "229.90",
          total_discount: "0.00",
          fulfillment_status: "fulfilled",
          price_set: {
            shop_money: { amount: "229.90", currency_code: "USD" },
            presentment_money: { amount: "229.90", currency_code: "USD" }
          },
          total_discount_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          discount_allocations: [],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678903",
          tax_lines: []
        }
      ],
      shipping_lines: [
        {
          id: 98765432103,
          title: "Standard Shipping",
          price: "15.10",
          code: "STANDARD",
          source: "shopify",
          phone: null,
          requested_fulfillment_service_id: null,
          delivery_category: null,
          carrier_identifier: null,
          discounted_price: "15.10",
          price_set: {
            shop_money: { amount: "15.10", currency_code: "USD" },
            presentment_money: { amount: "15.10", currency_code: "USD" }
          },
          discounted_price_set: {
            shop_money: { amount: "15.10", currency_code: "USD" },
            presentment_money: { amount: "15.10", currency_code: "USD" }
          },
          discount_allocations: [],
          tax_lines: []
        }
      ],
      fulfillments: [
        {
          id: 56789012346,
          order_id: 5001234567892,
          status: "success",
          created_at: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
          service: "manual",
          updated_at: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
          tracking_company: "Correios",
          shipment_status: "delivered",
          location_id: null,
          tracking_number: "BR987654321BR",
          tracking_numbers: ["BR987654321BR"],
          tracking_url: "https://tracking.correios.com.br/BR987654321BR",
          tracking_urls: ["https://tracking.correios.com.br/BR987654321BR"],
          receipt: {},
          name: "#1236.1",
          admin_graphql_api_id: "gid://shopify/Fulfillment/56789012346",
          line_items: [
            {
              id: 12345678903,
              variant_id: 40123456791,
              title: "Wireless Headphones",
              quantity: 1,
              sku: "HEAD-WIRE-001",
              variant_title: "Black",
              vendor: "Audio Tech Co",
              fulfillment_service: "manual",
              product_id: 7654321100,
              requires_shipping: true,
              taxable: true,
              gift_card: false,
              name: "Wireless Headphones - Black",
              variant_inventory_management: "shopify",
              properties: [],
              product_exists: true,
              fulfillable_quantity: 0,
              grams: 320,
              price: "229.90",
              total_discount: "0.00",
              fulfillment_status: "fulfilled",
              price_set: {
                shop_money: { amount: "229.90", currency_code: "USD" },
                presentment_money: { amount: "229.90", currency_code: "USD" }
              },
              total_discount_set: {
                shop_money: { amount: "0.00", currency_code: "USD" },
                presentment_money: { amount: "0.00", currency_code: "USD" }
              },
              discount_allocations: [],
              duties: [],
              admin_graphql_api_id: "gid://shopify/LineItem/12345678903",
              tax_lines: []
            }
          ]
        }
      ],
      refunds: [],
      transactions: [
        {
          id: 89234567890126,
          order_id: 5001234567892,
          kind: "sale",
          gateway: "shopify_payments",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "ch_3QWX8dM4dE5fG6hI3j456789",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "245.00",
            charges: "ch_3QWX8dM4dE5fG6hI3j456789",
            payment_method_details: {
              card: {
                brand: "visa",
                last4: "1234",
                exp_month: 3,
                exp_year: 2028,
                fingerprint: "9IJK0lMn1OPqrStU",
                funding: "credit",
                network: "visa"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "411111",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 1234",
            credit_card_company: "Visa",
            buyer_action_info: null
          },
          amount: "245.00",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QWX8dM4dE5fG6hI3j456789",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890126"
        }
      ]
    },
    reasonTranslated: "Fraudulenta",
    pedidoId: "#1236",
    gateway: "shopify_payments",
    createAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "245.00",
    products: [{ name: "Wireless Headphones", quantity: 1, price: 229.90 }],
    totalProductsValue: 229.90,
  },
  {
    id: "11084628339",
    gateway_dispute_id: "dp_1QVW0dN5eF6gH7iJ8k",
    charge_id: "ch_3QVW9eN5eF6gH7iJ4k567890",
    order_id: "5001234567893",
    type: "chargeback",
    amount: "67.80",
    currency: "USD",
    reason: "product_not_received",
    network_reason_code: "13.1",
    status: "lost",
    evidence_due_by: null,
    evidence_sent_on: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_on: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    initiated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 67.8,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Pedro Costa",
    card_brand: "Mastercard",
    card_last4: "8888",
    card_bin: "555555",
    network: "mastercard",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567893,
      email: "pedro.costa@exemplo.com",
      created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1237,
      note: null,
      token: "yzab7890cdef1234",
      gateway: "paypal",
      test: false,
      total_price: "67.80",
      subtotal_price: "59.80",
      total_weight: 100,
      total_tax: "0.00",
      taxes_included: false,
      currency: "USD",
      financial_status: "refunded",
      confirmed: true,
      total_discounts: "0.00",
      total_line_items_price: "59.80",
      cart_token: "cart_token_1237",
      buyer_accepts_marketing: false,
      name: "#1237",
      referring_site: "https://www.instagram.com",
      landing_site: "/products/phone-case",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "67.80",
      checkout_token: "checkout_token_1237",
      reference: null,
      user_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      processed_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: "+5531987654321",
      customer_locale: "pt-BR",
      app_id: 580111,
      browser_ip: "177.45.112.89",
      landing_site_ref: null,
      order_number: 1237,
      discount_applications: [],
      discount_codes: [],
      note_attributes: [],
      payment_gateway_names: ["paypal"],
      processing_method: "express",
      checkout_id: 30123456792,
      source_name: "web",
      fulfillment_status: "unfulfilled",
      tax_lines: [],
      tags: "dispute_lost",
      contact_email: "pedro.costa@exemplo.com",
      order_status_url: "https://mystore.myshopify.com/12345/orders/yzab7890/authenticate?key=xyz792",
      presentment_currency: "USD",
      total_line_items_price_set: {
        shop_money: { amount: "59.80", currency_code: "USD" },
        presentment_money: { amount: "59.80", currency_code: "USD" }
      },
      total_discounts_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "8.00", currency_code: "USD" },
        presentment_money: { amount: "8.00", currency_code: "USD" }
      },
      subtotal_price_set: {
        shop_money: { amount: "59.80", currency_code: "USD" },
        presentment_money: { amount: "59.80", currency_code: "USD" }
      },
      total_price_set: {
        shop_money: { amount: "67.80", currency_code: "USD" },
        presentment_money: { amount: "67.80", currency_code: "USD" }
      },
      total_tax_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      customer: {
        id: 9876543213,
        email: "pedro.costa@exemplo.com",
        accepts_marketing: false,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "Pedro",
        last_name: "Costa",
        orders_count: 1,
        state: "enabled",
        total_spent: "67.80",
        last_order_id: 5001234567893,
        note: "Cliente com histórico de disputes",
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: "+5531987654321",
        tags: "disputer",
        last_order_name: "#1237",
        currency: "USD",
        accepts_marketing_updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: null,
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543213",
        default_address: {
          id: 12345678904,
          customer_id: 9876543213,
          first_name: "Pedro",
          last_name: "Costa",
          company: null,
          address1: "Rua dos Goitacazes, 321",
          address2: null,
          city: "Belo Horizonte",
          province: "Minas Gerais",
          country: "Brazil",
          zip: "30190-051",
          phone: "+5531987654321",
          name: "Pedro Costa",
          province_code: "MG",
          country_code: "BR",
          country_name: "Brazil",
          default: true
        }
      },
      billing_address: {
        first_name: "Pedro",
        last_name: "Costa",
        address1: "Rua dos Goitacazes, 321",
        address2: null,
        city: "Belo Horizonte",
        province: "Minas Gerais",
        country: "Brazil",
        zip: "30190-051",
        phone: "+5531987654321",
        name: "Pedro Costa",
        province_code: "MG",
        country_code: "BR",
        latitude: -19.9167,
        longitude: -43.9345
      },
      shipping_address: {
        first_name: "Pedro",
        last_name: "Costa",
        address1: "Rua dos Goitacazes, 321",
        address2: null,
        city: "Belo Horizonte",
        province: "Minas Gerais",
        country: "Brazil",
        zip: "30190-051",
        phone: "+5531987654321",
        name: "Pedro Costa",
        province_code: "MG",
        country_code: "BR",
        latitude: -19.9167,
        longitude: -43.9345
      },
      line_items: [
        {
          id: 12345678904,
          variant_id: 40123456792,
          title: "Phone Case",
          quantity: 2,
          sku: "CASE-PHONE-001",
          variant_title: "Clear",
          vendor: "Mobile Accessories Ltd",
          fulfillment_service: "manual",
          product_id: 7654321101,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: "Phone Case - Clear",
          variant_inventory_management: "shopify",
          properties: [],
          product_exists: true,
          fulfillable_quantity: 2,
          grams: 50,
          price: "29.90",
          total_discount: "0.00",
          fulfillment_status: "unfulfilled",
          price_set: {
            shop_money: { amount: "29.90", currency_code: "USD" },
            presentment_money: { amount: "29.90", currency_code: "USD" }
          },
          total_discount_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          discount_allocations: [],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678904",
          tax_lines: []
        }
      ],
      shipping_lines: [
        {
          id: 98765432104,
          title: "Economy Shipping",
          price: "8.00",
          code: "ECONOMY",
          source: "shopify",
          phone: null,
          requested_fulfillment_service_id: null,
          delivery_category: null,
          carrier_identifier: null,
          discounted_price: "8.00",
          price_set: {
            shop_money: { amount: "8.00", currency_code: "USD" },
            presentment_money: { amount: "8.00", currency_code: "USD" }
          },
          discounted_price_set: {
            shop_money: { amount: "8.00", currency_code: "USD" },
            presentment_money: { amount: "8.00", currency_code: "USD" }
          },
          discount_allocations: [],
          tax_lines: []
        }
      ],
      fulfillments: [],
      refunds: [
        {
          id: 78901234567,
          order_id: 5001234567893,
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          note: "Chargeback perdido - reembolso automático",
          user_id: null,
          processed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          restock: true,
          duties: [],
          total_duties_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          admin_graphql_api_id: "gid://shopify/Refund/78901234567",
          refund_line_items: [
            {
              id: 12345678904,
              quantity: 2,
              line_item_id: 12345678904,
              location_id: null,
              restock_type: "cancel",
              subtotal: "59.80",
              total_tax: "0.00",
              subtotal_set: {
                shop_money: { amount: "59.80", currency_code: "USD" },
                presentment_money: { amount: "59.80", currency_code: "USD" }
              },
              total_tax_set: {
                shop_money: { amount: "0.00", currency_code: "USD" },
                presentment_money: { amount: "0.00", currency_code: "USD" }
              },
              line_item: {
                id: 12345678904,
                variant_id: 40123456792,
                title: "Phone Case",
                quantity: 2,
                sku: "CASE-PHONE-001",
                variant_title: "Clear",
                vendor: "Mobile Accessories Ltd",
                fulfillment_service: "manual",
                product_id: 7654321101,
                requires_shipping: true,
                taxable: true,
                gift_card: false,
                name: "Phone Case - Clear",
                variant_inventory_management: "shopify",
                properties: [],
                product_exists: true,
                fulfillable_quantity: 2,
                grams: 50,
                price: "29.90",
                total_discount: "0.00",
                fulfillment_status: "unfulfilled",
                price_set: {
                  shop_money: { amount: "29.90", currency_code: "USD" },
                  presentment_money: { amount: "29.90", currency_code: "USD" }
                },
                total_discount_set: {
                  shop_money: { amount: "0.00", currency_code: "USD" },
                  presentment_money: { amount: "0.00", currency_code: "USD" }
                },
                discount_allocations: [],
                duties: [],
                admin_graphql_api_id: "gid://shopify/LineItem/12345678904",
                tax_lines: []
              }
            }
          ],
          transactions: [
            {
              id: 89012345678,
              order_id: 5001234567893,
              kind: "refund",
              gateway: "paypal",
              status: "success",
              message: "Chargeback perdido",
              created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              test: false,
              authorization: null,
              location_id: null,
              user_id: null,
              parent_id: 89012345677,
              processed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              device_id: null,
              receipt: {},
              error_code: null,
              source_name: "web",
              amount: "67.80",
              currency: "USD",
              admin_graphql_api_id: "gid://shopify/OrderTransaction/89012345678"
            }
          ],
          order_adjustments: []
        }
      ],
      transactions: [
        {
          id: 89234567890127,
          order_id: 5001234567893,
          kind: "sale",
          gateway: "paypal",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "PAYID-MXYZ123ABC456DEF789GH",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "67.80",
            charges: "ch_3QVW9eN5eF6gH7iJ4k567890",
            payment_method_details: {
              card: {
                brand: "mastercard",
                last4: "8888",
                exp_month: 11,
                exp_year: 2025,
                fingerprint: "0JKL1mNo2PQrstuV",
                funding: "debit",
                network: "mastercard"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "555555",
            avs_result_code: "N",
            cvv_result_code: "P",
            credit_card_number: "•••• •••• •••• 8888",
            credit_card_company: "Mastercard",
            buyer_action_info: null
          },
          amount: "67.80",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "PAYID-MXYZ123ABC456DEF789GH",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890127"
        }
      ]
    },
    reasonTranslated: "Produto não recebido",
    pedidoId: "#1237",
    gateway: "paypal",
    createAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "67.80",
    products: [{ name: "Phone Case", quantity: 2, price: 29.90 }],
    totalProductsValue: 59.80,
  },
  {
    id: "11084628340",
    gateway_dispute_id: "dp_1QUV1eO6fG7hI8jK9l",
    charge_id: "ch_3QUV0fO6fG7hI8jK5l678901",
    order_id: "5001234567894",
    type: "chargeback",
    amount: "156.25",
    currency: "BRL",
    reason: "credit_not_processed",
    network_reason_code: "4853",
    status: "needs_response",
    evidence_due_by: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_sent_on: null,
    finalized_on: null,
    initiated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 156.25,
    original_currency: "BRL",
    dispute_opened_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Carla Mendes",
    card_brand: "Elo",
    card_last4: "6363",
    card_bin: "636368",
    network: "elo",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567894,
      email: "carla.mendes@exemplo.com",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1238,
      note: null,
      token: "ghij3456klmn7890",
      gateway: "stripe",
      test: false,
      total_price: "156.25",
      subtotal_price: "145.00",
      total_weight: 80,
      total_tax: "21.75",
      taxes_included: false,
      currency: "BRL",
      financial_status: "partially_refunded",
      confirmed: true,
      total_discounts: "10.00",
      total_line_items_price: "155.00",
      cart_token: "cart_token_1238",
      buyer_accepts_marketing: true,
      name: "#1238",
      referring_site: null,
      landing_site: "/collections/smartwatch-accessories",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "31.25",
      checkout_token: "checkout_token_1238",
      reference: null,
      user_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      processed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: "+5541987654321",
      customer_locale: "pt-BR",
      app_id: 580111,
      browser_ip: "201.23.45.178",
      landing_site_ref: null,
      order_number: 1238,
      discount_applications: [
        {
          type: "discount_code",
          value: "10.00",
          value_type: "fixed_amount",
          allocation_method: "across",
          target_selection: "all",
          target_type: "line_item",
          code: "PRIMEIRA10",
          description: "10 reais de desconto na primeira compra"
        }
      ],
      discount_codes: [
        {
          code: "PRIMEIRA10",
          amount: "10.00",
          type: "fixed_amount"
        }
      ],
      note_attributes: [],
      payment_gateway_names: ["stripe"],
      processing_method: "direct",
      checkout_id: 30123456793,
      source_name: "web",
      fulfillment_status: "fulfilled",
      tax_lines: [
        {
          title: "ICMS",
          price: "21.75",
          rate: 0.15,
          channel_liable: false
        }
      ],
      tags: "",
      contact_email: "carla.mendes@exemplo.com",
      order_status_url: "https://mystore.myshopify.com/12345/orders/ghij3456/authenticate?key=xyz793",
      presentment_currency: "BRL",
      total_line_items_price_set: {
        shop_money: { amount: "155.00", currency_code: "BRL" },
        presentment_money: { amount: "155.00", currency_code: "BRL" }
      },
      total_discounts_set: {
        shop_money: { amount: "10.00", currency_code: "BRL" },
        presentment_money: { amount: "10.00", currency_code: "BRL" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "0.00", currency_code: "BRL" },
        presentment_money: { amount: "0.00", currency_code: "BRL" }
      },
      subtotal_price_set: {
        shop_money: { amount: "145.00", currency_code: "BRL" },
        presentment_money: { amount: "145.00", currency_code: "BRL" }
      },
      total_price_set: {
        shop_money: { amount: "156.25", currency_code: "BRL" },
        presentment_money: { amount: "156.25", currency_code: "BRL" }
      },
      total_tax_set: {
        shop_money: { amount: "21.75", currency_code: "BRL" },
        presentment_money: { amount: "21.75", currency_code: "BRL" }
      },
      customer: {
        id: 9876543214,
        email: "carla.mendes@exemplo.com",
        accepts_marketing: true,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "Carla",
        last_name: "Mendes",
        orders_count: 2,
        state: "enabled",
        total_spent: "289.75",
        last_order_id: 5001234567894,
        note: null,
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: "+5541987654321",
        tags: "brasil, desconto",
        last_order_name: "#1238",
        currency: "BRL",
        accepts_marketing_updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: "single_opt_in",
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543214",
        default_address: {
          id: 12345678905,
          customer_id: 9876543214,
          first_name: "Carla",
          last_name: "Mendes",
          company: null,
          address1: "Rua XV de Novembro, 555",
          address2: "Sala 302",
          city: "Curitiba",
          province: "Paraná",
          country: "Brazil",
          zip: "80020-310",
          phone: "+5541987654321",
          name: "Carla Mendes",
          province_code: "PR",
          country_code: "BR",
          country_name: "Brazil",
          default: true
        }
      },
      billing_address: {
        first_name: "Carla",
        last_name: "Mendes",
        address1: "Rua XV de Novembro, 555",
        address2: "Sala 302",
        city: "Curitiba",
        province: "Paraná",
        country: "Brazil",
        zip: "80020-310",
        phone: "+5541987654321",
        name: "Carla Mendes",
        province_code: "PR",
        country_code: "BR",
        latitude: -25.4284,
        longitude: -49.2733
      },
      shipping_address: {
        first_name: "Carla",
        last_name: "Mendes",
        address1: "Rua XV de Novembro, 555",
        address2: "Sala 302",
        city: "Curitiba",
        province: "Paraná",
        country: "Brazil",
        zip: "80020-310",
        phone: "+5541987654321",
        name: "Carla Mendes",
        province_code: "PR",
        country_code: "BR",
        latitude: -25.4284,
        longitude: -49.2733
      },
      line_items: [
        {
          id: 12345678905,
          variant_id: 40123456793,
          title: "Smart Watch Band",
          quantity: 2,
          sku: "BAND-SMART-001",
          variant_title: "Silicone - Blue",
          vendor: "Wearables Brazil",
          fulfillment_service: "manual",
          product_id: 7654321102,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: "Smart Watch Band - Silicone - Blue",
          variant_inventory_management: "shopify",
          properties: [],
          product_exists: true,
          fulfillable_quantity: 0,
          grams: 40,
          price: "49.90",
          total_discount: "5.00",
          fulfillment_status: "fulfilled",
          price_set: {
            shop_money: { amount: "49.90", currency_code: "BRL" },
            presentment_money: { amount: "49.90", currency_code: "BRL" }
          },
          total_discount_set: {
            shop_money: { amount: "5.00", currency_code: "BRL" },
            presentment_money: { amount: "5.00", currency_code: "BRL" }
          },
          discount_allocations: [
            {
              amount: "5.00",
              discount_application_index: 0,
              amount_set: {
                shop_money: { amount: "5.00", currency_code: "BRL" },
                presentment_money: { amount: "5.00", currency_code: "BRL" }
              }
            }
          ],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678905",
          tax_lines: [
            {
              title: "ICMS",
              price: "13.48",
              rate: 0.15,
              channel_liable: false,
              price_set: {
                shop_money: { amount: "13.48", currency_code: "BRL" },
                presentment_money: { amount: "13.48", currency_code: "BRL" }
              }
            }
          ]
        },
        {
          id: 12345678906,
          variant_id: 40123456794,
          title: "Screen Protector",
          quantity: 1,
          sku: "PROT-SCREEN-001",
          variant_title: "Tempered Glass",
          vendor: "Wearables Brazil",
          fulfillment_service: "manual",
          product_id: 7654321103,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: "Screen Protector - Tempered Glass",
          variant_inventory_management: "shopify",
          properties: [],
          product_exists: true,
          fulfillable_quantity: 0,
          grams: 20,
          price: "55.20",
          total_discount: "5.00",
          fulfillment_status: "fulfilled",
          price_set: {
            shop_money: { amount: "55.20", currency_code: "BRL" },
            presentment_money: { amount: "55.20", currency_code: "BRL" }
          },
          total_discount_set: {
            shop_money: { amount: "5.00", currency_code: "BRL" },
            presentment_money: { amount: "5.00", currency_code: "BRL" }
          },
          discount_allocations: [
            {
              amount: "5.00",
              discount_application_index: 0,
              amount_set: {
                shop_money: { amount: "5.00", currency_code: "BRL" },
                presentment_money: { amount: "5.00", currency_code: "BRL" }
              }
            }
          ],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678906",
          tax_lines: [
            {
              title: "ICMS",
              price: "8.28",
              rate: 0.15,
              channel_liable: false,
              price_set: {
                shop_money: { amount: "8.28", currency_code: "BRL" },
                presentment_money: { amount: "8.28", currency_code: "BRL" }
              }
            }
          ]
        }
      ],
      shipping_lines: [
        {
          id: 98765432105,
          title: "Frete Grátis",
          price: "0.00",
          code: "FREE_SHIPPING",
          source: "shopify",
          phone: null,
          requested_fulfillment_service_id: null,
          delivery_category: null,
          carrier_identifier: null,
          discounted_price: "0.00",
          price_set: {
            shop_money: { amount: "0.00", currency_code: "BRL" },
            presentment_money: { amount: "0.00", currency_code: "BRL" }
          },
          discounted_price_set: {
            shop_money: { amount: "0.00", currency_code: "BRL" },
            presentment_money: { amount: "0.00", currency_code: "BRL" }
          },
          discount_allocations: [],
          tax_lines: []
        }
      ],
      fulfillments: [
        {
          id: 56789012347,
          order_id: 5001234567894,
          status: "success",
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          service: "manual",
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          tracking_company: "Correios",
          shipment_status: "delivered",
          location_id: null,
          tracking_number: "BR456789012BR",
          tracking_numbers: ["BR456789012BR"],
          tracking_url: "https://tracking.correios.com.br/BR456789012BR",
          tracking_urls: ["https://tracking.correios.com.br/BR456789012BR"],
          receipt: {},
          name: "#1238.1",
          admin_graphql_api_id: "gid://shopify/Fulfillment/56789012347"
        }
      ],
      refunds: [],
      transactions: [
        {
          id: 89234567890128,
          order_id: 5001234567894,
          kind: "authorization",
          gateway: "stripe",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "py_3QUV0fO6fG7hI8jK5l678901",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "156.25",
            charges: "ch_3QUV0fO6fG7hI8jK5l678901",
            payment_method_details: {
              card: {
                brand: "elo",
                last4: "6363",
                exp_month: 6,
                exp_year: 2026,
                fingerprint: "1KLM2nOp3QRstuvW",
                funding: "credit",
                network: "elo"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "636368",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 6363",
            credit_card_company: "Elo",
            buyer_action_info: null
          },
          amount: "156.25",
          currency: "BRL",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QUV0fO6fG7hI8jK5l678901",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890128"
        },
        {
          id: 89234567890129,
          order_id: 5001234567894,
          kind: "capture",
          gateway: "stripe",
          status: "success",
          message: "Transaction captured",
          created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "py_3QUV0fO6fG7hI8jK5l678901",
          location_id: null,
          user_id: null,
          parent_id: 89234567890128,
          processed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {},
          error_code: null,
          source_name: "web",
          amount: "156.25",
          currency: "BRL",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QUV0fO6fG7hI8jK5l678901_capture",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890129"
        }
      ]
    },
    reasonTranslated: "Crédito não processado",
    pedidoId: "#1238",
    gateway: "stripe",
    createAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "156.25",
    products: [
      { name: "Smart Watch Band", quantity: 2, price: 49.90 },
      { name: "Screen Protector", quantity: 1, price: 55.20 }
    ],
    totalProductsValue: 145.00,
  },
  {
    id: "11084628341",
    gateway_dispute_id: "dp_1QTU2fP7gH8iJ9kL0m",
    charge_id: "ch_3QTU1gP7gH8iJ9kL6m789012",
    order_id: "5001234567895",
    type: "chargeback",
    amount: "312.00",
    currency: "USD",
    reason: "product_not_received",
    network_reason_code: "13.1",
    status: "under_review",
    evidence_due_by: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_sent_on: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_on: null,
    initiated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 312,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Roberto Almeida",
    card_brand: "American Express",
    card_last4: "0005",
    card_bin: "378282",
    network: "american_express",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567895,
      email: "roberto.almeida@exemplo.com",
      created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1239,
      total_price: "312.00",
      subtotal_price: "299.00",
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: "unfulfilled",
      customer: {
        id: 9876543215,
        email: "roberto.almeida@exemplo.com",
        first_name: "Roberto",
        last_name: "Almeida",
        phone: "+5548987654321",
        orders_count: 1,
        total_spent: "312.00"
      },
      billing_address: {
        first_name: "Roberto",
        last_name: "Almeida",
        address1: "Av. Beira Mar Norte, 1000",
        address2: null,
        city: "Florianópolis",
        province: "Santa Catarina",
        country: "Brazil",
        zip: "88015-700",
        phone: "+5548987654321",
        province_code: "SC",
        country_code: "BR"
      },
      shipping_address: {
        first_name: "Roberto",
        last_name: "Almeida",
        address1: "Av. Beira Mar Norte, 1000",
        address2: null,
        city: "Florianópolis",
        province: "Santa Catarina",
        country: "Brazil",
        zip: "88015-700",
        phone: "+5548987654321",
        province_code: "SC",
        country_code: "BR"
      },
      line_items: [
        {
          id: 12345678907,
          title: "Designer Sunglasses",
          quantity: 1,
          price: "299.00",
          sku: "SUNG-DSGN-001",
          name: "Designer Sunglasses - Black"
        }
      ],
      transactions: [
        {
          id: 89234567890130,
          order_id: 5001234567895,
          kind: "sale",
          gateway: "shopify_payments",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "ch_3QTU1gP7gH8iJ9kL6m789012",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "312.00",
            charges: "ch_3QTU1gP7gH8iJ9kL6m789012",
            payment_method_details: {
              card: {
                brand: "american_express",
                last4: "0005",
                exp_month: 9,
                exp_year: 2027,
                fingerprint: "2LMN3oPq4RStuvwX",
                funding: "credit",
                network: "american_express"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "378282",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••••• •0005",
            credit_card_company: "American Express",
            buyer_action_info: null
          },
          amount: "312.00",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QTU1gP7gH8iJ9kL6m789012",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890130"
        }
      ]
    },
    reasonTranslated: "Produto não recebido",
    pedidoId: "#1239",
    gateway: "shopify_payments",
    createAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "312.00",
    products: [{ name: "Designer Sunglasses", quantity: 1, price: 299.00 }],
    totalProductsValue: 299.00,
  },
  {
    id: "11084628342",
    gateway_dispute_id: "dp_1QST3gQ8hI9jK0lM1n",
    charge_id: "ch_3QST2hQ8hI9jK0lM7n890123",
    order_id: "5001234567896",
    type: "chargeback",
    amount: "45.99",
    currency: "USD",
    reason: "duplicate",
    network_reason_code: "4.53",
    status: "won",
    evidence_due_by: null,
    evidence_sent_on: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_on: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    initiated_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 45.99,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Fernanda Lima",
    card_brand: "Visa",
    card_last4: "7777",
    card_bin: "400000",
    network: "visa",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567896,
      email: "fernanda.lima@exemplo.com",
      created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1240,
      total_price: "45.99",
      subtotal_price: "39.99",
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: "fulfilled",
      customer: {
        id: 9876543216,
        email: "fernanda.lima@exemplo.com",
        first_name: "Fernanda",
        last_name: "Lima",
        phone: "+5585987654321",
        orders_count: 4,
        total_spent: "234.78"
      },
      billing_address: {
        first_name: "Fernanda",
        last_name: "Lima",
        address1: "Rua Dragão do Mar, 222",
        address2: "Apto 503",
        city: "Fortaleza",
        province: "Ceará",
        country: "Brazil",
        zip: "60060-390",
        phone: "+5585987654321",
        province_code: "CE",
        country_code: "BR"
      },
      shipping_address: {
        first_name: "Fernanda",
        last_name: "Lima",
        address1: "Rua Dragão do Mar, 222",
        address2: "Apto 503",
        city: "Fortaleza",
        province: "Ceará",
        country: "Brazil",
        zip: "60060-390",
        phone: "+5585987654321",
        province_code: "CE",
        country_code: "BR"
      },
      line_items: [
        {
          id: 12345678908,
          title: "USB Cable",
          quantity: 3,
          price: "13.33",
          sku: "CABLE-USB-001",
          name: "USB Cable - Type-C - 1m"
        }
      ],
      transactions: [
        {
          id: 89234567890131,
          order_id: 5001234567896,
          kind: "sale",
          gateway: "paypal",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "PAYID-NXYZ234BCD567EFG890HI",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "45.99",
            charges: "ch_3QST2hQ8hI9jK0lM7n890123",
            payment_method_details: {
              card: {
                brand: "visa",
                last4: "7777",
                exp_month: 4,
                exp_year: 2028,
                fingerprint: "3MNO4pQr5STuvwxY",
                funding: "credit",
                network: "visa"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "400000",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 7777",
            credit_card_company: "Visa",
            buyer_action_info: null
          },
          amount: "45.99",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "PAYID-NXYZ234BCD567EFG890HI",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890131"
        }
      ]
    },
    reasonTranslated: "Cobrança duplicada",
    pedidoId: "#1240",
    gateway: "paypal",
    createAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "45.99",
    products: [{ name: "USB Cable", quantity: 3, price: 13.33 }],
    totalProductsValue: 39.99,
  },
  {
    id: "11084628343",
    gateway_dispute_id: "dp_1QRS4hR9iJ0kL1mN2o",
    charge_id: "ch_3QRS3iR9iJ0kL1mN8o901234",
    order_id: "5001234567897",
    type: "chargeback",
    amount: "189.00",
    currency: "USD",
    reason: "product_unacceptable",
    network_reason_code: "4853",
    status: "needs_response",
    evidence_due_by: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_sent_on: null,
    finalized_on: null,
    initiated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 189,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Lucas Rodrigues",
    card_brand: "Mastercard",
    card_last4: "9999",
    card_bin: "222100",
    network: "mastercard",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567897,
      email: "lucas.rodrigues@exemplo.com",
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1241,
      total_price: "189.00",
      subtotal_price: "179.90",
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: "fulfilled",
      customer: {
        id: 9876543217,
        email: "lucas.rodrigues@exemplo.com",
        first_name: "Lucas",
        last_name: "Rodrigues",
        phone: "+5562987654321",
        orders_count: 2,
        total_spent: "287.90"
      },
      billing_address: {
        first_name: "Lucas",
        last_name: "Rodrigues",
        address1: "Av. T-9, 1500",
        address2: null,
        city: "Goiânia",
        province: "Goiás",
        country: "Brazil",
        zip: "74063-010",
        phone: "+5562987654321",
        province_code: "GO",
        country_code: "BR"
      },
      shipping_address: {
        first_name: "Lucas",
        last_name: "Rodrigues",
        address1: "Av. T-9, 1500",
        address2: null,
        city: "Goiânia",
        province: "Goiás",
        country: "Brazil",
        zip: "74063-010",
        phone: "+5562987654321",
        province_code: "GO",
        country_code: "BR"
      },
      line_items: [
        {
          id: 12345678909,
          title: "Bluetooth Speaker",
          quantity: 1,
          price: "179.90",
          sku: "SPEAK-BT-001",
          name: "Bluetooth Speaker - Waterproof"
        }
      ],
      transactions: [
        {
          id: 89234567890132,
          order_id: 5001234567897,
          kind: "authorization",
          gateway: "stripe",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "py_3QRS3iR9iJ0kL1mN8o901234",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "189.00",
            charges: "ch_3QRS3iR9iJ0kL1mN8o901234",
            payment_method_details: {
              card: {
                brand: "mastercard",
                last4: "9999",
                exp_month: 2,
                exp_year: 2029,
                fingerprint: "4NOP5qRs6TUvwxyZ",
                funding: "credit",
                network: "mastercard"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "222100",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 9999",
            credit_card_company: "Mastercard",
            buyer_action_info: null
          },
          amount: "189.00",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QRS3iR9iJ0kL1mN8o901234",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890132"
        },
        {
          id: 89234567890133,
          order_id: 5001234567897,
          kind: "capture",
          gateway: "stripe",
          status: "success",
          message: "Transaction captured",
          created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "py_3QRS3iR9iJ0kL1mN8o901234",
          location_id: null,
          user_id: null,
          parent_id: 89234567890132,
          processed_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {},
          error_code: null,
          source_name: "web",
          amount: "189.00",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QRS3iR9iJ0kL1mN8o901234_capture",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890133"
        }
      ]
    },
    reasonTranslated: "Produto diferente do descrito",
    pedidoId: "#1241",
    gateway: "stripe",
    createAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "189.00",
    products: [{ name: "Bluetooth Speaker", quantity: 1, price: 179.90 }],
    totalProductsValue: 179.90,
  },
  // ============================================================
  // CASOS DE TESTE: Campos Ausentes, Null e Vazios
  // ============================================================
  {
    id: "11084628344",
    gateway_dispute_id: "dp_1QPQ5iS0jK1lM2nO3p",
    charge_id: "ch_3QPQ4jS0jK1lM2nO9p012345",
    order_id: "5001234567898",
    type: "chargeback",
    amount: "99.99",
    currency: "USD",
    reason: "fraudulent",
    network_reason_code: "10.4",
    status: "needs_response",
    evidence_due_by: null, // ⚠️ NULL - Sem prazo definido
    evidence_sent_on: null,
    finalized_on: null,
    initiated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 99.99,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "Carlos Santos",
    card_brand: "Visa",
    card_last4: "0001",
    card_bin: "400000",
    network: "visa",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567898,
      email: "carlos.santos@exemplo.com",
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1242,
      note: null, // ⚠️ NULL
      token: "wxyz5678abcd9012",
      gateway: "shopify_payments",
      test: false,
      total_price: "99.99",
      subtotal_price: "99.99",
      total_weight: 0, // ⚠️ ZERO - Produto digital
      total_tax: "0.00",
      taxes_included: false,
      currency: "USD",
      financial_status: "paid",
      confirmed: true,
      total_discounts: "0.00",
      total_line_items_price: "99.99",
      cart_token: "cart_token_1242",
      buyer_accepts_marketing: false,
      name: "#1242",
      referring_site: null, // ⚠️ NULL
      landing_site: "/",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "99.99",
      checkout_token: "checkout_token_1242",
      reference: null,
      user_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      processed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: null, // ⚠️ NULL - Cliente não forneceu telefone
      customer_locale: "en-US",
      app_id: 580111,
      browser_ip: "192.168.1.100",
      landing_site_ref: null,
      order_number: 1242,
      discount_applications: [], // ⚠️ ARRAY VAZIO
      discount_codes: [], // ⚠️ ARRAY VAZIO
      note_attributes: [],
      payment_gateway_names: ["shopify_payments"],
      processing_method: "direct",
      checkout_id: 30123456794,
      source_name: "web",
      fulfillment_status: null, // ⚠️ NULL - Produto digital, sem fulfillment
      tax_lines: [],
      tags: "", // ⚠️ STRING VAZIA
      contact_email: "carlos.santos@exemplo.com",
      order_status_url: "https://mystore.myshopify.com/12345/orders/wxyz5678/authenticate?key=xyz794",
      presentment_currency: "USD",
      total_line_items_price_set: {
        shop_money: { amount: "99.99", currency_code: "USD" },
        presentment_money: { amount: "99.99", currency_code: "USD" }
      },
      total_discounts_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      subtotal_price_set: {
        shop_money: { amount: "99.99", currency_code: "USD" },
        presentment_money: { amount: "99.99", currency_code: "USD" }
      },
      total_price_set: {
        shop_money: { amount: "99.99", currency_code: "USD" },
        presentment_money: { amount: "99.99", currency_code: "USD" }
      },
      total_tax_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      customer: {
        id: 9876543218,
        email: "carlos.santos@exemplo.com",
        accepts_marketing: false,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "Carlos",
        last_name: "Santos",
        orders_count: 1,
        state: "enabled",
        total_spent: "99.99",
        last_order_id: 5001234567898,
        note: null,
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: null, // ⚠️ NULL - Sem telefone
        tags: "", // ⚠️ STRING VAZIA
        last_order_name: "#1242",
        currency: "USD",
        accepts_marketing_updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: null,
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543218",
        default_address: null // ⚠️ NULL - Cliente não tem endereço cadastrado
      },
      billing_address: {
        first_name: "Carlos",
        last_name: "Santos",
        address1: "123 Main St",
        address2: null, // ⚠️ NULL
        city: "New York",
        province: "New York",
        country: "United States",
        zip: "10001",
        phone: null, // ⚠️ NULL
        name: "Carlos Santos",
        province_code: "NY",
        country_code: "US",
        latitude: null, // ⚠️ NULL - Sem coordenadas
        longitude: null // ⚠️ NULL
      },
      shipping_address: null, // ⚠️ NULL - Produto digital, sem envio
      line_items: [
        {
          id: 12345678910,
          variant_id: 40123456795,
          title: "Digital Course",
          quantity: 1,
          sku: "COURSE-DIG-001",
          variant_title: null, // ⚠️ NULL - Sem variante
          vendor: "Online Education Co",
          fulfillment_service: "manual",
          product_id: 7654321104,
          requires_shipping: false, // Produto digital
          taxable: false,
          gift_card: false,
          name: "Digital Course",
          variant_inventory_management: null, // ⚠️ NULL
          properties: [], // ⚠️ ARRAY VAZIO
          product_exists: true,
          fulfillable_quantity: 0,
          grams: 0, // Produto digital
          price: "99.99",
          total_discount: "0.00",
          fulfillment_status: null, // ⚠️ NULL
          price_set: {
            shop_money: { amount: "99.99", currency_code: "USD" },
            presentment_money: { amount: "99.99", currency_code: "USD" }
          },
          total_discount_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          discount_allocations: [],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678910",
          tax_lines: []
        }
      ],
      shipping_lines: [], // ⚠️ ARRAY VAZIO - Sem envio
      fulfillments: [], // ⚠️ ARRAY VAZIO - Produto digital
      refunds: [],
      transactions: [
        {
          id: 89234567890134,
          order_id: 5001234567898,
          kind: "sale",
          gateway: "shopify_payments",
          status: "success",
          message: "Transaction approved",
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "ch_3QPQ4jS0jK1lM2nO9p012345",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {
            paid_amount: "99.99",
            charges: "ch_3QPQ4jS0jK1lM2nO9p012345",
            payment_method_details: {
              card: {
                brand: "visa",
                last4: "0001",
                exp_month: 10,
                exp_year: 2026,
                fingerprint: "5OPQ6rSt7UVwxyzA",
                funding: "credit",
                network: "visa"
              },
              type: "card"
            }
          },
          error_code: null,
          source_name: "web",
          payment_details: {
            credit_card_bin: "400000",
            avs_result_code: "Y",
            cvv_result_code: "M",
            credit_card_number: "•••• •••• •••• 0001",
            credit_card_company: "Visa",
            buyer_action_info: null
          },
          amount: "99.99",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QPQ4jS0jK1lM2nO9p012345",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890134"
        }
      ]
    },
    reasonTranslated: "Fraudulenta",
    pedidoId: "#1242",
    gateway: "shopify_payments",
    createAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "99.99",
    products: [{ name: "Digital Course", quantity: 1, price: 99.99 }],
    totalProductsValue: 99.99,
  },
  {
    id: "11084628345",
    gateway_dispute_id: "dp_1QOP6jT1kL2mN3oP4q",
    charge_id: "ch_3QOP5kT1kL2mN3oP0q123456",
    order_id: "5001234567899",
    type: "inquiry",
    amount: "45.00",
    currency: "USD",
    reason: "general",
    network_reason_code: null, // ⚠️ NULL - Inquiry não tem código
    status: "needs_response",
    evidence_due_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_sent_on: null,
    finalized_on: null,
    initiated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    original_amount: 45,
    original_currency: "USD",
    dispute_opened_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    cardholder_name: "", // ⚠️ STRING VAZIA
    card_brand: "Visa",
    card_last4: "3333",
    card_bin: "424242",
    network: "visa",
    shop_domain: "myawesomestore.myshopify.com",
    shop_name: "My Awesome Store",
    order: {
      id: 5001234567899,
      email: "", // ⚠️ STRING VAZIA - Email não fornecido
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      number: 1243,
      note: "",  // ⚠️ STRING VAZIA
      token: "efgh9012ijkl3456",
      gateway: "shopify_payments",
      test: false,
      total_price: "45.00",
      subtotal_price: "45.00",
      total_weight: 50,
      total_tax: "0.00",
      taxes_included: false,
      currency: "USD",
      financial_status: "paid",
      confirmed: true,
      total_discounts: "0.00",
      total_line_items_price: "45.00",
      cart_token: "",  // ⚠️ STRING VAZIA
      buyer_accepts_marketing: false,
      name: "#1243",
      referring_site: "",  // ⚠️ STRING VAZIA
      landing_site: "/",
      cancelled_at: null,
      cancel_reason: null,
      total_price_usd: "45.00",
      checkout_token: "",  // ⚠️ STRING VAZIA
      reference: "",  // ⚠️ STRING VAZIA
      user_id: null,
      location_id: null,
      source_identifier: "",  // ⚠️ STRING VAZIA
      source_url: "",  // ⚠️ STRING VAZIA
      processed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      device_id: null,
      phone: "",  // ⚠️ STRING VAZIA
      customer_locale: "en-US",
      app_id: 580111,
      browser_ip: "",  // ⚠️ STRING VAZIA
      landing_site_ref: "",  // ⚠️ STRING VAZIA
      order_number: 1243,
      discount_applications: [],
      discount_codes: [],
      note_attributes: [],
      payment_gateway_names: ["shopify_payments"],
      processing_method: "direct",
      checkout_id: 30123456795,
      source_name: "web",
      fulfillment_status: "unfulfilled",
      tax_lines: [],
      tags: "",
      contact_email: "",  // ⚠️ STRING VAZIA
      order_status_url: "https://mystore.myshopify.com/12345/orders/efgh9012/authenticate?key=xyz795",
      presentment_currency: "USD",
      total_line_items_price_set: {
        shop_money: { amount: "45.00", currency_code: "USD" },
        presentment_money: { amount: "45.00", currency_code: "USD" }
      },
      total_discounts_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      total_shipping_price_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      subtotal_price_set: {
        shop_money: { amount: "45.00", currency_code: "USD" },
        presentment_money: { amount: "45.00", currency_code: "USD" }
      },
      total_price_set: {
        shop_money: { amount: "45.00", currency_code: "USD" },
        presentment_money: { amount: "45.00", currency_code: "USD" }
      },
      total_tax_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" }
      },
      customer: {
        id: 9876543219,
        email: "",  // ⚠️ STRING VAZIA
        accepts_marketing: false,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        first_name: "",  // ⚠️ STRING VAZIA
        last_name: "",  // ⚠️ STRING VAZIA
        orders_count: 1,
        state: "enabled",
        total_spent: "45.00",
        last_order_id: 5001234567899,
        note: "",  // ⚠️ STRING VAZIA
        verified_email: false,
        multipass_identifier: null,
        tax_exempt: false,
        phone: "",  // ⚠️ STRING VAZIA
        tags: "",
        last_order_name: "#1243",
        currency: "USD",
        accepts_marketing_updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        marketing_opt_in_level: null,
        tax_exemptions: [],
        admin_graphql_api_id: "gid://shopify/Customer/9876543219",
        default_address: {
          id: 12345678911,
          customer_id: 9876543219,
          first_name: "",  // ⚠️ STRING VAZIA
          last_name: "",  // ⚠️ STRING VAZIA
          company: "",  // ⚠️ STRING VAZIA
          address1: "Unknown",
          address2: "",  // ⚠️ STRING VAZIA
          city: "Unknown",
          province: "Unknown",
          country: "United States",
          zip: "00000",
          phone: "",  // ⚠️ STRING VAZIA
          name: "",  // ⚠️ STRING VAZIA
          province_code: "",  // ⚠️ STRING VAZIA
          country_code: "US",
          country_name: "United States",
          default: true
        }
      },
      billing_address: {
        first_name: "",  // ⚠️ STRING VAZIA
        last_name: "",  // ⚠️ STRING VAZIA
        address1: "Unknown",
        address2: "",  // ⚠️ STRING VAZIA
        city: "Unknown",
        province: "Unknown",
        country: "United States",
        zip: "00000",
        phone: "",  // ⚠️ STRING VAZIA
        name: "",  // ⚠️ STRING VAZIA
        province_code: "",  // ⚠️ STRING VAZIA
        country_code: "US",
        latitude: null,
        longitude: null
      },
      shipping_address: {
        first_name: "",  // ⚠️ STRING VAZIA
        last_name: "",  // ⚠️ STRING VAZIA
        address1: "Unknown",
        address2: "",  // ⚠️ STRING VAZIA
        city: "Unknown",
        province: "Unknown",
        country: "United States",
        zip: "00000",
        phone: "",  // ⚠️ STRING VAZIA
        name: "",  // ⚠️ STRING VAZIA
        province_code: "",  // ⚠️ STRING VAZIA
        country_code: "US",
        latitude: null,
        longitude: null
      },
      line_items: [
        {
          id: 12345678911,
          variant_id: null, // ⚠️ NULL
          title: "Mystery Item",
          quantity: 1,
          sku: "",  // ⚠️ STRING VAZIA
          variant_title: "",  // ⚠️ STRING VAZIA
          vendor: "",  // ⚠️ STRING VAZIA
          fulfillment_service: "manual",
          product_id: null, // ⚠️ NULL
          requires_shipping: true,
          taxable: false,
          gift_card: false,
          name: "Mystery Item",
          variant_inventory_management: "",  // ⚠️ STRING VAZIA
          properties: [],
          product_exists: false, // ⚠️ Produto não existe mais
          fulfillable_quantity: 1,
          grams: 50,
          price: "45.00",
          total_discount: "0.00",
          fulfillment_status: "unfulfilled",
          price_set: {
            shop_money: { amount: "45.00", currency_code: "USD" },
            presentment_money: { amount: "45.00", currency_code: "USD" }
          },
          total_discount_set: {
            shop_money: { amount: "0.00", currency_code: "USD" },
            presentment_money: { amount: "0.00", currency_code: "USD" }
          },
          discount_allocations: [],
          duties: [],
          admin_graphql_api_id: "gid://shopify/LineItem/12345678911",
          tax_lines: []
        }
      ],
      shipping_lines: [],
      fulfillments: [],
      refunds: [],
      transactions: [
        {
          id: 89234567890135,
          order_id: 5001234567899,
          kind: "sale",
          gateway: "shopify_payments",
          status: "success",
          message: "",  // ⚠️ STRING VAZIA
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          test: false,
          authorization: "ch_3QOP5kT1kL2mN3oP0q123456",
          location_id: null,
          user_id: null,
          parent_id: null,
          processed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          device_id: null,
          receipt: {}, // ⚠️ OBJETO VAZIO
          error_code: null,
          source_name: "web",
          payment_details: null, // ⚠️ NULL - Detalhes não disponíveis
          amount: "45.00",
          currency: "USD",
          authorization_expires_at: null,
          extended_authorization_attributes: {},
          gateway_transaction_id: "pi_3QOP5kT1kL2mN3oP0q123456",
          admin_graphql_api_id: "gid://shopify/OrderTransaction/89234567890135"
        }
      ]
    },
    reasonTranslated: "Geral",
    pedidoId: "#1243",
    gateway: "shopify_payments",
    createAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ordersQnt: 1,
    amountOrdem: "45.00",
    products: [{ name: "Mystery Item", quantity: 1, price: 45.00 }],
    totalProductsValue: 45.00,
  },
];

type MockDataOverrides = {
  healthAccount?: number;
};

export const getMockDisputesData = (overrides?: MockDataOverrides) => {
  const metrics = {
    ...mockMetrics,
    ...(overrides?.healthAccount !== undefined ? { healthAccount: overrides.healthAccount } : {}),
  };

  return {
    metrics,
    charts: mockCharts,
    rawData: {
      disputes: mockDisputes,
    },
  };
};
