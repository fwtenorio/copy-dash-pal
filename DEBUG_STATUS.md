# Debug Status Issues

## Problema: Toggle travado no "Paused"

### Passos para Debug:

1. **Abra o Console do Navegador (F12)**
   - Vá para a aba "Console"

2. **Verifique os Logs ao Carregar a Página**
   - Procure por logs como: `IntegrationCard Shopify: { connected: true, status: 'paused', ... }`
   - **Verifique o valor de `status`** - deve ser `'active'`, `'paused'` ou `null`

3. **Clique no Switch para Reativar**
   - Você deve ver logs detalhados:
     ```
     === Switch changed ===
     Checked: true
     Connected: true
     Status: paused
     isActive: false
     isPaused: true
     Action: Reactivating integration - calling onToggle with "active"
     handleToggleStatus called: { id: 'shopify', newStatus: 'active' }
     ```

4. **Verifique se há Erros**
   - Se aparecer `ERROR: onToggle is not defined!` → O problema é na passagem da prop
   - Se aparecer erro de banco de dados → A migration não foi aplicada
   - Se aparecer `No mapping found for id` → Problema na configuração

### Verificação da Migration

Execute este SQL no Supabase Dashboard (SQL Editor):

```sql
-- Verificar se as colunas de status existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name LIKE '%_status';
```

**Resultado esperado:** 11 linhas mostrando os campos de status

Se não retornar nada ou retornar menos de 11 linhas, execute:

```sql
-- Criar as colunas de status
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

-- Definir integrações conectadas como 'active'
UPDATE public.clients SET shopify_status = 'active' WHERE shopify_connected_at IS NOT NULL;
```

### Verificar Dados do Cliente

Execute este SQL para ver o status atual:

```sql
SELECT 
  id,
  shopify_store_name,
  shopify_connected_at,
  shopify_status
FROM public.clients
WHERE shopify_connected_at IS NOT NULL;
```

**Status esperado:** Se a integração está conectada, `shopify_status` deve ser `'active'` ou `'paused'`

### Se o Status está NULL ou não existe

Execute este SQL para corrigir:

```sql
UPDATE public.clients 
SET shopify_status = 'active' 
WHERE shopify_connected_at IS NOT NULL 
AND (shopify_status IS NULL OR shopify_status = '');
```

### Teste Final

1. Após executar os SQLs acima
2. Recarregue a página (Ctrl+Shift+R ou Cmd+Shift+R)
3. Abra o console
4. Tente pausar/reativar
5. Verifique os logs detalhados

## Possíveis Causas e Soluções

### Causa 1: Migration não foi aplicada
**Sintoma:** Erro no console sobre coluna inexistente
**Solução:** Execute os SQLs de verificação acima

### Causa 2: Status é NULL no banco
**Sintoma:** Logs mostram `status: null` mas `connected: true`
**Solução:** Execute o UPDATE acima para definir como 'active'

### Causa 3: Estado local não está sendo atualizado
**Sintoma:** Logs mostram "Database updated successfully" mas a UI não muda
**Solução:** Verifique se há erros no `setStatusStates`

### Causa 4: onToggle não está definido
**Sintoma:** Log mostra "ERROR: onToggle is not defined!"
**Solução:** Problema no código, verificar se a prop está sendo passada corretamente
