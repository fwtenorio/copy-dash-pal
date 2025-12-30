# Resolution Hub - Configuração de Branding

## Como configurar as cores e logo

1. **Acesse `/configuracoes`** (Settings)
2. Vá para a aba **"Branding"**
3. Configure:
   - **Logo**: Faça upload da logo da sua loja
   - **Accent Color**: Escolha a cor principal (botões, destaques, etc.)
   - **Text Color**: Cor do texto sobre os botões
4. Clique em **"Salvar alterações"**

## Como testar localmente

### Opção 1: Testar via `/proxy` local
1. Salve as configurações em `/configuracoes`
2. Acesse `http://localhost:5173/proxy.html`
3. Clique no botão **🔄 Refresh** ao lado do logo
4. As novas configurações serão carregadas do Supabase

**Nota**: O botão de refresh só aparece em ambiente de desenvolvimento (localhost).

### Opção 2: Testar em produção (Shopify)
Quando o Resolution Hub estiver integrado à loja Shopify via App Proxy:
- As configurações são carregadas automaticamente do banco
- Não é necessário refresh manual
- A Edge Function busca as configurações baseadas no `shop_domain`

## Campos configuráveis

| Campo | Origem (tabela `clients`) | Uso no Resolution Hub |
|-------|---------------------------|----------------------|
| **Accent Color** | `brand_color` | Cor dos botões, ícones ativos, timeline, badges |
| **Text Color** | `brand_text_color` | Cor do texto sobre botões (futuro) |
| **Logo** | `logo_url` | Logo exibido no topo |
| **Nome da Empresa** | `nome_empresa` | Usado no heading automático |

## Estrutura técnica

### Local Development
```
ResolutionHub → fetchBrandingFromSupabase() → Supabase clients table → StoreSettings
```

### Production (Shopify)
```
Shopify App Proxy → Edge Function → Supabase clients table → window.CHARGEMIND_DATA → ResolutionHub
```

## Cores aplicadas

A `brand_color` configurada no Settings é aplicada em:
- ✅ Botões primários (validar, aceitar crédito, enviar disputa)
- ✅ Step indicator (etapa ativa)
- ✅ Ícones da etapa atual
- ✅ Timeline de rastreio (ponto ativo)
- ✅ Badges de destaque ("Melhor escolha", "+10% bônus")
- ✅ Cards de sucesso e confirmação
- ✅ Checkbox de declaração
- ✅ Focus rings nos inputs

## Troubleshooting

### "Não vejo minhas alterações"
1. Certifique-se de que salvou em `/configuracoes`
2. Clique no botão de refresh (🔄) ao lado do logo
3. Verifique o console do navegador para erros
4. Confirme que está logado (as configs vêm do seu `client_id`)

### "Botão de refresh não aparece"
- O botão só aparece em `localhost` ou `127.0.0.1`
- Em produção, as configs são carregadas automaticamente

### "Erro ao buscar branding"
- Verifique se a migration `20251217120000_add_clients_branding_columns.sql` foi aplicada
- Confirme que você tem permissão de leitura na tabela `clients`
