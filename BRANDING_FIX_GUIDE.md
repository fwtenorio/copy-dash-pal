# 🔧 Guia de Correção: Branding não aparece em /apps/resolution

## 🎯 Problema Identificado

O diagnóstico revelou que a **Edge Function não está encontrando dados de branding no banco de dados**:

```json
{
  "shop": "big-store-575881.myshopify.com",
  "branding": {}  // ❌ VAZIO!
}
```

## 🔍 Causa Raiz

A função `fetchBranding()` em `app-proxy-render/index.ts` busca dados na tabela `clients` usando o parâmetro `shop` enviado pela Shopify:

```typescript
// Linha 224-418 em app-proxy-render/index.ts
const branding = await fetchBranding(normalizedShop);
```

**Possíveis problemas:**

1. ❌ O `shopify_store_name` no banco **não corresponde** ao valor enviado pela Shopify
2. ❌ As colunas `brand_color`, `brand_text_color`, `logo_url` estão **NULL ou vazias**
3. ❌ O cliente não existe na tabela `clients`

---

## ✅ Solução: Passo a Passo

### **Passo 1: Execute o Diagnóstico**

```bash
cd /Users/jonathanoliveira/charge-mind
bash scripts/diagnose-branding-issue.sh
```

Resultado esperado:
```json
{
  "shop": "big-store-575881.myshopify.com",
  "branding": {}  // Se vazio, continua para o Passo 2
}
```

---

### **Passo 2: Verifique o Banco de Dados**

Acesse o **Supabase Dashboard**:
- URL: https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/editor

Execute a query de verificação (copie de `scripts/fix-shopify-store-name.sql`):

```sql
-- Mostra todos os clientes
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  brand_text_color,
  logo_url
FROM clients
WHERE 
  shopify_store_name ILIKE '%big-store%'
  OR shopify_store_name ILIKE '%575881%'
ORDER BY created_at DESC
LIMIT 5;
```

**Cenários possíveis:**

#### **Cenário A: Cliente existe mas shopify_store_name está incorreto**

Exemplo: `shopify_store_name = 'big-store-575881'` (sem `.myshopify.com`)

**Solução:**
```sql
UPDATE clients
SET shopify_store_name = 'big-store-575881.myshopify.com'
WHERE id = 'SEU_CLIENT_ID_AQUI'
RETURNING id, shopify_store_name, nome_empresa;
```

#### **Cenário B: Cliente existe mas branding está NULL/vazio**

**Solução:**

1. Acesse `/configurations` na aplicação
2. Preencha os campos:
   - **Brand Color** (ex: `#1B966C`)
   - **Brand Text Color** (ex: `#FFFFFF`)
   - **Logo URL** (faça upload de um logo)
3. Clique em **Salvar**

**OU** atualize manualmente no banco:

```sql
UPDATE clients
SET 
  brand_color = '#1B966C',
  brand_text_color = '#FFFFFF',
  logo_url = 'https://sua-url-do-logo.png'
WHERE id = 'SEU_CLIENT_ID_AQUI'
RETURNING id, brand_color, logo_url;
```

#### **Cenário C: Colunas de branding não existem**

Execute a migration:

```bash
cd /Users/jonathanoliveira/charge-mind
supabase db push
```

Ou execute manualmente no SQL Editor:

```sql
-- Conteúdo de: supabase/migrations/20251217120000_add_clients_branding_columns.sql
alter table
  public.clients
  add column if not exists brand_color text,
  add column if not exists brand_text_color text,
  add column if not exists support_url text,
  add column if not exists refund_policy_url text,
  add column if not exists logo_url text;
```

#### **Cenário D: Cliente não existe**

Crie o cliente manualmente ou conecte via Shopify OAuth em `/settings`.

---

### **Passo 3: Teste a Correção**

Após atualizar o banco, execute novamente o diagnóstico:

```bash
bash scripts/diagnose-branding-issue.sh
```

