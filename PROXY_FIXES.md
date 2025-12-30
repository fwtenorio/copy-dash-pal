# Correções do App Proxy - Shopify

## Problemas Identificados e Corrigidos

### ✅ 1. Headers CORS Adicionados
**Problema:** Faltavam headers CORS, o que poderia impedir o Shopify de carregar recursos.

**Correção:**
```typescript
const htmlHeaders = {
  "Content-Type": "application/liquid; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

### ✅ 2. Suporte a OPTIONS (CORS Preflight)
**Problema:** Não havia tratamento para requisições OPTIONS (preflight do CORS).

**Correção:**
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: htmlHeaders,
  });
}
```

### ✅ 3. Injeção de Variáveis CSS no `<style>`
**Problema:** As cores só eram passadas via JavaScript (`CHARGEMIND_DATA`), causando delay na aplicação.

**Correção:** Agora as cores são injetadas diretamente como variáveis CSS no `<head>`:
```html
<style>
  :root {
    --primary-color: #1B966C;
    --primary-text-color: #FFFFFF;
    --accent-color: #1B966C;
    --primary-soft: rgba(27, 150, 108, 0.08);
    --primary-border: rgba(27, 150, 108, 0.2);
    --primary-strong: rgba(27, 150, 108, 0.6);
  }
</style>
```

### ✅ 4. Content-Type Correto
**Status:** Já estava correto como `application/liquid; charset=utf-8` ✅

### ✅ 5. URLs de Assets Absolutas
**Status:** Já estavam usando URLs absolutas do CDN ✅

## Como Testar

### Opção 1: Script Automatizado
```bash
./scripts/test-proxy-headers.sh [SHOP_DOMAIN] [FUNCTION_URL]
```

Exemplo:
```bash
./scripts/test-proxy-headers.sh big-store-575881.myshopify.com
```

### Opção 2: Teste Manual com curl

#### Teste 1: Verificar Headers
```bash
curl -v "https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render?shop=big-store-575881.myshopify.com"
```

**O que verificar:**
- `Content-Type: application/liquid; charset=utf-8`
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`

#### Teste 2: Verificar CORS Preflight (OPTIONS)
```bash
curl -v -X OPTIONS "https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render?shop=big-store-575881.myshopify.com"
```

**O que verificar:**
- Status: `204 No Content`
- Headers CORS presentes

#### Teste 3: Verificar Injeção de CSS
```bash
curl -s "https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render?shop=big-store-575881.myshopify.com" | grep -A 10 "style"
```

**O que verificar:**
- Presença de `<style>` tag
- Variáveis CSS `--primary-color`, `--primary-text-color`, etc.

#### Teste 4: Verificar CHARGEMIND_DATA
```bash
curl -s "https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render?shop=big-store-575881.myshopify.com" | grep -o "CHARGEMIND_DATA.*" | head -c 200
```

**O que verificar:**
- `CHARGEMIND_DATA` presente no HTML
- `brand_color` e `brand_text_color` no objeto

## Deploy

Após as correções, faça o deploy:

```bash
supabase functions deploy app-proxy-render --no-verify-jwt
```

## Verificação no Browser

1. Acesse: `https://big-store-575881.myshopify.com/apps/resolution`
2. Abra o DevTools (F12)
3. Verifique no Console:
   - `📦 Brand Color:` deve mostrar a cor do banco
   - `📦 Brand Text Color:` deve mostrar a cor do banco
4. Verifique no Elements:
   - Procure por `<style>` tag com variáveis CSS
   - Verifique se `--primary-color` está definido

## Estrutura do HTML Retornado

```html
<!-- Variáveis CSS injetadas -->
<style>
  :root {
    --primary-color: #1B966C;
    --primary-text-color: #FFFFFF;
    ...
  }
</style>

<!-- CSS externo -->
<link rel="stylesheet" href="https://...supabase.co/.../proxy-index.css" />

<!-- Containers -->
<div id="root">...</div>
<div id="chargemind-proxy-root">...</div>

<!-- Dados globais -->
<script>
  window.CHARGEMIND_DATA = {
    shop: "...",
    branding: {
      brand_color: "#1B966C",
      brand_text_color: "#FFFFFF",
      ...
    }
  };
</script>

<!-- JavaScript -->
<script type="module" src="https://...supabase.co/.../proxy-index.js"></script>
```

## Troubleshooting

### Cores não aparecem
1. Verifique se as cores estão no banco: `SELECT brand_color, brand_text_color FROM clients WHERE shopify_store_name = '...'`
2. Verifique os logs da Edge Function no Supabase Dashboard
3. Verifique o console do navegador para erros

### CORS errors
1. Verifique se os headers CORS estão presentes na resposta
2. Teste com `curl -v` para ver todos os headers
3. Verifique se OPTIONS retorna 204

### CSS não carrega
1. Verifique se a URL do CSS é absoluta (não relativa)
2. Verifique se o arquivo existe no Supabase Storage
3. Verifique o status HTTP da requisição do CSS (deve ser 200)
