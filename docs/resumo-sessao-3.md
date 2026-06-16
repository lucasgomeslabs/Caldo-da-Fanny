# Resumo — Sessão 3 — Caldo da Fanny

> Registro arquivado e permanente desta sessão (versionado no git).

## Status num relance
**Frete real ativado e no ar.** O front passou a consultar a distância no backend (ORS) via `/exec`, com o backend reimplantado (Versão 5) e smoke test confirmando o geocode real. A gravação na planilha (Entrega E) segue **desligada** por opção. Falta o dono testar as faixas de frete no site real.

## O que mudou (FATOS)
- A sessão **começou com a Parte 3 já commitada** no backend (`de63ff0`).
- **Docs/governança:** a seção "Execução vs. trabalho manual" do `prompt.md` foi reescrita como **"Execução pelos agentes (regra absoluta)"**, com a **fronteira chat/Code** explícita (o chat consultor não tem disco/terminal → toda ação local vira prompt para o Claude Code). Criada a skill cross-projeto `agent-execution-boundary` (versão detalhada da mesma regra, acionada no ponto de decisão), empacotada e instalada pelo dono. Commit `988d08d` (`docs/prompt.md` + `docs/contexto.md`).
- **Backend reimplantado: Versão 5** (Apps Script).
- **Smoke test do `/exec`:** retornou `{"ok":true,"km":10}` para Av. Yara, Vila Yara, Osasco/SP → base em Barueri (~10 km de rota). Prova o **geocode real** (ORS_KEY válida) — o que os 42/42 não cobriam.
- **Frete real ativado no front:** nova const `FRETE_URL` → `/exec`, usada só pela `fetchDistanciaKm` (guard + `s.src`). **`SHEETS_URL` mantida vazia** → o `doPost` (gravação na planilha) continua desligado (Entrega E).
- **`tests/harness.html` sincronizado** com o index (troca `SHEETS_URL`→`FRETE_URL` no caminho do frete, mantendo `FRETE_URL=""` no harness para preservar o teste do fallback). Suíte: **42/42**.
- **`contexto.md`** atualizado para Sessão 3 (cabeçalho, Status, §2, tabela D, §5, §6, §10).
- **Frete ativado e resumo desta sessão arquivado no MESMO commit:** `frontend/index.html`, `tests/harness.html`, `docs/contexto.md`, `docs/resumo-sessao-3.md`; push em `origin/main` (Netlify republica). *(Os resumos de sessão são arquivos permanentes; o `resumo-sessao-2.md` já existia, commitado em `de63ff0`, e NÃO entra neste commit — nesta sessão foi criado apenas o `resumo-sessao-3.md`.)*

## Em andamento / despachado (não concluído)
- **Teste por faixa no site real** (≤3 / 3–4 / 4–5 / 5–6 / >6 km) — tarefa do dono, no navegador. **Ainda não feito.** Verifica a calibragem das faixas em produção; o fallback é não-bloqueante (risco baixo).

## Dúvidas / decisões em aberto
- **Entrega E:** religar a planilha — colar `SHEETS_URL` no front, conferir o cabeçalho de 16 colunas (A1:P1), decidir se `numero`/`complemento` entram no `appendRow`.

## Como resolver na próxima sessão
1. Dono testa 1 CEP de cada faixa no site real; se alguma faixa vier errada, calibrar.
2. Iniciar a Entrega E (planilha + múltiplos caldos).

## Dados úteis
- Endpoint `/exec`: https://script.google.com/macros/s/AKfycby6fGQYm2LRVG7bEflWBOCwGmJQ7PEA8DvFTMfq7OTI7D13adcMhn5v4Rcfe1LwRbuz/exec
- `FRETE_URL` (front) = `/exec`; `SHEETS_URL` = `""` (Entrega E).
- `ORS_KEY` em Script Properties (backend), nunca no repo; permissão `script.external_request` concedida.
- `BASE_LONLAT`: coordenada-base no `frontend/index.html` (nível quarteirão).
- Tabela de frete: ≤3 grátis / 3–4 R$4 / 4–5 R$6 / 5–6 R$8 / >6 consultar.
- Smoke input → resultado: Av. Yara, Vila Yara, Osasco/SP → `km = 10`.
- Commits relevantes: `988d08d` (docs/governança), `de63ff0` (Parte 3 backend + `resumo-sessao-2.md`), e este commit (frete + contexto + `resumo-sessao-3.md`).
- Skill nova: `agent-execution-boundary`.
