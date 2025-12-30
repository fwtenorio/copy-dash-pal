# 🚨 SOLUÇÃO RÁPIDA - Integração entrando como "Paused"

## Problema
Quando você conecta uma nova integração e clica em "Save", ela aparece como **"Paused"** (amarelo) ao invés de **"Active"** (verde).

## Causa
A coluna `shopify_status` (e outras colunas `*_status`) **não existe no banco de dados** ou está com valor `NULL`.

## ✅ SOLUÇÃO (3 passos simples)

### Passo 1: Verificar se a Migration foi Aplicada

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Cole e execute este SQL:

```sql
-- Verificar se as colunas existem
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name LIKE '%_status'
ORDER BY column_name;
```

**Resultado esperado:** Deve retornar 11 linhas (uma para cada integração)

Se retornar **0 linhas** ou **menos de 11**, vá para o Passo 2.

---

### Passo 2: Aplicar a Migration

Cole e execute este SQL no **SQL Editor**:

```sql
-- Adicionar colunas de status
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS shopify_status TEXT CHECK (shopify_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS woocommerce_status TEXT CHECK (woocommerce_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS stripe_status TEXT CHECK (stripe_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS paypal_status TEXT CHECK (paypal_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS klarna_status TEXT CHECK (klarna_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS airwallex_status TEXT CHECK (airwallex_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS woopayments_status TEXT CHECK (woopayments_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS braintree_status TEXT CHECK (braintree_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS adyen_status TEXT CHECK (adyen_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS wix_status TEXT CHECK (wix_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS magento_status TEXT CHECK (magento_status IN ('active', 'paused'));

-- Definir integrações existentes como 'active'
UPDATE public.clients 
SET shopify_status = 'active' 
WHERE shopify_connected_at IS NOT NULL;

UPDATE public.clients 
SET woocommerce_status = 'active' 
WHERE woocommerce_connected_at IS NOT NULL;

UPDATE public.clients 
SET stripe_status = 'active' 
WHERE stripe_connected_at IS NOT NULL;

UPDATE public.clients 
SET paypal_status = 'active' 
WHERE paypal_connected_at IS NOT NULL;

UPDATE public.clients 
SET klarna_status = 'active' 
WHERE klarna_connected_at IS NOT NULL;

UPDATE public.clients 
SET airwallex_status = 'active' 
WHERE airwallex_connected_at IS NOT NULL;

UPDATE public.clients 
SET woopayments_status = 'active' 
WHERE woopayments_connected_at IS NOT NULL;

UPDATE public.clients 
SET braintree_status = 'active' 
WHERE braintree_connected_at IS NOT NULL;

UPDATE public.clients 
SET adyen_status = 'active' 
WHERE adyen_connected_at IS NOT NULL;

UPDATE public.clients 
SET wix_status = 'active' 
WHERE wix_connected_at IS NOT NULL;

UPDATE public.clients 
SET magento_status = 'active' 
WHERE magento_connected_at IS NOT NULL;
```

**Clique em RUN** ou pressione `Ctrl+Enter`

Aguarde a mensagem de sucesso!

---

### Passo 3: Testar

1. **Recarregue completamente** a página da aplicação (`Ctrl+Shift+R` ou `Cmd+Shift+R`)
2. **Abra o Console** do navegador (F12)
3. Tente conectar uma nova integração:
   - Clique em "Connect" ou no switch
   - Preencha os dados
   - Clique em "Save"
4. **Verifique os logs no console:**
   - Deve aparecer: `"Saving integration to database"` com `statusValue: 'active'`
   - Deve aparecer: `"Integration saved successfully with status 'active'"`
   - Deve aparecer: `"Local status state updated to active"`
5. **A integração deve aparecer como "Active" (verde)** após recarregar

---

## 🔍 Verificação Final

Execute este SQL para confirmar que o status foi salvo:

```sql
SELECT 
  shopify_store_name,
  shopify_connected_at,
  shopify_status
FROM public.clients
WHERE shopify_connected_at IS NOT NULL;
```

**Resultado esperado:** `shopify_status` deve ser `'active'`

---

## ❌ Se ainda não funcionar

1. Abra o Console do navegador (F12)
2. Procure por erros em vermelho
3. Compartilhe o erro comigo
4. Verifique se a coluna realmente existe:

```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'shopify_status';
```

Se não retornar nada, a coluna não foi criada e há um problema de permissões.
