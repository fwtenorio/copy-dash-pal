# Estrutura dos Dados Mockados - Shopify API

Este documento descreve a estrutura dos dados mockados no arquivo `src/data/mockDisputesData.ts`, que são fiéis à estrutura real da API da Shopify.

## 📋 Referência da API Shopify

Os dados mockados seguem a estrutura oficial da **Shopify REST Admin API 2024-07** e **Shopify Payments Dispute API**.

Documentação oficial: 
- Orders: https://shopify.dev/docs/api/admin-rest/2024-07/resources/order
- Transactions: https://shopify.dev/docs/api/admin-rest/2024-07/resources/transaction
- Disputes: https://shopify.dev/docs/api/admin-graphql/2024-07/objects/shopifypaymentsdispute

## 🔥 Campos Adicionais de Dispute (Shopify Payments)

Além dos campos do Order, cada dispute inclui:

```typescript
{
  id: string,                      // ID curto, numérico (ex.: "11084628336")
  gateway_dispute_id?: string,     // (Opcional) ID do provedor/gateway (ex.: dp_xxx)
  charge_id: string,               // ID da cobrança (formato: ch_xxx)
  order_id: string,                // ID do pedido
  type: string,                    // Tipo (chargeback, inquiry)
  amount: string,                  // Valor em disputa
  currency: string,                // Moeda
  reason: string,                  // Motivo da disputa
  network_reason_code: string,     // Código da rede de cartão
  status: string,                  // Status (needs_response, under_review, won, lost)
  evidence_due_by: string | null,  // Prazo para envio de evidências
  evidence_sent_on: string | null, // Data de envio das evidências
  finalized_on: string | null,     // Data de finalização
  initiated_at: string,            // Data de início
  dispute_opened_at: string,       // ⭐ Data de abertura do dispute
  cardholder_name: string,         // ⭐ Nome no cartão
  card_brand: string,              // ⭐ Bandeira (Visa, Mastercard, Elo, Amex)
  card_last4: string,              // ⭐ Últimos 4 dígitos
  card_bin: string,                // ⭐ BIN do cartão (primeiros 6 dígitos)
  network: string,                 // ⭐ Rede (visa, mastercard, elo, american_express)
  shop_domain: string,             // ⭐ URL da loja (.myshopify.com)
  shop_name: string,               // ⭐ Nome da loja
  original_amount: number,
  original_currency: string
}
```

## 🏗️ Estrutura do Objeto Order

### Campos Principais do Pedido

```typescript
{
  id: number,                    // ID único do pedido
  email: string,                 // Email do cliente
  created_at: string (ISO 8601), // Data de criação
  updated_at: string (ISO 8601), // Data de atualização
  number: number,                // Número do pedido
  note: string | null,           // Notas do pedido
  token: string,                 // Token único
  gateway: string,               // Gateway de pagamento (shopify_payments, stripe, paypal)
  test: boolean,                 // Se é pedido de teste
  total_price: string,           // Preço total (string formatada)
  subtotal_price: string,        // Subtotal (sem frete e taxas)
  total_weight: number,          // Peso total em gramas
  total_tax: string,             // Total de impostos
  taxes_included: boolean,       // Se impostos estão incluídos no preço
  currency: string,              // Moeda (USD, BRL, etc)
  financial_status: string,      // Status financeiro (paid, refunded, etc)
  confirmed: boolean,            // Se foi confirmado
  total_discounts: string,       // Total de descontos
  total_line_items_price: string,// Total dos itens
  buyer_accepts_marketing: boolean,
  name: string,                  // Nome do pedido (#1234)
  referring_site: string | null, // Site de origem
  landing_site: string,          // Página de entrada
  cancelled_at: string | null,   // Data de cancelamento
  cancel_reason: string | null,  // Motivo do cancelamento
  phone: string,                 // Telefone
  customer_locale: string,       // Locale do cliente (pt-BR, en-US)
  browser_ip: string,            // IP do navegador
  order_number: number,          // Número sequencial
  processing_method: string,     // Método de processamento
  source_name: string,           // Origem (web, mobile, etc)
  fulfillment_status: string     // Status de fulfillment (fulfilled, unfulfilled, partial)
}
```

### 👤 Objeto Customer (Cliente)

**IMPORTANTE:** A Shopify **SEMPRE** separa o nome em `first_name` e `last_name`.

