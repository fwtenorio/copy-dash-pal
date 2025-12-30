# 🧪 Casos de Teste - Edge Cases e Dados Incompletos

## 📋 Visão Geral

Os dados mockados agora incluem **casos de teste específicos** para garantir que a aplicação lida corretamente com dados ausentes, null ou vazios que podem vir da API real da Shopify.

- **Disputes Completos**: 8 (IDs numéricos: 11084628336–11084628343)
- **Disputes de Teste**: 2 (IDs numéricos: 11084628344–11084628345)
- **Total**: 10 disputes

## 🧪 Casos de Teste Implementados

### Dispute #9 - Produto Digital sem Endereço (ID: 11084628344 / gateway_dispute_id: dp_1QPQ5iS0jK1lM2nO3p)

**Cenário**: Pedido de curso digital onde o cliente não forneceu telefone e não há endereço de entrega.

#### Campos NULL
- ✅ `evidence_due_by: null` - Sem prazo definido para evidências
- ✅ `note: null` - Sem nota no pedido
- ✅ `phone: null` - Cliente não forneceu telefone
- ✅ `referring_site: null` - Sem site de referência
- ✅ `customer.phone: null` - Telefone do cliente null
- ✅ `customer.default_address: null` - Cliente sem endereço cadastrado
- ✅ `shipping_address: null` - Produto digital, sem envio
- ✅ `billing_address.address2: null` - Sem complemento
- ✅ `billing_address.phone: null` - Sem telefone no endereço
- ✅ `billing_address.latitude: null` - Sem coordenadas
- ✅ `billing_address.longitude: null` - Sem coordenadas
- ✅ `line_items[].variant_title: null` - Produto sem variante
- ✅ `line_items[].variant_inventory_management: null`
- ✅ `line_items[].fulfillment_status: null` - Produto digital
- ✅ `fulfillment_status: null` - Sem fulfillment

#### Arrays Vazios
- ✅ `discount_applications: []` - Sem descontos
- ✅ `discount_codes: []` - Sem cupons
- ✅ `shipping_lines: []` - Sem linhas de envio
- ✅ `fulfillments: []` - Sem entregas (produto digital)
- ✅ `line_items[].properties: []` - Sem propriedades customizadas
- ✅ `line_items[].discount_allocations: []` - Sem alocação de desconto
- ✅ `line_items[].duties: []` - Sem taxas
- ✅ `line_items[].tax_lines: []` - Sem impostos

#### Strings Vazias
- ✅ `tags: ""` - Sem tags
- ✅ `customer.tags: ""` - Sem tags do cliente

#### Valores Zero
- ✅ `total_weight: 0` - Produto digital sem peso
- ✅ `line_items[].grams: 0` - Item digital
- ✅ `line_items[].fulfillable_quantity: 0`

#### Características Especiais
- Produto digital (Digital Course)
- `requires_shipping: false`
- Cliente nos EUA
- Sem dados de telefone em nenhum lugar
- Sem endereço de entrega

---

### Dispute #10 - Dados Mínimos e Campos Vazios (ID: 11084628345 / gateway_dispute_id: dp_1QOP6jT1kL2mN3oP4q)

**Cenário**: Inquiry (não chargeback) com dados mínimos, cliente anônimo/guest, produto deletado.

#### Campos NULL
- ✅ `network_reason_code: null` - Inquiry não tem código de rede
- ✅ `line_items[].variant_id: null` - Produto sem variante
- ✅ `line_items[].product_id: null` - Produto deletado
- ✅ `payment_details: null` - Detalhes de pagamento não disponíveis
- ✅ Múltiplos campos null em addresses

#### Strings Vazias (Dados Ausentes)
- ✅ `cardholder_name: ""` - Nome do cartão vazio
- ✅ `email: ""` - Email não fornecido
- ✅ `note: ""` - Nota vazia
- ✅ `cart_token: ""` - Token vazio
- ✅ `referring_site: ""` - Site de referência vazio
- ✅ `checkout_token: ""` - Token vazio
- ✅ `reference: ""` - Referência vazia
- ✅ `source_identifier: ""` - Identificador vazio
- ✅ `source_url: ""` - URL vazia
- ✅ `phone: ""` - Telefone vazio
- ✅ `browser_ip: ""` - IP não registrado
- ✅ `landing_site_ref: ""` - Referência vazia
- ✅ `contact_email: ""` - Email de contato vazio

#### Customer com Dados Vazios
- ✅ `customer.email: ""`
- ✅ `customer.first_name: ""`
- ✅ `customer.last_name: ""`
- ✅ `customer.phone: ""`
- ✅ `customer.note: ""`
- ✅ `customer.tags: ""`
- ✅ `verified_email: false` - Email não verificado

