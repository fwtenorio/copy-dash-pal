#!/bin/bash

# Script de diagnóstico para identificar problemas de branding no App Proxy
# Verifica banco de dados, Edge Function e cache

set -e

echo "🔍 DIAGNÓSTICO DE BRANDING - RESOLUTION HUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variáveis
SHOP_DOMAIN="${1:-big-store-575881.myshopify.com}"
EDGE_FUNCTION_URL="https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render"

echo "📋 Configurações:"
echo "   Loja Shopify: $SHOP_DOMAIN"
echo "   Edge Function: $EDGE_FUNCTION_URL"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 1: VERIFICAR BANCO DE DADOS
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PARTE 1: VERIFICANDO BANCO DE DADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verifica se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI não encontrado"
  echo "   Instale com: brew install supabase/tap/supabase"
  echo ""
  echo "📋 VERIFICAÇÃO MANUAL:"
  echo "   1. Acesse: https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/editor"
  echo "   2. Execute a query:"
  echo ""
  echo "      SELECT id, shopify_store_name, brand_color, brand_text_color, logo_url, nome_empresa"
  echo "      FROM clients"
  echo "      WHERE shopify_store_name ILIKE '%${SHOP_DOMAIN}%'"
  echo "         OR shopify_store_name ILIKE '%big-store%';"
  echo ""
else
  echo "✅ Supabase CLI encontrado"
  echo ""
  
  # Verifica se está logado
  if ! supabase status &> /dev/null; then
    echo "⚠️  Não conectado ao projeto Supabase"
    echo "   Execute: supabase link --project-ref xieephvojphtjayjoxbc"
    echo ""
  fi
  
  echo "📋 Executando query no banco..."
  echo ""
  
  # Query SQL para verificar dados
  QUERY="SELECT 
    id, 
    shopify_store_name, 
    brand_color, 
    brand_text_color, 
    logo_url, 
    nome_empresa,
    CASE 
      WHEN brand_color IS NULL THEN '❌ NULL'
      WHEN brand_color = '' THEN '❌ VAZIO'
      ELSE '✅ OK'
    END as status_brand_color,
    CASE 
      WHEN logo_url IS NULL THEN '❌ NULL'
      WHEN logo_url = '' THEN '❌ VAZIO'
      ELSE '✅ OK'
    END as status_logo
FROM clients
WHERE shopify_store_name ILIKE '%${SHOP_DOMAIN}%'
   OR shopify_store_name ILIKE '%big-store%'
   OR shopify_store_name = '${SHOP_DOMAIN}'
   OR shopify_store_name = '${SHOP_DOMAIN%.myshopify.com}'
LIMIT 5;"
  
  echo "$QUERY" | supabase db execute || echo "⚠️  Não foi possível executar a query"
  echo ""
fi

echo "🔍 PONTOS DE VERIFICAÇÃO:"
echo ""
echo "   1️⃣  O shopify_store_name corresponde a '$SHOP_DOMAIN'?"
echo "       - Pode estar como 'big-store-575881' sem '.myshopify.com'"
echo "       - Pode estar com case diferente (maiúscula/minúscula)"
echo ""
echo "   2️⃣  As colunas brand_color e logo_url têm valores?"
echo "       - Se NULL ou vazio, a Edge Function usa fallbacks"
echo "       - Verifique se salvou em /configurations"
echo ""
echo "   3️⃣  O nome_empresa está preenchido?"
echo "       - Usado para gerar o heading no Resolution Hub"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 2: TESTAR EDGE FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 PARTE 2: TESTANDO EDGE FUNCTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Fazendo requisição para Edge Function..."
echo "   URL: ${EDGE_FUNCTION_URL}?shop=${SHOP_DOMAIN}"
echo ""

# Faz requisição e salva resposta
RESPONSE=$(curl -s "${EDGE_FUNCTION_URL}?shop=${SHOP_DOMAIN}")

# Verifica se window.CHARGEMIND_DATA está presente
if echo "$RESPONSE" | grep -q "window.CHARGEMIND_DATA"; then
  echo "✅ window.CHARGEMIND_DATA encontrado no HTML"
  echo ""
  
  # Extrai o JSON do CHARGEMIND_DATA
  CHARGEMIND_JSON=$(echo "$RESPONSE" | grep -o 'window.CHARGEMIND_DATA = .*' | sed 's/window.CHARGEMIND_DATA = //' | sed 's/;$//')
  
  echo "📦 Dados injetados:"
  echo "$CHARGEMIND_JSON" | jq '.' 2>/dev/null || echo "$CHARGEMIND_JSON"
  echo ""
  
  # Verifica campos específicos
  if echo "$CHARGEMIND_JSON" | grep -q '"brand_color"'; then
    BRAND_COLOR=$(echo "$CHARGEMIND_JSON" | jq -r '.branding.brand_color' 2>/dev/null || echo "N/A")
    echo "   🎨 brand_color: $BRAND_COLOR"
  else
    echo "   ❌ brand_color NÃO encontrado no branding"
  fi
  
  if echo "$CHARGEMIND_JSON" | grep -q '"logo_url"'; then
    LOGO_URL=$(echo "$CHARGEMIND_JSON" | jq -r '.branding.logo_url' 2>/dev/null || echo "N/A")
    echo "   🖼️  logo_url: $LOGO_URL"
  else
    echo "   ❌ logo_url NÃO encontrado no branding"
  fi
  
  echo ""
