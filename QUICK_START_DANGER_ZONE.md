# ⚡ Quick Start - Danger Zone

## 🚀 3 Comandos para Deploy

```bash
# 1. Aplicar migração
supabase db push

# 2. Deploy da Edge Function
supabase functions deploy app-uninstall

# 3. Verificar
supabase functions list
```

**Pronto!** A funcionalidade está deployada. 🎉

---

## 📍 Onde Testar

**URL:** `/settings`

1. Abrir página Settings
2. Aba "General"  
3. Rolar até "Danger Zone" (seção com borda vermelha)
4. Clicar em "Delete Account"

---

## 🎨 Visual Preview

### Danger Zone Section
```
╔═════════════════════════════════════════════════════╗
║ 🔴 Deactivate Account                               ║
║                                                     ║
║ Once you delete your account, there is no going    ║
║ back. Please be certain.                           ║
║                                          [Delete]  ║ ← Botão vermelho
╚═════════════════════════════════════════════════════╝
```

### Modal
```
╔═══════════════════════════════════════════════╗
║ Deactivate and Uninstall?                    ║
║                                               ║
║ This will cancel your subscription           ║
║ immediately, remove your account data, and    ║
║ uninstall the app from your store. This      ║
║ action cannot be undone.                     ║
║                                               ║
║         [Cancel]  [Uninstall App & Delete]   ║
╚═══════════════════════════════════════════════╝
```

---

## ✅ O que Acontece?

```
Click → Modal → Confirm → Uninstalling... → Success! → Logout → Shopify ✓
```

**Detalhes:**
1. 📞 Chama Shopify GraphQL API
2. 🗑️ Remove credenciais Shopify
3. 🔒 Desativa conta
4. 👥 Desativa todos os usuários
5. 🚪 Faz logout
6. 🔄 Redireciona para `admin.shopify.com`

---

## 🔧 Troubleshooting Rápido

### Erro: "Failed to uninstall app"
```bash
# Ver logs
supabase functions logs app-uninstall --follow
```

### Modal não abre
```typescript
// Adicionar console.log no Settings.tsx
console.log("showDeleteAccountDialog:", showDeleteAccountDialog);
```

### Verificar no banco
```sql
SELECT account_status, deactivated_at 
FROM clients 
WHERE id = 'seu-client-id';
```

---

## 📚 Docs Completas

| Doc | Quando Usar |
|-----|-------------|
| `README_DANGER_ZONE.md` | Visão geral completa |
| `DANGER_ZONE_IMPLEMENTATION.md` | Detalhes técnicos |
| `DEPLOY_APP_UNINSTALL.md` | Guia de deployment |
| `CHANGELOG_DANGER_ZONE.md` | Histórico de mudanças |

---

## 🎯 Arquivos Criados/Modificados

### ✨ Criados
- `supabase/functions/app-uninstall/index.ts`
- `supabase/migrations/20251217030000_*.sql`

### 🔧 Modificados
- `src/pages/Settings.tsx`

---

## 🚨 Importante

⚠️ **Ação irreversível:** Não há undo automático  
✅ **Dados preservados:** Apenas desativados, não deletados  
🔐 **Seguro:** Confirmação obrigatória via modal  

---

**Pronto para começar?** Execute os 3 comandos acima! 🚀
