# CONTEXTO — Caldo da Fanny

> **Arquivo de estado vivo do projeto.** Leia este arquivo primeiro ao retomar o trabalho.
> Reúne: estado atual, decisões, roadmap, **processo de trabalho** e **regras**.
> **Deve ser atualizado antes do fim de cada sessão.**

- **Última atualização:** Sessão 4
- **Sessão atual:** 4
- **Status geral:** **Parte 1 no ar. Entregas C+D em `8348624`, no ar.** **Frete agora 100% no front**
  (geocode **Nominatim** no navegador + distância em **linha reta/Haversine** até a base; ORS descartado).
  **Backend limpo** (frete-ORS removido, **V8 no ar**) — só grava pedido (`doPost`) + healthcheck (`doGet`).
  A **gravação na planilha (`doPost`, Entrega E) segue DESLIGADA** (`SHEETS_URL` vazia). Testes: front 48/48.

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
- **Frete:** **100% no front** (Sessão 4), com **fallback não-bloqueante** ("a confirmar pelo WhatsApp").
  O navegador geocodifica o endereço no **Nominatim** (fetch/CORS, padrão ViaCEP) e mede a distância em
  **LINHA RETA (Haversine)** até a base — **sem ORS, sem chamada ao backend**. Régua: ≤2 grátis / >2–3 R$4 /
  >3–5 R$6 / >5 consultar. Travas: geocode vazio/erro/timeout ou >30 km → "a confirmar". (ORS descartado —
  ver §3.) `SHEETS_URL` segue vazia (gravação na planilha = Entrega E, desligada).
- **Sanitização:** fraca. Sem anti-fórmula no Sheets, sem honeypot (Entrega C).

---

## 3. Decisões tomadas

- **Segurança proporcional:** por código, não por infra prematura.
- **Planilha:** religada **somente na Entrega E**, já com a estrutura final do pedido.
- **Múltiplos caldos (tipos diferentes):** confirmado — Entrega E.
- **Endereço-base do frete:** **Rua Açucena, 175 — Parque Imperial, Barueri — CEP 06462520**
  (substitui a referência anterior, que tinha só o CEP de origem).
- **Regra de frete (Sessão 4 — por distância em LINHA RETA/Haversine):**
  - até 2 km: **grátis**
  - 2 a 3 km: **R$ 4,00**
  - 3 a 5 km: **R$ 6,00**
  - acima de 5 km: **consultar disponibilidade pelo WhatsApp** antes de finalizar
  - *(fronteira sempre na faixa mais barata. A régua rodoviária antiga ≤3/≤4/≤5/≤6 e a classificação por bairros ficam **DESCARTADAS**.)*
- **Geocode/distância (Sessão 4 — pivô D-front):** o cálculo de frete saiu do backend e foi **100% para o
  navegador** — **Nominatim** geocodifica (fetch/CORS) e a distância é **linha reta (Haversine)**. **ORS
  DESCARTADO** (geocode caía em centroide de cidade — `fallback`/`locality`) e Nominatim no backend deu
  **HTTP 429** (IP do Google bloqueado, igual ViaCEP). As decisões de ORS abaixo (arquitetura ORS, JSONP,
  geocode por endereço, `BASE_LONLAT` no backend) ficam **SUPERADAS** — mantidas só como histórico.
- **Arquitetura do cálculo de distância (Entrega D):** API **OpenRouteService** (plano gratuito).
  A **chave NÃO fica no front-end.** Fluxo: navegador → **backend (Apps Script)** → OpenRouteService
  → devolve a distância. A chave fica guardada no backend, invisível no código público.
- **Ordem C antes de D:** a Entrega C (segurança proporcional do backend) vem **antes** da D (frete),
  pois compartilham o backend; a C prepara o terreno (validação no backend e chamada externa segura).
- **Remoção do campo "Área de entrega" (Entrega D — FEITO):** o seletor manual `bairro`
  (Parque Imperial / Região / Outro) foi **removido**; o **CEP** é a única fonte da área.
  Mexeu em: HTML, `validate()`, `focusFirstInvalid()`, mensagem do WhatsApp e testes.
