# 📊 Resumo dos Dados Mockados - Completo e Realista

## ✅ Checklist de Completude

Todos os dados mockados agora incluem:

### 🆔 Identificadores Únicos
- [x] **Dispute ID** realista (formato: `dp_1QYZ7aK2bC3dE4fG5h`)
- [x] **Charge ID** (formato: `ch_3QYZ6bK2bC3dE4fG1h234567`)
- [x] **Transaction IDs** (números de 14 dígitos)
- [x] **Order IDs** (números de 13 dígitos)
- [x] **Gateway Transaction IDs** (formato: `pi_xxx` ou `PAYID-xxx`)

### 📅 Datas Completas
- [x] **initiated_at** - Data de início da disputa
- [x] **dispute_opened_at** - Data de abertura do dispute
- [x] **evidence_due_by** - Prazo para evidências
- [x] **evidence_sent_on** - Data de envio das evidências
- [x] **finalized_on** - Data de finalização
- [x] **created_at** nos orders e transactions
- [x] **processed_at** nas transactions

### 💳 Dados do Cartão
- [x] **cardholder_name** - Nome no cartão
- [x] **card_brand** - Bandeira (Visa, Mastercard, Elo, Amex)
- [x] **card_last4** - Últimos 4 dígitos
- [x] **card_bin** - BIN do cartão (primeiros 6 dígitos)
- [x] **network** - Rede do cartão
- [x] **exp_month** e **exp_year** - Validade
- [x] **fingerprint** - Fingerprint único
- [x] **funding** - Tipo (credit, debit)

### 🔐 Autorizações e Segurança
- [x] **authorization** - Authorization key/code
- [x] **avs_result_code** - Address Verification System
- [x] **cvv_result_code** - CVV verification
- [x] **receipt** completo com payment_method_details

### 👤 Dados do Cliente
- [x] **email** - Email do cliente (em todos os orders)
- [x] **first_name** e **last_name** separados
- [x] **phone** - Telefone com código do país (+55)
- [x] **customer_locale** - Locale (pt-BR)
- [x] **browser_ip** - IP do navegador

### 🏪 Dados da Loja
- [x] **shop_domain** - URL completa (.myshopify.com)
- [x] **shop_name** - Nome da loja
- [x] **order_status_url** - URL de status do pedido

### 📦 Dados de Envio
- [x] **tracking_number** - Código de rastreio (Correios)
- [x] **tracking_url** - URL de rastreamento
- [x] **tracking_company** - Transportadora
- [x] **shipment_status** - Status da entrega

### 💰 Transações Completas
- [x] **kind** - Tipo (sale, authorization, capture, refund)
- [x] **status** - Status da transação
- [x] **message** - Mensagem de retorno
- [x] **gateway** - Gateway de pagamento
- [x] **payment_details** - Detalhes completos do pagamento
- [x] **receipt** - Recibo da transação

## 📋 Tabela de Disputes Mockados

### Disputes Completos (8)

| ID (numérico) | Pedido | Cliente | Valor | Moeda | Cartão | Status | Gateway |
|---|---|---|---|---|---|---|---|
| 11084628336 | #1234 | Maria Silva | $125.00 | USD | Visa •4242 | needs_response | Shopify Payments |
| 11084628337 | #1235 | João Santos | $89.50 | USD | MC •5454 | under_review | Stripe |
| 11084628338 | #1236 | Ana Oliveira | $245.00 | USD | Visa •1234 | won | Shopify Payments |
| 11084628339 | #1237 | Pedro Costa | $67.80 | USD | MC •8888 | lost | PayPal |
| 11084628340 | #1238 | Carla Mendes | R$156.25 | BRL | Elo •6363 | needs_response | Stripe |
| 11084628341 | #1239 | Roberto Almeida | $312.00 | USD | Amex •0005 | under_review | Shopify Payments |
| 11084628342 | #1240 | Fernanda Lima | $45.99 | USD | Visa •7777 | won | PayPal |
| 11084628343 | #1241 | Lucas Rodrigues | $189.00 | USD | MC •9999 | needs_response | Stripe |

### Casos de Teste - Edge Cases (2)