```typescript
customer: {
  id: number,
  email: string,
  accepts_marketing: boolean,
  created_at: string (ISO 8601),
  updated_at: string (ISO 8601),
  first_name: string,           // ⚠️ Nome separado
  last_name: string,            // ⚠️ Sobrenome separado
  orders_count: number,         // Total de pedidos
  state: string,                // Estado do cliente (enabled, disabled)
  total_spent: string,          // Total gasto
  last_order_id: number,
  note: string | null,
  verified_email: boolean,
  multipass_identifier: string | null,
  tax_exempt: boolean,
  phone: string,
  tags: string,                 // Tags separadas por vírgula
  last_order_name: string,
  currency: string,
  accepts_marketing_updated_at: string (ISO 8601),
  marketing_opt_in_level: string | null,
  tax_exemptions: array,
  admin_graphql_api_id: string, // ID GraphQL
  default_address: {            // Endereço padrão do cliente
    id: number,
    customer_id: number,
    first_name: string,
    last_name: string,
    company: string | null,
    address1: string,
    address2: string | null,
    city: string,
    province: string,
    country: string,
    zip: string,
    phone: string,
    name: string,               // Nome completo concatenado
    province_code: string,      // Código do estado (SP, RJ, etc)
    country_code: string,       // Código do país (BR, US, etc)
    country_name: string,
    default: boolean
  }
}
```

### 📍 Billing Address (Endereço de Cobrança)

```typescript
billing_address: {
  first_name: string,           // ⚠️ Nome separado
  last_name: string,            // ⚠️ Sobrenome separado
  address1: string,             // Endereço linha 1
  address2: string | null,      // Endereço linha 2 (complemento)
  city: string,                 // Cidade
  province: string,             // Estado/Província (nome completo)
  country: string,              // País (nome completo)
  zip: string,                  // CEP/Código postal
  phone: string,                // Telefone
  name: string,                 // Nome completo (first_name + last_name)
  province_code: string,        // Código do estado (SP, RJ)
  country_code: string,         // Código do país (BR, US)
  latitude: number,             // Latitude (opcional)
  longitude: number             // Longitude (opcional)
}
```

### 🚚 Shipping Address (Endereço de Entrega)

**IMPORTANTE:** O `shipping_address` pode ser **diferente** do `billing_address` (comum em presentes ou dropshipping).

**ATENÇÃO:** O `shipping_address` pode ser **null** se for:
- Produto digital
- Venda em POS físico sem entrega
- Serviço sem envio

```typescript
shipping_address: {
  first_name: string,
  last_name: string,
  address1: string,
  address2: string | null,
  city: string,
  province: string,
  country: string,
  zip: string,
  phone: string,
  name: string,
  province_code: string,
  country_code: string,
  latitude: number,             // Coordenadas geográficas
  longitude: number
}
```

### 📦 Line Items (Itens do Pedido)

```typescript
line_items: [
  {
    id: number,
    variant_id: number,
    title: string,              // Título do produto
    quantity: number,           // Quantidade
    sku: string,                // SKU
    variant_title: string,      // Variante (cor, tamanho, etc)
    vendor: string,             // Fornecedor
    fulfillment_service: string,
    product_id: number,
    requires_shipping: boolean,
    taxable: boolean,
    gift_card: boolean,
    name: string,               // Nome completo (title + variant)
    variant_inventory_management: string,
    properties: array,          // Propriedades customizadas
    product_exists: boolean,
    fulfillable_quantity: number,
    grams: number,              // Peso em gramas
    price: string,              // Preço unitário
    total_discount: string,     // Desconto aplicado
    fulfillment_status: string, // Status (fulfilled, unfulfilled, partial)
    price_set: {                // Preço em múltiplas moedas
      shop_money: { amount: string, currency_code: string },
      presentment_money: { amount: string, currency_code: string }
    },
    total_discount_set: {
      shop_money: { amount: string, currency_code: string },
      presentment_money: { amount: string, currency_code: string }
    },
    discount_allocations: array, // Alocação de descontos
    duties: array,               // Taxas alfandegárias
    admin_graphql_api_id: string,
    tax_lines: array             // Linhas de impostos
  }
]
```

### 🚚 Shipping Lines (Linhas de Envio)

```typescript
shipping_lines: [
  {
    id: number,
    title: string,              // Nome do método de envio
    price: string,              // Preço do frete
    code: string,               // Código do método
    source: string,             // Origem (shopify, third_party)
    phone: string | null,
    requested_fulfillment_service_id: number | null,
    delivery_category: string | null,
    carrier_identifier: string | null,
    discounted_price: string,   // Preço com desconto
    price_set: {
      shop_money: { amount: string, currency_code: string },
      presentment_money: { amount: string, currency_code: string }
    },
    discounted_price_set: {
      shop_money: { amount: string, currency_code: string },
      presentment_money: { amount: string, currency_code: string }
    },
    discount_allocations: array,
    tax_lines: array
  }
]
```

