# 🍲 Caldo da Fanny

Site de pedidos para um delivery de caldos caseiros. O cliente monta o pedido pelo site
e finaliza pelo WhatsApp com a mensagem já preenchida. Projeto desenvolvido de forma
incremental, com testes e documentação de processo.

*Ordering website for a homemade soup-broth delivery business. Customers build an order
on the site and finalize it via WhatsApp with a pre-filled message. Built incrementally,
with tests and process documentation.*

---

## ✨ Visão geral / Overview

- **Frontend:** página única (`frontend/index.html`) — HTML, CSS e JS *vanilla*, sem
  framework nem build step. Mobile-first.
- **Backend (opcional):** Google Apps Script (`backend/google-apps-script.js`) que grava
  pedidos numa planilha Google. Atualmente desligado; será religado quando o pedido
  multi-item estiver pronto.
- **Integração:** WhatsApp via link `wa.me` com mensagem pré-montada.
- **Busca de endereço:** API pública ViaCEP (gratuita) para autopreencher o endereço a
  partir do CEP.
- **Testes:** suíte em Node + jsdom (`tests/`).
- **Hospedagem:** site estático (Netlify).

---

## 🧱 Tech stack

`HTML` · `CSS` · `JavaScript (vanilla)` · `Google Apps Script` · `ViaCEP API` ·
`Node + jsdom (tests)` · `Netlify`

---

## 📂 Estrutura / Project structure

```
.
├── frontend/
│   └── index.html              # página única (HTML + CSS + JS inline)
├── backend/
│   └── google-apps-script.js   # Web App que grava pedidos na planilha (doPost)
├── tests/
│   ├── run-tests.mjs           # runner (Node + jsdom)
│   ├── harness.html            # snapshot do DOM/JS para testes
│   └── README.md
├── Banner/                     # imagens (logo, banner)
├── docs/
│   ├── contexto.md             # estado vivo do projeto + processo + roadmap
│   ├── prompt.md               # enquadramento de negócio (planejamento)
│   └── code.md                 # regras de execução para o agente de código
├── GUIA-INSTALACAO.md          # manual de operação para a dona do negócio
└── README.md
```

---

## ✅ Funcionalidades / Features

- Formulário de pedido com validação em JavaScript.
- Máscara de telefone e de CEP (padrão brasileiro).
- Autopreenchimento de endereço via ViaCEP, **não bloqueante** (se a API falhar, o
  cliente preenche manualmente e o pedido segue).
- Geração de mensagem organizada e envio via WhatsApp (`encodeURIComponent`).
- Numeração sequencial de pedidos.

---

## 🧪 Testes / Running tests

```bash
npm install jsdom          # uma única vez / one-time
node tests/run-tests.mjs
```

> The test harness (`tests/harness.html`) is a manual snapshot of the inline code in
> `index.html`. When the page changes, the harness must be updated too, otherwise tests
> validate stale code.

---

## 🛠️ Desenvolvimento / Development approach

Trabalho incremental em pequenas entregas, cada uma revisada e testada antes do commit.
O processo completo, as decisões de arquitetura e o roadmap ficam em `docs/contexto.md`.

A **estratégia de escala** é deliberada: a infraestrutura para alto volume **não** é
construída antecipadamente (evitando over-engineering); os gatilhos para evoluí-la estão
documentados. Segurança é tratada de forma proporcional — por código (validação no
back e no front, anti-injeção de fórmula em planilha, honeypot anti-bot), não por
infraestrutura prematura.

*Development is incremental: small, reviewed, tested deliveries. Architecture decisions,
process and roadmap live in `docs/contexto.md`. Scaling is deliberate — high-volume infra is
intentionally deferred (documented triggers), and security is handled proportionally in
code rather than via premature infrastructure.*

---

## 📌 Status

Em desenvolvimento ativo. Veja `docs/contexto.md` para o estado atual e o próximo passo.

*Active development. See `docs/contexto.md` for current state and next steps.*