- **Abordagem km-digitado / frete linear (R$1/km): DESCARTADA antes de implementar.** Numa sessão
  de planejamento avulsa cogitou-se um campo de km digitado pelo cliente e frete linear; foi
  rejeitada (não confiável) em favor da **distância automática (ORS) + tabela em degraus**.
- **Leitura da distância no front via JSONP:** `doGet?cep=...&logradouro=...&bairro=...&localidade=...&uf=...&callback=...`
  no backend; a chave ORS fica em **Script Properties** (CORS impede `fetch` legível cross-origin do Apps Script).
- **Geocodificação por ENDEREÇO (Parte 3 — pivô):** o CEP puro na ORS retorna 0 resultados; e a opção
  "backend chama o ViaCEP" foi **inviabilizada** (o ViaCEP **bloqueia os IPs do Google/Apps Script** —
  exceção de transporte "Endereço não disponível"). Solução: o **front** (que acessa o ViaCEP do
  navegador) **envia os 4 campos do endereço** ao backend, que geocodifica na ORS. Reusa `montarEndereco_`
  (pura, testada). Backend: `enderecoDoCep_` removida; `geocodeCep_` → `geocodeEndereco_`; temporárias
  `_autorizar`/`_diag` removidas.
- **`BASE_LONLAT` corrigido:** de `[-46.8470, -23.5180]` (aproximado, ~6 km fora) para
  `[-46.806196, -23.477291]` (R. Açucena, 175 — geocodificado e confirmado no mapa). `ORS_KEY` em
  Script Properties (confirmada); permissão `script.external_request` concedida no Apps Script.
- **Honeypot (Entrega C): só no backend.** Não entra em `validate()` nem é `required`; o backend
  ignora o pedido (finge sucesso) quando o campo isca vem preenchido.
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
| **C** | Segurança proporcional (anti-fórmula Sheets, validação/sanitização backend, limite de tamanho, honeypot) | ✅ **Commitada (`8348624`) e publicada** (origin/main; deploy automático no Netlify) — 43/43 testes puros |
| **D** | Frete **por distância em km** (Sessão 4: ≤2 grátis / >2–3 R$4 / >3–5 R$6 / >5 consultar — **linha reta/Haversine**); **campo "Área de entrega" removido**; visual (card translúcido, logo, fundo→asset) | ✅ **Commitada (`8348624`) e publicada**. **Sessão 4 — frete 100% no front (D-front):** geocode **Nominatim** no navegador + Haversine; **ORS descartado**; backend limpo (V8). Front **48/48**. *(A planilha — `doPost`/`SHEETS_URL` — segue na Entrega E.)* |
| **E** | Múltiplos caldos (tipos diferentes) + preço por caldo + total; religar a planilha (incl. colunas para **número** e **complemento**) | Não iniciada |

---

## 5. Pendências (o que falta / depende de decisão)

**A lista única de pendências vive em [`docs/backlog.md`](backlog.md).** Itens abertos: **P2/P3**
(frete invisível + tela "Revisar Pedido"), **P4/P8** (múltiplos caldos + Entrega E: religar a planilha
`SHEETS_URL`/`doPost`, cabeçalho de 16 colunas A1:P1, decidir colunas `numero`/`complemento`), **P5/P6**
(ícone batata no Caldo de Mandioca; selo "ENTREGA GRÁTIS" estourado), **P7** (`inputmode="numeric"` no
campo Número). *(P1 — frete — ✅ resolvido na Sessão 4.)*

- **`ORS_KEY` (Script Properties):** **obsoleta** desde a Sessão 4 (o frete saiu do backend). Limpeza
  **opcional** — remover quando quiser; não afeta o código.

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

**Entregas C e D commitadas (`8348624`) e publicadas (origin/main; deploy automático no Netlify):**
- **C (segurança):** validação/sanitização no backend, anti-fórmula (apóstrofo; plano B
  `setNumberFormat("@")` documentado), limite de tamanho, honeypot (só no backend). Testes
  puros em `tests/backend-tests.mjs` (43/43).
