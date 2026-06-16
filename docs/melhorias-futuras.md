# Melhorias futuras — Caldo da Fanny

> Ideias **pós-MVP**, deliberadamente **fora do roadmap atual** (A–E, concluído). Nada aqui está
> implementado — é registro para não se perder e reavaliar quando o volume/necessidade justificar.
> Cada item traz uma nota honesta de **esforço/complexidade** (FATO), para decidir com base real.
> Princípio que guia a priorização: **menos processos, mais produtividade.**
>
> Ideias de **escala de infraestrutura** e **fidelidade/identificação de cliente** já vivem no
> `contexto.md` (§8 e §8b) — não duplicadas aqui.

---

## 1. Funcionalidades de valor (produtividade)

As de maior retorno pelo princípio "menos processos, mais produtividade".

### 1.1 Disponibilidade do dia / produtos esgotados
A dona marca, num lugar simples (uma config), o que está no ar hoje — "fechado hoje", "Caldo Verde
esgotado" — e o site reflete na hora. Mata o vai-e-volta no WhatsApp ("ah, acabou") e o pedido que
morre por falta de produto.
- **Esforço:** médio — o site precisa **ler** uma config (ex.: uma célula de planilha publicada, ou
  o próprio Apps Script). **Valor:** alto (operacional).

### 1.2 Autofill do cliente recorrente (no navegador)
Lembrar nome/telefone/endereço do último pedido **daquele aparelho** e pré-preencher no próximo.
Cliente que volta digita quase nada → mais conversão.
- **Esforço:** baixo, **sem servidor**. O site **já usa `localStorage`** (para o número do pedido),
  então é o mesmo mecanismo.
- **LGPD:** o dado fica **só no navegador do cliente**, nunca no sistema da Fanny → **sem** obrigação
  de controlador de dados. Encaixa perfeito no princípio.

### 1.3 Fotos + descrições reais dos caldos
Preencher o "Descrição em breve" (placeholder atual) + uma foto por caldo. **Foto de comida
converte.**
- **Esforço:** baixo e único. O layout **já reserva o espaço** da descrição.

### 1.4 Horário de funcionamento automático
Fora do horário, o site mostra "fechado, abrimos às Xh" e (opcional) pausa o pedido. Menos pedido
fora de hora para a dona administrar.
- **Esforço:** baixo. **Valor:** operacional. *(Pareia bem com a 1.1 — pode ser a mesma config.)*

### 1.5 PWA — "adicionar à tela inicial"
O site vira **ícone no celular** do cliente (presença app-like, retenção), sem virar app de loja.
- **Esforço:** baixo (manifest + service worker básico).

---

## 2. Dashboard de vendas na planilha

**Objetivo:** transformar a planilha de pedidos em **inteligência de negócio** — resumo **diário,
semanal e mensal**, e ranking de produtos (qual caldo saiu mais, o preferido, ticket médio).

**FATO — fácil vs difícil (pela estrutura atual):**
A coluna **"Itens"** guarda o pedido como **texto legível** (ex.: `2x Caldo Cremoso de Frango (Grande);
1x Caldo Verde (Pequeno)`) — ótimo para a dona ler, mas **ruim para somar por caldo** (consequência da
decisão D1: 1 linha por pedido, itens concatenados). Então:

- **Métricas FÁCEIS (nativas do Sheets, sem código):** total por **dia/semana/mês**, nº de pedidos,
  **ticket médio**, total de frete, formas de pagamento — via **tabela dinâmica / `QUERY` / `SUMIFS`**
  sobre `Total`, `Horário`, `Pagamento` (colunas que já existem). Uma aba **"Dashboard"** com esses
  números + gráficos já entrega a maior parte do valor.
- **Métricas DIFÍCEIS — "qual caldo saiu mais / preferido":** exigem **somar quantidade por tipo**, e
  o texto concatenado da coluna "Itens" **não soma com fórmula simples**. Opções:
  - **(a) Parsing:** Apps Script (ou aba auxiliar com fórmulas) lê a coluna "Itens" e gera contagens
    por caldo numa aba oculta → o dashboard soma daí.
  - **(b) Logar item estruturado:** o backend gravar **também** os itens de forma estruturada (aba
    "Itens" com 1 linha por caldo) — facilita o ranking, mas muda o modelo de dados.
  - *(A opção "1 linha por item" foi descartada na D1 por piorar o fulfillment; para analytics ela
    ajudaria — é o trade-off entre **ler o pedido** e **analisar vendas**.)*

