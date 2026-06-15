/* Testes de lógica pura (Entregas C+D).
   SNAPSHOT das funções puras: segurança (de backend/google-apps-script.js) e
   calcFrete (de frontend/index.html). Cópia fiel — se mudar nos fontes, atualize aqui.
   Não depende do Google/planilha. Como rodar:  node tests/backend-tests.mjs */

/* ===================== SNAPSHOT ===================== */
const LIMITES = {
  horario: 40, nome: 80, telefone: 20, endereco: 120, numero: 20,
  complemento: 80, bairro_cep: 60, cep: 9, km: 8, pedido_id: 12,
  pagamento: 20, obs: 300, subtotal: 20, frete: 60, total: 20
};
const PAGAMENTOS = ["PIX", "Dinheiro", "Cartão"];
function digits(v) {
  return String(v == null ? "" : v).replace(/\D/g, "");
}
function antiFormula(v) {
  const s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s;
}
function cleanText(v, max) {
  const raw = String(v == null ? "" : v);
  let s = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (c === 9 || c === 10 || (c >= 32 && c !== 127)) s += raw.charAt(i);
  }
  s = s.trim();
  if (max && s.length > max) s = s.substring(0, max);
  return antiFormula(s);
}
function isBot(d) {
  return !!(d && String(d.website == null ? "" : d.website).trim() !== "");
}
function validateOrder(d) {
  if (!d || typeof d !== "object") return { ok: false, erro: "payload invalido" };
  const obrig = ["nome", "telefone", "endereco", "numero", "pagamento"];
  for (let i = 0; i < obrig.length; i++) {
    if (String(d[obrig[i]] == null ? "" : d[obrig[i]]).trim() === "") {
      return { ok: false, erro: "campo obrigatorio vazio: " + obrig[i] };
    }
  }
  if (digits(d.telefone).length < 10) return { ok: false, erro: "telefone invalido" };
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
  for (const campo in LIMITES) {
    if (d[campo] != null && String(d[campo]).length > LIMITES[campo] * 4) {
      return { ok: false, erro: "campo muito grande: " + campo };
    }
  }
  return { ok: true };
}
function formatItens_(itens) {
  if (!Array.isArray(itens)) return "";
  return itens.map(function (it) {
    const i = it || {};
    const qtd = parseInt(i.qtd, 10) || 0;
    return qtd + "x " + cleanText(i.tipo, 60) + " (" + cleanText(i.tamanho, 20) + ")";
  }).join("; ");
}
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
/* calcFrete(km): tabela em DEGRAUS por distância (km) — IDÊNTICA ao frontend/index.html.
   Limites: km<=3 grátis; (3,4] R$4; (4,5] R$6; (5,6] R$8; km>6 "consultar".
   Ex.: 3,0=grátis · 4,0=R$4 (faixa 3–4) · 5,5=R$8 · 7=consultar. */
function calcFrete(km) {
  if (typeof km !== "number" || !(km >= 0)) return { valor: null, status: "indef" };
  if (km <= 3) return { valor: 0, status: "gratis" };
  if (km <= 4) return { valor: 4, status: "pago" };
  if (km <= 5) return { valor: 6, status: "pago" };
  if (km <= 6) return { valor: 8, status: "pago" };
  return { valor: null, status: "consultar" };
}
/* ===================== fim do snapshot ===================== */

const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);
const SOH = String.fromCharCode(1);
const DEL = String.fromCharCode(127);

