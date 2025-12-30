# ⚡ Referência Rápida: Etapas do Proxy

**Use esta referência rápida durante edições e modificações do fluxo.**

---

## ⚠️ **IMPORTANTE: Mantenha Este Guia Atualizado**

**Sempre que você fizer alterações no fluxo do ResolutionHub, atualize este guia também!**

### 📝 Checklist Rápido (Após Modificar o Fluxo):

- [ ] Atualizar "Formas de Referenciar" se adicionar novos steps
- [ ] Atualizar "Exemplos Práticos" com novos casos
- [ ] Atualizar `GUIA_REFERENCIA_ETAPAS_PROXY.md` (guia completo)
- [ ] Verificar se os nomes descritivos ainda fazem sentido

**💡 Dica**: Este guia deve estar sempre sincronizado com o `GUIA_REFERENCIA_ETAPAS_PROXY.md`

### 🤖 Atualização Automática

**Quando você pedir para eu fazer alterações no fluxo, eu automaticamente atualizarei os guias também!**

Basta mencionar que você quer que eu atualize os guias, ou eu farei isso automaticamente quando modificar o `ResolutionHub.tsx`.

---

## 🎯 Formas de Referenciar (Escolha a melhor para sua situação)

### 1️⃣ **Por Nome Descritivo** (Melhor durante edições)
- ✅ "Tela de Validação"
- ✅ "Tela de Detalhes do Pedido"
- ✅ "Tela de Escolha do Problema"
- ✅ "Tela de Escolha da Solução"
- ✅ "Tela de Evidências"
- ✅ "Tela de Confirmação"

### 2️⃣ **Por Função de Renderização** (Mais técnico)
- ✅ "renderStep1()"
- ✅ "renderStep2()"
- ✅ "renderStep3()"
- ✅ "renderStep4()"
- ✅ "renderStep5()"
- ✅ "renderStep6()"

### 3️⃣ **Por Estado/Variável** (Preciso)
- ✅ "currentStep === 1"
- ✅ "currentStep === 2"
- ✅ "quando currentStep é 3"
- ✅ "a tela controlada por currentStep === 4"

### 4️⃣ **Por Posição Relativa** (Quando reorganizar)
- ✅ "A tela **antes** da escolha do problema"
- ✅ "A tela **depois** da validação"
- ✅ "A **primeira** tela do fluxo"
- ✅ "A **última** tela do fluxo"

### 5️⃣ **Por Handler** (Quando falar de navegação)
- ✅ "A tela após `handleValidation()`"
- ✅ "A tela após `selectRoute()`"
- ✅ "A tela após `selectDecision()`"

---

## 📝 Exemplos Práticos

### Durante Edições:
> ✅ "Preciso alterar o botão na **tela de validação**"
> 
> ✅ "Adicionei uma nova tela **entre a validação e os detalhes do pedido**"
> 
> ✅ "Vou mover a **tela de evidências** para antes da **escolha da solução**"
> 
> ✅ "A função `renderStep3()` precisa de um novo campo"

### Fluxo Estável:
> ✅ "Preciso alterar o botão no **Step 1**"
> 
> ✅ "O título do **Step 3** está errado"
> 
> ✅ "Adicionar checkbox no **Step 5**"

---

## 🆕 Para Novas Telas

Quando adicionar uma nova tela, use:
- ✅ Nome descritivo: "Tela de Verificação de Endereço"
- ✅ Nome da função: "renderVerificationStep()"
- ✅ Posição: "entre a validação e os detalhes"

---

## 🔄 Para Reorganizações

Quando reorganizar, mencione:
- ✅ O nome descritivo + posição antiga + posição nova
- ✅ Exemplo: "A tela de evidências (antes Step 5, agora Step 4)"

---

## 🔄 Histórico de Mudanças Rápido

| Data | Mudança |
|------|---------|
| - | Versão inicial - 6 steps padrão |
| Hoje | Step 6 agora usa mesmo layout do Step 2 (fonte, separadores, bordas) |

**💡 Sempre adicione mudanças aqui quando modificar o fluxo!**

---

**📖 Para mais detalhes, veja `GUIA_REFERENCIA_ETAPAS_PROXY.md`**

**🔔 Lembrete**: Sempre atualize este guia quando modificar o fluxo!

