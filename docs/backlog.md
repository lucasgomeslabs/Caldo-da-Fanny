# Backlog — Caldo da Fanny

> **Lista única de pendências do projeto.** Toda tarefa pendente vive aqui para não se perder
> entre sessões. Atualizar ao fim de cada sessão (junto com o contexto.md). Origem anotada.

## Prioridade sugerida
Revisar Pedido (P2/P3) → ~~Entrega E / múltiplos caldos (P4/P8)~~ **E1 feito; falta E2 (planilha, P8)** →
visuais (~~P5~~ **feito** / P6 selo) e UX (P7).

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

### P2 — Frete invisível para o cliente antes de finalizar
O valor do frete não aparece no site antes do envio — o cliente confirma sem ver frete nem total.
**Resolvido junto com P3** (a tela de revisão exibe frete + total). *(Reportado: Sessão 3.)*

### P3 — Tela "Revisar Pedido"
Hoje o cliente preenche e clica em "Peça pelo WhatsApp", que já é a confirmação de fato — sem ver
frete nem total no site. Fluxo a implementar:
1. Cliente preenche todos os campos.
2. Após "Observações", botão **"Finalizar Pedido"** → **tela de revisão**.
3. Resumo com: número do pedido; o pedido completo (itens); nome; telefone; endereço (conferir);
   **valor do frete**; **total**.
4. Botão **"Finalizar Pedido"** que leva **direto ao WhatsApp**.
Resolve junto o P2. *(Seu pedido; fila de melhorias do front, resumo-sessao-2 §5/§6.)*
*(A decidir na execução: nomes distintos para os dois botões; e se o nº do pedido é gerado na revisão ou no envio.)*

### P4 — Múltiplos caldos de tipos diferentes não somam ✅ RESOLVIDO no front (Sessão 5, E1)
O site **alternava** o tipo de caldo em vez de **somar** — só dava para pedir vários do mesmo tipo.
**Resolvido (E1):** carrinho de 6 itens (3 tipos × 2 tamanhos), preço por item, subtotal por soma,
mensagem do WhatsApp em N linhas. *(Reportado: Sessão 3.)* A **gravação na planilha** dessa nova
estrutura segue em P8 (E2). *(Resolvido no front; planilha pendente.)*

## Funcionais — backend/dados

### P8 — Entrega E (planilha + preços) — PARCIAL (E1 feito no front; E2 pendente)
**E1 (Sessão 5, no front):** preço por item e múltiplos caldos (P4) já implementados — ver carrinho
em `frontend/index.html` (`CARDAPIO`/`data.itens`).
**E2 — pendente:** religar a gravação na planilha (`SHEETS_URL`/`doPost`, hoje desligado de propósito);
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

## Fora do escopo atual (registrado, não fazer agora)
- **Identificação de cliente + fidelidade** — pós-MVP (contexto.md §8b: arquitetura, LGPD).
