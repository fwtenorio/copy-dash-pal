# 🖼️ Atualizar Logo Real

## OPÇÃO A: Verificar se já existe logo no sistema

### **1. No Supabase SQL Editor, execute:**

```sql
-- Ver todos os logos já cadastrados
SELECT 
  id,
  nome_empresa,
  logo_url
FROM clients
WHERE logo_url IS NOT NULL
  AND logo_url != ''
  AND logo_url NOT LIKE '%placeholder%'
ORDER BY created_at DESC;
```

**Se encontrar algum logo**, copie a URL e pule para o **PASSO 3**.

---

## OPÇÃO B: Fazer upload do logo

### **2A. Via Interface /configuracoes:**

1. Acesse: https://app.chargemind.io/configurations
2. Vá na aba **"Branding"**
3. Clique no campo de **"Logo"**
4. Faça upload da imagem
5. **Clique em SALVAR**
6. O logo será salvo automaticamente no banco

**OU**

### **2B. Upload manual no Supabase Storage:**

1. Acesse: https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/storage/buckets/assets
2. Crie uma pasta `logos` (se não existir)
3. Faça upload do seu logo
4. Clique no arquivo e copie a **Public URL**
5. Continue para o **PASSO 3**

---

## PASSO 3: Atualizar no banco

Cole no **Supabase SQL Editor**:

```sql
UPDATE clients
SET logo_url = 'COLE_A_URL_DO_SEU_LOGO_AQUI'
WHERE id = 'e961576b-7131-4a36-b655-0a637cc8149a'
RETURNING id, nome_empresa, logo_url;
```

**Exemplo com URL real:**
```sql
UPDATE clients
SET logo_url = 'https://xieephvojphtjayjoxbc.supabase.co/storage/v1/object/public/assets/logos/meu-logo.png'
WHERE id = 'e961576b-7131-4a36-b655-0a637cc8149a'
RETURNING id, nome_empresa, logo_url;
```

---

## PASSO 4: Teste

Execute no terminal:
```bash
bash scripts/diagnose-branding-issue.sh
```

Deve mostrar:
```json
{
  "branding": {
    "logo_url": "https://xieephvojphtjayjoxbc.supabase.co/storage/v1/object/public/assets/logos/meu-logo.png"
  }
}
```

Abra no navegador (aba anônima):
```
https://big-store-575881.myshopify.com/apps/resolution
```

**O seu logo deve aparecer no topo da página!** 🎨

---

## 🔍 Qual caminho você quer seguir?

**OPÇÃO A:** Já tenho logo no sistema (execute a query do PASSO 1)
**OPÇÃO B:** Preciso fazer upload (use /configuracoes ou Supabase Storage)

**Me diga qual opção e eu te ajudo!** 🚀
