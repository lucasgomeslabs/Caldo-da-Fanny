# CONTEXTO — Caldo da Fanny

> **Arquivo de estado vivo do projeto.** Leia este arquivo primeiro ao retomar o trabalho.
> Reúne: estado atual, decisões, roadmap, **processo de trabalho** e **regras**.
> **Deve ser atualizado antes do fim de cada sessão.**

- **Última atualização:** Sessão 1
- **Sessão atual:** 1
- **Status geral:** Parte 1 commitada (Entrega A + documentação). Próxima: Entrega B (campos de endereço).

---

## 1. O que é o projeto

Site de pedidos do **Caldo da Fanny**, um delivery de caldos. O cliente monta o pedido
no site e finaliza pelo WhatsApp (mensagem pré-preenchida). Há um backend opcional em
Google Apps Script que grava pedidos numa planilha — hoje **desligado**.

**Stack real (confirmada por análise):**
- \`frontend/index.html\` — arquivo único: HTML + CSS (inline) + JS (inline). ~531 linhas.
  Imagem de fundo embutida em base64. Mobile-first.
- \`backend/google-apps-script.js\` — Web App que grava pedidos na planilha (\`doPost\`).
  **Desligado** hoje: a constante \`SHEETS_URL\` no front está vazia.
- \`tests/\` — suíte com \`run-tests.mjs\` (Node + jsdom) sobre \`harness.html\`, que é um
  **snapshot manual** do inline do index.html. 7 cenários / 28 verificações.
- \`Banner/\`, \`GUIA-INSTALACAO.md\`, \`.gitignore\`, \`files.zip\` (ignorado no git).

**Repositório:** GitHub \`origin\` configurado
(\`https://github.com/lucascontatoedf-lgtm/Caldo-da-Fanny.git\`), branch \`main\`.
Existe uma branch local \`backup/pre-hardening\` (não publicada, ponto de restauração).

**Publicação:** site estático no **Netlify**, conectado ao **GitHub para deploy automático**
(cada push em `main` republica o site). A **publish directory é `frontend`** (onde está o
`index.html`), configurada no `netlify.toml` na raiz, sem etapa de build (`command = ""`).
ATENÇÃO: o site no ar só reflete o que foi commitado + enviado (push); com o deploy
automático, o push em `main` já dispara a republicação.

---

## 2. Estado atual confirmado (FATOS)

- **Formulário:** existe (\`<form id="form">\`). Caldo é escolha **única** (radio), 3 opções.
- **Preço:** único e global (\`const PRICE = 24.90\`). \`data-price\` por caldo existe mas
  **não é usado** no cálculo. Não há preço por caldo de verdade.
- **Caldos:** Caldo Verde, Caldo de Mandioca, Caldo Cremoso de Frango — todos R$ 24,90.
  Hoje dá para pedir vários do MESMO tipo, mas não misturar tipos diferentes (será
  resolvido na Entrega E).
- **WhatsApp:** integração via \`wa.me\`. Número JÁ ATUALIZADO no código (Entrega A) para
  \`5511937223540\` / exibido \`(11) 93722-3540\`.
- **Máscara de telefone:** IMPLEMENTADA na Entrega A (testada no arquivo local: ok).
- **Validação:** existe por JS (\`validate()\`).
- **CEP + ViaCEP:** existe — máscara de CEP, autofill não-bloqueante. O ViaCEP retorna o
  logradouro (rua), útil para a Entrega B de campos de endereço.
- **Endereço:** hoje é um campo único de "endereço completo" (textarea). Será separado em
  rua / número / complemento-referência (Entrega B).
- **Selo "Entrega grátis / Parque Imperial":** alinhado corretamente no arquivo LOCAL.
  O desalinhamento visto era só na versão antiga publicada no Netlify; some ao republicar.
- **Frete:** **não existe** regra ainda (Entrega D).
- **Sanitização:** fraca. Sem anti-fórmula no Sheets, sem honeypot (Entrega C).

---

## 3. Decisões tomadas

- **Segurança proporcional:** por código, não por infra prematura.
- **Planilha:** religada **somente na Entrega E**, já com a estrutura final do pedido.
- **Múltiplos caldos (tipos diferentes):** confirmado — Entrega E.
- **CEP de origem das entregas:** \`06462520\`.
- **Regras de frete definidas:** Parque Imperial grátis; próximas R$ 6; médias R$ 8;
  demais R$ 1,50/km (cálculo por km **fora do MVP** — exige API de mapas; no site fica
  "a confirmar pelo WhatsApp").
- **Campos de endereço:** separar em Endereço (rua/avenida) / Número / Complemento-
  referência (ex.: "próximo ao terminal", "portão preto"). Priorizado ANTES da segurança.
- **Documentação:** consolidada em \`prompt.md\`, \`contexto.md\`, \`code.md\`, \`README.md\`.
  \`GUIA-INSTALACAO.md\` permanece separado (manual da dona). \`GUIA-PROCESSO.md\` foi
  absorvido por este arquivo (a remover na pasta).
- **"Coworker" (4º agente):** avaliado e DESCARTADO. As tarefas pretendidas (teste visual,
  julgamento de layout) não são delegáveis a uma IA de código e dependem do dono; um agente
  intermediário seria over-engineering para o tamanho do projeto. Reavaliar só se o projeto
  crescer muito.

---

## 4. Roadmap de entregas (status) — REORDENADO

| Entrega | Descrição | Status |
|---|---|---|
| **A** | WhatsApp novo + máscara de telefone | ✅ **Concluída, aprovada e commitada** (`09b75d9`) |
| **B** | Separar campos de endereço (rua / número / complemento-referência); ViaCEP preenche a rua | Próxima — não iniciada |
| **C** | Segurança proporcional (anti-fórmula Sheets, validação backend, limite de tamanho, honeypot) | Não iniciada |
| **D** | Frete (regras fixas: grátis / R$6 / R$8; demais "a confirmar") | Não iniciada — **bloqueada** pela lista de bairros/CEPs |
| **E** | Múltiplos caldos (tipos diferentes) + preço por caldo + total; religar a planilha | Não iniciada |

---

## 5. Pendências (o que falta / depende de decisão)

- **[Você]** Definir a lista de **bairros ou faixas de CEP** que contam como "região
  próxima" (R$ 6) e "região média" (R$ 8). Necessário para a Entrega D.
- **[Processo]** Fazer o push do commit `09b75d9` para o GitHub e republicar no Netlify,
  para o número novo e o selo correto irem ao ar (commit já feito localmente, falta push).
- **[Processo]** Decidir se o cálculo de frete por km entra no futuro (exigiria API de
  mapas) ou permanece "a confirmar pelo WhatsApp".
- **[Você]** Conectar o repositório no **Netlify** para deploy automático ("Add new site →
  Import from GitHub", selecionar o repo). O `netlify.toml` já define `publish = "frontend"`
  e sem build — a partir daí, todo push em `main` republica o site automaticamente.

---

## 6. Onde paramos (fim da Sessão 1)

- Projeto subiu para o GitHub (commit inicial \`d8c5516\`).
- Diagnóstico completo (somente leitura) feito pelo Code.
- **Entrega A implementada, testada (28/28 automáticos + teste manual local) e APROVADA.**
- Documentação consolidada em 4 arquivos + guia de instalação separado.
- Roadmap reordenado: endereço (B) priorizado antes da segurança (C).

- **Parte 1 commitada:** commit `09b75d9` ("Parte 1: novo WhatsApp + máscara de telefone
  e documentação do projeto"), 9 arquivos, +507/−6. SEM push ainda.

**Próximo passo recomendado:** (opcional) fazer o push para o GitHub e republicar no
Netlify para o número novo ir ao ar. Na próxima sessão, iniciar a Entrega B (separar os
campos de endereço, com o ViaCEP preenchendo a rua).

---

## 7. Processo de trabalho

### Papéis
- **Dono do projeto (você):** decisões finais, testa (inclusive o que é visual), dá feedback.
- **Consultor / Product Owner (chat):** analisa, propõe, fatia em entregas pequenas, revisa.
- **Engenheiro de Software (Claude Code):** implementa local, mostra diff, roda testes,
  prepara propostas de commit — **nunca comita sem aprovação**.

### Fluxo (sempre nesta ordem)
1. **Análise** (somente leitura) → 2. **Plano** → 3. **Aprovação do plano** →
4. **Implementação incremental** (uma entrega por vez, com diff) → 5. **Testes**
(automáticos + manual no navegador) → 6. **Proposta de commit** → 7. **Commit** (só após "ok").

> Regra de ouro: **nunca executar múltiplas mudanças grandes de uma vez.**
>
> **Regra obrigatória: ATUALIZAR O CONTEXTO ANTES DO COMMIT.** Nenhum commit ocorre sem
> que este arquivo já reflita o estado final da sessão. Ordem: (1) atualizar contexto →
> (2) revisar → (3) propor commit → (4) commitar após "ok". O contexto entra no MESMO
> commit, já atualizado — nunca depois. O hash do commit é anotado no encerramento,
> mirando a próxima sessão.

### Regras absolutas
- Nunca inventar arquivos, rotas, bibliotecas ou estrutura.
- Nunca assumir que algo existe sem verificar.
- Diferenciar **FATOS** de **SUPOSIÇÕES**.
- Menor mudança necessária; evitar over-engineering.
- Priorizar soluções simples, baratas e gratuitas.
- Considerar o estágio atual do negócio antes de soluções avançadas.
- Trabalhar só dentro da pasta do projeto; nunca tocar em outros projetos.
- **Nunca commit/push sem aprovação explícita.**

### Segurança proporcional
Proteção por **código**, não por infra prematura: validação e sanitização no front
(experiência) **e no backend** (proteção real); anti-injeção de fórmula no Sheets
(\`= + - @\`); limite de tamanho dos campos; honeypot anti-bot (alternativa barata a captcha).

---

## 8. Roadmap de escala futura (decisão consciente de NÃO construir ainda)

A infra para um eventual "boom" de vendas **não** é construída antecipadamente — seria
over-engineering para o estágio atual. Decisão deliberada, registrada:

- **Backend hoje:** Google Apps Script + planilha. Suporta com folga o volume atual.
- **Gatilhos para evoluir:** planilha lenta, limites de cota do Google, volume diário alto
  e constante, necessidade de relatórios que a planilha não dá conta.
- **Caminho de evolução (quando justificar):** migrar a gravação para backend dedicado
  (banco + API simples), mantendo o front.
- **Segurança evolutiva (quando justificar):** rate limiting e/ou captcha no backend,
  validação server-side robusta — só quando o volume/abuso justificar.

---

## 9. Documentos do repositório

Organização: a documentação de trabalho fica em `docs/`; o `README.md` fica na **raiz**
(exigência do GitHub para aparecer na página do repositório); o manual da dona
(`GUIA-INSTALACAO.md`) fica na raiz por conveniência dela.

| Arquivo | Local | Para quem | Função | Atualização |
|---|---|---|---|---|
| `docs/contexto.md` | docs/ | Próximo chat / Code | Estado vivo + processo + roadmap (este arquivo). | **Antes do fim de cada sessão.** |
| `docs/prompt.md` | docs/ | Próximo chat (Consultor) | Como o chat deve agir (prompt-mestre de negócio). | Conforme necessidade. |
| `docs/code.md` | docs/ | Claude Code | Como o Code deve e não deve agir. | Conforme necessidade. |
| `README.md` | raiz | GitHub / portfólio | Apresentação do projeto (PT + seções-chave EN). | Conforme necessidade. |
| `GUIA-INSTALACAO.md` | raiz | A dona (Fanny) | Manual de instalação/operação (leigo). | Conforme necessidade. |

## 10. Registro de sessões

### Sessão 1
- Subida do projeto ao GitHub (commit \`d8c5516\`).
- Análise somente leitura completa do projeto.
- Definição e reordenação do roadmap (A, B-endereço, C-segurança, D-frete, E-caldos).
- Decisões: número novo de WhatsApp, CEP de origem, regras de frete, religar planilha
  na Entrega E, múltiplos caldos confirmados, campos de endereço priorizados, "coworker"
  descartado.
- **Entrega A implementada, testada e aprovada.**
- Consolidação da documentação: processo e roadmap absorvidos por este \`contexto.md\`;
  manual de instalação mantido separado.
