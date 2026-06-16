# Resumo da Sessão 6 — Caldo da Fanny

> Registro **arquivado** da Sessão 6 (snapshot permanente, versionado no git). Detalhe narrativo;
> o estado conciso vive no `contexto.md`. Data: 2026-06-15. Vai em **commit próprio** (os commits
> de feature P6/P7/P8 já levaram `contexto.md`/`backlog.md`; desvio consciente, igual ao resumo-5).

## 1. Status num relance
Sessão grande e de fechamento: **P6, P7 e o P8 INTEIRO** (backend reescrito + ativação no Google)
concluídos e no ar. Com o P8, a **Entrega E está 100% completa** (E1+E2 front das sessões
anteriores + backend desta) e o **roadmap A–E está fechado**. Restam só docs: **P10** (README) e
**P9** (dívida de testes). Testes: front **72/72**, backend **60/60**. **Smoke test da planilha:
PASSOU.** `HEAD` ao gerar este resumo = `6a4c7ca` (+ este commit).

## 2. O que mudou (FATOS)

### Commits (branch main — confirmados no origin/main pela skill remote-git-check)
- **`8c751fa` — P6 (selo "ENTREGA GRÁTIS" cabe no círculo):** tentou-se primeiro SÓ encurtar o
  texto ("PARQUE IMPERIAL!" → "PQ IMPERIAL"), mas no teste visual ainda transbordava — encurtar
  não bastou. Solução: texto **"PQ.IMPERIAL"** + ajuste de CSS escopado em `.freebadge small`
  (font-size 9.5→8.5px, letter-spacing .03em→0, `white-space:nowrap`); círculo 108px e rodapé
  "PARQUE IMPERIAL E REGIÃO" intocados. harness não cobre o selo → nada a sincronizar.
- **`1a2803b` — P7 (teclado numérico no campo Número):** `inputmode="numeric"` no
  `<input name="numero">` (`type="text"` mantido, sem máscara — "123A"/"s/n" seguem válidos).
  Decidiu-se **NÃO replicar no harness** (atributo presentacional, não-JS, não testado); a 1ª
  versão tinha mexido no harness e foi revertida; docs corrigidos para "não replicado no harness".
- **`8ea4c77` — P8 backend (`doPost` lê `data.itens`):** reescrita p/ o formato lista (ver abaixo).
- **`6a4c7ca` — P8 ativação (`SHEETS_URL`):** linha 398 do `index.html` de `""` → URL `/exec` do
  Web App (Apps Script **Versão 9**); liga a gravação no site. harness segue `""` de propósito.

### P8 — cerne descoberto no fact-finding (FATO)
O backend ainda exigia `caldo`/`qtde` escalares e ignorava `data.itens` → como estava,
**reprovaria 100% dos pedidos do front atual** (que manda lista). "Religar a planilha" NÃO era só
colar a `SHEETS_URL` — exigia **reescrever o backend**.

### Decisões de design da planilha (D1–D5, fechadas com o dono)
- **D1** — 1 linha por pedido; coluna "Itens" = `{qtd}x {tipo} ({tamanho})`, itens por "; " (mesma
  redação do WhatsApp, sem bullet).
- **D2** — Endereço gravado = rua + número; Complemento em coluna própria (antes se perdiam).
- **D3** — km/Subtotal/Frete/Total mantidos como strings vindas do front (espelho do WhatsApp).
- **D4** — gravar os DOIS ids: sequencial do backend ("Pedido", `#001`) + `pedido_id` do front
  ("Ref. cliente").
- **D5** — sem colunas cidade/uf.
- **Cabeçalho final (17 col, A1:Q1):** Pedido · Ref. cliente · Horário · Nome · Telefone ·
  Endereço · Complemento · Bairro · CEP · Distância (km) · Itens · Subtotal · Frete · Total ·
  Pagamento · Observações · Status.

### Implementação do backend (`8ea4c77`)
- `validateOrder` largou `caldo`/`qtde`; exige `itens` (array 1–30; cada item qtd 1–20,
  tipo/tamanho não-vazios) com guarda contra item nulo/malformado (`d.itens[i]||{}`, `== null`).
- Nova função pura `formatItens_` (coluna "Itens", com `cleanText` em tipo/tamanho).
- `appendRow` na nova ordem (17 col), TODO campo de texto livre via `cleanText` (anti-fórmula +
  corte por LIMITES) — segurança da Entrega C **preservada**; grava número, complemento e os 2 ids.
- `doPost` com try/catch de 2 níveis + `JSON.parse` próprio → erro vira JSON limpo, nunca 500.
- Testes migrados: `backend-tests.mjs` (helper `validOrder()` → `itens:[...]`, B6 ampliado,
  +B11 `formatItens_`) → **60/60**. `run-tests` **72/72**.
- Segurança (digits/antiFormula/cleanText/isBot/jsonOut) e healthcheck `doGet`: **intactos**.

### Ativação no Google (dona; fora do repo) + smoke test
- Backend novo colado no editor ("Scripts CDF", via planilha → Extensões → Apps Script);
  redeploy = **Versão 9** (editando a implantação existente → mesma URL `/exec`). Aba "Pedidos" já
  existia **vazia** (ideal: o código cria o cabeçalho de 17 col sozinho no 1º pedido).
