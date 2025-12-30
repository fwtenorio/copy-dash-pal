#!/bin/bash

# Script completo de deploy do proxy
# Garante build limpo, upload e deploy da função

set -e  # Para na primeira erro

echo "🚀 Iniciando deploy completo do Resolution Hub Proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Passo 1: Limpar dist
echo "📋 Passo 1: Limpando pasta dist..."
rm -rf dist
echo "✅ Pasta dist limpa"
echo ""

# Passo 2: Build do proxy
echo "📋 Passo 2: Buildando proxy (single bundle)..."
npm run build:proxy
echo "✅ Build concluído"
echo ""

# Verificar se os arquivos foram gerados
if [ ! -f "dist/proxy-index.js" ]; then
  echo "❌ ERRO: proxy-index.js não foi gerado!"
  exit 1
fi

if [ ! -f "dist/proxy-index.css" ]; then
  echo "❌ ERRO: proxy-index.css não foi gerado!"
  exit 1
fi

echo "✅ Arquivos gerados:"
echo "   - dist/proxy-index.js ($(du -h dist/proxy-index.js | cut -f1))"
echo "   - dist/proxy-index.css ($(du -h dist/proxy-index.css | cut -f1))"
echo ""

# Passo 3: Upload para Supabase Storage
echo "📋 Passo 3: Fazendo upload para Supabase Storage..."
npm run upload:proxy
echo "✅ Upload concluído"
echo ""

# Passo 4: Deploy da Edge Function
echo "📋 Passo 4: Fazendo deploy da Edge Function..."
supabase functions deploy app-proxy-render --no-verify-jwt
echo "✅ Deploy da função concluído"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy completo finalizado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste a página: https://big-store-575881.myshopify.com/apps/resolution"
echo "   2. Verifique o console do navegador para logs"
echo "   3. Verifique os logs da Edge Function no Supabase Dashboard"
echo ""
