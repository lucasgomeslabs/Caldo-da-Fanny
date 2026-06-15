/**
 * Caldo da Fanny — recebe os pedidos da página e grava na planilha.
 *
 * Como usar (resumo — veja o GUIA-INSTALACAO.md):
 *  1. Crie uma planilha no Google Sheets.
 *  2. Menu: Extensões > Apps Script.
 *  3. Apague o conteúdo e cole TODO este arquivo.
 *  4. Implantar > Nova implantação > Tipo "App da Web".
 *       - Executar como: Eu
 *       - Quem tem acesso: Qualquer pessoa
 *  5. Copie a URL gerada (.../exec) e cole em SHEETS_URL no index.html.
 *
 * Segurança (Entrega C): valida/sanitiza os dados, protege contra injeção de
 * fórmula no Sheets, limita o tamanho dos campos e tem honeypot anti-bot.
 */

// Nome da aba onde os pedidos serão gravados:
const ABA = "Pedidos";

/* ===================================================================
   SEGURANÇA (Entrega C) — funções PURAS (sem dependência do Google).
   ATENÇÃO: estas funções são replicadas (SNAPSHOT) em
   tests/backend-tests.mjs. Se mudar aqui, atualize o teste.
   =================================================================== */

// Limite de tamanho (caracteres) por campo gravado na planilha.
const LIMITES = {
  horario: 40, nome: 80, telefone: 20, endereco: 120, numero: 20,
  complemento: 80, bairro_cep: 60, cep: 9, km: 8, pedido_id: 12,
  pagamento: 20, obs: 300, subtotal: 20, frete: 60, total: 20
};

// Enum estrito SÓ de pagamento (valores exatos do front). NÃO há enum de
// caldo (muda na Entrega E) nem de bairro (será removido na Entrega D).
const PAGAMENTOS = ["PIX", "Dinheiro", "Cartão"];

// Só os dígitos de um valor.
function digits(v) {
  return String(v == null ? "" : v).replace(/\D/g, "");
}

// Anti-injeção de fórmula no Sheets: um texto começando com  = + - @  (ou
// TAB/CR) seria interpretado como fórmula. Prefixar com apóstrofo força texto.
// PLANO B (se o apóstrofo aparecer visível na célula): em vez de prefixar,
// gravar e depois formatar a nova linha como texto puro com
// range.setNumberFormat("@").
function antiFormula(v) {
  const s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s;
}

// Sanitiza um campo de texto: remove caracteres de controle (mantém TAB e
// quebra de linha), faz trim, limita o tamanho e aplica o anti-fórmula.
function cleanText(v, max) {
  const raw = String(v == null ? "" : v);
  let s = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    // mantém TAB (9) e LF (10); descarta demais controles (0-8, 11-31) e DEL (127)
    if (c === 9 || c === 10 || (c >= 32 && c !== 127)) s += raw.charAt(i);
  }
  s = s.trim();
  if (max && s.length > max) s = s.substring(0, max);
  return antiFormula(s);
}

// Honeypot: humanos deixam o campo isca "website" vazio; bots costumam preencher.
function isBot(d) {
  return !!(d && String(d.website == null ? "" : d.website).trim() !== "");
}

// Validação no backend (não confia no front). Retorna {ok:true} ou {ok:false, erro}.
function validateOrder(d) {
  if (!d || typeof d !== "object") return { ok: false, erro: "payload invalido" };
  const obrig = ["nome", "telefone", "endereco", "numero", "pagamento"];
  for (let i = 0; i < obrig.length; i++) {
    if (String(d[obrig[i]] == null ? "" : d[obrig[i]]).trim() === "") {
      return { ok: false, erro: "campo obrigatorio vazio: " + obrig[i] };
    }
  }
  if (digits(d.telefone).length < 10) return { ok: false, erro: "telefone invalido" };
  // Itens: lista não-vazia (1..30). Cada item precisa de qtd inteira 1–20 e tipo/tamanho não-vazios.
  if (!Array.isArray(d.itens) || d.itens.length < 1) return { ok: false, erro: "itens vazio" };
  if (d.itens.length > 30) return { ok: false, erro: "itens demais" };
  for (let i = 0; i < d.itens.length; i++) {
    const it = d.itens[i] || {};
    const q = parseInt(it.qtd, 10);
    if (!(q >= 1 && q <= 20)) return { ok: false, erro: "quantidade invalida" };
    if (String(it.tipo == null ? "" : it.tipo).trim() === "") return { ok: false, erro: "item sem tipo" };
    if (String(it.tamanho == null ? "" : it.tamanho).trim() === "") return { ok: false, erro: "item sem tamanho" };
  }
  if (PAGAMENTOS.indexOf(String(d.pagamento)) === -1) return { ok: false, erro: "pagamento invalido" };
  // Proteção anti-payload gigante: nenhum campo string pode exceder muito seu limite.
  for (const campo in LIMITES) {
    if (d[campo] != null && String(d[campo]).length > LIMITES[campo] * 4) {
      return { ok: false, erro: "campo muito grande: " + campo };
    }
  }
  return { ok: true };
}

