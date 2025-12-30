# 🧪 Como Testar Modos Mock e Real Data

## 📋 Resumo Rápido

### 1️⃣ Testando no Admin (localhost:8080)

**Controle:** Toggle "Test Mode" / "Production Mode" no Admin

- ✅ **Test Mode ativado** → Usa dados mockados (`mockOrders`)
- ✅ **Production Mode ativado** → Usa API do Shopify (dados reais)

**Por que funciona:** O Admin e o ResolutionHub estão no mesmo domínio (localhost), então compartilham o `localStorage`.

---

### 2️⃣ Testando no Shopify Proxy (/apps/resolution)

**Controle:** Parâmetro `?mock=true` na URL

#### Para dados MOCKADOS:
```
https://sua-loja.myshopify.com/apps/resolution?mock=true
```

#### Para dados REAIS (padrão):
```
https://sua-loja.myshopify.com/apps/resolution
```

**Por que precisa do parâmetro:** O Shopify (myshopify.com) e o Admin (localhost) são domínios DIFERENTES. O navegador NÃO compartilha `localStorage` entre domínios diferentes por segurança.

---

## 🔐 Entendendo localStorage e domínios

```
┌─────────────────────┐       ┌─────────────────────┐
│  localhost:8080     │       │  myshopify.com      │
│  (Admin)            │       │  (Shopify Proxy)    │
├─────────────────────┤       ├─────────────────────┤
│ localStorage:       │   ❌  │ localStorage:       │
│ - mock_data: true   │  NÃO  │ - (vazio)           │
│                     │ACESSA │                     │
└─────────────────────┘       └─────────────────────┘
   ↓ COMPARTILHA               ↓ USA PARÂMETRO URL
   ↓ localStorage              ↓ ?mock=true
   ↓                           ↓
/admin/settings              /apps/resolution?mock=true
```

---

## 📊 Tabela de Comportamento

| Onde você está | Como controlar | Resultado |
|----------------|----------------|-----------|
| **http://localhost:8080/admin** | Toggle no Admin | Mock ou Real conforme selecionado |
| **http://localhost:8080/proxy** | Toggle no Admin | Mock ou Real conforme selecionado |
| **https://loja.myshopify.com/apps/resolution** | URL sem parâmetro | **Real Data** (padrão) |
| **https://loja.myshopify.com/apps/resolution?mock=true** | Parâmetro `?mock=true` | **Mock Data** |
| **https://loja.myshopify.com/apps/resolution?mock=false** | Parâmetro `?mock=false` | **Real Data** |

---

## 🧪 TODOS os 10 Pedidos Mockados - MESMOS DAS DISPUTAS

### 📦 Pedido #1234 - Maria Silva
- **Email:** maria.silva@exemplo.com
- **Valor:** $125.00
- **Status:** Delivered
- **Produto:** Premium Watch - Silver
- **Endereço:** Av. Rio Branco, 123, Apto 45 - Itapira, SP
- **Data:** 12/03/2024

---

### 📦 Pedido #1235 - João Santos
- **Email:** joao.santos@exemplo.com
- **Valor:** $89.50
- **Status:** Delivered
- **Produto:** Leather Wallet - Brown
- **Endereço:** Rua das Acácias, 456, Bloco B - Campinas, SP
- **Rastreio:** BR987654321BR
- **Data:** 11/28/2024

---

### 📦 Pedido #1236 - Ana Costa
- **Email:** ana.costa@exemplo.com
- **Valor:** $245.00
- **Status:** Delivered
- **Produto:** Designer Sunglasses - Black
- **Endereço:** Av. Paulista, 1578, Apto 102 - São Paulo, SP
- **Rastreio:** SP123ABC456
- **Data:** 11/08/2024

---

### 📦 Pedido #1237 - Pedro Costa
- **Email:** pedro.costa@exemplo.com
- **Valor:** $67.80
- **Status:** Refunded
- **Produto:** Phone Case - Blue
- **Endereço:** Rua das Palmeiras, 789 - Belo Horizonte, MG
- **Data:** 10/29/2024

