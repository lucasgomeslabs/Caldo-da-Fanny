# Resumo — Sessao 8 (16/06/2026)

> Registro de sessao arquivado em git. Migracao de hosting Netlify -> Cloudflare.
> Estado vivo conciso em `contexto.md` (§1).

## Status num relance
Site migrado do **Netlify** para o **Cloudflare** (Workers Static Assets), validado ponta-a-ponta
(frontend + backend Apps Script). Motivacao: pausa recorrente por estouro de cota no Netlify.
Backend (Google Apps Script) intacto — nao foi afetado.

## Motivacao / diagnostico (FATOS)
- Netlify pausou os deploys por estouro da cota mensal. Modelo de creditos novo: Free = 300
  creditos/mes, limite rigido. Deploy de producao custa 15 creditos cada (independe do build).
- Causa provavel (SUPOSICAO embasada): alto volume de deploys da fase de construcao
  (~20 deploys/mes ja esgotam o Free). Banda tambem conta, mas trafego e baixo.
- Ultimo deploy publicado no Netlify antes da pausa: 0a04256. Os commits posteriores
  (d92f799, 7fd16ff, b872d8c, f91e9b5) ficaram Skipped — mas eram todos docs/teste, entao o
  site servido nao perdeu nada funcional.
- Reset da cota Netlify: inicio do mes-calendario (~01/jul/2026).

## Decisao
- Migrar para Cloudflare (banda ilimitada no Free, sem custo por deploy, uso comercial OK).
- GitHub Pages descartado: proibe uso comercial, e site de delivery e transacao comercial.
- A UI da Cloudflare so expos o fluxo Workers (Pages descontinuado p/ projetos novos) -> usou-se
  Workers Static Assets.

## Fact-find pre-migracao (read-only) — FATOS
- index.html vive em `frontend/` (unica pasta do site, com `assets/`).
- `netlify.toml` na raiz: publish="frontend", command="" (estatico puro, sem build).
- ZERO recursos Netlify-especificos: sem _redirects, _headers, functions/, data-netlify.
  Migracao 100% portavel.
- URL `caldodafanny.netlify.app` hardcoded so em docs; ZERO no `frontend/`.

## Implementacao (FATOS)
- Commit `ecd943d`: cria `wrangler.jsonc` na raiz
  (name: caldo-da-fanny; compatibility_date; assets.directory: ./frontend). Validado como JSON
  antes do commit. Pushed.
- Conta Cloudflare criada com lucas.contatoedf@gmail.com; conectada ao GitHub (lucasgomeslabs),
  repo Caldo-da-Fanny.
- Deploy via `npx wrangler deploy` (build #c731c77a): leu 4 arquivos de `frontend/`, subiu
  index.html + bg-cozinha.jpg + emoji-mandioca.svg. Build completed com sucesso.
- Subdominio da conta workers.dev renomeado de `lucas-contatoedf` (auto-gerado do e-mail) para
  `gomless` (marca GomLess).
- URL de producao: **https://caldo-da-fanny.gomless.workers.dev**

## Validacao ponta-a-ponta (FATO)
- Site renderizou identico (logo, fundo, "SEU PEDIDO", precos).
- Pedido de teste completo: 3 caldos, subtotal R$82, tela "REVISE SEU PEDIDO" #001, e o pedido
  CHEGOU na planilha do Apps Script (linha #001/#007, 16/06 12:40, com nome/telefone/endereco/
  CEP/distancia/itens/total). Sem CORS, sem erro. Migracao validada.

## Limpeza pos-migracao (FATOS)
- `netlify.toml`: MANTIDO como Plano B (fallback MANUAL, nao divulgado; so reativado numa
  eventual queda do Cloudflare). NAO e failover automatico.
- Commit `75c3b32`: README.md + docs/contexto.md atualizados — Cloudflare como host principal,
  Netlify citado como plano B; housekeeping de seguranca (acesso restrito ao repo + sites de
  teste antigos deletados) reposicionado p/ o Netlify. Registros historicos (contexto.md §6/§10,
  resumos 5/6) preservados intactos.

## Decisoes tomadas
- Host principal = Cloudflare; Netlify = plano B manual (nao failover automatico).
- Subdominio workers.dev = `gomless`.
- GitHub Pages descartado (uso comercial).
- Numeracao: Sessao 8 (Sessao 7 ja fechada e pushada em f91e9b5).
- Nao tocar registros historicos.

## Em andamento / despachado (NAO concluido)
- **Push final** (`75c3b32` + este resumo) — leva os docs ao GitHub. E o fecho da sessao.
  (`ecd943d` ja foi pushado na fase do deploy.)

## Proxima sessao
- Retomar o backlog de FEATURE (estava pausado quando a cota estourou): fluxo de botoes,
  "Finalizar Pedido", pagina de revisao pre-confirmacao, Entrega E (multiplos tipos de caldo).
- Opcional/futuro: dominio proprio (ex.: caldodafanny.com.br) p/ URL profissional — com custo,
  nao obrigatorio.

## Dados uteis
- Site (Cloudflare): https://caldo-da-fanny.gomless.workers.dev
- Plano B (Netlify, NAO divulgado): caldodafanny.netlify.app — reset de cota ~01/jul/2026
- Repo: https://github.com/lucasgomeslabs/Caldo-da-Fanny, branch main
- Commits da Sessao 8: `ecd943d` (wrangler.jsonc, pushed) · `75c3b32` (docs URL, local) ·
  + este resumo (local). Push final pendente.
- Config Cloudflare: `wrangler.jsonc` na raiz, assets.directory = ./frontend, sem build.
- Backend: Google Apps Script (externo, nao afetado pela migracao).

## Estado do working tree
- Limpo apos o commit deste resumo (confirmado no Passo 1 antes de gravar).
