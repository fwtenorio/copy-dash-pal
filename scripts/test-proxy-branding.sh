#!/bin/bash

# Script para testar e diagnosticar o branding do App Proxy
# Uso: ./scripts/test-proxy-branding.sh [SHOP_DOMAIN] [FUNCTION_URL]

SHOP_DOMAIN="${1:-big-store-575881.myshopify.com}"
FUNCTION_URL="${2:-https://xieephvojphtjayjoxbc.supabase.co/functions/v1/app-proxy-render}"

echo "🧪 Testando Branding do App Proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste 1: Verificar se o HTML contém variáveis CSS
echo "📋 Teste 1: Verificando injeção de variáveis CSS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HTML_BODY=$(curl -s "${FUNCTION_URL}?shop=${SHOP_DOMAIN}")
if [[ "${HTML_BODY}" == *"--primary-color:"* ]]; then
  echo "✅ Variáveis CSS encontradas no HTML!"
  echo "   Cores encontradas:"
  echo "${HTML_BODY}" | grep -o "--primary-color:[^;]*" | head -1
  echo "${HTML_BODY}" | grep -o "--text-color:[^;]*" | head -1
else
  echo "❌ Variáveis CSS não encontradas no HTML!"
fi
echo ""

# Teste 2: Verificar CHARGEMIND_DATA
echo "📋 Teste 2: Verificando CHARGEMIND_DATA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CHARGEMIND_DATA=$(echo "${HTML_BODY}" | grep -o 'CHARGEMIND_DATA = {[^}]*}' | head -1)
if [[ -n "${CHARGEMIND_DATA}" ]]; then
  echo "✅ CHARGEMIND_DATA encontrado!"
  echo "   Conteúdo: ${CHARGEMIND_DATA}"
  
  # Verificar se branding está vazio
  if [[ "${CHARGEMIND_DATA}" == *'"branding":{}'* ]]; then
    echo "   ⚠️  PROBLEMA: branding está vazio {}"
    echo "   Isso significa que a função fetchBranding() retornou um objeto vazio"
    echo "   Verifique os logs da Edge Function no Supabase Dashboard"
  else
    echo "   ✅ Branding contém dados!"
    if [[ "${CHARGEMIND_DATA}" == *"brand_color"* ]]; then
      echo "   ✅ brand_color encontrado!"
    else
      echo "   ⚠️  brand_color não encontrado"
    fi
    if [[ "${CHARGEMIND_DATA}" == *"brand_text_color"* ]]; then
      echo "   ✅ brand_text_color encontrado!"
    else
      echo "   ⚠️  brand_text_color não encontrado"
    fi
  fi
else
  echo "❌ CHARGEMIND_DATA não encontrado no HTML!"
fi
echo ""

# Teste 3: Extrair e mostrar o objeto branding completo
echo "📋 Teste 3: Extraindo objeto branding completo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BRANDING_JSON=$(echo "${HTML_BODY}" | grep -o '"branding":{[^}]*}' | head -1)
if [[ -n "${BRANDING_JSON}" ]]; then
  echo "Branding JSON: ${BRANDING_JSON}"
  if [[ "${BRANDING_JSON}" == '"branding":{}' ]]; then
    echo ""
    echo "❌ PROBLEMA IDENTIFICADO: branding está vazio!"
    echo ""
    echo "Possíveis causas:"
    echo "1. Cliente não encontrado na tabela clients com shopify_store_name = '${SHOP_DOMAIN}'"
    echo "2. Cliente encontrado mas sem dados de branding (brand_color, brand_text_color, logo_url são null)"
    echo "3. Erro na query do banco de dados"
    echo ""
    echo "Para diagnosticar:"
    echo "1. Acesse: https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/functions"
    echo "2. Vá em: Edge Functions → app-proxy-render → Logs"
    echo "3. Procure por logs que começam com:"
    echo "   - 🔍 PASSO 1:"
    echo "   - 🔍 PASSO 2:"
    echo "   - 🔍 PASSO 3:"
    echo "   - 📦 BRANDING FINAL ANTES DE ENVIAR HTML:"
    echo ""
    echo "Ou execute esta query no Supabase SQL Editor:"
    echo "SELECT id, shopify_store_name, brand_color, brand_text_color, logo_url"
    echo "FROM clients"
    echo "WHERE shopify_store_name LIKE '%${SHOP_DOMAIN}%';"
  else
    echo "✅ Branding contém dados!"
  fi
else
  echo "❌ Não foi possível extrair o objeto branding"
fi
echo ""

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Function URL: ${FUNCTION_URL}"
echo "Shop Domain: ${SHOP_DOMAIN}"
echo ""
echo "Próximos passos:"
echo "1. Verifique os logs da Edge Function no Supabase Dashboard"
echo "2. Execute a query SQL acima para verificar os dados no banco"
echo "3. Se os dados existem no banco mas não aparecem, verifique os logs detalhados"
echo ""