// Formata a lista para a coluna "Itens": "{qtd}x {tipo} ({tamanho})" por item, vários
// separados por "; ". MESMA redação por item da mensagem do WhatsApp (frontend/index.html).
// tipo/tamanho passam por cleanText; qtd vira inteiro (o payload é controlável pelo cliente).
function formatItens_(itens) {
  if (!Array.isArray(itens)) return "";
  return itens.map(function (it) {
    const i = it || {};
    const qtd = parseInt(i.qtd, 10) || 0;
    return qtd + "x " + cleanText(i.tipo, 60) + " (" + cleanText(i.tamanho, 20) + ")";
  }).join("; ");
}

/* =================================================================== */

// Resposta JSON padrão.
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000); // evita pedidos simultâneos gravando errado

  try {
    // 1) Parse seguro do corpo
    let d;
    try {
      d = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonOut({ ok: false, erro: "json invalido" });
    }

    // 2) Honeypot anti-bot: finge sucesso e NÃO grava (não revela ao bot que foi barrado)
    if (isBot(d)) return jsonOut({ ok: true });

    // 3) Validação no backend (não confia no front)
    const v = validateOrder(d);
    if (!v.ok) return jsonOut({ ok: false, erro: v.erro });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ABA);

    // Cria a aba e o cabeçalho na primeira vez
    if (!sheet) {
      sheet = ss.insertSheet(ABA);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Pedido", "Ref. cliente", "Horário", "Nome", "Telefone", "Endereço", "Complemento",
        "Bairro", "CEP", "Distância (km)", "Itens", "Subtotal", "Frete", "Total",
        "Pagamento", "Observações", "Status"
      ]);
      sheet.getRange("A1:Q1").setFontWeight("bold").setBackground("#c1440e").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    // Número oficial (sequencial do backend) = quantidade de linhas já existentes
    const seq = sheet.getLastRow(); // 1 = só cabeçalho => 1º pedido vira #001
    const pid = "#" + String(seq).padStart(3, "0");

    // 4) Grava já sanitizado (anti-fórmula + limite de tamanho em cada campo)
    sheet.appendRow([
      pid,                                              // Pedido (sequencial do backend)
      cleanText(d.pedido_id, LIMITES.pedido_id),        // Ref. cliente (id gerado no front)
      cleanText(d.horario || new Date().toLocaleString("pt-BR"), LIMITES.horario),
      cleanText(d.nome, LIMITES.nome),
      cleanText(d.telefone, LIMITES.telefone),
      cleanText(d.endereco, LIMITES.endereco) + ", " + cleanText(d.numero, LIMITES.numero),  // Endereço = rua + número
      cleanText(d.complemento, LIMITES.complemento),    // Complemento
      cleanText(d.bairro_cep, LIMITES.bairro_cep),      // "Bairro" = bairro do ViaCEP
      cleanText(d.cep, LIMITES.cep),
      cleanText(d.km, LIMITES.km),                      // Distância (km) calculada no front (Nominatim+Haversine); pode vir vazia
      formatItens_(d.itens),                            // Itens (lista legível, mesma redação do WhatsApp)
      cleanText(d.subtotal, LIMITES.subtotal),
      cleanText(d.frete, LIMITES.frete),
      cleanText(d.total, LIMITES.total),
      cleanText(d.pagamento, LIMITES.pagamento),
      cleanText(d.obs, LIMITES.obs),
      "Recebido"
    ]);

    return jsonOut({ ok: true, pedido: pid });

  } catch (err) {
    return jsonOut({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ===================================================================
   doGet — healthcheck. O cálculo de frete foi 100% para o front
   (Nominatim + Haversine no index.html); o backend agora só grava
   pedidos via doPost. Mantido só para indicar que o app está no ar.
   =================================================================== */
function doGet(e) {
  return ContentService.createTextOutput("Caldo da Fanny — ativo");
}
