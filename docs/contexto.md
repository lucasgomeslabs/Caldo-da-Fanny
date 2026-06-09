# CONTEXTO — Caldo da Fanny

> **Arquivo de estado vivo do projeto.** Leia este arquivo primeiro ao retomar o trabalho.
> Reúne: estado atual, decisões, roadmap, **processo de trabalho** e **regras**.
> **Deve ser atualizado antes do fim de cada sessão.**

- **Última atualização:** Sessão 1
- **Sessão atual:** 1
- **Status geral:** **Parte 1 no ar.** **Entrega B concluída e commitada** (`27c2caa`, 29/29).
  Próxima: **Entrega C** (segurança do backend), depois **D** (frete por km via OpenRouteService).

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

**Publicação:** site estático no **Netlify**, **já conectado** ao **GitHub com deploy
automático ativo** — no ar em **https://caldodafanny.netlify.app**. Cada push em `main`
republica o site sozinho. A **publish directory é `frontend`** (onde está o `index.html`),
configurada no `netlify.toml` na raiz, sem etapa de build (`command = ""`). Acesso do
Netlify ao GitHub restrito **apenas ao repositório `Caldo-da-Fanny`** (menor privilégio).
Sites de teste antigos (`cdf-teste1`, `radiant-salmiakki-989226`) foram **deletados**;
resta só o `caldodafanny`.

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
- **Endereço:** **separado (Entrega B)** em rua (`endereco`, preenchido pelo ViaCEP), número
  (`numero`, obrigatório) e complemento/referência (`complemento`, opcional). Mensagem do
  WhatsApp: "Endereço: <rua>, <número>" + linha "Complemento" quando preenchido.
- **Número (11) 93722-3540 e selo "Parque Imperial e Região":** confirmados **corretos no ar**
  (republicação feita; o desalinhamento antigo era da versão anterior do Netlify).
- **Frete:** regra **definida** (por distância em km — ver §3), ainda **não implementada** (Entrega D).
- **Sanitização:** fraca. Sem anti-fórmula no Sheets, sem honeypot (Entrega C).

---

## 3. Decisões tomadas

- **Segurança proporcional:** por código, não por infra prematura.
- **Planilha:** religada **somente na Entrega E**, já com a estrutura final do pedido.
- **Múltiplos caldos (tipos diferentes):** confirmado — Entrega E.
- **Endereço-base do frete:** **Rua Açucena, 175 — Parque Imperial, Barueri — CEP 06462520**
  (substitui a referência anterior, que tinha só o CEP de origem).
- **Regra de frete (NOVA — por distância real em km):**
  - até 3 km: **grátis**
  - 3 a 4 km: **R$ 4,00**
  - 4 a 5 km: **R$ 6,00**
  - 5 a 6 km: **R$ 8,00**
  - acima de 6 km: **consultar disponibilidade pelo WhatsApp** antes de finalizar
  - *(a classificação antiga por bairros — próximas R$ 6 / médias R$ 8 — fica **DESCARTADA**.)*
- **Arquitetura do cálculo de distância (Entrega D):** API **OpenRouteService** (plano gratuito).
  A **chave NÃO fica no front-end.** Fluxo: navegador → **backend (Apps Script)** → OpenRouteService
  → devolve a distância. A chave fica guardada no backend, invisível no código público.
- **Ordem C antes de D:** a Entrega C (segurança proporcional do backend) vem **antes** da D (frete),
  pois compartilham o backend; a C prepara o terreno (validação no backend e chamada externa segura).
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
| **B** | Separar campos de endereço (rua / número / complemento-referência); ViaCEP preenche a rua; + scroll/foco ao 1º campo inválido | ✅ **Concluída e commitada** (`27c2caa`, 29/29) |
| **C** | Segurança proporcional (anti-fórmula Sheets, validação backend, limite de tamanho, honeypot) | Não iniciada |
| **D** | Frete **por distância em km** (≤3 grátis / 3–4 R$4 / 4–5 R$6 / 5–6 R$8 / >6 consultar no WhatsApp); distância via **OpenRouteService** chamada pelo backend (chave protegida) | Não iniciada — **depende da Entrega C** (mesmo backend) |
| **E** | Múltiplos caldos (tipos diferentes) + preço por caldo + total; religar a planilha (incl. colunas para **número** e **complemento**) | Não iniciada |

---

## 5. Pendências (o que falta / depende de decisão)

- **[Você]** Criar conta gratuita na **OpenRouteService** e gerar a **chave de API** (ficará
  guardada no backend, nunca no front) — necessária para a Entrega D (frete por km).
- **[Entrega E]** Ao religar a planilha, **incluir colunas para `numero` e `complemento`**.
  Hoje (Entrega B) eles já vão no objeto `data` do front, mas o backend só grava `endereco`.

> ✅ **Resolvido nesta sessão:** push da Parte 1 + Netlify conectado ao GitHub com deploy
> automático (site no ar em caldodafanny.netlify.app).

### Melhorias de UX pendentes (antes do término do projeto)

- **Campo Número — teclado numérico no mobile:** adicionar `inputmode="numeric"` (igual ao
  campo CEP) para abrir só números no celular. Ressalva: o campo Número **não tem máscara de
  propósito** (aceita "123A", "s/n"); o teclado numérico deve ser apenas o padrão, **sem impedir
  esses casos** (o cliente pode alternar de teclado se precisar de letra). Melhoria de UX.

---

## 6. Onde paramos (Parte 1 concluída e NO AR)

