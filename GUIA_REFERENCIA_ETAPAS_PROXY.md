# 📋 Guia de Referência: Etapas da Página `/proxy`

Este documento explica como se referir às diferentes etapas da página `/proxy` (ResolutionHub) para facilitar a comunicação durante edições.

---

## ⚠️ **IMPORTANTE: Mantenha Este Guia Atualizado**

**Sempre que você fizer alterações no fluxo do ResolutionHub, atualize este guia também!**

### 📝 Checklist de Atualização (Após Modificar o Fluxo):

- [ ] Atualizar a seção "Nomenclatura Padrão" se adicionar/remover/reorganizar steps
- [ ] Atualizar "Estrutura do Código" com novas funções ou linhas alteradas
- [ ] Atualizar "Handlers principais" se criar/modificar funções de navegação
- [ ] Atualizar "Elementos Visuais por Step" se mudar textos/títulos
- [ ] Adicionar entrada no "Histórico de Mudanças" abaixo
- [ ] Atualizar o `REFERENCIA_RAPIDA_PROXY.md` também

### 🔄 Histórico de Mudanças

| Data | Mudança | Detalhes |
|------|---------|----------|
| - | Versão inicial | 6 steps padrão (validação → detalhes → problema → solução → evidências → confirmação) |
| Hoje | Layout Step 6 atualizado | Step 6 (Tela de Confirmação) agora usa o mesmo layout, fonte, separadores e bordas do Step 2 (Tela de Detalhes do Pedido) |

**💡 Dica**: Sempre documente mudanças aqui para facilitar rastreamento futuro.

### 🤖 Atualização Automática

**Quando você pedir para eu fazer alterações no fluxo, eu automaticamente atualizarei os guias também!**

Basta mencionar que você quer que eu atualize os guias, ou eu farei isso automaticamente quando modificar o `ResolutionHub.tsx`.

---

## 🎯 Nomenclatura Padrão

A página `/proxy` possui **6 etapas principais** (Steps). Use sempre esta nomenclatura:

### **Step 1: Validação do Pedido** 
- **Nome técnico**: `renderStep1()` ou `currentStep === 1`
- **O que faz**: Tela inicial onde o cliente insere o número do pedido ou email
- **Elementos principais**:
  - Campo "Order number" 
  - Campo "Email address"
  - Botão "Locate My Order"
- **Como referenciar**: 
  - ✅ "Step 1" ou "Etapa 1"
  - ✅ "Tela de validação"
  - ✅ "Tela inicial do proxy"
  - ✅ "renderStep1"

---

### **Step 2: Detalhes do Pedido**
- **Nome técnico**: `renderStep2()` ou `currentStep === 2`
- **O que faz**: Mostra os detalhes do pedido encontrado (produtos, valor, status, data de entrega)
- **Elementos principais**:
  - Informações do pedido
  - Lista de produtos com imagens
  - Status de entrega
  - Botão "Continue" para escolher o problema
- **Como referenciar**:
  - ✅ "Step 2" ou "Etapa 2"
  - ✅ "Tela de detalhes do pedido"
  - ✅ "Tela de confirmação do pedido"
  - ✅ "renderStep2"

---

### **Step 3: Escolha do Tipo de Problema**
- **Nome técnico**: `renderStep3()` ou `currentStep === 3`
- **O que faz**: Cliente escolhe o tipo de problema que está enfrentando
- **Opções disponíveis**:
  - "Product didn't arrive" (not_received)
  - "Product has defect" (defect)
  - "I regret the purchase" (regret)
  - "I want to cancel" (cancel)
  - "I suspect fraud" (fraud)
- **Como referenciar**:
  - ✅ "Step 3" ou "Etapa 3"
  - ✅ "Tela de escolha do problema"
  - ✅ "Rapid Resolution Center"
  - ✅ "renderStep3"
  - ✅ "Tela de rotas" (route selection)

---

### **Step 4: Escolha da Solução**
- **Nome técnico**: `renderStep4()` ou `currentStep === 4`
- **O que faz**: Cliente escolhe entre Crédito (imediato) ou Reembolso
- **Elementos principais**:
  - Opção "Credit" (destaque visual)
  - Opção "Refund" 
  - Contexto baseado no tipo de problema escolhido
- **Como referenciar**:
  - ✅ "Step 4" ou "Etapa 4"
  - ✅ "Tela de escolha da solução"
  - ✅ "Tela de decisão" (decision)
  - ✅ "renderStep4"
  - ✅ "Tela Credit vs Refund"

