# ⚡ APLICAR CORREÇÃO AGORA

## 🎯 Problema: branding está vazio

```json
{"shop":"big-store-575881.myshopify.com","branding":{}}  ❌
```

## ✅ SOLUÇÃO EM 2 PASSOS

### **PASSO 1: Abra o Supabase SQL Editor**

🔗 **Acesse:** https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/editor

---

### **PASSO 2: Execute esta query**

**Copie e cole no SQL Editor:**

```sql
-- ════════════════════════════════════════════════════════════════════════════════
-- PASSO 2A: Verificar quais clientes existem
-- ════════════════════════════════════════════════════════════════════════════════

SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  logo_url,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;

-- ════════════════════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO: Você verá uma lista de clientes
-- Copie o ID do cliente que você quer atualizar
-- ════════════════════════════════════════════════════════════════════════════════



-- ════════════════════════════════════════════════════════════════════════════════
-- PASSO 2B: Atualizar shopify_store_name
-- ════════════════════════════════════════════════════════════════════════════════
-- 
-- ATENÇÃO: Substitua 'COLE_O_ID_DO_CLIENTE_AQUI' pelo ID que você copiou acima
-- Exemplo: '550e8400-e29b-41d4-a716-446655440000'
-- 
-- Remova os comentários (--) das 4 linhas abaixo e execute:

-- UPDATE clients
-- SET shopify_store_name = 'big-store-575881.myshopify.com'
-- WHERE id = 'COLE_O_ID_DO_CLIENTE_AQUI'
-- RETURNING id, shopify_store_name, nome_empresa;



-- ════════════════════════════════════════════════════════════════════════════════
-- PASSO 2C: Verificar/Adicionar dados de branding
-- ════════════════════════════════════════════════════════════════════════════════
--
-- Se brand_color ou logo_url estiverem NULL, descomente e execute:

-- UPDATE clients
-- SET 
--   brand_color = '#1B966C',
--   brand_text_color = '#FFFFFF',
--   logo_url = 'https://via.placeholder.com/150x50?text=Logo'
-- WHERE id = 'COLE_O_ID_DO_CLIENTE_AQUI'
-- RETURNING id, brand_color, brand_text_color, logo_url;



-- ════════════════════════════════════════════════════════════════════════════════
-- PASSO 2D: Verificar resultado final
-- ════════════════════════════════════════════════════════════════════════════════

SELECT 
  id,
  shopify_store_name,
  brand_color,
  brand_text_color,
  logo_url,
  nome_empresa
FROM clients
WHERE shopify_store_name = 'big-store-575881.myshopify.com';

-- ════════════════════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
-- shopify_store_name: 'big-store-575881.myshopify.com'  ✅
-- brand_color: '#1B966C'  ✅
-- brand_text_color: '#FFFFFF'  ✅
-- logo_url: 'https://...'  ✅
-- ════════════════════════════════════════════════════════════════════════════════
```

---

### **PASSO 3: Teste**

Abra no navegador (aba anônima para evitar cache):

```
https://big-store-575881.myshopify.com/apps/resolution
```

Abra o Console do navegador (F12) e digite:

```javascript
console.log(window.CHARGEMIND_DATA);
```

**Resultado esperado:**
```json
{
  "shop": "big-store-575881.myshopify.com",
  "branding": {
    "brand_color": "#1B966C",  ✅
    "brand_text_color": "#FFFFFF",  ✅
    "logo_url": "https://..."  ✅
  }
}
```

---

## 🔄 ALTERNATIVA: Use a interface /configurations

Se você preferir **não mexer no SQL**, pode fazer via interface:

1. **Acesse:** https://app.chargemind.io/configurations
2. **Preencha:**
   - Brand Color: `#1B966C`
   - Brand Text Color: `#FFFFFF`
   - Logo: (faça upload de um logo)
3. **Salve**
4. **IMPORTANTE:** Você ainda precisa executar o **PASSO 2B** acima para atualizar o `shopify_store_name`

---

## ❓ Precisa de ajuda?

**Se não souber qual é o ID do cliente:**

1. Execute **PASSO 2A** no SQL Editor
2. Procure por:
   - Nome da empresa que você reconhece
   - OU o shopify_store_name mais parecido com 'big-store'
   - OU o registro mais recente (created_at)
3. Copie o `id` desse registro
4. Use no **PASSO 2B** e **PASSO 2C**

---

## 🎯 Por que isso funciona?

A Edge Function busca dados assim:

```typescript
// 1. Recebe shop da Shopify
const shop = "big-store-575881.myshopify.com";

// 2. Busca no banco
SELECT * FROM clients 
WHERE shopify_store_name = "big-store-575881.myshopify.com"

// 3. Se não encontrar → branding = {}  ❌
// 4. Se encontrar → branding = { brand_color, logo_url, ... }  ✅
```

**A correção:** Garantir que `shopify_store_name` no banco corresponda exatamente ao nome enviado pela Shopify.

---

## ✅ Checklist

- [ ] Executei **PASSO 2A** e vi a lista de clientes
- [ ] Copiei o `id` do cliente correto
- [ ] Executei **PASSO 2B** com o ID correto
- [ ] Executei **PASSO 2C** para adicionar branding (se necessário)
- [ ] Executei **PASSO 2D** e vi os dados atualizados
- [ ] Testei no navegador em aba anônima
- [ ] Verifiquei `window.CHARGEMIND_DATA` no console
- [ ] O branding está aparecendo! 🎉