#### Endereços com Dados Mínimos
- ✅ Todos os campos de nome vazios
- ✅ Endereços com "Unknown"
- ✅ CEP "00000"
- ✅ `province_code: ""` - Código de província vazio
- ✅ `company: ""` - Empresa vazia

#### Line Item (Produto)
- ✅ `sku: ""` - SKU vazio
- ✅ `variant_title: ""` - Variante vazia
- ✅ `vendor: ""` - Fornecedor vazio
- ✅ `variant_inventory_management: ""` - Gestão de inventário vazia
- ✅ `product_exists: false` - ⚠️ Produto foi deletado!

#### Transaction
- ✅ `message: ""` - Mensagem vazia
- ✅ `receipt: {}` - Recibo vazio (objeto sem conteúdo)
- ✅ `payment_details: null` - Detalhes não disponíveis

#### Características Especiais
- Tipo `inquiry` (não é chargeback)
- Cliente anônimo/guest checkout
- Produto deletado da loja
- Dados mínimos em todos os lugares
- "Mystery Item" - produto desconhecido

---

## 📊 Matriz de Testes

### Por Tipo de Campo

| Tipo | Campos Afetados | Total |
|------|----------------|-------|
| **NULL** | evidence_due_by, note, phone, referring_site, addresses, coordinates, variants, fulfillment_status, network_reason_code, payment_details | ~25 campos |
| **String Vazia** | email, name, tags, tokens, references, SKU, vendor, province_code, company | ~30 campos |
| **Array Vazio** | discount_applications, discount_codes, shipping_lines, fulfillments, properties, discount_allocations, duties, tax_lines | ~8 arrays |
| **Zero** | total_weight, grams, fulfillable_quantity | ~3 campos |
| **false** | verified_email, product_exists, requires_shipping | ~3 campos |

### Por Categoria

| Categoria | Cenários Testados |
|-----------|-------------------|
| **Produto Digital** | Sem peso, sem envio, sem fulfillment, shipping_address null |
| **Cliente Anônimo** | Sem nome, sem email verificado, dados mínimos |
| **Endereços Incompletos** | Sem coordenadas, campos vazios, endereços "Unknown" |
| **Produto Deletado** | product_exists: false, product_id null, dados mínimos |
| **Inquiry vs Chargeback** | network_reason_code null em inquiry |
| **Dados de Pagamento** | payment_details null, receipt vazio |
| **Telefone** | null vs string vazia |
| **Tokens** | Vazios ou ausentes |

## 🎯 Como Usar para Testes

### 1. Testar Renderização de Dados Ausentes

```typescript
import { mockDisputes } from '@/data/mockDisputesData';

// Dispute com produto digital (sem shipping_address)
const digitalProduct = mockDisputes[8]; // dp_1QPQ...

if (digitalProduct.order.shipping_address === null) {
  console.log('✅ Shipping address is null - handle accordingly');
}

// Dispute com dados mínimos
const minimalData = mockDisputes[9]; // dp_1QOP...

if (minimalData.order.email === "") {
  console.log('✅ Email is empty string - show placeholder');
}
```

### 2. Testar Telefone (null vs empty string)

```typescript
const dispute1 = mockDisputes[8]; // phone: null
const dispute2 = mockDisputes[9]; // phone: ""

const formatPhone = (phone: string | null) => {
  if (phone === null || phone === "") {
    return "Não fornecido";
  }
  return phone;
};

console.log(formatPhone(dispute1.order.phone)); // "Não fornecido"
console.log(formatPhone(dispute2.order.phone)); // "Não fornecido"
```

### 3. Testar Arrays Vazios

```typescript
const dispute = mockDisputes[8];

// Verificar se há descontos
if (dispute.order.discount_applications.length === 0) {
  console.log('✅ No discounts applied');
}

// Verificar se há fulfillments
if (dispute.order.fulfillments.length === 0) {
  console.log('✅ No fulfillments - digital product or unfulfilled');
}
```

### 4. Testar Produto Deletado

```typescript
const dispute = mockDisputes[9];
const lineItem = dispute.order.line_items[0];

if (!lineItem.product_exists) {
  console.log('⚠️ Product no longer exists in catalog');
  console.log('Product ID:', lineItem.product_id); // null
  console.log('SKU:', lineItem.sku || 'N/A'); // ""
}
```

### 5. Testar Endereço de Cliente Ausente

```typescript
const dispute = mockDisputes[8];
const customer = dispute.order.customer;

if (customer.default_address === null) {
  console.log('⚠️ Customer has no default address');
  // Use billing_address as fallback
}
```

### 6. Testar Coordenadas

```typescript
const dispute = mockDisputes[8];
const billing = dispute.order.billing_address;

if (billing.latitude === null || billing.longitude === null) {
  console.log('⚠️ No coordinates available - cannot show on map');
}
```

