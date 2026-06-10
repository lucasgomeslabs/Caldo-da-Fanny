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
  complemento: 80, bairro_cep: 60, cep: 9, km: 8, caldo: 60, qtde: 5,
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
  const obrig = ["nome", "telefone", "endereco", "numero", "caldo", "pagamento"];
  for (let i = 0; i < obrig.length; i++) {
    if (String(d[obrig[i]] == null ? "" : d[obrig[i]]).trim() === "") {
      return { ok: false, erro: "campo obrigatorio vazio: " + obrig[i] };
    }
  }
  if (digits(d.telefone).length < 10) return { ok: false, erro: "telefone invalido" };
  const q = parseInt(d.qtde, 10);
  if (!(q >= 1 && q <= 20)) return { ok: false, erro: "quantidade invalida" };
  if (PAGAMENTOS.indexOf(String(d.pagamento)) === -1) return { ok: false, erro: "pagamento invalido" };
  // Proteção anti-payload gigante: nenhum campo pode exceder muito seu limite.
  for (const campo in LIMITES) {
    if (d[campo] != null && String(d[campo]).length > LIMITES[campo] * 4) {
      return { ok: false, erro: "campo muito grande: " + campo };
    }
  }
  return { ok: true };
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
        "Pedido", "Horário", "Nome", "Telefone", "Endereço", "Bairro", "CEP",
        "Distância(km)", "Caldo", "Qtde", "Pagamento", "Observações",
        "Subtotal", "Frete", "Total", "Status"
      ]);
      sheet.getRange("A1:P1").setFontWeight("bold").setBackground("#c1440e").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    // Número oficial do pedido = quantidade de linhas já existentes
    const numero = sheet.getLastRow(); // 1 = só cabeçalho => 1º pedido vira #001
    const pid = "#" + String(numero).padStart(3, "0");

    // 4) Grava já sanitizado (anti-fórmula + limite de tamanho em cada campo)
    sheet.appendRow([
      pid,
      cleanText(d.horario || new Date().toLocaleString("pt-BR"), LIMITES.horario),
      cleanText(d.nome, LIMITES.nome),
      cleanText(d.telefone, LIMITES.telefone),
      cleanText(d.endereco, LIMITES.endereco),
      cleanText(d.bairro_cep, LIMITES.bairro_cep),   // "Bairro" = bairro do ViaCEP (campo manual removido)
      cleanText(d.cep, LIMITES.cep),
      cleanText(d.km, LIMITES.km),                   // Distância calculada pelo ORS (pode vir vazia)
      cleanText(d.caldo, LIMITES.caldo),
      cleanText(d.qtde, LIMITES.qtde),
      cleanText(d.pagamento, LIMITES.pagamento),
      cleanText(d.obs, LIMITES.obs),
      cleanText(d.subtotal, LIMITES.subtotal),
      cleanText(d.frete, LIMITES.frete),
      cleanText(d.total, LIMITES.total),
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
   FRETE — distância via OpenRouteService (Entrega D).
   A CHAVE fica em Script Properties (ORS_KEY), nunca no código/repo.
   doGet responde por JSONP para o front ler a distância sem expor a chave.
   Só funciona após: criar a chave ORS + colá-la em Script Properties +
   reimplantar. Até lá, o front cai no fallback "frete a confirmar".
   =================================================================== */

// Coordenadas [lon, lat] da base (Rua Açucena, 175 — Parque Imperial, Barueri).
// AJUSTE: geocodifique a base uma vez e cole a coordenada real aqui.
const BASE_LONLAT = [-46.806196, -23.477291]; // R. Açucena, 175, Parque Imperial, Barueri/SP — geocodificado e confirmado no mapa

function orsKey_() {
  const k = PropertiesService.getScriptProperties().getProperty("ORS_KEY");
  if (!k) throw new Error("ORS_KEY ausente em Script Properties");
  return k;
}

// Monta o texto de endereço a partir dos campos (logradouro, bairro, localidade, uf)
// que o FRONT obtém do ViaCEP e envia ao backend: campos não-vazios na ordem, sempre
// terminando em "Brasil". O backend NÃO chama o ViaCEP (ele recusa os IPs do Apps Script).
// PURA (sem rede) — replicada em tests/backend-tests.mjs. Se mudar aqui, atualize o teste.
function montarEndereco_(via) {
  const partes = [];
  const campos = ["logradouro", "bairro", "localidade", "uf"];
  for (let i = 0; i < campos.length; i++) {
    const val = String((via && via[campos[i]] != null) ? via[campos[i]] : "").trim();
    if (val) partes.push(val);
  }
  partes.push("Brasil");
  return partes.join(", ");
}

// Geocodifica na ORS um endereço JÁ MONTADO (texto). Endereço vazio (só "Brasil")
// lança erro, para a cadeia cair no fallback "frete a confirmar".
function geocodeEndereco_(text) {
  if (text === "Brasil") throw new Error("endereco vazio");
  const url = "https://api.openrouteservice.org/geocode/search"
    + "?api_key=" + encodeURIComponent(orsKey_())
    + "&text=" + encodeURIComponent(text)
    + "&boundary.country=BR&size=1";
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const d = JSON.parse(r.getContentText());
  if (!d.features || !d.features.length) throw new Error("CEP nao geocodificado");
  return d.features[0].geometry.coordinates; // [lon, lat]
}

function distanciaKmDaBase_(text) {
  const dest = geocodeEndereco_(text);
  const r = UrlFetchApp.fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: orsKey_() },
    payload: JSON.stringify({ locations: [BASE_LONLAT, dest], metrics: ["distance"], units: "km" }),
    muteHttpExceptions: true
  });
  const d = JSON.parse(r.getContentText());
  const km = d && d.distances && d.distances[0] && d.distances[0][1];
  if (typeof km !== "number") throw new Error("distancia indisponivel");
  return Math.round(km * 10) / 10; // 1 casa decimal
}

// doGet: JSONP de distância ( .../exec?cep=12345678&logradouro=...&bairro=...&localidade=...&uf=...&callback=cb -> cb({ok,km}) )
// O endereço vem do front (que consultou o ViaCEP); sem cep/callback, responde texto "ativo".
function doGet(e) {
  const p = (e && e.parameter) || {};
  const cep = String(p.cep || "").replace(/\D/g, "");
  const cb = String(p.callback || "");
  if (cep.length === 8 && cb) {
    // O endereço (logradouro/bairro/localidade/uf) vem do front, que consultou o ViaCEP.
    const text = montarEndereco_({
      logradouro: p.logradouro, bairro: p.bairro,
      localidade: p.localidade, uf: p.uf
    });
    let payload;
    try { payload = { ok: true, km: distanciaKmDaBase_(text) }; }
    catch (err) { payload = { ok: false, erro: String(err) }; }
    return ContentService
      .createTextOutput(cb + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput("Caldo da Fanny — ativo");
}
