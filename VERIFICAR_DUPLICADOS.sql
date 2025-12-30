-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFICAR CLIENTES DUPLICADOS
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Ver TODOS os clientes com shopify_store_name = 'big-store-575881.myshopify.com'
SELECT 
  id,
  shopify_store_name,
  nome_empresa,
  brand_color,
  brand_text_color,
  logo_url,
  created_at,
  updated_at
FROM clients
WHERE shopify_store_name = 'big-store-575881.myshopify.com'
ORDER BY created_at DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
-- Se aparecer MAIS DE 1 linha, há duplicados!
-- A Edge Function está pegando o primeiro (mais antigo) com a cor azul
-- ════════════════════════════════════════════════════════════════════════════════

-- 2. Se houver duplicados, APAGUE os antigos e mantenha apenas o mais recente:
-- (NÃO EXECUTE AINDA - primeiro veja o resultado da query acima!)

-- DELETE FROM clients
-- WHERE shopify_store_name = 'big-store-575881.myshopify.com'
--   AND id != 'ID_DO_CLIENTE_MAIS_RECENTE_AQUI'
-- RETURNING id, shopify_store_name, brand_color;

-- ════════════════════════════════════════════════════════════════════════════════
-- 3. OU atualize TODOS os registros duplicados de uma vez:
-- ════════════════════════════════════════════════════════════════════════════════

-- UPDATE clients
-- SET 
--   brand_color = 'SUA_COR_NOVA_AQUI',
--   brand_text_color = '#ffffff'
-- WHERE shopify_store_name = 'big-store-575881.myshopify.com'
-- RETURNING id, shopify_store_name, brand_color, created_at;
