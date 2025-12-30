#!/bin/bash

# Script para testar os headers da Edge Function do App Proxy
# Uso: ./scripts/test-proxy-headers.sh [SHOP_DOMAIN] [FUNCTION_URL]

SHOP_DOMAIN="${1:-big-store-575881.myshopify.com}"
FUNCTION_URL="${2:-https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render}"

echo "🧪 Testando headers da Edge Function do App Proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste 1: Verificar Content-Type
echo "📋 Teste 1: Verificando Content-Type (deve ser 'application/liquid')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CONTENT_TYPE=$(curl -s -I "${FUNCTION_URL}?shop=${SHOP_DOMAIN}" | grep -i "content-type" | tr -d '\r')
echo "Resultado: ${CONTENT_TYPE}"
if [[ "${CONTENT_TYPE}" == *"application/liquid"* ]]; then
  echo "✅ Content-Type correto!"
else
  echo "❌ Content-Type incorreto ou ausente!"
fi
echo ""

# Teste 2: Verificar CORS headers
echo "📋 Teste 2: Verificando headers CORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CORS_ORIGIN=$(curl -s -I "${FUNCTION_URL}?shop=${SHOP_DOMAIN}" | grep -i "access-control-allow-origin" | tr -d '\r')
CORS_METHODS=$(curl -s -I "${FUNCTION_URL}?shop=${SHOP_DOMAIN}" | grep -i "access-control-allow-methods" | tr -d '\r')
echo "Access-Control-Allow-Origin: ${CORS_ORIGIN:-❌ Ausente}"
echo "Access-Control-Allow-Methods: ${CORS_METHODS:-❌ Ausente}"
if [[ -n "${CORS_ORIGIN}" ]]; then
  echo "✅ CORS headers presentes!"
else
  echo "❌ CORS headers ausentes!"
fi
echo ""

# Teste 3: Verificar OPTIONS (preflight)
echo "📋 Teste 3: Verificando resposta OPTIONS (CORS preflight)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${FUNCTION_URL}?shop=${SHOP_DOMAIN}")
echo "Status HTTP: ${OPTIONS_STATUS}"
if [[ "${OPTIONS_STATUS}" == "204" ]]; then
  echo "✅ OPTIONS retorna 204 (correto)!"
else
  echo "❌ OPTIONS retorna ${OPTIONS_STATUS} (esperado: 204)!"
fi
echo ""

# Teste 4: Verificar se o HTML contém variáveis CSS
echo "📋 Teste 4: Verificando injeção de variáveis CSS no HTML"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HTML_BODY=$(curl -s "${FUNCTION_URL}?shop=${SHOP_DOMAIN}")
if [[ "${HTML_BODY}" == *"--primary-color:"* ]]; then
  echo "✅ Variáveis CSS encontradas no HTML!"
  echo "   Exemplo: $(echo "${HTML_BODY}" | grep -o "--primary-color:[^;]*" | head -1)"
else
  echo "❌ Variáveis CSS não encontradas no HTML!"
fi
echo ""

# Teste 5: Verificar se o HTML contém CHARGEMIND_DATA
echo "📋 Teste 5: Verificando CHARGEMIND_DATA no HTML"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "${HTML_BODY}" == *"CHARGEMIND_DATA"* ]]; then
  echo "✅ CHARGEMIND_DATA encontrado no HTML!"
  if [[ "${HTML_BODY}" == *"brand_color"* ]]; then
    echo "✅ brand_color encontrado no CHARGEMIND_DATA!"
  else
    echo "⚠️  brand_color não encontrado no CHARGEMIND_DATA"
  fi
else
  echo "❌ CHARGEMIND_DATA não encontrado no HTML!"
fi
echo ""

# Teste 6: Verificar URLs de assets (CSS e JS)
echo "📋 Teste 6: Verificando URLs de assets (CSS e JS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CSS_URL=$(echo "${HTML_BODY}" | grep -o 'href="[^"]*proxy-index\.css[^"]*"' | head -1 | sed 's/href="//;s/"//')
JS_URL=$(echo "${HTML_BODY}" | grep -o 'src="[^"]*proxy-index\.js[^"]*"' | head -1 | sed 's/src="//;s/"//')
echo "CSS URL: ${CSS_URL:-❌ Não encontrado}"
echo "JS URL: ${JS_URL:-❌ Não encontrado}"

if [[ -n "${CSS_URL}" ]]; then
  CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CSS_URL}")
  echo "   CSS Status: ${CSS_STATUS}"
  if [[ "${CSS_STATUS}" == "200" ]]; then
    echo "   ✅ CSS acessível!"
  else
    echo "   ❌ CSS não acessível (status: ${CSS_STATUS})!"
  fi
fi

if [[ -n "${JS_URL}" ]]; then
  JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${JS_URL}")
  echo "   JS Status: ${JS_STATUS}"
  if [[ "${JS_STATUS}" == "200" ]]; then
    echo "   ✅ JS acessível!"
  else
    echo "   ❌ JS não acessível (status: ${JS_STATUS})!"
  fi
fi
echo ""

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo dos testes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Function URL: ${FUNCTION_URL}"
echo "Shop Domain: ${SHOP_DOMAIN}"
echo ""
echo "Para testar manualmente com curl:"
echo "  curl -v '${FUNCTION_URL}?shop=${SHOP_DOMAIN}'"
echo ""
echo "Para testar OPTIONS (CORS preflight):"
echo "  curl -v -X OPTIONS '${FUNCTION_URL}?shop=${SHOP_DOMAIN}'"
echo ""
