# 📖 Como Usar os Dados Mockados

## 🎯 Visão Geral

Os dados mockados em `src/data/mockDisputesData.ts` agora estão **100% fiéis à estrutura real da API da Shopify**, incluindo todos os campos que viriam de uma API de produção.

**Total**: 10 disputes
- **8 disputes completos** com dados realistas
- **2 disputes de teste** com edge cases (campos null, vazios e ausentes)

**IDs**
- `id`: numérico curto (ex.: `"11084628336"`)
- `gateway_dispute_id` (opcional): ID do gateway (ex.: `dp_...`)

## 📁 Arquivos de Referência

### Documentação Principal
- **`SHOPIFY_MOCK_DATA_STRUCTURE.md`** - Documentação completa da estrutura
- **`MOCK_DATA_SUMMARY.md`** - Resumo visual e estatísticas
- **`EXEMPLO_DISPUTE_COMPLETO.json`** - Exemplo de um dispute completo

### Código
- **`src/data/mockDisputesData.ts`** - Dados mockados (2465 linhas)
- **`src/contexts/MockDataContext.tsx`** - Contexto para alternar entre mock/produção

## 🧪 Edge Cases e Testes de Robustez

Os **últimos 2 disputes** (índices 8 e 9) são casos especiais para testar:

### Dispute #9 (índice 8) - Produto Digital
```typescript
const digitalProduct = mockDisputes[8];

// Testes de NULL
console.log(digitalProduct.order.shipping_address); // null
console.log(digitalProduct.order.phone); // null
console.log(digitalProduct.customer.default_address); // null

// Testes de Arrays Vazios
console.log(digitalProduct.order.fulfillments); // []
console.log(digitalProduct.order.shipping_lines); // []

// Testes de Zero
console.log(digitalProduct.order.total_weight); // 0
```

### Dispute #10 (índice 9) - Dados Mínimos
```typescript
const minimalData = mockDisputes[9];

// Testes de String Vazia
console.log(minimalData.order.email); // ""
console.log(minimalData.customer.first_name); // ""
console.log(minimalData.cardholder_name); // ""

// Testes de NULL
console.log(minimalData.network_reason_code); // null
console.log(minimalData.order.transactions[0].payment_details); // null

// Produto Deletado
const item = minimalData.order.line_items[0];
console.log(item.product_exists); // false
console.log(item.product_id); // null
```

**📖 Ver documentação completa**: `CASOS_TESTE_EDGE.md`

## 🔍 Acessando os Dados

### Importando os Mocks

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

// Acessar um dispute específico
const dispute = mockDisputes[0];

console.log(dispute.id); // "dp_1QYZ7aK2bC3dE4fG5h"
console.log(dispute.charge_id); // "ch_3QYZ6bK2bC3dE4fG1h234567"
console.log(dispute.shop_domain); // "myawesomestore.myshopify.com"
```

### Acessando Dados do Cliente

```typescript
const dispute = mockDisputes[0];
const customer = dispute.order.customer;

console.log(customer.email); // "maria.silva@exemplo.com"
console.log(customer.first_name); // "Maria"
console.log(customer.last_name); // "Silva"
console.log(`${customer.first_name} ${customer.last_name}`); // "Maria Silva"
```

### Acessando Dados do Cartão

```typescript
const dispute = mockDisputes[0];

console.log(dispute.cardholder_name); // "Maria Silva"
console.log(dispute.card_brand); // "Visa"
console.log(dispute.card_last4); // "4242"
console.log(dispute.card_bin); // "424242"
console.log(dispute.network); // "visa"
```

### Acessando Transactions

```typescript
const dispute = mockDisputes[0];
const transaction = dispute.order.transactions[0];

console.log(transaction.id); // 89234567890123
console.log(transaction.kind); // "sale"
console.log(transaction.authorization); // "ch_3QYZ6bK2bC3dE4fG1h234567"
console.log(transaction.gateway_transaction_id); // "pi_3QYZ6bK2bC3dE4fG1h234567"