- **Smoke test PASSOU:** 3 pedidos gravaram alinhados — cabeçalho 17 col; itens
  `2x … (Grande); 1x …`; endereço rua+número + complemento na coluna própria; os 2 ids
  (#001/#026, #002/#027, #003/#028). O 3º (CEP distante `06250050`) validou o **frete real**:
  **3,2 km → R$ 6,00** (régua >3–5 km); Subtotal 234 + 6 = Total 240.
- ⇒ **P8 100% → Entrega E completa → roadmap A–E fechado.**

### Não-fix decidido (FATO)
A coluna "Distância (km)" mostrou "3.163.514" para ~3,2 km — é o km cru (`String(k)`, linha 472)
lido pelo Sheets pt-BR como separador de **milhar**. O cálculo do frete está certo (usa o valor
real) e a coluna "Frete" mostra "(3,2 km)" certo (linhas 465-466 usam `toFixed(1)`). **Decisão do
dono: NÃO corrigir agora** (cosmético). Fix pronto: linha 472, `String(k)` →
`k.toFixed(1).replace('.',',')` (1 linha + mirror no harness).

### Cosméticos registrados (não-bloqueantes)
- "Descrição em breve" é placeholder embaixo de cada caldo (futuro).
- Ícone da mandioca (SVG) confirmado OK no código (arquivo existe, referência certa, SVG válido);
  o "ícone quebrado" visto numa prévia era **cache**.

## 3. Em andamento / despachado
Nenhum código em voo. **Este `resumo-sessao-6.md` vai em commit próprio**; P10/P9 entram depois,
com seus commits. Desvio consciente da regra "mesmo commit", igual ao resumo-5.

## 4. Frente paralela — Skill `remote-git-check` (FORA do repo; NÃO entra em commit do projeto)
Criada a skill cross-projeto **`remote-git-check`**: na abertura de sessão (e em "isso já subiu?"),
o próprio chat confere o **REMOTO** read-only via GitHub API/raw — sem delegar ao Code, sem pedir
git ao dono. Complementa `agent-execution-boundary` (local e escrita seguem no Code). Usada o tempo
todo nesta sessão pra confirmar cada commit no `origin/main`. Instalada em
`~/.claude/skills/remote-git-check/SKILL.md` (via prompt do Code) + zip subido no Claude.ai —
**fora do repositório, não versionada**. Nota: a API de commits do GitHub bate rate limit por IP
compartilhado (anônimo); o fallback **raw-por-sha** fecha a verificação sem precisar dos hashes.

## 5. Dúvidas / decisões em aberto
Nenhuma bloqueante. Aberto por opção do dono: o fix do km (descartado por ora) e as "Descrições em
breve" (futuro).

## 6. Como resolver na próxima sessão (ordem sugerida)
1. **P10 (README):** fact-finding read-only do `README.md` → reescrever sobre FATO (cardápio P/G,
   carrinho, tela de revisão, frete por distância em linha reta, planilha 17 col ligada, backend
   V9). Atacar primeiro.
2. **P9 (dívida de testes):** `backend-tests.mjs` ainda tem snapshots de
   `calcFrete`/`montarEndereco_`, que NÃO existem mais no backend (saíram na Sessão 4). Limpar.
   Não crítico.
3. (Opcional) fix do km (1 linha) se o dono mudar de ideia.

## 7. Pendências de documentação
- `contexto.md`/`backlog.md` já atualizados nos commits de feature (8c751fa, 1a2803b, 8ea4c77,
  6a4c7ca); este resumo + fecho do contexto entram agora.
- **README.md (P10)** segue desatualizado — próximo da fila.

## 8. Dados úteis
- **Commits da Sessão 6:** `8c751fa` (P6), `1a2803b` (P7), `8ea4c77` (P8 backend), `6a4c7ca`
  (P8 ativação). Anteriores: `db84665` (E2/S5), `505065e` (E1/S5), `8348624` (C+D).
- **Repo:** github.com/lucasgomeslabs/Caldo-da-Fanny — branch main.
- **Site:** caldodafanny.netlify.app (deploy automático no push; publish=frontend, sem build).
  Furar cache: Ctrl+Shift+R.
- **Testes:** `node tests/run-tests.mjs` → 72/72; `node tests/backend-tests.mjs` → 60/60.
- **Backend:** Apps Script "Scripts CDF", **Versão 9** (`doPost` lê `data.itens` + healthcheck
  `doGet`); `SHEETS_URL` ligada (index.html linha 398). Planilha aba "Pedidos", 17 col (A1:Q1).
- **Cardápio (preço por item):** Frango P R$12/G R$22 · Mandioca P R$14/G R$26 · Verde P R$15/G R$28.
- **Régua de frete:** ≤2 km grátis / >2–3 R$4 / >3–5 R$6 / >5 consultar; geocode falho ou >30 km →
  "a confirmar".
- **CEPs de smoke:** 06286310, 06286240, 06253000; distante (testa frete): 06250050.
- **Skill nova:** `remote-git-check` (fora do repo, em ~/.claude/skills + Claude.ai).

## 9. Estado do working tree
- `HEAD` ao gerar este resumo = **`6a4c7ca`** (P6/P7/P8 commitados e confirmados no origin/main).
- A criar/commitar agora: `docs/resumo-sessao-6.md` + fecho mínimo do `contexto.md`. Commit próprio.
- Skill `remote-git-check` (~/.claude/skills) e o zip no Claude.ai são **fora do repo** — não entram.