let pass = 0, fail = 0; const fails = [];
function ok(cond, msg) { if (cond) { pass++; console.log('  PASS ' + msg); } else { fail++; fails.push(msg); console.log('  FAIL ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '  (esperado ' + JSON.stringify(b) + ', obtido ' + JSON.stringify(a) + ')'); }

function validOrder(extra) {
  return Object.assign({
    horario: '09/06/2026 12:00', nome: 'Maria', telefone: '11999998888',
    endereco: 'Rua X', numero: '100', complemento: '', cep: '01001000',
    bairro_cep: 'Parque Imperial', pagamento: 'PIX',
    itens: [{ id: 'verde-p', tipo: 'Caldo Verde', tamanho: 'Pequeno', volume: '250ml', preco: 15, qtd: 2 }],
    obs: '', total: 'R$ 49,80', website: ''
  }, extra || {});
}

const tests = {
  'B1 — anti-formula prefixa = + - @ e TAB'() {
    eq(antiFormula('=SUM(A1)'), "'=SUM(A1)", 'prefixa =');
    eq(antiFormula('+1'), "'+1", 'prefixa +');
    eq(antiFormula('-1'), "'-1", 'prefixa -');
    eq(antiFormula('@x'), "'@x", 'prefixa @');
    eq(antiFormula(TAB + '=x'), "'" + TAB + '=x', 'prefixa TAB inicial');
    eq(antiFormula('Rua X, 100'), 'Rua X, 100', 'texto normal intacto');
    eq(antiFormula('100'), '100', 'numero comum nao e prefixado');
    eq(antiFormula(''), '', 'vazio intacto');
  },
  'B2 — cleanText: trim, remove controle, limita tamanho, anti-formula'() {
    eq(cleanText('  oi  ', 80), 'oi', 'faz trim');
    eq(cleanText('a' + SOH + 'b' + DEL + 'c', 80), 'abc', 'remove caracteres de controle');
    eq(cleanText('linha1' + LF + 'linha2', 80), 'linha1' + LF + 'linha2', 'mantem quebra de linha');
    eq(cleanText('abcdef', 3), 'abc', 'limita ao tamanho maximo');
    eq(cleanText('=2+2', 80), "'=2+2", 'aplica anti-formula');
  },
  'B3 — honeypot detecta bot'() {
    ok(isBot({ website: 'http://spam' }) === true, 'isca preenchida = bot');
    ok(isBot({ website: '   ' }) === false, 'so espacos = nao-bot');
    ok(isBot({ website: '' }) === false, 'vazio = nao-bot');
    ok(isBot({}) === false, 'ausente = nao-bot');
  },
  'B4 — validateOrder aceita pedido valido'() {
    eq(validateOrder(validOrder()).ok, true, 'pedido completo e valido');
  },
  'B5 — validateOrder exige campos obrigatorios'() {
    eq(validateOrder(validOrder({ nome: '' })).ok, false, 'nome vazio reprova');
    eq(validateOrder(validOrder({ numero: '   ' })).ok, false, 'numero so espacos reprova');
    eq(validateOrder(validOrder({ endereco: '' })).ok, false, 'endereco vazio reprova');
  },
  'B6 — telefone e itens (lista + quantidade por item)'() {
    eq(validateOrder(validOrder({ telefone: '1199' })).ok, false, 'telefone curto reprova');
    eq(validateOrder(validOrder({ itens: undefined })).ok, false, 'itens ausente reprova');
    eq(validateOrder(validOrder({ itens: [] })).ok, false, 'itens vazio reprova');
    eq(validateOrder(validOrder({ itens: [{ tipo: 'Caldo Verde', tamanho: 'P', qtd: 0 }] })).ok, false, 'qtd 0 reprova');
    eq(validateOrder(validOrder({ itens: [{ tipo: 'Caldo Verde', tamanho: 'P', qtd: 21 }] })).ok, false, 'qtd 21 reprova');
    eq(validateOrder(validOrder({ itens: [{ tipo: 'Caldo Verde', tamanho: 'P', qtd: 'abc' }] })).ok, false, 'qtd nao-numero reprova');
    eq(validateOrder(validOrder({ itens: [{ tipo: '', tamanho: 'P', qtd: 1 }] })).ok, false, 'item sem tipo reprova');
    eq(validateOrder(validOrder({ itens: [{ tipo: 'Caldo Verde', tamanho: '   ', qtd: 1 }] })).ok, false, 'item sem tamanho reprova');
    const muitos = []; for (let i = 0; i < 31; i++) muitos.push({ tipo: 'X', tamanho: 'P', qtd: 1 });
    eq(validateOrder(validOrder({ itens: muitos })).ok, false, '>30 itens reprova');
    eq(validateOrder(validOrder({ itens: [{ tipo: 'Caldo Verde', tamanho: 'Grande', qtd: 20 }] })).ok, true, 'qtd 20 (limite) com tipo/tamanho ok passa');
  },
  'B7 — enum estrito de pagamento (PIX/Dinheiro/Cartao)'() {
    eq(validateOrder(validOrder({ pagamento: 'PIX' })).ok, true, 'PIX valido');
    eq(validateOrder(validOrder({ pagamento: 'Dinheiro' })).ok, true, 'Dinheiro valido');
    eq(validateOrder(validOrder({ pagamento: 'Cartão' })).ok, true, 'Cartao valido');
    eq(validateOrder(validOrder({ pagamento: 'Boleto' })).ok, false, 'Boleto reprova');
    eq(validateOrder(validOrder({ pagamento: 'pix' })).ok, false, 'minusculo reprova (valor exato)');
  },
  'B8 — limite anti-payload gigante'() {
    eq(validateOrder(validOrder({ nome: 'a'.repeat(80 * 4 + 1) })).ok, false, 'nome gigante reprova');
    eq(validateOrder(validOrder({ obs: 'a'.repeat(300) })).ok, true, 'obs no limite passa (truncada na gravacao)');
  },
  'B9 — calcFrete: tabela em degraus por distancia'() {
    eq(calcFrete(2).status, 'gratis', '2 km = gratis');
    eq(calcFrete(3).status, 'gratis', '3,0 km = gratis (limite inferior)');
    eq(calcFrete(3.5).valor, 4, '3,5 km = R$ 4');
    eq(calcFrete(4).valor, 4, '4,0 km cai na faixa 3-4 (R$ 4)');
    eq(calcFrete(4.5).valor, 6, '4,5 km = R$ 6');
    eq(calcFrete(5).valor, 6, '5,0 km = R$ 6');
    eq(calcFrete(5.5).valor, 8, '5,5 km = R$ 8');
    eq(calcFrete(6).valor, 8, '6,0 km = R$ 8');
    eq(calcFrete(7).status, 'consultar', '7 km (>6) = consultar');
    eq(calcFrete(0).status, 'gratis', '0 km = gratis');
    eq(calcFrete('x').status, 'indef', 'nao-numero = indef (fallback)');
  },
  'B10 — montarEndereco_: texto do ViaCEP (campos nao-vazios + Brasil)'() {
    eq(montarEndereco_({ logradouro: 'Rua Açucena', bairro: 'Parque Imperial', localidade: 'Barueri', uf: 'SP' }),
      'Rua Açucena, Parque Imperial, Barueri, SP, Brasil', 'todos os campos presentes');
    eq(montarEndereco_({ logradouro: '', bairro: '', localidade: 'Barueri', uf: 'SP' }),
      'Barueri, SP, Brasil', 'CEP generico (logradouro/bairro vazios) -> cidade, UF, Brasil');
    eq(montarEndereco_({ logradouro: '', bairro: '', localidade: '', uf: 'SP' }),
      'SP, Brasil', 'so uf -> "SP, Brasil" (nunca vazio nem so "Brasil" sem cidade)');
    eq(montarEndereco_({}), 'Brasil', 'tudo vazio -> "Brasil" (enderecoDoCep_ rejeita esse caso)');
    ok(montarEndereco_({ uf: 'SP' }) !== '' && montarEndereco_({ uf: 'SP' }) !== 'Brasil',
      'com algum campo, nunca retorna vazio nem so "Brasil"');
    eq(montarEndereco_({ logradouro: '  Av. Teste  ', localidade: 'X', uf: 'sp' }),
      'Av. Teste, X, sp, Brasil', 'faz trim dos campos');
  },
  'B11 — formatItens_: redacao "{qtd}x {tipo} ({tamanho})" juntada por "; " + sanitizacao'() {
    eq(formatItens_([{ tipo: 'Caldo Cremoso de Frango', tamanho: 'Grande', qtd: 2 },
                     { tipo: 'Caldo Verde', tamanho: 'Pequeno', qtd: 1 }]),
      '2x Caldo Cremoso de Frango (Grande); 1x Caldo Verde (Pequeno)', 'dois itens juntos por "; "');
    eq(formatItens_([{ tipo: 'Caldo Verde', tamanho: 'Pequeno', qtd: 3 }]),
      '3x Caldo Verde (Pequeno)', 'um item');
    eq(formatItens_([{ tipo: '=SUM(A1)', tamanho: 'Grande', qtd: 1 }]),
      "1x '=SUM(A1) (Grande)", 'tipo iniciando com = e sanitizado (apostrofo do anti-formula)');
    eq(formatItens_([]), '', 'lista vazia -> string vazia');
    eq(formatItens_('nao-array'), '', 'entrada nao-array -> string vazia');
  }
};

(async () => {
  console.log('== Logica pura (Entregas C+D) — seguranca + calcFrete ==');
  for (const [name, fn] of Object.entries(tests)) {
    console.log('');
    console.log(name);
    try { fn(); } catch (e) { fail++; fails.push(name + ' threw: ' + e.message); console.log('  FAIL excecao: ' + e.stack); }
  }
  console.log('');
  console.log('---------------------------------------');
  console.log('RESULTADO: ' + pass + ' passaram, ' + fail + ' falharam');
  if (fail) { console.log('Falhas:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
  else console.log('TODOS OS TESTES PASSARAM');
})();
