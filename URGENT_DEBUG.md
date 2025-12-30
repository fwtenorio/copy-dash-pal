# 🔴 DEBUG URGENTE - Integração entrando como Pausado

## Por favor, siga EXATAMENTE estes passos:

### Passo 1: Verificar o Banco de Dados

No Supabase Dashboard > SQL Editor, execute:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'shopify_status';
```

**Me diga:** Retornou alguma linha? Se sim, qual o `data_type`?

---

### Passo 2: Verificar o Valor Atual

Execute este SQL:

```sql
-- Ver o status atual
SELECT 
  id,
  email,
  shopify_store_name,
  shopify_connected_at,
  shopify_status
FROM public.clients
WHERE shopify_connected_at IS NOT NULL
ORDER BY shopify_connected_at DESC
LIMIT 5;
```

**Me diga:** Qual é o valor de `shopify_status`? É `'active'`, `'paused'`, ou `null`?

---

### Passo 3: Capturar os Logs do Console

1. Abra o Console do navegador (F12)
2. Limpe o console (botão 🚫 ou clique direito > Clear)
3. Clique em "Remove" para desconectar a integração
4. Clique em "Connect" novamente
5. Preencha os dados
6. Clique em "Save"

**Copie e cole TODOS os logs** que aparecerem, especialmente:
- `"Saving integration to database"`
- `"Database updated successfully"` ou qualquer erro
- `"=== Loaded Integration States ==="`
- Qualquer mensagem de erro em vermelho

---

### Passo 4: Atualizar Manualmente (teste temporário)

Execute este SQL para forçar o status como active:

```sql
UPDATE public.clients 
SET shopify_status = 'active' 
WHERE shopify_connected_at IS NOT NULL;
```

Depois **recarregue a página** e me diga: A integração aparece como "Active" agora?

---

## Me envie estas informações:

1. ✅ Resultado do Passo 1 (coluna existe?)
2. ✅ Resultado do Passo 2 (qual o valor do status?)
3. ✅ Logs do Passo 3 (console logs completos)
4. ✅ Resultado do Passo 4 (funciona após UPDATE manual?)