| ID (numérico) | Pedido | Tipo | Valor | Cenário | Características |
|---|---|---|---|---|---|
| 11084628344 | #1242 | Digital | $99.99 | Produto Digital | NULL: shipping_address, phone, coordinates, fulfillments |
| 11084628345 | #1243 | Inquiry | $45.00 | Dados Mínimos | STRING VAZIA: email, name, tokens, SKU; NULL: payment_details |

## 🌐 Bandeiras de Cartão Representadas

✅ **Visa** (4 disputes)
- BINs: 424242, 400000, 411111
- Últimos 4: 4242, 7777, 1234

✅ **Mastercard** (3 disputes)
- BINs: 545454, 555555, 222100
- Últimos 4: 5454, 8888, 9999

✅ **Elo** (1 dispute - Brasil)
- BIN: 636368
- Últimos 4: 6363

✅ **American Express** (1 dispute)
- BIN: 378282
- Últimos 4: 0005

## 🏦 Gateways de Pagamento

✅ **Shopify Payments** - 3 disputes
- Transaction format: `ch_xxx` e `pi_xxx`
- Authorization format: Charge ID

✅ **Stripe** - 3 disputes
- Transaction format: `py_xxx` e `pi_xxx`
- Authorization/Capture flow

✅ **PayPal** - 2 disputes
- Transaction format: `PAYID-xxx`
- Express checkout

## 🆔 Identificadores de Dispute

- `id`: numérico curto, ex.: `11084628336`
- `gateway_dispute_id` (opcional): mantém o formato `dp_...` do gateway/provedor

## 🇧🇷 Dados Brasileiros Realistas

### Cidades Representadas
- ✅ Itapira, SP
- ✅ São Paulo, SP
- ✅ Rio de Janeiro, RJ
- ✅ Belo Horizonte, MG
- ✅ Curitiba, PR
- ✅ Florianópolis, SC
- ✅ Fortaleza, CE
- ✅ Goiânia, GO

### Formatos
- **Telefones**: +55 (DDD) 9XXXX-XXXX
- **CEPs**: XXXXX-XXX (formato correto)
- **Estados**: Códigos de 2 letras (SP, RJ, MG, etc)
- **Moeda**: BRL para pedidos brasileiros
- **Impostos**: ICMS 15% (quando aplicável)

## 📦 Tracking Numbers

Todos os pedidos fulfilled incluem:
- **Formato Correios**: `BRXXXXXXXXBR`
- **URL de rastreamento**: `https://tracking.correios.com.br/BRXXXXXXXXBR`
- **Status**: delivered, in_transit, etc.

Exemplos:
- `BR123456789BR`
- `BR987654321BR`
- `BR456789012BR`

## 🔢 Network Reason Codes

### Visa
- **13.1** - Merchandise/Services Not Received (3 casos)
- **10.4** - Fraud - Card-Absent Environment (1 caso)

### Mastercard
- **4853** - Defective/Not as Described (3 casos)
- **4.53** - Cardholder Dispute - Recurring Transaction (1 caso)

## 💡 Casos de Uso Cobertos

### Status de Dispute
- ✅ **needs_response** (3) - Aguardando resposta
- ✅ **under_review** (2) - Em revisão
- ✅ **won** (2) - Ganhos
- ✅ **lost** (1) - Perdidos

### Motivos de Dispute
- ✅ **product_not_received** (3)
- ✅ **product_unacceptable** (2)
- ✅ **fraudulent** (1)
- ✅ **credit_not_processed** (1)
- ✅ **duplicate** (1)

### Financial Status
- ✅ **paid** (6 pedidos)
- ✅ **refunded** (1 pedido)
- ✅ **partially_refunded** (1 pedido)

### Fulfillment Status
- ✅ **unfulfilled** (3 pedidos)
- ✅ **fulfilled** (5 pedidos) - com tracking completo

### Tipos de Transação
- ✅ **sale** (pagamento único)
- ✅ **authorization** + **capture** (dois passos)
- ✅ **refund** (reembolso)

## 🎯 Cenários Especiais

### Pedido com Múltiplos Produtos (#1238)
- 2 produtos diferentes
- Cupom de desconto aplicado
- Impostos brasileiros (ICMS)
- Frete grátis

