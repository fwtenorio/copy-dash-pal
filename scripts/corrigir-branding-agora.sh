#!/bin/bash

# Script de correção rápida para branding
# Execute: bash scripts/corrigir-branding-agora.sh

set -e

echo "⚡ CORREÇÃO RÁPIDA DE BRANDING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SHOP="big-store-575881.myshopify.com"

echo "🔍 Problema identificado:"
echo "   A Edge Function retorna: {\"branding\": {}}"
echo ""
echo "✅ Solução:"
echo "   Atualizar shopify_store_name no banco para: $SHOP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 INSTRUÇÕES:"
echo ""
echo "1️⃣  Abra o Supabase SQL Editor:"
echo "    🔗 https://supabase.com/dashboard/project/xieephvojphtjayjoxbc/editor"
echo ""

echo "2️⃣  Cole e execute esta query para VER os clientes:"
echo ""
echo "────────────────────────────────────────────────────────────────────────────────────"
cat << 'EOF'
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  logo_url
FROM clients
ORDER BY created_at DESC
LIMIT 5;
EOF
echo "────────────────────────────────────────────────────────────────────────────────────"
echo ""

echo "3️⃣  Copie o ID do cliente que você quer atualizar"
echo ""

echo "4️⃣  Cole e execute esta query para ATUALIZAR (substitua SEU_CLIENT_ID):"
echo ""
echo "────────────────────────────────────────────────────────────────────────────────────"
cat << 'EOF'
UPDATE clients
SET shopify_store_name = 'big-store-575881.myshopify.com'
WHERE id = 'SEU_CLIENT_ID_AQUI'
RETURNING id, shopify_store_name, nome_empresa;
EOF
echo "────────────────────────────────────────────────────────────────────────────────────"
echo ""

echo "5️⃣  Se brand_color estiver NULL, execute também (substitua SEU_CLIENT_ID):"
echo ""
echo "────────────────────────────────────────────────────────────────────────────────────"
cat << 'EOF'
UPDATE clients
SET 
  brand_color = '#1B966C',
  brand_text_color = '#FFFFFF'
WHERE id = 'SEU_CLIENT_ID_AQUI'
RETURNING id, brand_color, brand_text_color;
EOF
echo "────────────────────────────────────────────────────────────────────────────────────"
echo ""

echo "6️⃣  Teste no navegador (aba anônima):"
echo "    🔗 https://$SHOP/apps/resolution"
echo ""
echo "    Abra o Console (F12) e digite:"
echo "    console.log(window.CHARGEMIND_DATA);"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ATALHO RÁPIDO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Se você souber o ID do cliente, pode executar tudo de uma vez:"
echo ""
echo "────────────────────────────────────────────────────────────────────────────────────"
cat << 'EOF'
-- Substitua SEU_CLIENT_ID pelo ID real do cliente

UPDATE clients
SET 
  shopify_store_name = 'big-store-575881.myshopify.com',
  brand_color = '#1B966C',
  brand_text_color = '#FFFFFF'
WHERE id = 'SEU_CLIENT_ID_AQUI'
RETURNING id, shopify_store_name, brand_color, brand_text_color, logo_url;
EOF
echo "────────────────────────────────────────────────────────────────────────────────────"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Resultado esperado após a atualização:"
echo ""
echo '   {"shop":"big-store-575881.myshopify.com","branding":{"brand_color":"#1B966C","brand_text_color":"#FFFFFF","logo_url":"..."}}'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