// Dados do cartão na transaction
const cardDetails = transaction.receipt.payment_method_details.card;
console.log(cardDetails.brand); // "visa"
console.log(cardDetails.last4); // "4242"
console.log(cardDetails.exp_month); // 12
console.log(cardDetails.exp_year); // 2026

// Verificações de segurança
const paymentDetails = transaction.payment_details;
console.log(paymentDetails.avs_result_code); // "Y" (Address match)
console.log(paymentDetails.cvv_result_code); // "M" (CVV match)
```

### Acessando Tracking

```typescript
const dispute = mockDisputes[1]; // Pedido com fulfillment
const fulfillment = dispute.order.fulfillments[0];

console.log(fulfillment.tracking_number); // "BR123456789BR"
console.log(fulfillment.tracking_url); // "https://tracking.correios.com.br/BR123456789BR"
console.log(fulfillment.tracking_company); // "Correios"
console.log(fulfillment.shipment_status); // "delivered"
```

### Acessando Endereços

```typescript
const dispute = mockDisputes[0];
const order = dispute.order;

// Endereço de cobrança
const billing = order.billing_address;
console.log(`${billing.address1}, ${billing.address2}`);
console.log(`${billing.city} - ${billing.province_code}`);
console.log(`CEP: ${billing.zip}`);
console.log(`País: ${billing.country_code}`);

// Endereço de entrega (pode ser diferente!)
const shipping = order.shipping_address;
console.log(`Lat: ${shipping.latitude}, Lng: ${shipping.longitude}`);

// Verificar se são o mesmo endereço
if (billing.address1 === shipping.address1) {
  console.log("Endereços de cobrança e entrega são iguais");
}
```

## 🎨 Casos de Uso Práticos

### 1. Listar Disputes por Status

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

const needsResponse = mockDisputes.filter(d => d.status === 'needs_response');
const underReview = mockDisputes.filter(d => d.status === 'under_review');
const won = mockDisputes.filter(d => d.status === 'won');
const lost = mockDisputes.filter(d => d.status === 'lost');

console.log(`Aguardando resposta: ${needsResponse.length}`);
console.log(`Em revisão: ${underReview.length}`);
console.log(`Ganhos: ${won.length}`);
console.log(`Perdidos: ${lost.length}`);
```

### 2. Filtrar por Bandeira de Cartão

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

const visaDisputes = mockDisputes.filter(d => d.card_brand === 'Visa');
const mcDisputes = mockDisputes.filter(d => d.card_brand === 'Mastercard');
const eloDisputes = mockDisputes.filter(d => d.card_brand === 'Elo');
const amexDisputes = mockDisputes.filter(d => d.card_brand === 'American Express');

console.log('Disputes por bandeira:');
console.log(`Visa: ${visaDisputes.length}`);
console.log(`Mastercard: ${mcDisputes.length}`);
console.log(`Elo: ${eloDisputes.length}`);
console.log(`Amex: ${amexDisputes.length}`);
```

### 3. Calcular Total em Disputa

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

const totalUSD = mockDisputes
  .filter(d => d.currency === 'USD')
  .reduce((sum, d) => sum + parseFloat(d.amount), 0);

const totalBRL = mockDisputes
  .filter(d => d.currency === 'BRL')
  .reduce((sum, d) => sum + parseFloat(d.amount), 0);

console.log(`Total em USD: $${totalUSD.toFixed(2)}`);
console.log(`Total em BRL: R$${totalBRL.toFixed(2)}`);
```

### 4. Verificar Pedidos com Tracking

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

const withTracking = mockDisputes.filter(d => 
  d.order.fulfillments && 
  d.order.fulfillments.length > 0 &&
  d.order.fulfillments[0].tracking_number
);

console.log(`Pedidos com tracking: ${withTracking.length}`);