### 📊 Campos Financeiros (Price Sets)

A Shopify usa objetos `*_set` para representar valores em múltiplas moedas:

```typescript
total_price_set: {
  shop_money: {                 // Moeda da loja
    amount: string,
    currency_code: string
  },
  presentment_money: {          // Moeda apresentada ao cliente
    amount: string,
    currency_code: string
  }
}
```

Todos os campos financeiros seguem esse padrão:
- `total_line_items_price_set`
- `total_discounts_set`
- `total_shipping_price_set`
- `subtotal_price_set`
- `total_price_set`
- `total_tax_set`

### 💰 Discount Applications (Aplicação de Descontos)

```typescript
discount_applications: [
  {
    type: string,               // Tipo (discount_code, automatic, manual)
    value: string,              // Valor do desconto
    value_type: string,         // Tipo de valor (fixed_amount, percentage)
    allocation_method: string,  // Método de alocação (across, each)
    target_selection: string,   // Seleção (all, entitled)
    target_type: string,        // Tipo (line_item, shipping_line)
    code: string,               // Código do cupom (se aplicável)
    description: string         // Descrição
  }
]
```

### 📦 Fulfillments (Entregas)

```typescript
fulfillments: [
  {
    id: number,
    order_id: number,
    status: string,             // Status (success, pending, failure)
    created_at: string (ISO 8601),
    service: string,
    updated_at: string (ISO 8601),
    tracking_company: string,   // Transportadora (Correios, FedEx, etc)
    shipment_status: string,    // Status do envio (delivered, in_transit, etc)
    location_id: number | null,
    tracking_number: string,    // Código de rastreamento
    tracking_numbers: array,    // Lista de códigos
    tracking_url: string,       // URL de rastreamento
    tracking_urls: array,
    receipt: object,
    name: string,               // Nome (#1234.1)
    admin_graphql_api_id: string,
    line_items: array           // Itens incluídos nesta entrega
  }
]
```

### 💳 Transactions (Transações)

**IMPORTANTE:** Cada pedido contém um array de transactions que registra todas as operações financeiras.

```typescript
transactions: [
  {
    id: number,                           // ID único da transação
    order_id: number,                     // ID do pedido
    kind: string,                         // Tipo: authorization, sale, capture, void, refund
    gateway: string,                      // Gateway (shopify_payments, stripe, paypal)
    status: string,                       // Status (success, pending, failure, error)
    message: string,                      // Mensagem de retorno
    created_at: string (ISO 8601),        // Data de criação
    test: boolean,                        // Se é transação de teste
    authorization: string,                // ⭐ Authorization code/token
    location_id: number | null,
    user_id: number | null,
    parent_id: number | null,             // ID da transação pai (para captures)
    processed_at: string (ISO 8601),      // Data de processamento
    device_id: number | null,
    receipt: {                            // ⭐ Recibo detalhado
      paid_amount: string,
      charges: string,                    // Charge ID
      payment_method_details: {
        card: {
          brand: string,                  // Bandeira
          last4: string,                  // Últimos 4 dígitos
          exp_month: number,              // Mês de expiração
          exp_year: number,               // Ano de expiração
          fingerprint: string,            // Fingerprint único do cartão
          funding: string,                // Tipo (credit, debit, prepaid)
          network: string                 // Rede
        },
        type: string                      // Tipo de pagamento (card)
      }
    },
    error_code: string | null,
    source_name: string,                  // Origem (web, pos, mobile)
    payment_details: {                    // ⭐ Detalhes do pagamento
      credit_card_bin: string,            // BIN do cartão
      avs_result_code: string,            // Código AVS (Address Verification)
      cvv_result_code: string,            // Código CVV
      credit_card_number: string,         // Número mascarado
      credit_card_company: string,        // Empresa do cartão
      buyer_action_info: object | null
    },
    amount: string,                       // Valor da transação
    currency: string,                     // Moeda
    authorization_expires_at: string | null,
    extended_authorization_attributes: object,
    gateway_transaction_id: string,       // ⭐ ID da transação no gateway
    admin_graphql_api_id: string          // ID GraphQL
  }
]
```

#### Tipos de Transação (kind)

- **authorization**: Reserva fundos sem capturar
- **sale**: Autorização + captura em uma única operação
- **capture**: Captura fundos previamente autorizados (tem parent_id)
- **void**: Cancela uma autorização ou captura pendente
- **refund**: Reembolsa fundos capturados

#### AVS Result Codes (Address Verification)