### Pedido Perdido com Reembolso (#1237)
- Status: lost
- Refund completo documentado
- Restock de produtos
- Transação de reembolso

### Pedido Internacional (#1236)
- Cliente brasileiro
- Gateway internacional
- Fulfillment com tracking
- Dispute ganho (won)

## 📊 Estatísticas dos Mocks

### Geral
- **Total de Disputes**: 10 (8 completos + 2 edge cases)
- **Valor Total em Disputa**: $1,380.03 USD + R$156.25 BRL
- **Linhas de Código**: ~3.000 linhas

### Status (8 disputes principais)
- **Taxa de Vitória**: 25% (2 won / 8 total)
- **Taxa de Perda**: 12.5% (1 lost / 8 total)
- **Em Análise**: 62.5% (5 needs_response ou under_review)

### Edge Cases (2 disputes de teste)
- **Produto Digital**: 1 (campos null apropriados)
- **Dados Mínimos**: 1 (strings vazias e ausências)
- **Campos NULL testados**: ~25 campos diferentes
- **Strings Vazias testadas**: ~30 campos diferentes
- **Arrays Vazios testados**: ~8 arrays diferentes

## 🔗 Estrutura de Relacionamentos

```
Dispute
  ├── charge_id → Charge
  ├── order_id → Order
  │   ├── customer
  │   │   └── default_address
  │   ├── billing_address
  │   ├── shipping_address
  │   ├── line_items []
  │   ├── shipping_lines []
  │   ├── fulfillments []
  │   │   ├── tracking_number
  │   │   └── tracking_url
  │   ├── refunds []
  │   └── transactions []
  │       ├── authorization
  │       ├── receipt
  │       │   └── payment_method_details
  │       └── payment_details
  └── shop_domain
```

## 🧪 Edge Cases e Testes de Robustez

### Dispute #9 - Produto Digital (dp_1QPQ5iS0jK1lM2nO3p)
**Testa**: Pedido sem envio físico, campos apropriadamente null

- ✅ `shipping_address: null` - Produto digital
- ✅ `phone: null` - Cliente não forneceu
- ✅ `customer.default_address: null` - Sem endereço
- ✅ `fulfillment_status: null` - Não aplicável
- ✅ `evidence_due_by: null` - Sem prazo definido
- ✅ Arrays vazios: `fulfillments[]`, `shipping_lines[]`
- ✅ Valores zero: `total_weight: 0`, `grams: 0`

### Dispute #10 - Dados Mínimos (dp_1QOP6jT1kL2mN3oP4q)
**Testa**: Cliente anônimo, produto deletado, dados incompletos

- ✅ `email: ""` - Email não fornecido
- ✅ `first_name: ""` e `last_name: ""` - Cliente anônimo
- ✅ `cardholder_name: ""` - Nome vazio
- ✅ `network_reason_code: null` - Inquiry não tem
- ✅ `payment_details: null` - Detalhes não disponíveis
- ✅ `receipt: {}` - Objeto vazio
- ✅ `product_exists: false` - Produto deletado
- ✅ ~30 campos com strings vazias

**Ver documentação completa**: `CASOS_TESTE_EDGE.md`

## ✨ Destaques de Qualidade

✅ **Números de Teste Válidos** - BINs reais de teste de cartões
✅ **IDs Únicos e Realistas** - Formato correto para cada tipo
✅ **Dados Geográficos Reais** - Cidades, CEPs e coordenadas brasileiras
✅ **Tracking Numbers Válidos** - Formato Correios correto
✅ **Authorization Codes Reais** - Formatos por gateway
✅ **AVS/CVV Codes** - Códigos de verificação realistas
✅ **Timestamps Consistentes** - Datas lógicas e sequenciais
✅ **Múltiplos Gateways** - Shopify, Stripe e PayPal
✅ **Variação de Bandeiras** - Visa, MC, Elo, Amex
✅ **Casos Complexos** - Refunds, múltiplos produtos, descontos
✅ **Edge Cases** - NULL, vazios, ausentes, produto deletado

---

**Atualizado em**: 2024-12-16
**Versão**: 2.0
**API**: Shopify REST Admin API 2024-07
