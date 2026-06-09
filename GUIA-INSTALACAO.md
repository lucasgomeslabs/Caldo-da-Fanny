# Caldo da Fanny — Guia de instalação

Você tem 2 arquivos:

- **index.html** → a página de pedido (é o que o cliente abre)
- **google-apps-script.js** → o código que salva os pedidos na sua planilha

A página **já funciona sozinha**: o cliente preenche e é levado ao WhatsApp com a
mensagem pronta. A planilha é o passo extra que cria a **fila automática**.

---

## Parte 1 — Testar a página agora (sem planilha)

1. Abra o `index.html` no celular ou computador.
2. Confira o número do WhatsApp: abra o arquivo, procure `const WHATSAPP =` e
   confirme que está `5511937223540` (DDI 55 + DDD + número, só dígitos).
3. Faça um pedido de teste → ele deve abrir o WhatsApp com tudo preenchido. ✅

---

## Parte 2 — Conectar a planilha (fila automática) — grátis

### 2.1 Criar a planilha
1. Acesse sheets.google.com e crie uma planilha em branco.
2. Dê o nome de **Caldo da Fanny — Pedidos** (qualquer nome serve).

### 2.2 Colar o código
1. Na planilha: menu **Extensões → Apps Script**.
2. Apague o que estiver lá e **cole todo o conteúdo** de `google-apps-script.js`.
3. Clique no disquete 💾 (Salvar).

### 2.3 Publicar como App da Web
1. No topo, clique em **Implantar → Nova implantação**.
2. No ícone de engrenagem, escolha o tipo **App da Web**.
3. Configure assim:
   - **Executar como:** Eu (seu e-mail)
   - **Quem pode acessar:** Qualquer pessoa
4. Clique **Implantar**.
5. O Google vai pedir autorização → escolha sua conta → em "Não verificado"
   clique em **Avançado → Acessar (nome do projeto)** → **Permitir**.
   (É seguro: é o seu próprio script.)
6. Copie a **URL do app da Web** — termina em `/exec`.

### 2.4 Colar a URL na página
1. Abra o `index.html`.
2. Procure a linha:
   ```
   const SHEETS_URL = "";
   ```
3. Cole a URL entre as aspas:
   ```
   const SHEETS_URL = "https://script.google.com/macros/s/SEU_ID/exec";
   ```
4. Salve.

Pronto. Agora **cada pedido cai na planilha em ordem de chegada**, com número
(#001, #002…), horário e status "Recebido". Essa ordem é a sua fila de prioridade.

---

## Parte 3 — Publicar o link para os clientes

A página é um arquivo único, então qualquer hospedagem grátis serve. As mais fáceis:

- **Netlify Drop** (netlify.com/drop): arraste o `index.html` e ganhe um link na hora.
- **GitHub Pages** ou **Cloudflare Pages**: também grátis.

Depois é só transformar o link em **QR Code** (ex.: br.qr-code-generator.com) e
colocar nos panfletos, no Instagram e no status do WhatsApp.

---

## Como gerenciar a fila no dia a dia

Na coluna **Status** da planilha, vá mudando manualmente:
`Recebido → Em preparo → Saiu para entrega → Entregue`.

Dica: selecione a coluna Status e use **Dados → Validação de dados** para criar um
menu suspenso com essas 4 opções — fica mais rápido de atualizar pelo celular.

---

## Perguntas comuns

**O WhatsApp confirma sozinho?**
Não. O WhatsApp comum/Business não permite envio automático. O cliente envia a
mensagem (1 toque) e vocês confirmam. Confirmação 100% automática só com a
WhatsApp Business **API** (paga) — vale a pena só quando o volume crescer.

**Mudei o código depois de publicar e não atualizou.**
Toda vez que editar o Apps Script, faça **Implantar → Gerenciar implantações →
editar (lápis) → Versão: Nova → Implantar**. A URL continua a mesma.

**Quero mudar preços ou sabores.**
No `index.html`, edite a seção do menu (`<div class="menu">`) e a constante
`const PRICE = 24.90;`.