- **Y**: Address and ZIP match
- **N**: No match
- **A**: Address matches, ZIP doesn't
- **Z**: ZIP matches, address doesn't
- **U**: Unavailable

#### CVV Result Codes

- **M**: Match
- **N**: No match
- **P**: Not processed
- **U**: Unavailable

### 💸 Refunds (Reembolsos)

```typescript
refunds: [
  {
    id: number,
    order_id: number,
    created_at: string (ISO 8601),
    note: string,               // Motivo do reembolso
    user_id: number | null,
    processed_at: string (ISO 8601),
    restock: boolean,           // Se recolocou em estoque
    duties: array,
    total_duties_set: object,
    admin_graphql_api_id: string,
    refund_line_items: array,   // Itens reembolsados
    transactions: array,        // Transações de reembolso
    order_adjustments: array
  }
]
```

## 🎯 Exemplos de Casos de Uso nos Mocks

### 1. Pedido Simples (10001)
- Cliente: Maria Silva (Brasil)
- 1 produto: Premium Watch
- Status: needs_response
- Fulfillment: unfulfilled
- Motivo: product_not_received

### 2. Pedido com Entrega Completa (10002)
- Cliente: João Santos (Brasil)
- 1 produto: Leather Wallet
- Status: under_review
- Fulfillment: fulfilled com tracking
- Gateway: Stripe

### 3. Pedido Ganho (10003)
- Cliente: Ana Oliveira (Brasil)
- 1 produto: Wireless Headphones
- Status: won
- Fulfillment: fulfilled
- Motivo: fraudulent

### 4. Pedido Perdido com Reembolso (10004)
- Cliente: Pedro Costa (Brasil)
- 2 produtos: Phone Case
- Status: lost
- Financial status: refunded
- Inclui objeto `refunds` completo

### 5. Pedido com Múltiplos Produtos e Desconto (10005)
- Cliente: Carla Mendes (Brasil)
- 2 produtos diferentes
- Cupom de desconto: PRIMEIRA10
- Moeda: BRL
- Impostos (ICMS): 15%
- Frete grátis

### 6-8. Pedidos Simplificados
- Estrutura mínima mas fiel à Shopify
- Diferentes estados e gateways
- Cobrem diversos cenários

## ⚠️ Pontos Importantes

### 1. Nomes Separados
```javascript
// ✅ CORRETO - Como vem da Shopify
customer.first_name = "Maria"
customer.last_name = "Silva"

// ❌ INCORRETO - Shopify NÃO envia assim
customer.name = "Maria Silva"
```

Se precisar do nome completo, concatene:
```javascript
const fullName = `${customer.first_name} ${customer.last_name}`;
```

### 2. Endereços Diferentes
```javascript
// billing_address pode ser diferente de shipping_address
// Comum em:
// - Presentes
// - Dropshipping
// - Endereço corporativo vs residencial
```

### 3. Shipping Address Nullable
```javascript
if (order.shipping_address === null) {
  // Produto digital, serviço, ou venda sem entrega
}
```

### 4. Financial Status
Valores possíveis:
- `pending` - Pagamento pendente
- `authorized` - Autorizado mas não capturado
- `partially_paid` - Parcialmente pago
- `paid` - Pago
- `partially_refunded` - Parcialmente reembolsado
- `refunded` - Reembolsado totalmente
- `voided` - Anulado

### 5. Fulfillment Status
Valores possíveis:
- `fulfilled` - Todos os itens entregues
- `null` ou `unfulfilled` - Nenhum item entregue
- `partial` - Alguns itens entregues
- `restocked` - Recolocado em estoque (pedido cancelado)

## 🔗 Recursos Adicionais