## ⚠️ Validações Recomendadas

### 1. Proteção contra NULL

```typescript
// ❌ RUIM - Pode quebrar
const phone = order.phone.trim();

// ✅ BOM - Protegido
const phone = order.phone?.trim() || "N/A";
```

### 2. Proteção contra String Vazia

```typescript
// ❌ RUIM - String vazia passa
if (customer.email) {
  sendEmail(customer.email);
}

// ✅ BOM - Verifica se não está vazio
if (customer.email && customer.email.trim() !== "") {
  sendEmail(customer.email);
}
```

### 3. Proteção contra Arrays Vazios

```typescript
// ❌ RUIM - Não verifica se está vazio
const firstFulfillment = order.fulfillments[0];

// ✅ BOM - Verifica antes
const firstFulfillment = order.fulfillments.length > 0 
  ? order.fulfillments[0] 
  : null;
```

### 4. Fallbacks para Dados Ausentes

```typescript
// Nome do cliente
const customerName = customer.first_name && customer.last_name
  ? `${customer.first_name} ${customer.last_name}`
  : customer.email || "Guest Customer";

// Endereço de entrega
const shippingAddress = order.shipping_address || order.billing_address;

// Telefone
const contactPhone = order.phone 
  || customer.phone 
  || billing_address.phone 
  || "Not provided";
```

## 🧪 Testes Unitários Sugeridos

```typescript
describe('Edge Cases - Null and Empty Data', () => {
  const digitalProduct = mockDisputes[8];
  const minimalData = mockDisputes[9];

  it('should handle null shipping address', () => {
    expect(digitalProduct.order.shipping_address).toBeNull();
  });

  it('should handle empty email', () => {
    expect(minimalData.order.email).toBe("");
  });

  it('should handle null customer default address', () => {
    expect(digitalProduct.order.customer.default_address).toBeNull();
  });

  it('should handle empty arrays', () => {
    expect(digitalProduct.order.fulfillments).toEqual([]);
    expect(digitalProduct.order.shipping_lines).toEqual([]);
  });

  it('should handle deleted products', () => {
    const lineItem = minimalData.order.line_items[0];
    expect(lineItem.product_exists).toBe(false);
    expect(lineItem.product_id).toBeNull();
  });

  it('should handle null payment details', () => {
    const transaction = minimalData.order.transactions[0];
    expect(transaction.payment_details).toBeNull();
  });

  it('should handle null evidence_due_by', () => {
    expect(digitalProduct.evidence_due_by).toBeNull();
  });
});
```

## 📈 Cobertura de Testes

### Cenários Cobertos

- ✅ Produto digital (sem envio físico)
- ✅ Cliente anônimo/guest
- ✅ Dados mínimos obrigatórios
- ✅ Campos opcionais ausentes
- ✅ Arrays vazios
- ✅ Strings vazias vs null
- ✅ Produto deletado
- ✅ Endereço incompleto
- ✅ Sem coordenadas geográficas
- ✅ Inquiry (não chargeback)
- ✅ Receipt vazio
- ✅ Payment details ausentes

### Cenários NÃO Cobertos (podem ser adicionados)

- ⚠️ Order cancelado (cancelled_at com data)
- ⚠️ Multiple refunds
- ⚠️ Partial fulfillment
- ⚠️ Failed transactions
- ⚠️ Void transactions
- ⚠️ Multiple addresses diferentes
- ⚠️ International orders com duties

## 🎓 Lições Aprendidas

### 1. Sempre use Optional Chaining
```typescript
// Acesso seguro a propriedades profundas
const city = order.shipping_address?.city || order.billing_address?.city || "Unknown";
```

### 2. Diferencie NULL de String Vazia
```typescript
// null = dado não aplicável
// "" = dado aplicável mas não fornecido

if (phone === null) {
  // Produto digital, telefone não faz sentido
} else if (phone === "") {
  // Cliente não forneceu telefone
}
```

### 3. Arrays Sempre Existem
```typescript
// Arrays SEMPRE existem (podem estar vazios)
// Não use optional chaining em arrays

// ❌ ERRADO
order.fulfillments?.length

// ✅ CORRETO
order.fulfillments.length
```

### 4. Use Nullish Coalescing
```typescript
// Melhor que || quando 0 ou "" são valores válidos
const weight = lineItem.grams ?? 100; // Só usa 100 se for null/undefined
const name = customer.first_name ?? "Guest"; // "" não seria substituído por "Guest"
```

## 📚 Referências

- [MDN - Nullish Coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [MDN - Optional Chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [TypeScript Handbook - Null and Undefined](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#null-and-undefined)

---

**Última atualização**: 2024-12-16  
**Versão**: 3.0 (com edge cases)  
**Total de Disputes**: 10 (8 completos + 2 edge cases)