else
  echo "❌ window.CHARGEMIND_DATA NÃO encontrado no HTML"
  echo ""
  echo "📋 Primeiras linhas da resposta:"
  echo "$RESPONSE" | head -20
  echo ""
fi

# Verifica Cache-Control
CACHE_HEADER=$(curl -sI "${EDGE_FUNCTION_URL}?shop=${SHOP_DOMAIN}" | grep -i "cache-control" || echo "Não encontrado")
echo "🔧 Header Cache-Control: $CACHE_HEADER"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 3: VERIFICAR ASSETS DO CDN
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 PARTE 3: VERIFICANDO ASSETS DO CDN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CDN_BASE="https://xieephvojphtjayjoxbc.supabase.co/storage/v1/object/public/assets/proxy"
JS_URL="${CDN_BASE}/proxy-index.js"
CSS_URL="${CDN_BASE}/proxy-index.css"

echo "📋 Verificando disponibilidade dos assets..."
echo ""

# Verifica JS
JS_STATUS=$(curl -sI "$JS_URL" | grep -i "HTTP" | head -1 || echo "Erro")
echo "   JavaScript: $JS_URL"
echo "   Status: $JS_STATUS"

JS_CACHE=$(curl -sI "$JS_URL" | grep -i "cache-control" || echo "   Cache-Control: Não encontrado")
echo "   $JS_CACHE"

# Verifica tamanho do JS
JS_SIZE=$(curl -sI "$JS_URL" | grep -i "content-length" | awk '{print $2}' | tr -d '\r' || echo "0")
if [ "$JS_SIZE" != "0" ]; then
  JS_SIZE_KB=$((JS_SIZE / 1024))
  echo "   Tamanho: ${JS_SIZE_KB}KB"
else
  echo "   ⚠️  Tamanho não detectado"
fi
echo ""

# Verifica CSS
CSS_STATUS=$(curl -sI "$CSS_URL" | grep -i "HTTP" | head -1 || echo "Erro")
echo "   CSS: $CSS_URL"
echo "   Status: $CSS_STATUS"

CSS_CACHE=$(curl -sI "$CSS_URL" | grep -i "cache-control" || echo "   Cache-Control: Não encontrado")
echo "   $CSS_CACHE"

# Verifica tamanho do CSS
CSS_SIZE=$(curl -sI "$CSS_URL" | grep -i "content-length" | awk '{print $2}' | tr -d '\r' || echo "0")
if [ "$CSS_SIZE" != "0" ]; then
  CSS_SIZE_KB=$((CSS_SIZE / 1024))
  echo "   Tamanho: ${CSS_SIZE_KB}KB"
else
  echo "   ⚠️  Tamanho não detectado"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 4: DIAGNÓSTICO E SOLUÇÕES
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 DIAGNÓSTICO E SOLUÇÕES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 PROBLEMAS COMUNS E SOLUÇÕES:"
echo ""

echo "1️⃣  Se o shopify_store_name não corresponde:"
echo "   - Atualize no banco: UPDATE clients SET shopify_store_name = '$SHOP_DOMAIN' WHERE id = ..."
echo "   - Ou verifique qual nome a Shopify está enviando nos logs da Edge Function"
echo ""

echo "2️⃣  Se brand_color ou logo_url estão NULL/vazios:"
echo "   - Acesse /configurations e salve novamente"
echo "   - Verifique se a migration 20251217120000_add_clients_branding_columns.sql foi executada"
echo ""

echo "3️⃣  Se window.CHARGEMIND_DATA tem os dados mas a página não reflete:"
echo "   - Cache do navegador: Abra em aba anônima ou limpe cache (Cmd+Shift+R)"
echo "   - Cache da Shopify: Pode levar até 5-10 minutos para invalidar"
echo "   - Cache do CDN: Execute: npm run deploy:proxy para forçar atualização"
echo ""

echo "4️⃣  Se assets não estão acessíveis (404):"
echo "   - Execute: npm run deploy:proxy"
echo "   - Verifique permissões do bucket 'assets' no Supabase"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Analise os resultados acima"
echo "   2. Aplique a solução correspondente"
echo "   3. Teste novamente em: https://${SHOP_DOMAIN}/apps/resolution"
echo "   4. Se o problema persistir, verifique os logs da Edge Function:"
echo "      https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/functions/app-proxy-render/logs"
echo ""