- [Shopify Order API](https://shopify.dev/docs/api/admin-rest/2024-07/resources/order)
- [Customer API](https://shopify.dev/docs/api/admin-rest/2024-07/resources/customer)
- [Fulfillment API](https://shopify.dev/docs/api/admin-rest/2024-07/resources/fulfillment)
- [Refund API](https://shopify.dev/docs/api/admin-rest/2024-07/resources/refund)

## 💳 Números de Cartão Realistas (Testes)

Os dados mockados usam BINs (Bank Identification Numbers) reais de teste:

### Visa
- **BIN**: 424242, 400000, 411111
- **Último 4 dígitos**: 4242, 7777, 1234

### Mastercard
- **BIN**: 545454, 555555, 222100
- **Último 4 dígitos**: 5454, 8888, 9999

### American Express
- **BIN**: 378282
- **Último 4 dígitos**: 0005

### Elo (Brasil)
- **BIN**: 636368
- **Último 4 dígitos**: 6363

## 🔑 Formato dos IDs

### Dispute IDs
Formato: `dp_` + 16 caracteres alfanuméricos
Exemplo: `dp_1QYZ7aK2bC3dE4fG5h`

### Charge IDs
Formato: `ch_` + 22 caracteres alfanuméricos
Exemplo: `ch_3QYZ6bK2bC3dE4fG1h234567`

### Transaction IDs
Formato: Números de 14 dígitos
Exemplo: `89234567890123`

### Order IDs
Formato: Números de 13 dígitos
Exemplo: `5001234567890`

### Authorization Codes

**Shopify Payments/Stripe:**
- Formato: Charge ID ou `py_` + alfanumérico
- Exemplo: `ch_3QYZ6bK2bC3dE4fG1h234567`

**PayPal:**
- Formato: `PAYID-` + alfanumérico
- Exemplo: `PAYID-MXYZ123ABC456DEF789GH`

### Gateway Transaction IDs

**Shopify Payments/Stripe:**
- Formato: `pi_` + alfanumérico
- Exemplo: `pi_3QYZ6bK2bC3dE4fG1h234567`
- Captura: `pi_3QYZ6bK2bC3dE4fG1h234567_capture`

**PayPal:**
- Mesmo que authorization code
- Exemplo: `PAYID-MXYZ123ABC456DEF789GH`

## 🏪 Shop Domain

Todas as lojas mockadas usam:
- **Domain**: `myawesomestore.myshopify.com`
- **Name**: `My Awesome Store`

## 📦 Tracking Numbers (Brasil)

Formato Correios: `BR` + 9 dígitos + `BR`
Exemplos:
- `BR123456789BR`
- `BR987654321BR`
- `BR456789012BR`

## 🌐 Network Reason Codes

### Visa
- **13.1**: Merchandise/Services Not Received
- **10.4**: Fraud - Card-Absent Environment

### Mastercard
- **4853**: Cardholder Dispute - Defective/Not as Described/Services Not Provided
- **4.53**: Cardholder Dispute - Recurring Transaction

## 📝 Changelog

- **2024-12-16 v3**: Adição de Edge Cases e Testes de Robustez
  - ✅ **2 Disputes de teste** com cenários especiais
  - ✅ **Campos NULL** testados (~25 campos)
  - ✅ **Strings vazias** testadas (~30 campos)
  - ✅ **Arrays vazios** testados (8 arrays)
  - ✅ **IDs de dispute numéricos** (ex.: "11084628336") + `gateway_dispute_id` opcional
  - ✅ **Produto digital** sem shipping_address
  - ✅ **Cliente anônimo** com dados mínimos
  - ✅ **Produto deletado** (product_exists: false)
  - ✅ **Inquiry** (não chargeback)
  - ✅ **Payment details null**
  - ✅ **Receipt vazio** (objeto {})
  - ✅ Documentação completa: `CASOS_TESTE_EDGE.md`

- **2024-12-16 v2**: Atualização completa com dados de produção
  - ✅ **Transaction IDs** completos com authorization keys
  - ✅ **Dispute IDs** realistas (formato dp_xxx)
  - ✅ **Charge IDs** realistas (formato ch_xxx)
  - ✅ **Email do cliente** em todos os orders
  - ✅ **Authorization keys** em todas as transactions
  - ✅ **Shop domain** (.myshopify.com) em todos os disputes
  - ✅ **Tracking numbers** (Correios) em fulfillments
  - ✅ **Objetos transactions** completos com:
    - Payment details (BIN, AVS, CVV codes)
    - Receipt com detalhes do cartão
    - Gateway transaction IDs
    - Authorization/Capture flow
  - ✅ **Card details** realistas:
    - Brand (Visa, Mastercard, Elo, Amex)
    - Last 4 digits
    - BIN numbers
    - Expiration dates
    - Fingerprints
  - ✅ **Network reason codes** por bandeira
  - ✅ **Números realistas** de teste para cartões
  - ✅ **Variação de bandeiras**: Visa, Mastercard, Elo (BR), American Express
  - ✅ **Diferentes tipos de transação**: sale, authorization+capture
  - ✅ **AVS e CVV result codes**

- **2024-12-16 v1**: Estrutura inicial baseada na Shopify REST Admin API 2024-07
  - 8 disputes mockados completos
  - Estrutura fiel à API real da Shopify
  - Exemplos brasileiros com CEP, CPF, telefones BR
  - Casos de uso diversos (won, lost, under_review, needs_response)
  - Múltiplos gateways (shopify_payments, stripe, paypal)