---

### **Step 5: Coleta de Evidências**
- **Nome técnico**: `renderStep5()` ou `currentStep === 5`
- **O que faz**: Coleta informações e evidências quando o cliente escolheu "Refund"
- **Elementos principais**:
  - Campo de descrição
  - Upload de fotos
  - Checkboxes específicos por tipo de problema:
    - Para "not_received": checkedNeighbors, checkedCarrier, recognizeAddress
    - Para "defect": productOpened, productPackaging, defectType
    - Para "regret": regretReason
    - Para "fraud": familyPurchase, chargebackInitiated, chargebackProtocol
  - Botão "Submit Evidence"
- **Como referenciar**:
  - ✅ "Step 5" ou "Etapa 5"
  - ✅ "Tela de evidências"
  - ✅ "Tela de coleta de informações"
  - ✅ "renderStep5"
  - ⚠️ **Nota**: Esta etapa só aparece quando o cliente escolhe "Refund" no Step 4

---

### **Step 6: Confirmação Final**
- **Nome técnico**: `renderStep6()` ou `currentStep === 6`
- **O que faz**: Mostra o resultado final (código de crédito ou protocolo de reembolso)
- **Layout**: Usa o mesmo layout do Step 2 (order-tracking-card) com mesmas fontes, separadores e bordas
- **Variações**:
  - **Step 6A - Crédito**: Mostra código de crédito imediato (ex: CREDIT-ABC123)
  - **Step 6B - Reembolso**: Mostra protocolo de reembolso pendente
- **Elementos principais**:
  - Card com estrutura idêntica ao Step 2 (order-tracking-card)
  - Separadores horizontais (order-tracking-divider-line)
  - Código/Protocolo destacado
  - NPS Score (avaliação)
  - Feedback adicional
  - Mensagem de confirmação
- **Como referenciar**:
  - ✅ "Step 6" ou "Etapa 6"
  - ✅ "Tela de confirmação"
  - ✅ "Tela final"
  - ✅ "renderStep6"
  - ✅ "Step 6A" (crédito) ou "Step 6B" (reembolso)

---

## 🔄 Fluxo Especial: Item Not Received

Quando o cliente escolhe "Product didn't arrive" no **Step 3**, há um fluxo especial:

- **Componente**: `ItemNotReceivedFlow`
- **Como referenciar**:
  - ✅ "Fluxo Item Not Received"
  - ✅ "Fluxo especial de não recebimento"
  - ✅ "showItemNotReceivedFlow"

Este fluxo substitui temporariamente os Steps 4-5 e depois retorna ao Step 4 normal.

---

## 📝 Exemplos de Comunicação

### ✅ **Bom - Específico e Claro**
> "Preciso alterar o texto do botão no Step 1"
> 
> "A cor do título no Step 3 está errada"
> 
> "O campo de descrição no Step 5 não está validando corretamente"
> 
> "Adicionar um novo checkbox no Step 5 para o caso de 'defect'"

### ❌ **Evitar - Vago**
> "Preciso mudar a primeira tela" (qual primeira?)
> 
> "O formulário está com problema" (qual formulário?)
> 
> "A tela de escolha precisa de ajuste" (Step 3 ou Step 4?)

---

## 🗂️ Estrutura do Código

**Arquivo principal**: `src/pages/proxy/ResolutionHub.tsx`

**Funções de renderização**:
- `renderStep1()` - Linha ~1690
- `renderStep2()` - Linha ~1799
- `renderStep3()` - Linha ~2039
- `renderStep4()` - Linha ~2193
- `renderStep5()` - Linha ~2373
- `renderStep6()` - Linha ~2928

**Estado principal**:
- `currentStep` - Controla qual step está sendo exibido (1-6)

**Handlers principais**:
- `handleValidation()` - Valida pedido (Step 1 → Step 2)
- `confirmOrder()` - Confirma pedido (Step 2 → Step 3)
- `selectRoute()` - Escolhe tipo de problema (Step 3 → Step 4)
- `selectDecision()` - Escolhe solução (Step 4 → Step 5 ou Step 6)
- `handleEvidenceSubmit()` - Submete evidências (Step 5 → Step 6)

---

## 🎨 Elementos Visuais por Step

### Step 1
- Título: "Let's locate your order."
- Subtítulo: "Enter the order number or email used for purchase"
- Botão: "Locate My Order"

### Step 2
- Mostra detalhes do pedido
- Lista de produtos
- Status de entrega