withTracking.forEach(d => {
  const tracking = d.order.fulfillments[0].tracking_number;
  const status = d.order.fulfillments[0].shipment_status;
  console.log(`Pedido ${d.order.name}: ${tracking} - ${status}`);
});
```

### 5. Analisar Transações

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

mockDisputes.forEach(dispute => {
  const transactions = dispute.order.transactions || [];
  
  console.log(`\nDispute ${dispute.id}:`);
  console.log(`  Gateway: ${dispute.gateway}`);
  console.log(`  Transações: ${transactions.length}`);
  
  transactions.forEach(tx => {
    console.log(`    - ${tx.kind}: ${tx.amount} ${tx.currency} (${tx.status})`);
    console.log(`      Auth: ${tx.authorization}`);
    if (tx.payment_details) {
      console.log(`      AVS: ${tx.payment_details.avs_result_code}, CVV: ${tx.payment_details.cvv_result_code}`);
    }
  });
});
```

### 6. Verificar Clientes Recorrentes

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

const customerEmails = mockDisputes.map(d => d.order.customer.email);
const duplicates = customerEmails.filter((email, index) => 
  customerEmails.indexOf(email) !== index
);

if (duplicates.length > 0) {
  console.log('Clientes com múltiplos disputes:');
  [...new Set(duplicates)].forEach(email => {
    const count = customerEmails.filter(e => e === email).length;
    console.log(`  ${email}: ${count} disputes`);
  });
} else {
  console.log('Nenhum cliente com múltiplos disputes');
}
```

## 🔄 Alternando entre Mock e Produção

Use o contexto `MockDataContext` para alternar facilmente:

```typescript
import { useMockDataContext } from '@/contexts/MockDataContext';
import { mockDisputes } from '@/data/mockDisputesData';

function MyComponent() {
  const { useMockData } = useMockDataContext();
  
  // Buscar dados (mock ou API real)
  const fetchDisputes = async () => {
    if (useMockData) {
      // Usar dados mockados
      return mockDisputes;
    } else {
      // Buscar da API real
      const response = await fetch('/api/disputes');
      return response.json();
    }
  };
  
  // ...
}
```

## 📊 Campos Disponíveis por Categoria

### Dispute (Nível Superior)
- ✅ IDs: `id`, `charge_id`, `order_id`
- ✅ Valores: `amount`, `currency`, `original_amount`
- ✅ Status: `status`, `reason`, `network_reason_code`
- ✅ Datas: `initiated_at`, `dispute_opened_at`, `evidence_due_by`, `finalized_on`
- ✅ Cartão: `cardholder_name`, `card_brand`, `card_last4`, `card_bin`, `network`
- ✅ Loja: `shop_domain`, `shop_name`

### Order
- ✅ Identificação: `id`, `number`, `name`, `email`
- ✅ Financeiro: `total_price`, `subtotal_price`, `currency`, `financial_status`
- ✅ Fulfillment: `fulfillment_status`
- ✅ Gateway: `gateway`, `payment_gateway_names`
- ✅ Customer: Objeto completo com endereço
- ✅ Addresses: `billing_address`, `shipping_address`
- ✅ Items: `line_items[]`
- ✅ Shipping: `shipping_lines[]`
- ✅ Transactions: `transactions[]`
- ✅ Fulfillments: `fulfillments[]` com tracking
- ✅ Refunds: `refunds[]`

### Transaction
- ✅ Identificação: `id`, `authorization`, `gateway_transaction_id`
- ✅ Tipo: `kind` (sale, authorization, capture, refund)
- ✅ Status: `status`, `message`
- ✅ Segurança: `avs_result_code`, `cvv_result_code`
- ✅ Cartão: `receipt.payment_method_details.card`
- ✅ Valores: `amount`, `currency`

## ⚠️ Notas Importantes

### 1. Nome do Cliente
```typescript
// ❌ ERRADO - Shopify não envia assim
const name = customer.name;

