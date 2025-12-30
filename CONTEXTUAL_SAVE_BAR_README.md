# Contextual Save Bar - Documentação

## 📋 Resumo das Alterações

Esta refatoração implementa uma **Contextual Save Bar** (Barra de Salvamento Global) na página de configurações, seguindo o padrão do Shopify/Polaris.

## ✨ Funcionalidades Implementadas

### 1. **Componente Reutilizável - ContextualSaveBar**
- **Localização**: `src/components/ContextualSaveBar.tsx`
- **Características**:
  - Barra fixa no topo da tela
  - Background escuro (`bg-zinc-900`)
  - Animação suave de entrada/saída (`slide-in`/`fade-in`)
  - Indicador visual pulsante (ponto âmbar)
  - Dois botões: "Discard" (Ghost) e "Save" (Verde)

### 2. **Integração com React Hook Form**
- Substituído múltiplos `useState` por um único `useForm`
- Interface TypeScript criada: `SettingsFormData`
- Campos gerenciados:
  - `nomeEmpresa` (Company Name)
  - `emailContato` (Contact Email)
  - `nomeCompleto` (Full Name)
  - `telefone` (Phone Number)
  - `currency` (Currency)

### 3. **Remoção de Botões Individuais**
- ❌ Removido botão "Save" da seção **Company Details**
- ❌ Removido botão "Save" da seção **Account Details**
- ✅ Botões substituídos pela **Contextual Save Bar**

### 4. **Lógica de Exibição**
- A barra aparece **SOMENTE** quando `form.formState.isDirty === true`
- Ou seja: quando o usuário altera qualquer campo
- Ao salvar ou descartar, a barra desaparece automaticamente

### 5. **Funcionalidades da Barra**

#### Botão "Save"
- Cor: Verde (`bg-green-600`)
- Ação: Chama `handleSaveSettings()`
- Salva dados no Supabase
- Reseta o estado `isDirty` após sucesso
- Mostra toast de sucesso/erro
- Loading state com spinner

#### Botão "Discard"
- Estilo: Ghost/Outline com borda branca
- Ação: Reseta o formulário para valores originais
- Mostra toast informativo
- Remove todas as alterações não salvas

## 🎨 Design da Barra

```tsx
Background: bg-zinc-900 (Preto/Cinza Escuro)
Texto: text-white (Branco)
Borda: border-zinc-800
Shadow: shadow-2xl

Estrutura:
┌─────────────────────────────────────────────────────┐
│ ● Unsaved changes    [Discard]  [Save]              │
└─────────────────────────────────────────────────────┘
```

## 📝 Uso do Componente

```tsx
<ContextualSaveBar
  isDirty={form.formState.isDirty}
  onSave={form.handleSubmit(handleSaveSettings)}
  onDiscard={handleDiscardChanges}
  isSaving={isSavingSettings}
  saveText={t("settings.save")}
  discardText={t("settings.discard")}
  unsavedText={t("settings.unsavedChanges")}
/>
```

## 🔑 Props do Componente

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|-----------|
| `isDirty` | `boolean` | Sim | - | Controla visibilidade da barra |
| `onSave` | `() => void` | Sim | - | Função executada ao clicar em "Save" |
| `onDiscard` | `() => void` | Sim | - | Função executada ao clicar em "Discard" |
| `isSaving` | `boolean` | Não | `false` | Estado de loading do botão Save |
| `saveText` | `string` | Não | `"Save"` | Texto do botão Save |
| `discardText` | `string` | Não | `"Discard"` | Texto do botão Discard |
| `unsavedText` | `string` | Não | `"Unsaved changes"` | Texto informativo |

## 🌍 Internacionalização (i18n)

Chaves de tradução adicionadas (verificar se existem em `src/i18n/locales/`):

```json
{
  "settings.save": "Save",
  "settings.discard": "Discard",
  "settings.unsavedChanges": "Unsaved changes"
}
```

**PT-BR**:
```json
{
  "settings.save": "Salvar",
  "settings.discard": "Descartar",
  "settings.unsavedChanges": "Alterações não salvas"
}
```

## 🚀 Benefícios da Refatoração

1. **UX Melhorada**: Feedback visual claro de alterações pendentes
2. **Prevenção de Perda de Dados**: Usuário não perde alterações acidentalmente
3. **Consistência**: Padrão usado por Shopify/Polaris (familiar aos usuários)
4. **Código Limpo**: React Hook Form centraliza lógica do formulário
5. **Reutilizável**: Componente pode ser usado em outras páginas
6. **Performance**: Menos re-renders com `useForm`
7. **TypeScript**: Tipagem completa dos dados do formulário

## 🧪 Testando a Funcionalidade

1. **Acesse a página Settings**
2. **Edite qualquer campo** (Company Name, Email, etc.)
3. **Observe**: A barra preta aparece no topo com animação
4. **Teste Discard**: Clique em "Discard" → alterações descartadas
5. **Teste Save**: Clique em "Save" → dados salvos no banco
6. **Observe**: Barra desaparece após salvar/descartar

## 📦 Dependências Utilizadas

- `react-hook-form` (já instalado)
- `sonner` (toasts)
- `lucide-react` (ícones)
- `tailwindcss` (estilos)

## 🔧 Arquivos Modificados

1. `src/components/ContextualSaveBar.tsx` (NOVO)
2. `src/pages/Settings.tsx` (REFATORADO)

## ⚠️ Observações Importantes

1. A barra tem `z-index: 50` para ficar acima de outros elementos
2. O formulário não é mais submetido ao clicar Enter (comportamento padrão removido)
3. Os campos de telefone mantêm lógica especial de formatação
4. A seção de Segurança (2FA, senha) não foi alterada (funcionam independentemente)
5. A seção de Team Management permanece separada do formulário principal

## 🎯 Próximos Passos (Opcional)

- [ ] Adicionar animação de "shake" se houver erro de validação
- [ ] Implementar atalho de teclado (Ctrl+S / Cmd+S) para salvar
- [ ] Adicionar contador de campos alterados ("3 fields changed")
- [ ] Permitir posicionamento da barra (topo ou rodapé) via prop
- [ ] Adicionar suporte a múltiplos formulários na mesma página
