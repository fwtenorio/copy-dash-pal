# 🎨 Sincronizar Cores de Branding

## 🔍 Problema Identificado

- **Banco de dados tem**: `#1B966C` (verde - cor antiga)
- **`/configuracoes` tem**: Cores personalizadas diferentes
- **Resultado**: `/apps/resolution` mostra cores antigas porque pega do banco

---

## ✅ SOLUÇÃO: Atualizar o Banco com as Cores Corretas

### **PASSO 1: Descubra quais são as cores ATUAIS configuradas**

1. **Abra no navegador**: https://app.chargemind.io/configurations
2. **Vá na aba "Branding"**
3. **Anote as cores**:
   - **Brand Color**: `_____________` (ex: `#D34024`)
   - **Brand Text Color**: `_____________` (ex: `#FFFFFF`)

---

### **PASSO 2: Abra o Supabase SQL Editor**

🔗 https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/editor

---

### **PASSO 3: Encontre o ID do seu cliente**

```sql
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  brand_text_color
FROM clients
WHERE shopify_store_name ILIKE '%big-store%'
   OR shopify_store_name ILIKE '%575881%'
ORDER BY created_at DESC
LIMIT 5;
```

**Copie o `id` do cliente correto**

---

### **PASSO 4: Atualize com as cores REAIS**

Substitua:
- `'SEU_CLIENT_ID'` → ID que você copiou no PASSO 3
- `'#D34024'` → Brand Color que você anotou no PASSO 1
- `'#FFFFFF'` → Brand Text Color que você anotou no PASSO 1

```sql
UPDATE clients
SET 
  shopify_store_name = 'big-store-575881.myshopify.com',
  brand_color = '#D34024',           -- ← Cole a cor REAL aqui
  brand_text_color = '#FFFFFF'        -- ← Cole a cor REAL aqui
WHERE id = 'SEU_CLIENT_ID'
RETURNING id, shopify_store_name, brand_color, brand_text_color, logo_url;
```

---

### **PASSO 5: Teste**

Execute o diagnóstico:
```bash
bash scripts/diagnose-branding-issue.sh
```

Deve mostrar:
```json
{
  "shop": "big-store-575881.myshopify.com",
  "branding": {
    "brand_color": "#D34024",    // ← Sua cor real!
    "brand_text_color": "#FFFFFF"
  }
}
```

Abra no navegador (aba anônima):
```
https://big-store-575881.myshopify.com/apps/resolution
```

---

## 🔄 ALTERNATIVA: Force o salvamento via interface

Se você preferir não mexer no SQL:

1. **Abra**: https://app.chargemind.io/configurations
2. **Vá na aba "Branding"**
3. **Mude a cor para qualquer outra** (ex: vermelho)
4. **Clique em SALVAR**
5. **Mude de volta para a cor correta**
6. **Clique em SALVAR novamente**
7. **Abra o Console do navegador (F12)** e verifique se há erros

Isso força o sistema a atualizar o banco.

---

## 🐛 Por que isso acontece?

O código em `Settings.tsx` (linha 919-920) deveria atualizar:

```typescript
const updateDataBrand = {
  brand_color: brandColor || clientData?.brand_color || null,
  brand_text_color: brandTextColor || clientData?.brand_text_color || null,
};
```

**Possíveis causas:**
1. ❌ Erro silencioso no salvamento (verifique Console do navegador)
2. ❌ As colunas `brand_color` não existiam quando você salvou (execute a migration)
3. ❌ Cache do frontend mostrando valores antigos

---

## 🔍 Debug: Verifique se o salvamento funciona

1. **Abra**: https://app.chargemind.io/configurations
2. **Abra o Console (F12)**
3. **Vá na aba "Branding"**
4. **Mude a Brand Color**
5. **Clique em SALVAR**
6. **Verifique no Console** se há:
   - ✅ Mensagem de sucesso
   - ❌ Erro em vermelho

Se houver erro, me mande o erro que aparece!

---

## ✅ Checklist Final

- [ ] Anotei as cores reais do `/configuracoes`
- [ ] Executei a query SELECT e copiei o ID do cliente
- [ ] Executei a query UPDATE com as cores REAIS
- [ ] Vi a mensagem de sucesso
- [ ] Executei `bash scripts/diagnose-branding-issue.sh`
- [ ] Vi as cores corretas no JSON
- [ ] Testei no navegador em aba anônima
- [ ] As cores estão corretas! 🎉

---

## 📊 Exemplo Completo

**Suas cores reais (do `/configuracoes`):**
```
Brand Color: #D34024 (vermelho)
Brand Text Color: #FFFFFF (branco)
```

**Query completa:**
```sql
-- 1. Ver clientes
SELECT id, shopify_store_name, brand_color, brand_text_color
FROM clients
WHERE shopify_store_name ILIKE '%big-store%'
LIMIT 5;

-- Resultado: id = 550e8400-e29b-41d4-a716-446655440000

-- 2. Atualizar com cores REAIS
UPDATE clients
SET 
  shopify_store_name = 'big-store-575881.myshopify.com',
  brand_color = '#D34024',        -- Sua cor real
  brand_text_color = '#FFFFFF'    -- Sua cor real
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
RETURNING id, brand_color, brand_text_color;

-- Resultado esperado:
-- brand_color: #D34024 ✅
-- brand_text_color: #FFFFFF ✅
```

---

**Primeira coisa a fazer:** Anote as cores que aparecem em `/configuracoes` na aba Branding! 🎨
