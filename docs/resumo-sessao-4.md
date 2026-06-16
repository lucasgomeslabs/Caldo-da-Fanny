# Resumo — Sessão 4 — Caldo da Fanny

> Registro arquivado e permanente desta sessão (versionado no git).

## Status num relance
Frete refeito do zero: saiu do backend (ORS, que errava) e passou 100% para o navegador
(Nominatim geocode + Haversine linha reta), com nova régua de faixas e travas não-bloqueantes.
Backend limpo (ORS removido, V8). Criado o backlog único do projeto (P1–P8); só o P1 foi
fechado nesta sessão — P2–P8 seguem para as próximas.

## O que mudou (FATOS)
- **Backlog criado** (`docs/backlog.md`, P1–P8) a partir de bugs vistos em produção: frete errado,
  frete invisível, falta de tela de revisão, múltiplos caldos não somam, ícone batata, selo estourado.
- **P1 diagnosticado:** o geocode do ORS devolvia centroide de Osasco (`match_type:"fallback"`,
  `layer:"locality"`, ~10 km) para todas as ruas; `structured` deu resultado misto; o modo texto
  casou uma rua em **Porto Velho/RO** com `confidence:1`. Causa = entrada/cobertura do ORS, não distância real.
- **Nominatim no backend testado → HTTP 429** (IP do Apps Script bloqueado, mesma parede do ViaCEP).
- **Decisão D-front** (Nominatim no navegador + Haversine), base aproximada pelo CEP.
- **`index.html`:** `BASE_LONLAT [lat,lon]` aprox.; `haversineKm` (pura); `calcFrete` nova régua
  (≤2 grátis / >2–3 R$4 / >3–5 R$6 / >5 consultar); `fetchDistanciaKm` via fetch ao Nominatim +
  Haversine + 2 travas (vazio/erro/timeout; >30 km → "a confirmar"); `FRETE_URL` removida;
  `SHEETS_URL`/POST intactos.
- **Testes:** `harness.html` sincronizado; `run-tests.mjs` com T8 reescrita, T9 renomeada,
  T2/T3 mockando rede, novos T10 (Haversine), T11 (>30 km), T12 (geocode vazio). **48/48**.
- **Backend limpo (V8):** removidos `geocodeEndereco_`, `distanciaKmDaBase_`, `montarEndereco_`,
  `orsKey_`, `BASE_LONLAT` e o diagnóstico temporário (`diagGeocode_`/`diagtext`); `doGet` virou
  healthcheck; `doPost`/segurança (Entrega C)/planilha intactos. `_testNominatim` apagado do editor.

## Em andamento / despachado (não concluído)
- **Teste por faixa no site real** (≤2 / >2–3 / >3–5 / >5 km) — tarefa do dono, no navegador, com a nova régua.
- **`ORS_KEY`** em Script Properties: obsoleta — remover quando quiser (não afeta o código).

## Aberto no backlog (próximas sessões)
- **P2/P3** — frete invisível + tela "Revisar Pedido" (Finalizar Pedido → revisão com frete/total → WhatsApp).
- **P4/P8** — múltiplos caldos somando + Entrega E (religar planilha).
- **P5/P6** — ícone batata no Caldo de Mandioca; selo "ENTREGA GRÁTIS" estourado.
- **P7** — `inputmode="numeric"` no campo Número.

## Dados úteis
- Base aprox. (front): `BASE_LONLAT` no `frontend/index.html`, formato [lat, lon] (nível quarteirão).
- Régua de frete: ≤2 grátis / >2–3 R$4 / >3–5 R$6 / >5 consultar (fronteira na faixa mais barata).
- Geocode: Nominatim (`/search?format=json&street=&city=&state=`), no navegador.
- Trava geográfica: > 30 km da base → "a confirmar".
- Backend pós-limpeza: só `doPost` (planilha, Entrega E, desligado) + segurança + `doGet` healthcheck.
- Commits da sessão: (1) feat frete D-front + docs; (2) chore limpeza backend.