// ✅ CORRETO - Shopify separa em first_name e last_name
const fullName = `${customer.first_name} ${customer.last_name}`;
```

### 2. Shipping Address Nullable
```typescript
// Sempre verificar se existe
if (order.shipping_address) {
  console.log(order.shipping_address.city);
} else {
  console.log('Produto digital ou sem envio');
}
```

### 3. Billing vs Shipping
```typescript
// Podem ser diferentes!
const billing = order.billing_address;
const shipping = order.shipping_address;

if (billing.address1 !== shipping?.address1) {
  console.log('Cliente está enviando para endereço diferente');
}
```

### 4. Transactions Array
```typescript
// Pode haver múltiplas transactions
// Ex: authorization + capture
const transactions = order.transactions || [];

const auth = transactions.find(t => t.kind === 'authorization');
const capture = transactions.find(t => t.kind === 'capture');

if (auth && capture) {
  console.log('Fluxo de dois passos (auth + capture)');
}
```

## 🧪 Testando com os Mocks

### Unit Tests

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

describe('Dispute Processing', () => {
  it('should have valid dispute IDs', () => {
    mockDisputes.forEach(dispute => {
      expect(dispute.id).toMatch(/^dp_/);
    });
  });
  
  it('should have valid charge IDs', () => {
    mockDisputes.forEach(dispute => {
      expect(dispute.charge_id).toMatch(/^ch_/);
    });
  });
  
  it('should have customer email', () => {
    mockDisputes.forEach(dispute => {
      expect(dispute.order.customer.email).toContain('@');
    });
  });
});
```

### Integration Tests

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

describe('Dispute API', () => {
  it('should match real API structure', () => {
    const dispute = mockDisputes[0];
    
    // Verificar campos obrigatórios
    expect(dispute).toHaveProperty('id');
    expect(dispute).toHaveProperty('charge_id');
    expect(dispute).toHaveProperty('order_id');
    expect(dispute).toHaveProperty('shop_domain');
    expect(dispute).toHaveProperty('card_brand');
    expect(dispute).toHaveProperty('card_last4');
    
    // Verificar estrutura do order
    expect(dispute.order).toHaveProperty('customer');
    expect(dispute.order).toHaveProperty('billing_address');
    expect(dispute.order).toHaveProperty('transactions');
    
    // Verificar transaction
    const tx = dispute.order.transactions[0];
    expect(tx).toHaveProperty('authorization');
    expect(tx).toHaveProperty('gateway_transaction_id');
    expect(tx).toHaveProperty('receipt');
  });
});
```

## 🎓 Aprendizado

### Campos Mais Importantes

1. **Dispute ID** (`id`) - Identificador único do dispute
2. **Charge ID** (`charge_id`) - Liga ao pagamento
3. **Transaction ID** (`transactions[].id`) - Rastreamento financeiro
4. **Authorization** (`transactions[].authorization`) - Código de autorização
5. **Gateway Transaction ID** - ID no gateway de pagamento
6. **Tracking Number** - Rastreamento de envio
7. **AVS/CVV Codes** - Códigos de verificação de segurança

### Fluxos Comuns

**Fluxo de Pagamento Normal:**
1. Cliente faz pedido
2. Transaction `sale` é criada
3. Payment captured
4. Order fulfilled
5. Tracking number gerado

**Fluxo de Dispute:**
1. Dispute aberto (`initiated_at`)
2. Status: `needs_response`
3. Evidence enviada (`evidence_sent_on`)
4. Status: `under_review`
5. Decisão final (`finalized_on`)
6. Status: `won` ou `lost`

## 📚 Recursos Adicionais

- [Shopify Order API](https://shopify.dev/docs/api/admin-rest/2024-07/resources/order)
- [Shopify Transaction API](https://shopify.dev/docs/api/admin-rest/2024-07/resources/transaction)
- [Shopify Payments Dispute](https://shopify.dev/docs/api/admin-graphql/2024-07/objects/shopifypaymentsdispute)

---

**Última atualização**: 2024-12-16
**Versão dos Mocks**: 2.0
