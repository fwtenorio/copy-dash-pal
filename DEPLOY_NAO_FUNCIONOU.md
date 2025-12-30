# 🔧 Por que o Deploy Não Apareceu em `/apps/resolution`?

## ⚠️ Problema Comum: Deploy Parcial

O comando `npm run deploy:proxy` faz:
1. ✅ Build dos arquivos (`dist/proxy-index.js` e `dist/proxy-index.css`)
2. ✅ Upload para Supabase Storage
3. ❌ **NÃO faz deploy da Edge Function automaticamente**

---

## ✅ Solução: Deploy Completo

Execute **AMBOS** os comandos:

```bash
# 1. Build e Upload (já feito)
npm run deploy:proxy

# 2. Deploy da Edge Function (CRÍTICO - pode estar faltando!)
supabase functions deploy app-proxy-render --no-verify-jwt
```

---

## 🔍 Verificações Rápidas

### 1. Verificar se os arquivos foram enviados

```bash
npm run check:proxy
```

**Esperado:**
- ✅ Arquivos encontrados no Storage
- ✅ Datas de modificação **recentes** (últimos minutos)
- ✅ Tamanhos corretos

### 2. Verificar se a Edge Function foi atualizada

```bash
supabase functions list
```

**Esperado:** `app-proxy-render` deve estar listada

### 3. Verificar cache do navegador

**No navegador:**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

**Ou:**
- Abra em modo anônimo/privado
- Limpe cache manualmente via DevTools

---

## 🎯 Processo de Deploy Correto

### Opção 1: Deploy Manual (Passo a Passo)

```bash
# 1. Limpar dist (opcional, mas recomendado)
rm -rf dist

# 2. Build e Upload
npm run deploy:proxy

# 3. Verificar upload
npm run check:proxy

# 4. Deploy da Edge Function (OBRIGATÓRIO!)
supabase functions deploy app-proxy-render --no-verify-jwt

# 5. Aguardar 10-30 segundos

# 6. Limpar cache do navegador e testar
# Acesse: https://sua-loja.myshopify.com/apps/resolution
```

### Opção 2: Script Completo (Recomendado)

```bash
# Use o script que faz tudo de uma vez
./scripts/deploy-proxy-complete.sh

# Ou manualmente:
npm run deploy:proxy && supabase functions deploy app-proxy-render --no-verify-jwt
```

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Arquivos no Storage, mas Edge Function não atualizada

**Sintoma:**
- `npm run check:proxy` mostra arquivos atualizados
- Mas `/apps/resolution` ainda mostra versão antiga

**Solução:**
```bash
# Fazer deploy da função
supabase functions deploy app-proxy-render --no-verify-jwt
```

### Problema 2: Cache do Navegador

**Sintoma:**
- Arquivos atualizados no Storage
- Edge Function atualizada
- Mas navegador ainda mostra versão antiga

**Solução:**
1. Hard refresh: `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
2. Ou use modo anônimo
3. Ou limpe cache manualmente

### Problema 3: Cache do CDN do Supabase

**Sintoma:**
- Tudo atualizado, mas ainda mostra versão antiga

**Solução:**
- A Edge Function usa cache busting (`?v=timestamp`)
- Aguarde alguns minutos para o CDN atualizar
- Ou force um novo deploy da função

### Problema 4: Arquivos não foram compilados com as mudanças

**Sintoma:**
- Deploy feito, mas mudanças não aparecem

**Solução:**
```bash
# 1. Limpar dist completamente
rm -rf dist

# 2. Build novamente
npm run build:proxy

# 3. Verificar se os arquivos têm as mudanças
# (pode inspecionar o conteúdo dos arquivos)

# 4. Upload e deploy
npm run deploy:proxy
supabase functions deploy app-proxy-render --no-verify-jwt
```

---

## 📋 Checklist de Deploy

Antes de reportar problema, verifique:

- [ ] `npm run build:proxy` executou sem erros
- [ ] Arquivos existem em `dist/proxy-index.js` e `dist/proxy-index.css`
- [ ] `npm run upload:proxy` executou sem erros
- [ ] `npm run check:proxy` mostra arquivos atualizados no Storage
- [ ] **`supabase functions deploy app-proxy-render --no-verify-jwt` foi executado**
- [ ] Cache do navegador foi limpo (`Cmd+Shift+R`)
- [ ] Testou em modo anônimo/privado
- [ ] Aguardou 10-30 segundos após o deploy

---

## 🔍 Como Verificar se Funcionou

### 1. Verificar URLs dos arquivos

Abra no navegador (deve carregar sem erro 404):
```
https://xieephvojphtjayjoxbc.supabase.co/storage/v1/object/public/assets/proxy/proxy-index.js
https://xieephvojphtjayjoxbc.supabase.co/storage/v1/object/public/assets/proxy/proxy-index.css
```

### 2. Verificar console do navegador

Em `/apps/resolution`, abra DevTools (`F12`) e verifique:
- ✅ Não há erros 404
- ✅ Arquivos JS/CSS estão sendo carregados
- ✅ URLs têm `?v=timestamp` (cache busting)

### 3. Verificar logs da Edge Function

No Supabase Dashboard:
1. Vá para **Edge Functions** → **app-proxy-render**
2. Clique em **Logs**
3. Verifique se há erros ou avisos

---

## 🚀 Comando Rápido de Deploy Completo

```bash
# Tudo de uma vez (recomendado)
npm run deploy:proxy && supabase functions deploy app-proxy-render --no-verify-jwt
```

Depois:
1. Aguarde 10-30 segundos
2. Limpe cache do navegador (`Cmd+Shift+R`)
3. Teste em `/apps/resolution`

---

## 💡 Dica Importante

**O comando `npm run deploy:proxy` NÃO faz deploy da Edge Function automaticamente!**

Sempre execute também:
```bash
supabase functions deploy app-proxy-render --no-verify-jwt
```

Isso é necessário porque:
- A Edge Function serve o HTML que carrega os arquivos JS/CSS
- Se a função não for atualizada, pode estar servindo URLs antigas
- Ou pode ter cache interno da função

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique logs da Edge Function:**
   ```bash
   supabase functions logs app-proxy-render --tail
   ```

2. **Teste URLs diretamente:**
   - Abra as URLs dos arquivos no navegador
   - Verifique se carregam corretamente
   - Verifique se têm as mudanças (inspecione o código)

3. **Force rebuild completo:**
   ```bash
   rm -rf dist node_modules/.vite
   npm run build:proxy
   npm run deploy:proxy
   supabase functions deploy app-proxy-render --no-verify-jwt
   ```

4. **Verifique permissões do Storage:**
   - Supabase Dashboard → Storage → Policies
   - Bucket `assets` deve ter políticas públicas para leitura