---

### 📦 Pedido #1238 - Carla Mendes
- **Email:** carla.mendes@exemplo.com
- **Valor:** $156.40
- **Status:** Delivered
- **Produto:** Wireless Headphones - Black
- **Endereço:** Rua dos Jacarandás, 321 - Curitiba, PR
- **Rastreio:** BR456789123BR
- **Data:** 11/23/2024

---

### 📦 Pedido #1239 - Lucas Almeida
- **Email:** lucas.almeida@exemplo.com
- **Valor:** $89.00
- **Status:** In Transit
- **Produto:** Fitness Tracker - Red
- **Endereço:** Av. Atlântica, 567 - Rio de Janeiro, RJ
- **Rastreio:** RJ789456123BR
- **Data:** 12/10/2024

---

### 📦 Pedido #1240 - Fernanda Rocha
- **Email:** fernanda.rocha@exemplo.com
- **Valor:** $342.50
- **Status:** Delivered
- **Produtos:** 
  - Laptop Stand - Silver ($159.90)
  - Wireless Mouse - White ($79.90)
  - USB-C Hub - Gray ($89.90)
- **Endereço:** Rua Augusta, 1234 - São Paulo, SP
- **Rastreio:** SP987DEF654
- **Data:** 11/18/2024

---

### 📦 Pedido #1241 - Roberto Lima
- **Email:** roberto.lima@exemplo.com
- **Valor:** $198.00
- **Status:** Pending
- **Produto:** Gaming Keyboard - RGB
- **Endereço:** Rua das Flores, 456 - Porto Alegre, RS
- **Data:** 12/15/2024

---

### 📦 Pedido #1242 - Juliana Ferreira
- **Email:** juliana.ferreira@exemplo.com
- **Valor:** $423.50
- **Status:** Delivered
- **Produto:** Smart Watch - Black
- **Endereço:** Av. Brigadeiro Faria Lima, 2000 - São Paulo, SP
- **Rastreio:** SP321GHI789
- **Data:** 11/05/2024

---

### 📦 Pedido #1243 - Marcos Santos
- **Email:** marcos.santos@exemplo.com
- **Valor:** $178.60
- **Status:** Delivered
- **Produto:** Bluetooth Speaker - Blue
- **Endereço:** Rua XV de Novembro, 678 - Curitiba, PR
- **Rastreio:** PR654JKL321BR
- **Data:** 11/25/2024

---

## ✅ Checklist de Teste

### No Admin (localhost):
- [ ] Ativar "Test Mode" → Digitar `1234` → Ver "Maria Silva - Premium Watch"
- [ ] Ativar "Test Mode" → Digitar `1235` → Ver "João Santos - Leather Wallet"
- [ ] Ativar "Test Mode" → Digitar `1236` → Ver "Ana Costa - Designer Sunglasses"
- [ ] Ativar "Test Mode" → Digitar `1237` → Ver "Pedro Costa - Phone Case (Refunded)"
- [ ] Ativar "Test Mode" → Digitar `1238` → Ver "Carla Mendes - Wireless Headphones"
- [ ] Ativar "Test Mode" → Digitar `1239` → Ver "Lucas Almeida - Fitness Tracker (In Transit)"
- [ ] Ativar "Test Mode" → Digitar `1240` → Ver "Fernanda Rocha - 3 produtos"
- [ ] Ativar "Test Mode" → Digitar `1241` → Ver "Roberto Lima - Gaming Keyboard (Pending)"
- [ ] Ativar "Test Mode" → Digitar `1242` → Ver "Juliana Ferreira - Smart Watch"
- [ ] Ativar "Test Mode" → Digitar `1243` → Ver "Marcos Santos - Bluetooth Speaker"
- [ ] Ativar "Production Mode" → Digitar pedido real → Ver dados da API

