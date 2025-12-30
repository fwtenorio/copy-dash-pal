# 🔄 Fluxo de Trabalho: Editar `/proxy` e `/apps/resolution`

## 📋 Resumo Rápido

**Arquivo principal a editar:**
- `src/pages/proxy/ResolutionHub.tsx` ← **Este é o arquivo principal!**

**Arquivos relacionados:**
- `src/proxy-index.tsx` - Ponto de entrada do proxy
- `src/proxy.css` - Estilos do proxy (já isolados)

---

## 🚀 Fluxo Completo de Desenvolvimento

### 1️⃣ **Desenvolvimento Local (Hot Reload)**

#### Opção A: Via `proxy.html` (Recomendado)
```bash
# Terminal 1: Iniciar servidor de desenvolvimento
npm run dev

# No navegador, acesse:
http://localhost:8080/proxy.html
```

**Vantagens:**
- ✅ Hot reload automático (mudanças aparecem instantaneamente)
- ✅ Simula o ambiente do Shopify
- ✅ Console do navegador mostra erros em tempo real
- ✅ Não precisa fazer deploy para testar

#### Opção B: Via rota `/proxy` (se configurada)
```bash
npm run dev

# No navegador:
http://localhost:8080/proxy
```

---

### 2️⃣ **Fazer Alterações**

Edite o arquivo:
```
src/pages/proxy/ResolutionHub.tsx
```

**O que você pode editar:**
- ✅ Layout e componentes
- ✅ Lógica de negócio
- ✅ Estilos inline (já isolados com `.chargemind-resolution-hub`)
- ✅ Textos e mensagens
- ✅ Fluxo de steps (1-6)

**O que NÃO editar sem cuidado:**
- ⚠️ Estrutura do container `#chargemind-proxy-root` (usado pelo Shopify)
- ⚠️ Função `resolveSettings()` (busca branding do Shopify)
- ⚠️ CSS global (use apenas estilos escopados)

---

### 3️⃣ **Testar Localmente**

#### Teste Visual
1. Abra `http://localhost:8080/proxy.html`
2. Teste todos os steps (1-6)
3. Verifique responsividade (mobile/desktop)
4. Teste com dados mockados (pedidos #1234-#1243)

#### Teste com Dados Mockados
```bash
# No navegador, acesse:
http://localhost:8080/proxy.html?mock=true

# Teste pedidos:
# 1234, 1235, 1236, 1237, 1238, 1239, 1240, 1241, 1242, 1243
```

#### Teste com Dados Reais
```bash
# No Admin (localhost:8080/admin/settings)
# Ative "Production Mode"

# Depois acesse:
http://localhost:8080/proxy.html
# Digite um pedido real da loja
```

---

### 4️⃣ **Deploy para Produção (Shopify)**

Após testar localmente e confirmar que está tudo OK:

```bash
# 1. Build e upload para Supabase Storage
npm run deploy:proxy

# 2. Deploy da Edge Function
supabase functions deploy app-proxy-render --no-verify-jwt
```

**O que acontece:**
1. ✅ Build gera `dist/proxy-index.js` e `dist/proxy-index.css`
2. ✅ Arquivos são enviados para Supabase Storage
3. ✅ Edge Function é atualizada
4. ✅ Shopify passa a servir a nova versão

---

### 5️⃣ **Verificar em Produção**

#### Testar no Shopify
```bash
# Acesse a loja:
https://sua-loja.myshopify.com/apps/resolution

# Ou com dados mockados:
https://sua-loja.myshopify.com/apps/resolution?mock=true
```

#### Verificar se os arquivos foram atualizados
```bash
npm run check:proxy
```

**Esperado:**
- ✅ Arquivos encontrados no Storage
- ✅ Tamanhos corretos
- ✅ Datas de modificação recentes

---

## 🔄 Workflow Recomendado

### Desenvolvimento Diário

```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir no navegador
# http://localhost:8080/proxy.html

# 3. Editar ResolutionHub.tsx
# (Hot reload automático)

# 4. Testar mudanças
# (Ver no navegador imediatamente)

# 5. Quando estiver satisfeito:
npm run deploy:proxy && supabase functions deploy app-proxy-render --no-verify-jwt

# 6. Verificar em produção
# https://sua-loja.myshopify.com/apps/resolution
```

---

## 🐛 Troubleshooting

### "Mudanças não aparecem no localhost"

**Solução:**
1. Verifique se o servidor está rodando (`npm run dev`)
2. Limpe o cache do navegador (`Cmd+Shift+R` no Mac, `Ctrl+Shift+R` no Windows)
3. Verifique o console do navegador para erros

### "Mudanças não aparecem no Shopify após deploy"

**Solução:**
1. Verifique se o deploy foi concluído:
   ```bash
   npm run check:proxy
   ```

2. Limpe o cache do navegador no Shopify

3. Verifique os logs da Edge Function no Supabase Dashboard

4. Force um novo build:
   ```bash
   rm -rf dist
   npm run deploy:proxy
   supabase functions deploy app-proxy-render --no-verify-jwt
   ```

### "Erro de compilação"

**Solução:**
1. Verifique erros de TypeScript:
   ```bash
   npm run lint
   ```

2. Verifique se todas as importações estão corretas

3. Verifique se não há referências a arquivos que não existem

---

## 📝 Checklist Antes de Fazer Deploy

- [ ] Testei localmente em `http://localhost:8080/proxy.html`
- [ ] Testei todos os steps (1-6)
- [ ] Testei com dados mockados (pedidos #1234-#1243)
- [ ] Testei responsividade (mobile/desktop)
- [ ] Não há erros no console do navegador
- [ ] Não há erros de TypeScript (`npm run lint`)
- [ ] Layout está correto visualmente
- [ ] Funcionalidades estão funcionando

---

## 🎯 Comandos Rápidos

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor local

# Build e Deploy
npm run deploy:proxy           # Build + Upload para Storage
npm run build:proxy            # Apenas build (sem upload)

# Verificação
npm run check:proxy           # Verifica arquivos no Storage

# Deploy completo
npm run deploy:proxy && supabase functions deploy app-proxy-render --no-verify-jwt
```

---

## 📚 Arquivos Importantes

| Arquivo | Descrição | Quando Editar |
|---------|-----------|---------------|
| `src/pages/proxy/ResolutionHub.tsx` | **Componente principal** | ✅ Sempre que precisar mudar layout/lógica |
| `src/proxy-index.tsx` | Ponto de entrada | ⚠️ Raramente (só se precisar mudar inicialização) |
| `src/proxy.css` | Estilos do proxy | ⚠️ Raramente (já isolado) |
| `vite.config.ts` | Configuração de build | ⚠️ Só se precisar mudar build |

---

## 💡 Dicas

1. **Use Hot Reload**: Mantenha `npm run dev` rodando enquanto edita
2. **Teste Antes de Deployar**: Sempre teste localmente primeiro
3. **Verifique Console**: Sempre verifique o console do navegador para erros
4. **Commits Pequenos**: Faça commits pequenos e frequentes
5. **Documente Mudanças**: Se fizer mudanças grandes, documente no código

---

## 🆘 Precisa de Ajuda?

- **Erros de build**: Verifique `npm run lint`
- **CSS não aplicado**: Verifique se está usando `.chargemind-resolution-hub`
- **Dados não aparecem**: Verifique console e logs da Edge Function
- **Deploy não funciona**: Verifique `npm run check:proxy`