- **D (frete + visual):** campo "Área de entrega" removido; frete em degraus por distância (ORS
  via JSONP), resumo Subtotal/Frete/Total, mensagem do WhatsApp atualizada, **fallback
  não-bloqueante**; visual (card translúcido, logo reenquadrada, fundo extraído para
  `frontend/assets/bg-cozinha.jpg`, HTML de ~300 KB → ~28 KB). Front 42/42.
- **Ativação real do frete:** feita na Sessão 3 (redeploy V5 + `FRETE_URL` no front; smoke `{"ok":true,"km":10}`).

**Frete reescrito (Parte 3 — commitada em `de63ff0` e ativada no front nesta sessão):** a geocodificação passou
de CEP→ORS para **ENDEREÇO→ORS** (o front envia os 4 campos do ViaCEP; o backend geocodifica). Motivo:
CEP puro na ORS = 0 resultados e o ViaCEP bloqueia o IP do Apps Script. `BASE_LONLAT` corrigido; `ORS_KEY`
+ permissão externa OK. Backend 49/49 + front 42/42 (provam o wiring, não o geocode real).

**Próximo passo:** testar 1 CEP por faixa no site real (≤3/3–4/4–5/5–6/>6) + Entrega E (religar a planilha).

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
| `docs/resumo-sessao-N.md` | docs/ | Próxima sessão / histórico | **Registro arquivado** (snapshot detalhado) de cada sessão — um arquivo por sessão, versionado no git. Distinto do `contexto.md` (estado vivo conciso). | Criado ao fim de cada sessão; **permanente** (não se sobrescreve). |
| `docs/prompt.md` | docs/ | Próximo chat (Consultor) | Como o chat deve agir (prompt-mestre de negócio). | Conforme necessidade. |
| `docs/code.md` | docs/ | Claude Code | Como o Code deve e não deve agir. | Conforme necessidade. |
| `README.md` | raiz | GitHub / portfólio | Apresentação do projeto (PT + seções-chave EN). | Conforme necessidade. |
| `GUIA-INSTALACAO.md` | raiz | A dona (Fanny) | Manual de instalação/operação (leigo). | Conforme necessidade. |

## 10. Registro de sessões

### Sessão 4
- Bugs reportados em produção (teste real): frete errado fora do Parque Imperial, frete invisível antes de finalizar, falta de tela de revisão, múltiplos caldos não somam, ícone batata no mandioca, selo "ENTREGA GRÁTIS" estourado. Criado `docs/backlog.md` (P1–P8) como lista única de pendências.
- **P1 (frete) diagnosticado e resolvido.** Causa: geocode do ORS caía em centroide de Osasco (`fallback`/`locality`); structured misto; texto casou Porto Velho/RO. Nominatim acertou as ruas.
- Nominatim no backend (Apps Script) testado: **HTTP 429** (IP do Google bloqueado, igual ViaCEP). Inviável no servidor.
- **Decisão: D-front** — geocode Nominatim no navegador (fetch/CORS) + distância em linha reta (Haversine). Sem ORS.
- Frete reescrito no front (`index.html`): nova `BASE_LONLAT [lat,lon]` aprox. do CEP; `haversineKm`; `calcFrete` nova régua (≤2 grátis/>2–3 R$4/>3–5 R$6/>5 consultar); 2 travas (vazio/erro/timeout e >30 km → "a confirmar"); `FRETE_URL` removida.
- Testes (`harness.html` + `run-tests.mjs`) sincronizados e reescritos (T8 nova tabela; T10 Haversine; T11 trava >30 km; T12 geocode vazio): **48/48**.
- Backend limpo (V8): removidos frete-ORS (`geocodeEndereco_`/`distanciaKmDaBase_`/`montarEndereco_`/`orsKey_`/`BASE_LONLAT`) + diagnóstico temporário; `doGet` virou healthcheck; `doPost`/segurança/planilha intactos. `_testNominatim` apagado do editor. `ORS_KEY` obsoleta.
- P2–P8 seguem abertos no backlog para as próximas sessões.

