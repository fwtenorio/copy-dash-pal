-- Script para verificar e corrigir shopify_store_name na tabela clients
-- Execute este script no Supabase Dashboard > SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 1: VERIFICAR DADOS ATUAIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Mostra todos os clientes com seus dados de branding
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  brand_text_color,
  logo_url,
  CASE 
    WHEN shopify_store_name IS NULL THEN '❌ NULL'
    WHEN shopify_store_name = '' THEN '❌ VAZIO'
    WHEN shopify_store_name LIKE '%.myshopify.com' THEN '✅ OK (com domínio)'
    ELSE '⚠️ Sem domínio .myshopify.com'
  END as status_shop_name,
  CASE 
    WHEN brand_color IS NULL THEN '❌ NULL'
    WHEN brand_color = '' THEN '❌ VAZIO'
    ELSE '✅ ' || brand_color
  END as status_brand_color,
  CASE 
    WHEN logo_url IS NULL THEN '❌ NULL'
    WHEN logo_url = '' THEN '❌ VAZIO'
    ELSE '✅ OK'
  END as status_logo
FROM clients
ORDER BY created_at DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 2: IDENTIFICAR O CLIENTE CORRETO
-- ═══════════════════════════════════════════════════════════════════════════════

-- Busca por variações do nome da loja
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  logo_url
FROM clients
WHERE 
  shopify_store_name ILIKE '%big-store%'
  OR shopify_store_name ILIKE '%575881%'
  OR nome_empresa ILIKE '%big%store%'
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 3: ATUALIZAR shopify_store_name (COMENTADO - DESCOMENTE PARA EXECUTAR)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ATENÇÃO: Substitua CLIENT_ID_AQUI pelo ID do cliente encontrado acima

-- Exemplo: Se o cliente tem shopify_store_name = 'big-store-575881' (sem domínio)
-- Descomente e execute:

-- UPDATE clients
-- SET shopify_store_name = 'big-store-575881.myshopify.com'
-- WHERE id = 'CLIENT_ID_AQUI'
-- RETURNING id, shopify_store_name, nome_empresa;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 4: VERIFICAR SE AS COLUNAS DE BRANDING EXISTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verifica se as colunas brand_color, brand_text_color, logo_url existem
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('brand_color', 'brand_text_color', 'logo_url', 'support_url', 'refund_policy_url')
ORDER BY column_name;

-- Se as colunas não existirem, execute a migration:
-- No terminal: cd /Users/jonathanoliveira/charge-mind
-- supabase migration up --local (para testar local)
-- ou execute manualmente o arquivo: supabase/migrations/20251217120000_add_clients_branding_columns.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 5: ATUALIZAR BRANDING (OPCIONAL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Se você quiser atualizar manualmente os dados de branding para teste:

-- UPDATE clients
-- SET 
--   brand_color = '#1B966C',
--   brand_text_color = '#FFFFFF',
--   logo_url = 'https://via.placeholder.com/150x50?text=Sua+Loja',
--   support_url = 'https://example.com/support',
--   refund_policy_url = 'https://example.com/refund'
-- WHERE id = 'CLIENT_ID_AQUI'
-- RETURNING id, shopify_store_name, brand_color, logo_url;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 6: VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

-- Após atualizar, verifique se os dados estão corretos:
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  brand_text_color,
  logo_url,
  support_url,
  refund_policy_url
FROM clients
WHERE shopify_store_name = 'big-store-575881.myshopify.com'
LIMIT 1;