- Projeto subiu para o GitHub (commit inicial \`d8c5516\`).
- Diagnóstico completo (somente leitura) feito pelo Code.
- **Entrega A implementada, testada (28/28 automáticos + teste manual local) e APROVADA.**
- Documentação consolidada em 4 arquivos + guia de instalação separado.
- Roadmap reordenado: endereço (B) priorizado antes da segurança (C).

- **Parte 1 commitada:** commit `09b75d9` ("Parte 1: novo WhatsApp + máscara de telefone
  e documentação do projeto"), 9 arquivos, +507/−6. já publicada em origin/main (push concluído).

**Parte 1 publicada e no ar:** deploy automático no Netlify (publish=frontend, sem build),
site em caldodafanny.netlify.app; número novo e selo confirmados corretos. Commits em
origin/main: 09b75d9 (Entrega A + docs), 4a65e0e (docs/processo), d772b51 (netlify.toml).

**Entrega B concluída e commitada** (`27c2caa`, 29/29 testes): endereço separado em rua /
número / complemento (ViaCEP preenche a rua) + scroll/foco ao 1º campo inválido.

**Entrega C — em ANÁLISE (plano apresentado, NÃO implementada).** Escopo: anti-fórmula no
Sheets, validação/sanitização no backend, limite de tamanho e honeypot. Pendem 3 decisões suas:
(a) enums estritos de caldo/pagamento/bairro ou só tipo/tamanho; (b) anti-fórmula por apóstrofo
com plano B `setNumberFormat("@")`; (c) testes via `tests/backend-tests.mjs` (snapshot das
funções puras). **Nenhum código tocado na C ainda.**

**Também decidido nesta sessão (só documentado):** frete por distância em km + endereço-base
(Rua Açucena, 175), arquitetura da Entrega D com OpenRouteService (chave no backend) e a visão
futura de identificação de cliente + fidelidade (§8b, fora do roadmap atual).

**Próximo passo:** sua aprovação do plano da **Entrega C** para implementar (backend + honeypot
no front + testes); depois a **D** (frete por km; ordem C→D porque compartilham o backend).

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

## 8b. Visão futura / pós-MVP

Ideias deliberadamente **fora** do roadmap atual (C, D, E). Registradas para reavaliar quando o volume justificar.

- **Identificação de cliente + programa de fidelidade** (FUTURO, pós-MVP, quando houver volume).
  Ideia: o cliente se identifica pelo WhatsApp; o sistema reconhece e puxa nome, último endereço
  e pontos. Programa de pontos simples (ex.: cada R$1 = 1 ponto; cartão fidelidade digital,
  +1 por pedido, 10 pedidos = brinde/desconto).
  **Alertas registrados:**
  - Muda a arquitetura atual (hoje o site **NÃO** armazena dados de cliente; exigiria uma base
    de dados de clientes).
  - LGPD passa de aviso a **obrigação concreta** (armazenar telefone/endereço/histórico = ser
    controlador de dados, com consentimento, finalidade, segurança e direito de exclusão).
  - "Puxar dados só pelo telefone digitado" **vaza dado pessoal** (qualquer um veria o endereço
    de outro); o modelo seguro exige confirmação por código no WhatsApp (login real), bem mais
    complexo que o esboço "sem senha".
  - Provável **gatilho para evoluir o backend** além da planilha (ver §8, escala futura).
  - **Decisão:** NÃO entra no roadmap atual (C, D, E). Reavaliar como projeto próprio quando o
    volume justificar.

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
- **Parte 1 publicada no ar:** push de 09b75d9, 4a65e0e, d772b51 para origin/main.
- **Netlify conectado ao GitHub** com deploy automático (publish=frontend, sem build); acesso
  restrito ao repo Caldo-da-Fanny (menor privilégio). Site: caldodafanny.netlify.app.
- Sites de teste antigos do Netlify (cdf-teste1, radiant-salmiakki-989226) deletados.
- Número novo (11) 93722-3540 e selo "Parque Imperial e Região" confirmados corretos no ar.
- **Entrega B implementada e testada (29/29):** endereço separado em rua (`endereco`, via
  ViaCEP) / número (`numero`, obrigatório) / complemento (`complemento`, opcional); mensagem
  do WhatsApp ajustada. Backend não tocado — colunas de número/complemento ficam para a Entrega E.
- **Correção incorporada à Entrega B:** no teste manual em **mobile** percebeu-se que, ao falhar
  a validação, a tela **não rolava** até o campo inválido — a pessoa ficava parada no botão sem
  entender por que o pedido não enviava. Adicionado `focusFirstInvalid()`: ao falhar, rola suave
  e foca o 1º campo inválido (ordem de documento; cobre campos de texto e grupos de rádio).
  Sem libs, sem innerHTML. Testes seguem 29/29 (stub de `scrollIntoView` no harness).
- **Entrega B commitada e publicada:** commit `27c2caa` → push para origin/main (deploy automático).
- **Frete redefinido (decisão/doc):** por distância real em km (≤3 grátis / 3–4 R$4 / 4–5 R$6 /
  5–6 R$8 / >6 consultar no WhatsApp); regra antiga por bairros descartada. Endereço-base:
  Rua Açucena, 175 — Parque Imperial, Barueri (CEP 06462520).
- **Arquitetura da Entrega D decidida:** distância via OpenRouteService (grátis); chave guardada
  no backend (Apps Script), nunca no front. Ordem definida: C (segurança) antes de D.
- **Entrega C analisada (plano apresentado, NÃO implementada):** anti-fórmula Sheets, validação/
  sanitização e limite de tamanho no backend, honeypot. 3 decisões pendentes (enums, apóstrofo +
  plano B, testes por snapshot). Aguardando aprovação.
- **Visão futura registrada (§8b):** identificação de cliente + fidelidade — fora do roadmap atual
  (alertas de arquitetura e LGPD anotados).