### Step 3
- Título: "Rapid Resolution Center"
- Subtítulo: "Avoid waiting for support. Choose an option for immediate resolution."
- 5 cards clicáveis com ícones

### Step 4
- Título: Varia conforme o tipo de problema
- 2 opções principais: Credit (destaque) e Refund

### Step 5
- Formulário com campos dinâmicos baseados no tipo de problema
- Upload de fotos
- Botão: "Submit Evidence"

### Step 6
- Confirmação com código/protocolo
- NPS Score
- Feedback

---

## 🔧 Referenciando Etapas Durante Edições e Mudanças no Fluxo

Quando você está **editando e modificando o fluxo**, os números dos Steps podem mudar. Use estas estratégias para manter a comunicação clara:

### 📌 **Método 1: Nomenclatura por Propósito (Recomendado durante edições)**

Use nomes descritivos baseados na **função** da tela, não apenas números:

| Nome Descritivo | Função | Quando Usar |
|----------------|--------|-------------|
| **"Tela de Validação"** | Valida pedido/email | Sempre que falar da tela inicial |
| **"Tela de Detalhes do Pedido"** | Mostra informações do pedido | Quando o pedido foi encontrado |
| **"Tela de Escolha do Problema"** | Cliente escolhe tipo de problema | Rapid Resolution Center |
| **"Tela de Escolha da Solução"** | Credit vs Refund | Após escolher o problema |
| **"Tela de Evidências"** | Coleta informações/evidências | Quando precisa de dados adicionais |
| **"Tela de Confirmação"** | Mostra resultado final | Última tela do fluxo |

### 📌 **Método 2: Referência ao Código**

Use os nomes das funções de renderização:

- ✅ "renderStep1" ou "função renderStep1"
- ✅ "renderStep2" ou "função renderStep2"
- ✅ "renderStep3" ou "função renderStep3"
- etc.

**Vantagem**: Funciona mesmo se você renumerar os steps!

### 📌 **Método 3: Referência ao Estado/Variável**

Use o estado ou variável que controla a tela:

- ✅ "currentStep === 1"
- ✅ "quando currentStep é 1"
- ✅ "a tela controlada por currentStep === 1"

### 📌 **Método 4: Posição Relativa no Fluxo**

Use a posição relativa quando adicionar/remover telas:

- ✅ "A tela **antes** da escolha do problema" (mesmo que não seja mais Step 3)
- ✅ "A tela **depois** da validação" (mesmo que não seja mais Step 2)
- ✅ "A tela **entre** a escolha do problema e a coleta de evidências"
- ✅ "A **primeira** tela do fluxo"
- ✅ "A **última** tela do fluxo"

### 📌 **Método 5: Nome da Função Handler**

Use o nome da função que leva àquela tela:

- ✅ "A tela que aparece após `handleValidation()`"
- ✅ "A tela que aparece após `selectRoute()`"
- ✅ "A tela que aparece após `selectDecision()`"

---

## 🆕 Como Referenciar Novas Telas que Você Adicionar

Quando você **adicionar uma nova tela** ao fluxo:

### Opção A: Nome Descritivo
> "Adicionei uma nova tela chamada 'Tela de Verificação de Endereço' entre a validação e os detalhes do pedido"

### Opção B: Nome da Função
> "Criei uma função `renderVerificationStep()` que aparece após a validação"

### Opção C: Posição + Descrição
> "Adicionei uma tela intermediária entre Step 1 e Step 2 que verifica o endereço"

### Opção D: Nome do Estado
> "Criei um novo estado `showAddressVerification` que controla uma tela de verificação"

---

## 🔄 Como Referenciar Quando Você Reorganizar o Fluxo

Se você **mover ou reorganizar** telas:

### Antes de Reorganizar:
> "Vou mover a tela de evidências (atualmente Step 5) para aparecer antes da escolha da solução"

### Durante a Reorganização:
> "Estou editando a função `renderStep5()` que agora será chamada antes de `renderStep4()`"

### Depois de Reorganizar:
> "A tela de evidências agora é Step 4, e a escolha da solução é Step 5"

**Dica**: Sempre mencione o **nome descritivo** junto com o número atual:
> "A tela de evidências (agora Step 4, antes era Step 5) precisa de ajustes"

---

## 📋 Template para Documentar Mudanças no Fluxo

Quando você modificar o fluxo, use este template:

