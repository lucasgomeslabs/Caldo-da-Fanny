# Backlog — Caldo da Fanny

> **Lista única de pendências do projeto.** Toda tarefa pendente vive aqui para não se perder
> entre sessões. Atualizar ao fim de cada sessão (junto com o contexto.md). Origem anotada.

## Prioridade sugerida
~~Revisar Pedido (P2/P3)~~ **feito (E2)** → ~~múltiplos caldos (P4)~~ **feito (E1)** →
**religar planilha (P8)** → visuais (~~P5~~ **feito** / P6 selo) e UX (P7) → docs (**P10 README** logo após o P8; P9 dívida técnica).

## Funcionais — frete e pedido

### P1 — Frete errado fora do Parque Imperial ✅ RESOLVIDO (Sessão 4)
**Causa-raiz (diagnosticada):** o geocoder do ORS não resolvia ruas residenciais de Osasco —
devolvia `match_type:"fallback"`/`layer:"locality"` (centroide da cidade, ~10 km), jogando todo
endereço de Osasco em ">6 km / consultar". O modo `structured` resolveu um endereço mas falhou
em outro; o modo texto casou uma rua de **Porto Velho/RO** com `confidence:1`.
**Solução (D-front):** o cálculo de frete saiu do backend e passou 100% para o navegador —
**Nominatim** geocodifica (fetch/CORS, padrão ViaCEP) e a distância é medida em **linha reta
(Haversine)** até a base. Sem ORS, sem chamada ao Apps Script para frete.
- Base aproximada pelo CEP (não a coordenada exata da casa).
- **Régua:** ≤2 km grátis / >2–3 km R$4 / >3–5 km R$6 / >5 km consultar (fronteira na faixa mais barata).
- **Travas não-bloqueantes:** geocode vazio/erro/timeout → "a confirmar"; distância > 30 km → "a confirmar".
- Backend limpo: frete-ORS removido (V8). `ORS_KEY` em Script Properties ficou obsoleta.

> **Saga / aprendizado (não repetir o caminho):** ORS texto → fallback (centroide) → ORS
> structured → misto (1 ok, 1 fallback) → Nominatim no backend (Apps Script) → HTTP 429, IP do
> Google bloqueado (mesma parede do ViaCEP) → Nominatim no front (navegador, IP do cliente) →
> funciona. Lição: roteador errando distância = entrada malformada, não "serviço ruim".

### P2 — Frete invisível para o cliente antes de finalizar ✅ RESOLVIDO (Sessão 5, E2)
O valor do frete não aparecia antes do envio. **Resolvido junto com P3:** a tela de revisão (`#done`) exibe
itens + Subtotal/Frete/Total antes de confirmar. *(Reportado: Sessão 3.)*

### P3 — Tela "Revisar Pedido" ✅ RESOLVIDO (Sessão 5, E2)
**Resolvido:** a `#done` (antes só "pedido recebido") virou **tela de revisão**. Fluxo atual:
1. Cliente preenche os dados e o carrinho.
2. Botão **"REVISAR PEDIDO"** (antigo "PEÇA PELO WHATSAPP") → `#done` em modo revisão.
3. Resumo: nº do pedido, itens (`qtd x Tipo (Tamanho)` + preço por linha), Subtotal, Frete, Total (em destaque).
   *(Nome/endereço não são re-exibidos no resumo — ficam no form, que "Refazer pedido" preserva para edição.)*
4. **"Confirmar Pedido"** (link `wa.me`, abre só no clique) leva ao WhatsApp; **"Refazer pedido"** volta ao form
   **sem apagar** dados/carrinho. Resolve junto o P2.
*(Divergência registrada do plano original: reusou-se a `#done` com **um** botão "REVISAR PEDIDO" em vez de um
"Finalizar Pedido" separado; o nº do pedido segue gerado no envio.)*

### P4 — Múltiplos caldos de tipos diferentes não somam ✅ RESOLVIDO no front (Sessão 5, E1)
O site **alternava** o tipo de caldo em vez de **somar** — só dava para pedir vários do mesmo tipo.
**Resolvido (E1):** carrinho de 6 itens (3 tipos × 2 tamanhos), preço por item, subtotal por soma,
mensagem do WhatsApp em N linhas. *(Reportado: Sessão 3.)* A **gravação na planilha** dessa nova
estrutura segue em P8 (parte backend da Entrega E). *(Resolvido no front; planilha pendente.)*

## Funcionais — backend/dados

### P8 — Entrega E (planilha + preços) — PARCIAL (front feito: E1+E2; planilha pendente)
**Front (Sessão 5):** múltiplos caldos/preço por item (E1) e tela de revisão (E2) prontos — ver
`frontend/index.html` (`CARDAPIO`/`data.itens`).
**Planilha (parte backend, pendente):** religar a gravação (`SHEETS_URL`/`doPost`, hoje desligado de propósito);
mapear a nova estrutura `data.itens` (lista) para colunas; conferir/rever o cabeçalho (hoje 16 colunas
A1:P1 com `caldo`/`qtde` únicos — precisa repensar p/ N itens); decidir se `numero`/`complemento`
entram no `appendRow`. *(Roadmap, Entrega E.)*

## Visuais

### P5 — Ícone errado no Caldo de Mandioca ✅ RESOLVIDO (Sessão 5, E1)
O ícone exibido era uma **batata** (🥔), não mandioca. **Resolvido:** criado
`frontend/assets/emoji-mandioca.svg` (ícone desenhado) e referenciado no bloco do tipo via
`<img src="assets/emoji-mandioca.svg" class="emoji" alt="Mandioca">`. Verde (🥬) e Frango (🍗)
seguem com emoji de texto. *(Reportado: Sessão 3.)*

### P6 — Selo "ENTREGA GRÁTIS"
"PARQUE IMPERIAL" está **estourando o círculo** do selo. Ajustar enquadramento/tamanho. *(Reportado: Sessão 3.)*

## UX

### P7 — Campo Número: teclado numérico no mobile
Adicionar `inputmode="numeric"` (como no CEP) — **sem** máscara (aceitar "123A", "s/n"). *(contexto.md §5.)*

## Manutenção / dívida técnica

### P9 — Resíduos de documentação e testes defasados
Limpeza de inconsistências pré-Sessão 4 (não crítica):
- `contexto.md` §1 (stack: "backend desligado", "7 cenários / 28 verificações") e §6 "Onde paramos"
  (narra o frete-ORS e cita a régua antiga ≤3/≤4/≤5/≤6) estão desatualizados.
- `contexto.md` §2: "Sanitização: fraca / sem anti-fórmula / sem honeypot" — a Entrega C já implementou isso.
- `tests/backend-tests.mjs`: snapshot ainda inclui `montarEndereco_` (removido do backend na Sessão 4);
  passa nos testes por testar a própria cópia, mas está dessincronizado do backend real.
*(Registrado na Sessão 4; consertar numa próxima.)*

### P10 — Atualizar README.md (pós-Entrega E)
O `README.md` está desatualizado: descreve múltiplos caldos como **futuro** (já está pronto — E1),
**não** menciona `docs/backlog.md` nem os `docs/resumo-sessao-N.md`, e não reflete o **cardápio P/G**,
a **tela de revisão** (E2) nem o **frete por distância**. **Ideal atacar junto/logo após o P8** (quando a
planilha religar e o estado estabilizar), para não reescrever duas vezes. *(Registrado: Sessão 5.)*

## Fora do escopo atual (registrado, não fazer agora)
- **Identificação de cliente + fidelidade** — pós-MVP (contexto.md §8b: arquitetura, LGPD).