Resultado esperado:
```json
{
  "shop": "big-store-575881.myshopify.com",
  "branding": {
    "brand_color": "#1B966C",          // ✅
    "brand_text_color": "#FFFFFF",     // ✅
    "logo_url": "https://...",         // ✅
    "heading": "Sua Loja - Need help?"
  }
}
```

---

### **Passo 4: Verifique no Navegador**

Acesse a página pública:
```
https://big-store-575881.myshopify.com/apps/resolution
```

**Abra o Console do Navegador (F12)** e verifique:

```javascript
console.log(window.CHARGEMIND_DATA);
```

Deve mostrar:
```json
{
  "shop": "big-store-575881.myshopify.com",
  "branding": {
    "brand_color": "#1B966C",
    "brand_text_color": "#FFFFFF",
    "logo_url": "https://...",
    "heading": "Sua Loja - Need help?"
  }
}
```

---

## 🔄 Se o problema persistir

### **1. Limpe o cache do navegador**

- **Chrome/Edge**: `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
- **Ou abra em aba anônima**

### **2. Verifique os logs da Edge Function**

- URL: https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/functions/app-proxy-render/logs
- Procure por mensagens como:
  ```
  ⚠️ Nenhum cliente encontrado para shop: "big-store-575881.myshopify.com"
  ```

### **3. Force um novo deploy**

```bash
cd /Users/jonathanoliveira/charge-mind
npm run deploy:proxy
```

Isso vai:
1. Rebuildar os assets (proxy-index.js, proxy-index.css)
2. Fazer upload para Supabase Storage com cache-control: 0
3. Fazer deploy da Edge Function atualizada

### **4. Verifique a configuração do App Proxy na Shopify**

- Acesse: Shopify Admin > Apps > Chargemind > App setup > App proxy
- Verifique se está configurado:
  - **Subpath**: `resolution`
  - **Subpath prefix**: `apps`
  - **Proxy URL**: `https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render`

---

## 📋 Checklist de Verificação

- [ ] Execute `bash scripts/diagnose-branding-issue.sh`
- [ ] Verifique se `shopify_store_name` corresponde no banco
- [ ] Verifique se `brand_color` e `logo_url` têm valores
- [ ] Teste no navegador (aba anônima)
- [ ] Verifique `window.CHARGEMIND_DATA` no console
- [ ] Veja os logs da Edge Function no Supabase
- [ ] Se necessário, execute `npm run deploy:proxy`

---

## 🆘 Suporte

Se após seguir todos os passos o problema persistir:

1. **Capture screenshots**:
   - Resultado do `diagnose-branding-issue.sh`
   - Query SQL do banco mostrando os dados
   - Console do navegador mostrando `window.CHARGEMIND_DATA`
   - Logs da Edge Function

2. **Informações importantes**:
   - Qual cenário (A, B, C ou D) você identificou?
   - O que você já tentou?
   - Mensagens de erro específicas

---

## 🎓 Como funciona (Resumo Técnico)

```
┌─────────────────────────────────────────────────────────────────┐
│ Fluxo de Branding                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Usuário salva em /configurations                           │
│     └─> UPDATE clients SET brand_color, logo_url, ...         │
│                                                                 │
│  2. Shopify chama /apps/resolution                             │
│     └─> GET https://.../app-proxy-render?shop=big-store...    │
│                                                                 │
│  3. Edge Function busca branding                               │
│     └─> SELECT brand_color, logo_url FROM clients             │
│         WHERE shopify_store_name = ?shop                       │
│                                                                 │
│  4. Injeta no HTML                                             │
│     └─> window.CHARGEMIND_DATA = { shop, branding }           │
│                                                                 │
│  5. React consome e aplica CSS                                 │
│     └─> --primary-color: brand_color                           │
│         Logo: <img src={logo_url} />                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Arquivo principal**: `supabase/functions/app-proxy-render/index.ts`
- **Linha 224-418**: Função `fetchBranding(shop: string)`
- **Linha 79-221**: Função `buildHtml(payload)` que injeta o branding