```markdown
## Mudança no Fluxo - [Data]

### O que mudou:
- [ ] Adicionei nova tela: [nome descritivo]
- [ ] Removi tela: [nome descritivo]
- [ ] Reorganizei: [tela X] agora vem antes/depois de [tela Y]

### Novo fluxo:
1. [Nome da tela] - `renderStepX()` ou `[nome da função]`
2. [Nome da tela] - `renderStepX()` ou `[nome da função]`
3. ...

### Handlers atualizados:
- `[nome do handler]` agora vai para `[qual tela]`
```

### 🔄 Processo de Atualização dos Guias

**Sempre que modificar o fluxo, siga estes passos:**

1. **Faça as alterações no código** (`ResolutionHub.tsx`)
2. **Atualize este guia** (`GUIA_REFERENCIA_ETAPAS_PROXY.md`):
   - Atualize a seção "Nomenclatura Padrão"
   - Atualize "Estrutura do Código" (linhas das funções)
   - Atualize "Handlers principais"
   - Atualize "Elementos Visuais por Step"
   - Adicione entrada no "Histórico de Mudanças"
3. **Atualize o guia rápido** (`REFERENCIA_RAPIDA_PROXY.md`):
   - Atualize "Formas de Referenciar" se necessário
   - Atualize "Exemplos Práticos" se necessário
   - Adicione entrada no "Histórico de Mudanças Rápido"
4. **Verifique consistência** entre os dois guias

**💡 Dica**: Se você pedir para eu fazer alterações no fluxo, eu automaticamente atualizarei os guias também!

---

## 💬 Exemplos Práticos Durante Edições

### ✅ **Bom - Específico e Funciona Mesmo com Mudanças**
> "Preciso alterar o texto do botão na **tela de validação** (renderStep1)"
> 
> "A cor do título na **tela de escolha do problema** está errada"
> 
> "Adicionei uma nova tela **entre a validação e os detalhes do pedido** que verifica o email"
> 
> "Vou mover a **tela de evidências** para aparecer antes da **escolha da solução**"
> 
> "A função `renderStep5()` agora precisa validar um campo adicional"

### ❌ **Evitar - Depende de Números que Podem Mudar**
> "Preciso mudar o Step 3" (e se você adicionar uma tela antes?)
> 
> "A última tela precisa de ajuste" (qual é a última agora?)
> 
> "A tela depois do Step 2" (e se você reorganizar?)

---

## 🎯 Estratégia Recomendada Durante Desenvolvimento

1. **Use nomes descritivos** quando estiver modificando o fluxo
2. **Mencione a função de renderização** para referência técnica precisa
3. **Documente mudanças** usando o template acima
4. **Atualize este guia** quando o fluxo estabilizar

**Exemplo de comunicação ideal durante edições:**
> "Estou editando a **tela de escolha do problema** (`renderStep3()`). Vou adicionar uma nova opção e depois criar uma **tela intermediária de confirmação** que aparece antes da **tela de escolha da solução**."

---

## 💡 Dicas Rápidas

1. **Durante edições**: Prefira nomes descritivos ou funções de renderização
2. **Fluxo estável**: Use números (Step 1, Step 2, etc.)
3. **Mencione o contexto**: Se for sobre um elemento específico, diga qual (ex: "botão do Step 1")
4. **Para fluxos especiais**: Mencione o tipo de problema (ex: "Step 5 quando for 'defect'")
5. **Para variações**: Use "Step 6A" (crédito) ou "Step 6B" (reembolso)
6. **Documente mudanças**: Atualize este guia quando modificar o fluxo

---

## 🔍 Busca Rápida no Código

Para encontrar rapidamente um Step no código:

```bash
# Buscar Step 1
grep -n "renderStep1\|currentStep === 1" src/pages/proxy/ResolutionHub.tsx

# Buscar Step 2
grep -n "renderStep2\|currentStep === 2" src/pages/proxy/ResolutionHub.tsx

# E assim por diante...
```

---

## 📋 Checklist de Atualização Rápida

Quando modificar o fluxo, atualize:

1. ✅ **Nomenclatura Padrão** - Adicione/remova/reorganize steps
2. ✅ **Estrutura do Código** - Atualize funções e linhas
3. ✅ **Handlers principais** - Documente novas funções de navegação
4. ✅ **Elementos Visuais** - Atualize textos/títulos se mudar
5. ✅ **Histórico de Mudanças** - Adicione entrada com data e detalhes
6. ✅ **REFERENCIA_RAPIDA_PROXY.md** - Mantenha sincronizado

---

**Última atualização**: Baseado na estrutura atual do `ResolutionHub.tsx`

**🔔 Lembrete**: Sempre atualize este guia quando modificar o fluxo!

