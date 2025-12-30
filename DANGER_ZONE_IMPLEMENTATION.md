# Danger Zone - App Uninstall Implementation

## 📋 Visão Geral

Implementação completa da funcionalidade "Danger Zone" conforme os requisitos da Shopify App Store, incluindo desinstalação do app e cancelamento automático de assinaturas.

## 🎯 Requisitos Atendidos

### 1. UI/UX (Settings Page)
- ✅ Seção "Danger Zone" com visual destacado (borda vermelha, fundo vermelho claro)
- ✅ Botão "Delete Account" com estilo Destructive/Outline alinhado à direita
- ✅ Hover states com feedback visual claro
- ✅ Separação visual para evitar cliques acidentais

### 2. Modal de Confirmação
- ✅ Título: "Deactivate and Uninstall?"
- ✅ Descrição clara das consequências
- ✅ Botão "Cancel" como foco padrão (segurança)
- ✅ Botão "Uninstall App & Delete Data" em vermelho (destrutivo)

### 3. Backend Logic
- ✅ Edge Function `/app-uninstall` criada
- ✅ Chamada à mutation `appUninstall` da Shopify GraphQL Admin API
- ✅ Limpeza automática de dados do cliente
- ✅ Desativação de todos os usuários vinculados
- ✅ Cancelamento automático de cobranças (via Shopify)

### 4. Feedback e Redirecionamento
- ✅ `toast.promise` do Sonner com estados loading/success/error
- ✅ Logout automático após desinstalação
- ✅ Redirecionamento para `https://admin.shopify.com`

## 🏗️ Arquitetura

### Frontend (`src/pages/Settings.tsx`)

```typescript
const handleDeleteAccount = async () => {
  // 1. Chama Edge Function via Supabase
  const { data, error } = await supabase.functions.invoke("app-uninstall");
  
  // 2. Logout do usuário
  await supabase.auth.signOut();
  
  // 3. Redireciona para Shopify Admin
  window.open("https://admin.shopify.com", "_top");
};
```

**Features:**
- Toast.promise para UX fluida
- Estados de loading adequados
- Tratamento robusto de erros

### Backend (`supabase/functions/app-uninstall/index.ts`)

**Fluxo:**
1. Autenticação do usuário
2. Busca credenciais Shopify do cliente
3. Chama mutation `appUninstall` via GraphQL
4. Limpa dados locais (independente do resultado Shopify)
5. Desativa usuários vinculados
6. Retorna sucesso

**GraphQL Mutation:**
```graphql
mutation {
  appUninstall {
    userErrors {
      field
      message
    }
  }
}
```

### Database (`supabase/migrations/20251217030000_add_account_deactivation_fields.sql`)

**Campos adicionados à tabela `clients`:**
- `account_status`: TEXT (active, deactivated, suspended)
- `deactivated_at`: TIMESTAMPTZ

**Índices criados:**
- `idx_clients_account_status`
- `idx_clients_deactivated_at`

## 🧪 Como Testar

### 1. Ambiente de Desenvolvimento

```bash
# 1. Aplicar migração
supabase db push

# 2. Deploy da Edge Function
supabase functions deploy app-uninstall

# 3. Testar na UI
# Navegar para Settings > General > Danger Zone
# Clicar em "Delete Account"
# Confirmar no modal
```

### 2. Verificações Esperadas

**Antes da desinstalação:**
- [ ] Cliente tem `account_status = 'active'`
- [ ] Cliente tem credenciais Shopify válidas
- [ ] Usuário está autenticado

**Durante a desinstalação:**
- [ ] Toast "Uninstalling app..." aparece
- [ ] Chamada GraphQL é feita para Shopify
- [ ] Logs no console mostram sucesso

**Depois da desinstalação:**
- [ ] Cliente tem `account_status = 'deactivated'`
- [ ] Campo `deactivated_at` tem timestamp
- [ ] Credenciais Shopify foram removidas
- [ ] Usuário foi deslogado
- [ ] Redirecionamento para Shopify Admin ocorreu

### 3. Teste Manual da Edge Function

```bash
curl -X POST \
  'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/app-uninstall' \
  -H 'Authorization: Bearer [USER-JWT-TOKEN]' \
  -H 'Content-Type: application/json'
```

## 🔒 Segurança

### Checklist de Segurança
- ✅ Autenticação obrigatória (JWT)
- ✅ Verificação de proprietário da conta
- ✅ Confirmação explícita via modal
- ✅ Botão Cancel como foco padrão
- ✅ Logs detalhados para auditoria
- ✅ Tratamento de erros sem expor dados sensíveis

### Permissões RLS
A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para:
- Buscar dados do cliente
- Atualizar status da conta
- Desativar usuários

**Importante:** O service role bypassa RLS apenas no backend, nunca exposto ao cliente.

## 📊 Monitoramento

### Logs a Verificar

**Supabase Edge Functions:**
```
=== DEBUG: Iniciando desinstalação do app ===
User ID: [uuid]
Client ID: [uuid]
Chamando appUninstall para loja: [store].myshopify.com
✅ App desinstalado com sucesso via Shopify GraphQL
✅ Dados do cliente limpos com sucesso
✅ Conta desativada com sucesso
```

**Browser Console:**
```
✅ App uninstalled successfully: { success: true, message: "..." }
```

### Métricas Importantes
- Taxa de sucesso de desinstalações
- Tempo médio de processamento
- Erros de GraphQL da Shopify
- Taxa de fallback (limpeza local quando Shopify falha)

## 🚨 Tratamento de Erros

### Cenários Cobertos

1. **Usuário não autenticado**
   - Retorna 401
   - Toast de erro no frontend

2. **Cliente sem credenciais Shopify**
   - Pula chamada GraphQL
   - Apenas limpa dados locais

3. **Falha na chamada Shopify**
   - Loga warning
   - Continua com limpeza local
   - Garante que conta seja desativada

4. **Erro ao limpar dados**
   - Retorna 500
   - Toast de erro detalhado
   - Usuário pode tentar novamente

## 🔄 Reversão (Recovery)

**Não há reversão automática** - A ação é irreversível por design (requisito Shopify).

Para reativar manualmente (apenas admin):
```sql
UPDATE clients 
SET 
  account_status = 'active',
  deactivated_at = NULL
WHERE id = '[CLIENT_ID]';

UPDATE users 
SET active = true 
WHERE client_id = '[CLIENT_ID]';
```

## 📚 Referências

- [Shopify App Uninstall GraphQL Mutation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/appUninstall)
- [Shopify App Store Requirements](https://shopify.dev/docs/apps/store/requirements)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Sonner Toast Promise](https://sonner.emilkowal.ski/toast#promise)

## 🎨 Screenshots

### Danger Zone Section
![Danger Zone](docs/images/danger-zone-section.png)

### Confirmation Modal
![Modal](docs/images/uninstall-modal.png)

### Success Toast
![Toast](docs/images/success-toast.png)

---

**Status:** ✅ Implementação Completa
**Data:** 17 de Dezembro de 2025
**Versão:** 1.0.0