### No Shopify Proxy:
- [ ] Acessar `/apps/resolution?mock=true` → Testar pedidos #1234 a #1243
- [ ] Acessar `/apps/resolution` → Digitar pedido real → Ver dados da API

---

## 🔍 Logs do Console

### Mock Data ativado:
```javascript
📦 localStorage 'chargemind_use_mock_data': "true"
🔍 Modo de busca (via localStorage/admin): MOCK DATA ✅
   → Test Mode (Mock Data) ativo!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST MODE (MOCK DATA) - Buscando em mockOrders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Pedido encontrado: { orderNumber: "1234", customerName: "Maria Silva", ... }
```

### Real Data ativado:
```javascript
📦 localStorage 'chargemind_use_mock_data': "false"
🔍 Modo de busca (via localStorage/admin): REAL DATA 🌐
   → Production Mode (Real Data) ativo!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 PRODUCTION MODE (REAL DATA) - Buscando via API Shopify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Resultado da API: { found: true, order: {...} }
```

---

## ⚠️ Problemas Comuns

### "O modo do Admin não funciona no /apps/resolution"
**Motivo:** Domínios diferentes não compartilham localStorage  
**Solução:** Use `?mock=true` na URL do Shopify

### "Os dados mockados não aparecem"
**Verificar:**
1. Console mostra "🧪 TEST MODE"?
2. Está usando pedido mockado correto? (1234-1243)
3. Se no Shopify, tem `?mock=true` na URL?
4. Os pedidos mockados são os MESMOS das disputas

### "Os dados reais não aparecem"
**Verificar:**
1. Console mostra "🌐 PRODUCTION MODE"?
2. Shopify está conectado no Admin?
3. Pedido existe realmente na loja?
4. Tem `shopify_access_token` válido no banco?

---

## 🎯 Resumo Visual

```
MOCK DATA - 10 PEDIDOS DISPONÍVEIS:
┌──────────────────────────────────────────┐
│ #1234 → Maria Silva      → $125.00       │
│ #1235 → João Santos      → $89.50        │
│ #1236 → Ana Costa        → $245.00       │
│ #1237 → Pedro Costa      → $67.80        │
│ #1238 → Carla Mendes     → $156.40       │
│ #1239 → Lucas Almeida    → $89.00        │
│ #1240 → Fernanda Rocha   → $342.50       │
│ #1241 → Roberto Lima     → $198.00       │
│ #1242 → Juliana Ferreira → $423.50       │
│ #1243 → Marcos Santos    → $178.60       │
└──────────────────────────────────────────┘
         ↓ MESMOS DADOS ↓
┌──────────────────────────────────────────┐
│ Disputas Mockadas no Dashboard           │
└──────────────────────────────────────────┘

REAL DATA:
┌──────────────────────────────────────────┐
│ API Shopify → Pedidos reais da loja      │
└──────────────────────────────────────────┘
```

---

## 📈 Status dos Pedidos Mockados

| Pedido | Cliente | Status | Valor | Rastreio |
|--------|---------|--------|-------|----------|
| #1234 | Maria Silva | ✅ Delivered | $125.00 | - |
| #1235 | João Santos | ✅ Delivered | $89.50 | ✅ |
| #1236 | Ana Costa | ✅ Delivered | $245.00 | ✅ |
| #1237 | Pedro Costa | 💰 Refunded | $67.80 | - |
| #1238 | Carla Mendes | ✅ Delivered | $156.40 | ✅ |
| #1239 | Lucas Almeida | 🚚 In Transit | $89.00 | ✅ |
| #1240 | Fernanda Rocha | ✅ Delivered | $342.50 | ✅ |
| #1241 | Roberto Lima | ⏳ Pending | $198.00 | - |
| #1242 | Juliana Ferreira | ✅ Delivered | $423.50 | ✅ |
| #1243 | Marcos Santos | ✅ Delivered | $178.60 | ✅ |

**⚠️ IMPORTANTE:** Estes são os MESMOS pedidos que aparecem nas disputas mockadas do dashboard!
