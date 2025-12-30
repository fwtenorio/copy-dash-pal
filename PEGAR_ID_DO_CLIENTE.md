# 🎯 Como Pegar o ID do Cliente

## PASSO 1: Execute esta query no Supabase

🔗 **Abra:** https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/editor

**Cole e clique em RUN (ou Ctrl+Enter):**

```sql
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
```

---

## PASSO 2: Você verá uma tabela assim:

```
┌────────────────────────────────────────┬─────────────────────┬──────────────┬─────────────┬──────────┐
│ id                                     │ shopify_store_name  │ nome_empresa │ brand_color │ logo_url │
├────────────────────────────────────────┼─────────────────────┼──────────────┼─────────────┼──────────┤
│ 550e8400-e29b-41d4-a716-446655440000   │ big-store-575881    │ Minha Loja   │ NULL        │ NULL     │ ← ESTE!
│ 123e4567-e89b-12d3-a456-426614174000   │ outra-loja         │ Outra Loja   │ #1B966C     │ https... │
│ ...                                    │ ...                 │ ...          │ ...         │ ...      │
└────────────────────────────────────────┴─────────────────────┴──────────────┴─────────────┴──────────┘
```

---

## PASSO 3: Identifique o cliente correto

Procure por **UM** destes sinais:

✅ **`shopify_store_name` parecido com `big-store` ou `575881`**
✅ **`nome_empresa` que você reconhece**
✅ **O registro mais recente** (última linha se você acabou de criar)

**NO EXEMPLO ACIMA:** A primeira linha tem `shopify_store_name = 'big-store-575881'`

---

## PASSO 4: Copie o ID

Clique na célula do **`id`** e copie o valor completo:

```
550e8400-e29b-41d4-a716-446655440000
```

Esse é um UUID (identificador único). Parece com:
- Letras e números
- Separados por hífens (-)
- Total de 36 caracteres

---

## PASSO 5: Use na query de UPDATE

Substitua `'SEU_CLIENT_ID_AQUI'` pelo ID que você copiou:

**ANTES:**
```sql
UPDATE clients
SET shopify_store_name = 'big-store-575881.myshopify.com'
WHERE id = 'SEU_CLIENT_ID_AQUI'  ← Troque aqui
RETURNING id, shopify_store_name;
```

**DEPOIS (com o ID real):**
```sql
UPDATE clients
SET shopify_store_name = 'big-store-575881.myshopify.com'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'  ← ID real
RETURNING id, shopify_store_name;
```

---

## 🎬 EXEMPLO COMPLETO PASSO A PASSO

### **Query 1 - VER clientes:**
```sql
SELECT id, shopify_store_name, nome_empresa, brand_color
FROM clients
ORDER BY created_at DESC
LIMIT 5;
```

### **Resultado que você verá:**
```
id: 550e8400-e29b-41d4-a716-446655440000
shopify_store_name: big-store-575881
nome_empresa: Minha Loja
brand_color: NULL
```

### **Query 2 - ATUALIZAR (com o ID copiado):**
```sql
UPDATE clients
SET 
  shopify_store_name = 'big-store-575881.myshopify.com',
  brand_color = '#1B966C',
  brand_text_color = '#FFFFFF'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
RETURNING id, shopify_store_name, brand_color;
```

### **Resultado esperado:**
```
id: 550e8400-e29b-41d4-a716-446655440000
shopify_store_name: big-store-575881.myshopify.com ✅
brand_color: #1B966C ✅
brand_text_color: #FFFFFF ✅
```

---

## ❓ E se eu não tiver certeza de qual cliente é?

**Opção A - Procure pelo nome da empresa:**
```sql
SELECT id, shopify_store_name, nome_empresa
FROM clients
WHERE nome_empresa ILIKE '%big%'
   OR nome_empresa ILIKE '%store%';
```

**Opção B - Procure por shopify_store_name parecido:**
```sql
SELECT id, shopify_store_name, nome_empresa
FROM clients
WHERE shopify_store_name ILIKE '%big%'
   OR shopify_store_name ILIKE '%575881%';
```

**Opção C - Veja TODOS os clientes:**
```sql
SELECT id, shopify_store_name, nome_empresa, created_at
FROM clients
ORDER BY created_at DESC;
```

---

## ✅ Checklist

- [ ] Executei a query SELECT para ver os clientes
- [ ] Identifiquei qual linha é o meu cliente
- [ ] Copiei o valor da coluna `id` (UUID de 36 caracteres)
- [ ] Colei no lugar de `'SEU_CLIENT_ID_AQUI'` na query UPDATE
- [ ] Executei a query UPDATE
- [ ] Vi a mensagem de sucesso com os dados atualizados
- [ ] Testei no navegador

---

## 🆘 Ainda com dúvida?

Se você executou a primeira query e está vendo os resultados, me diga:

1. **Quantas linhas apareceram?**
2. **Qual é o `shopify_store_name` de cada linha?**
3. **Qual é o `nome_empresa` de cada linha?**

Eu te ajudo a identificar qual é o correto!