**Recomendação de PO:** começar pelo **dashboard nativo das métricas fáceis** (alto valor, zero
código, sobre os dados que já caem na planilha); investir no parsing/modelo estruturado para o
ranking de caldos só quando isso virar prioridade real.

---

## 3. WhatsApp Business

Dois níveis, com esforço e momento bem diferentes:

- **App WhatsApp Business (grátis) — recomendado, item operacional.** Quase tudo é mudança da
  **operação** (a Fanny instala/converte o número); o site funciona **igual** (o `wa.me` aponta pro
  mesmo número). Ganha: perfil de negócio, **catálogo**, **respostas rápidas**, **etiquetas** para
  organizar pedidos, saudação/ausência, horário. **~Zero código**, profissionalismo imediato.
- **WhatsApp Business API (Cloud API) — futuro de escala.** Versão **programável**: confirmação
  automática de pedido, chatbot, notificações em escala. Mas tem **custo por conversa**, aprovação da
  Meta e exige um **backend de verdade**. **Over-engineering para o estágio atual** (volume baixo,
  fulfillment manual). Reavaliar quando o volume justificar.

---

## 4. Ambiente visual imersivo (animações de fundo)

**Objetivo:** dar vida à cena da cozinha — sensação artesanal, aconchego e qualidade — como
**detalhe premium**, nunca protagonista. O cliente entra para comprar caldo; a animação só reforça a
sensação de cuidado e profissionalismo.

**Elemento previsto: ingredientes flutuando.** Ingredientes ligados ao produto (mandioca, cebolinha,
milho, folhas verdes, pimenta…) com movimento **leve, elegante, quase imperceptível, não repetitivo**
no fundo. Não pode parecer desenho animado, site infantil nem banner piscando.

**Regras de design (da spec original):**
- Hierarquia de atenção (nunca ultrapassar): 1º logo, 2º cardápio, 3º botões, 4º resumo do pedido,
  5º WhatsApp, 6º animações.
- Poucos elementos (5–10), **baixa opacidade**, sem concentração numa área só.
- Camada exclusiva: `position: fixed`, tela cheia, `pointer-events: none`, **abaixo** do conteúdo.
- **CSS Animations/Transforms + GPU; sem GIFs, sem vídeos pesados, sem bibliotecas.**
- Responsivo: menos elementos / menor intensidade no mobile; **desativar automaticamente** em
  dispositivos fracos.
- Performance **imperceptível** (carregamento, scroll, SEO, Core Web Vitals).
- **Funciona 100% sem as animações** (se falharem/desativarem, o site segue bonito e operacional).
- **Critério de remoção:** sai do projeto se reduzir desempenho, atrapalhar leitura ou prejudicar
  conversão/pedidos.

**Descartado (decisão consciente, NÃO implementar):**
- **Fumaça/vapor animado saindo dos caldos** — seria um overlay CSS preso às panelas, mas as panelas
  estão **desenhadas no fundo estático** (`bg-cozinha.jpg`), que **escala/corta** conforme a tela →
  alinhamento do overlay com as panelas **frágil** (mobile vs desktop), desproporcional ao ganho. (Os
  ingredientes flutuando **não** têm esse problema: flutuam livres, sem ancorar em nada do fundo.)
- **Placa "Fanny — Caldos feitos com amor" balançando** — está **embutida no fundo estático**;
  animá-la exigiria recortá-la como camada separada ou refazer o fundo sem ela — desproporcional.

---

## Como usar este documento

Estes itens **não entram** no fluxo de trabalho atual. Quando algum virar prioridade, ele sai daqui,
vira uma entrega fatiada (análise → plano → implementação incremental → testes → commit), e o
`contexto.md` passa a rastreá-lo como trabalho ativo.