### Sessão 3
- Sessão iniciada com a Parte 3 já commitada no backend (`de63ff0`).
- Docs/governança: seção de execução do `prompt.md` reescrita como **regra absoluta** + fronteira chat/Code; criada a skill cross-projeto `agent-execution-boundary` (commit `988d08d`).
- Backend reimplantado **Versão 5**; smoke test do `/exec` retornou `{"ok":true,"km":10}` (Av. Yara, Vila Yara, Osasco → base Barueri ≈10 km) — prova o geocode real (ORS_KEY válida).
- **Frete real ativado no front:** nova const `FRETE_URL` aponta ao `/exec`; `SHEETS_URL` segue vazia → gravação na planilha (`doPost`) continua DESLIGADA (Entrega E).
- `tests/harness.html` sincronizado (`SHEETS_URL`→`FRETE_URL` no caminho do frete, valor `""` preservado); 42/42.

### Sessão 2
- Contexto sincronizado com o git (C+D já em `8348624` e no ar).
- Regra de formato de prompt do Code passou a viver na skill `code-handoff-prompt`;
  `prompt.md` guarda só um ponteiro.
- **Frete reescrito para ENDEREÇO→ORS (Parte 3, no working tree):** o front envia os 4 campos do
  ViaCEP (logradouro/bairro/localidade/uf) ao backend, que geocodifica o endereço na ORS. Motivo:
  CEP puro na ORS = 0 resultados; e o backend não alcança o ViaCEP (bloqueio de IP do Google/Apps
  Script). Backend 49/49 + front 42/42. **Ativação pendente:** redeploy V5 + `SHEETS_URL` + smoke por curl.
- **`BASE_LONLAT` geocodificado** `[-46.806196, -23.477291]` (era ~6 km fora). `ORS_KEY` em Script
  Properties confirmada; permissão `script.external_request` concedida (via `_autorizar`); diagnóstico
  por `_diag`. Temporárias `_autorizar`/`_diag` e `enderecoDoCep_` removidas; `geocodeCep_` → `geocodeEndereco_`.
- Criadas 2 skills cross-projeto: `code-handoff-prompt` e `session-summary`.
- Resumo de sessão passou a ser **ARQUIVO PERMANENTE** por sessão (`docs/resumo-sessao-N.md`).
- Nova regra no `prompt.md`: tarefas manuais executáveis por agente Claude são feitas pelo agente.

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
- **Entrega C implementada (local):** funções puras `antiFormula`/`cleanText`/`isBot`/`validateOrder`
  + portão no `doPost`; honeypot só no backend; enum estrito só de `pagamento`. 43/43 testes puros.
- **Entrega D implementada (local):** frete em degraus por distância via **ORS (JSONP)**; campo de
  área manual **removido** (CEP é a fonte); resumo Subtotal/Frete/Total + mensagem; **fallback
  não-bloqueante** (CEP inválido / ORS fora / backend off / >6 km). Front 42/42 (inclui 2/3/3,5/4,5/5,5/7 km).
- **Visual (D):** card translúcido (`backdrop-filter`), logo reenquadrada, fundo migrado de base64
  para `frontend/assets/bg-cozinha.jpg` (index.html 300 KB → 28 KB).
- **Backend (D):** planilha agora com **16 colunas (A1:P1)** — +CEP, +Distância(km), +Subtotal, +Frete;
  "Bairro" = `bairro_cep` do ViaCEP. ORS em Script Properties; `BASE_LONLAT` aproximado (ajustar).
- **Descartado antes de implementar:** km digitado pelo cliente + frete linear R$1/km (sessão de
  planejamento avulsa) — substituído por distância automática + degraus.
- **Pendente p/ Entrega E:** chave ORS + colar `SHEETS_URL` + redeploy = ativa o frete real e a planilha.
