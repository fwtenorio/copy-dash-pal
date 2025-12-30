# 🔧 Troubleshooting - Proxy Resolution Hub

## Problema: `/apps/resolution` não está atualizado após deploy

### ✅ Solução Rápida

1. **Fazer deploy completo novamente:**
```bash
npm run deploy:proxy && supabase functions deploy app-proxy-render --no-verify-jwt
```

2. **Limpar cache do navegador:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

3. **Verificar se os arquivos foram atualizados:**
```bash
npm run check:proxy
```

### 🔍 Diagnóstico Passo a Passo

#### 1. Verificar se os arquivos foram compilados localmente

```bash
# Verificar se os arquivos existem em dist/
ls -lh dist/proxy-index.js dist/proxy-index.css
```

**Esperado:** Arquivos devem existir e ter tamanho > 0

#### 2. Verificar se os arquivos foram enviados para o Storage

```bash
npm run check:proxy
```

**Esperado:** Deve mostrar:
- ✅ Arquivos encontrados no Storage
- ✅ Tamanhos corretos
- ✅ Datas de modificação recentes

#### 3. Verificar se a Edge Function foi atualizada

```bash
supabase functions list
```

**Esperado:** `app-proxy-render` deve estar listada

#### 4. Verificar logs da Edge Function

No Supabase Dashboard:
1. Vá para **Edge Functions** → **app-proxy-render**
2. Clique em **Logs**
3. Verifique se há erros ou avisos

#### 5. Testar diretamente as URLs dos arquivos

Após o deploy, teste as URLs diretamente no navegador:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/assets/proxy/proxy-index.js
https://[PROJECT_ID].supabase.co/storage/v1/object/public/assets/proxy/proxy-index.css
```

**Esperado:** Arquivos devem carregar sem erro 404

### 🐛 Problemas Comuns

#### Problema 1: Arquivos não foram atualizados no Storage

**Sintomas:**
- `/apps/resolution` mostra versão antiga
- `npm run check:proxy` mostra datas antigas

**Solução:**
```bash
# 1. Limpar dist
rm -rf dist

# 2. Build e upload novamente
npm run deploy:proxy

# 3. Verificar
npm run check:proxy
```

#### Problema 2: Cache do navegador

**Sintomas:**
- Arquivos no Storage estão atualizados
- Mas o navegador ainda mostra versão antiga

**Solução:**
1. Limpar cache do navegador (veja acima)
2. Ou usar modo anônimo/privado
3. Ou adicionar `?v=timestamp` manualmente na URL

#### Problema 3: Edge Function não foi atualizada

**Sintomas:**
- Arquivos no Storage estão corretos
- Mas a Edge Function ainda serve URLs antigas

**Solução:**
```bash
# Fazer deploy da função novamente
supabase functions deploy app-proxy-render --no-verify-jwt

# Verificar logs
supabase functions logs app-proxy-render
```

#### Problema 4: Cache do Supabase CDN

**Sintomas:**
- Arquivos foram atualizados
- Mas ainda servem versão antiga

**Solução:**
- A Edge Function agora usa cache busting automático (`?v=timestamp`)
- Se ainda houver problema, aguarde alguns minutos para o CDN atualizar

### 📋 Checklist de Deploy

Antes de reportar um problema, verifique:

- [ ] `npm run build:proxy` executou sem erros
- [ ] Arquivos existem em `dist/proxy-index.js` e `dist/proxy-index.css`
- [ ] `npm run upload:proxy` executou sem erros
- [ ] `npm run check:proxy` mostra arquivos atualizados no Storage
- [ ] `supabase functions deploy app-proxy-render --no-verify-jwt` executou sem erros
- [ ] Cache do navegador foi limpo
- [ ] Testou em modo anônimo/privado
- [ ] Verificou logs da Edge Function no Supabase Dashboard

### 🔄 Processo de Deploy Completo

```bash
# 1. Limpar build anterior
rm -rf dist

# 2. Build do proxy
npm run build:proxy

# 3. Verificar se os arquivos foram gerados
ls -lh dist/proxy-index.*

# 4. Upload para Storage
npm run upload:proxy

# 5. Verificar upload
npm run check:proxy

# 6. Deploy da Edge Function
supabase functions deploy app-proxy-render --no-verify-jwt

# 7. Aguardar 10-30 segundos

# 8. Testar em /apps/resolution (com cache limpo)
```

### 🆘 Se Nada Funcionar

1. **Verificar variáveis de ambiente:**
```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

2. **Verificar permissões do Storage:**
   - No Supabase Dashboard, vá para **Storage** → **Policies**
   - Verifique se o bucket `assets` tem políticas públicas para leitura

3. **Verificar logs detalhados:**
```bash
# Logs da Edge Function
supabase functions logs app-proxy-render --tail

# Ou no Dashboard do Supabase
```

4. **Testar URLs diretamente:**
   - Abra o console do navegador em `/apps/resolution`
   - Verifique se há erros 404 ou CORS
   - Verifique as URLs dos arquivos JS/CSS que estão sendo carregadas

### 📝 Notas Importantes

- **Cache Busting:** A Edge Function agora adiciona `?v=timestamp` automaticamente aos arquivos JS/CSS
- **Cache Control:** Os arquivos são enviados com `cacheControl: "no-cache, no-store, must-revalidate"`
- **Upsert:** Os arquivos são sempre sobrescritos (`upsert: true`) no upload

### 🔗 Links Úteis

- Supabase Dashboard: https://supabase.com/dashboard
- Edge Functions Logs: Dashboard → Edge Functions → app-proxy-render → Logs
- Storage Browser: Dashboard → Storage → assets → proxy

---

**Última atualização:** 20 de dezembro de 2024


