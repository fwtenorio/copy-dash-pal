# 🚀 Deploy Guide - App Uninstall Feature

## Passo a Passo para Deploy

### 1️⃣ Aplicar Migração de Banco de Dados

```bash
# Conectar ao projeto Supabase
supabase link --project-ref [YOUR-PROJECT-REF]

# Aplicar a migração
supabase db push

# Verificar se os campos foram adicionados
supabase db diff
```

**Verificação no Dashboard:**
1. Acesse o Supabase Dashboard
2. Vá em `Database` > `Tables` > `clients`
3. Verifique se os campos existem:
   - `account_status` (text, default: 'active')
   - `deactivated_at` (timestamptz, nullable)

### 2️⃣ Deploy da Edge Function

```bash
# Deploy da função app-uninstall
supabase functions deploy app-uninstall

# Verificar se o deploy foi bem-sucedido
supabase functions list
```

**Saída esperada:**
```
┌──────────────────┬────────────┬─────────┐
│ NAME             │ VERSION    │ STATUS  │
├──────────────────┼────────────┼─────────┤
│ app-uninstall    │ v1         │ ACTIVE  │
│ ...              │ ...        │ ...     │
└──────────────────┴────────────┴─────────┘
```

### 3️⃣ Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no Supabase:

```bash
# Já devem estar configuradas, mas verificar:
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### 4️⃣ Teste Local (Opcional)

```bash
# Iniciar Supabase localmente
supabase start

# Servir a função localmente
supabase functions serve app-uninstall

# Testar com curl
curl -X POST \
  'http://localhost:54321/functions/v1/app-uninstall' \
  -H 'Authorization: Bearer [USER-JWT-TOKEN]' \
  -H 'Content-Type: application/json'
```

### 5️⃣ Deploy do Frontend

```bash
# Build do frontend
npm run build

# Deploy (Vercel/Netlify/etc)
# O deploy do frontend acontece automaticamente se você está usando CI/CD
# Caso contrário, siga o processo do seu hosting provider
```

### 6️⃣ Verificação Final

**Checklist pós-deploy:**

- [ ] Migração aplicada com sucesso
- [ ] Edge Function deployada e ativa
- [ ] Frontend atualizado com nova UI
- [ ] Testar fluxo completo em ambiente de staging:
  - [ ] Abrir página de Settings
  - [ ] Ver seção Danger Zone
  - [ ] Clicar em "Delete Account"
  - [ ] Modal abre com textos corretos
  - [ ] Cancelar funciona
  - [ ] Confirmar desinstalação funciona
  - [ ] Toast de loading aparece
  - [ ] Toast de sucesso aparece
  - [ ] Redirecionamento para Shopify ocorre

## 🧪 Teste em Produção

### Teste com Conta de Desenvolvimento

```bash
# 1. Criar uma conta de teste
# 2. Conectar a uma loja Shopify de desenvolvimento
# 3. Ir em Settings > Danger Zone
# 4. Clicar em "Delete Account"
# 5. Confirmar no modal
# 6. Verificar:
#    - Toast "Uninstalling app..."
#    - Toast de sucesso
#    - Redirecionamento para admin.shopify.com
#    - Logout automático
```

### Verificar no Banco de Dados

```sql
-- Verificar conta desativada
SELECT 
  id,
  account_status,
  deactivated_at,
  shopify_store_name,
  shopify_access_token
FROM clients
WHERE id = '[TEST-CLIENT-ID]';

-- Resultado esperado:
-- account_status: 'deactivated'
-- deactivated_at: [timestamp recente]
-- shopify_store_name: NULL
-- shopify_access_token: NULL
```

### Logs da Edge Function

```bash
# Visualizar logs em tempo real
supabase functions logs app-uninstall --follow

# Buscar erros específicos
supabase functions logs app-uninstall --filter "error"
```

## ⚠️ Troubleshooting

### Erro: "Failed to uninstall app"

**Possíveis causas:**
1. Credenciais Shopify inválidas
2. Token de acesso expirado
3. Loja não mais acessível

**Solução:**
- A Edge Function continua executando e limpa dados locais
- Verificar logs para detalhes específicos

### Erro: "User not authenticated"

**Causa:** Sessão expirada

**Solução:**
- Usuário precisa fazer login novamente
- Verificar se `supabase.auth.getSession()` retorna sessão válida

### Modal não abre

**Causa:** Estado React não atualizado

**Solução:**
```typescript
// Verificar se o estado está sendo atualizado corretamente
console.log("showDeleteAccountDialog:", showDeleteAccountDialog);
```

### Redirecionamento não funciona

**Causa:** Popup blocker do navegador

**Solução:**
- Usar `window.location.href` ao invés de `window.open` se necessário
- Testar em modo de navegação anônima

## 📊 Monitoramento

### Métricas a Acompanhar

1. **Taxa de desinstalação**
   ```sql
   SELECT COUNT(*) as total_uninstalls
   FROM clients
   WHERE account_status = 'deactivated'
   AND deactivated_at >= NOW() - INTERVAL '7 days';
   ```

2. **Tempo médio de processamento**
   - Verificar logs da Edge Function
   - Tempo entre início e conclusão

3. **Taxa de erro**
   - Verificar logs de erro no Supabase
   - Alertas para falhas de GraphQL

### Alertas Sugeridos

- Taxa de erro > 5%
- Tempo de processamento > 10s
- Mais de X desinstalações por hora

## 🔄 Rollback

Se algo der errado, você pode fazer rollback:

```bash
# Rollback da migração
supabase db reset

# Fazer rollback para versão anterior da Edge Function
supabase functions deploy app-uninstall --version [PREVIOUS-VERSION]

# Reverter deploy do frontend
# (depende do seu hosting provider)
```

## ✅ Checklist Final de Deploy

- [ ] Código revisado e testado localmente
- [ ] Migração aplicada em staging
- [ ] Edge Function testada em staging
- [ ] Frontend testado em staging
- [ ] Testes E2E passando
- [ ] Documentação atualizada
- [ ] Equipe informada sobre nova feature
- [ ] Migração aplicada em produção
- [ ] Edge Function deployada em produção
- [ ] Frontend deployado em produção
- [ ] Testes de smoke em produção
- [ ] Monitoramento ativo
- [ ] Documentação de usuário atualizada

---

**Próximos Passos:**
1. Aplicar migração
2. Deploy da Edge Function
3. Testar em staging
4. Deploy em produção
5. Monitorar por 24h

**Suporte:**
- Logs: `supabase functions logs app-uninstall`
- Dashboard: https://app.supabase.com
- Docs: ./DANGER_ZONE_IMPLEMENTATION.md
