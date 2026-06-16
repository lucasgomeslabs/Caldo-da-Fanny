/* Testes do Bloco 1 (CEP + ViaCEP) — roda o inline JS real de index.html
   dentro de um DOM (jsdom), com fetch mockado. Cobre máscara, validação,
   autofill, edição manual, falha não-bloqueante e a mensagem do WhatsApp.

   Como rodar:
     npm install jsdom          (uma vez)
     node tests/run-tests.mjs

   Obs.: o DOM/JS testado está em tests/harness.html (snapshot do inline de
   frontend/index.html). Se editar o index.html, atualize o harness. */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./harness.html', import.meta.url), 'utf8');
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));
const q = (w, s) => w.document.querySelector(s);

function makeDom(fetchImpl) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://localhost/' });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.fetch = fetchImpl || (() => Promise.reject(new Error('sem fetch')));
  // D-front: o fetchDistanciaKm real usa AbortController; garante que exista no ambiente jsdom.
  window.AbortController = window.AbortController || globalThis.AbortController ||
    class { constructor(){ this.signal = {}; } abort(){} };
  return window;
}
async function typeCep(w, digits) {
  const cep = q(w, '[name="cep"]');
  cep.value = digits;
  cep.dispatchEvent(new w.Event('input', { bubbles: true }));
  await tick(); await tick();
}
function pick(w, sel) {
  const el = q(w, sel); el.checked = true;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}
function submit(w) {
  q(w, '#form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
}
// E1 (carrinho): clica o stepper [+]/[-] do item `id` n vezes (default 1).
function addItem(w, id, n = 1) { const b = q(w, '.plus[data-id="' + id + '"]'); for (let i = 0; i < n; i++) b.click(); }
function removeItem(w, id, n = 1) { const b = q(w, '.minus[data-id="' + id + '"]'); for (let i = 0; i < n; i++) b.click(); }
const okData = () => Promise.resolve({ ok: true, json: async () => (
  { logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }) });
// fetch que distingue ViaCEP de Nominatim pela URL (p/ exercitar o fetchDistanciaKm real).
const routerFetch = (viacep, nominatim) => (url) =>
  Promise.resolve({ ok: true, json: async () => (String(url).includes('nominatim') ? nominatim : viacep) });

let pass = 0, fail = 0; const fails = [];
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; fails.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, `${msg}  (esperado ${JSON.stringify(b)}, obtido ${JSON.stringify(a)})`); }

const tests = {
  async 'T1 — máscara 00000-000 e só números'() {
    const w = makeDom();
    const cep = q(w, '[name="cep"]');
    cep.value = '01001000'; cep.dispatchEvent(new w.Event('input', { bubbles: true }));
    eq(cep.value, '01001-000', 'formata 8 dígitos como 00000-000');
    cep.value = 'ab12.345-678xy'; cep.dispatchEvent(new w.Event('input', { bubbles: true }));
    eq(cep.value, '12345-678', 'remove não-dígitos e limita a 8');
    cep.value = '123'; cep.dispatchEvent(new w.Event('input', { bubbles: true }));
    eq(cep.value, '123', 'menos de 6 dígitos: sem hífen');
  },

  async 'T2 — ViaCEP preenche endereço/bairro/cidade/UF'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.resolve(2);   // mock: não bate na rede (Nominatim)
    await typeCep(w, '01001000');
    eq(q(w, '[name="endereco"]').value, 'Praça da Sé', 'endereço (logradouro) preenchido');
    eq(q(w, '[name="bairro_cep"]').value, 'Sé', 'bairro preenchido');
    eq(q(w, '[name="cidade"]').value, 'São Paulo', 'cidade preenchida');
    eq(q(w, '[name="uf"]').value, 'SP', 'UF preenchida');
    ok(q(w, '#cepStatus').className.includes('ok'), 'status de sucesso (classe ok)');
  },

  async 'T3 — edição manual é preservada; campo não editado atualiza'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.resolve(2);   // mock: não bate na rede (Nominatim)
    await typeCep(w, '01001000');
    q(w, '[name="cidade"]').value = 'Cidade Editada';            // usuário edita
    w.fetch = () => Promise.resolve({ ok: true, json: async () => (
      { logradouro: 'Av Nova', bairro: 'Bairro Novo', localidade: 'Outra', uf: 'RJ' }) });
    await typeCep(w, '20040002');                                 // novo CEP
    eq(q(w, '[name="cidade"]').value, 'Cidade Editada', 'cidade editada NÃO é sobrescrita');
    eq(q(w, '[name="endereco"]').value, 'Av Nova', 'endereço não editado é atualizado');
    eq(q(w, '[name="uf"]').value, 'RJ', 'UF não editada é atualizada');
  },

  async 'T4 — CEP inexistente (erro:true) não bloqueia o pedido'() {
    const w = makeDom(() => Promise.resolve({ ok: true, json: async () => ({ erro: true }) }));
    await typeCep(w, '99999999');
    eq(q(w, '[name="cidade"]').value, '', 'não preenche cidade');
    ok(q(w, '#cepStatus').className.includes('warn'), 'status de aviso (warn)');
    q(w, '[name="nome"]').value = 'Maria';
    q(w, '[name="telefone"]').value = '11999998888';
    q(w, '[name="endereco"]').value = 'Rua X';
    q(w, '[name="numero"]').value = '100';
    addItem(w, 'verde-g');
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    eq(q(w, '#done').style.display, 'block', 'pedido concluído mesmo sem ViaCEP');
    ok(decodeURIComponent(q(w, '#waLink').href).includes('*CEP:* 99999-999'),
       'mensagem inclui o CEP digitado manualmente');
  },

  async 'T5 — falha de rede do ViaCEP não bloqueia o pedido'() {
    const w = makeDom(() => Promise.reject(new Error('network down')));
    await typeCep(w, '01001000');
    ok(q(w, '#cepStatus').className.includes('warn'), 'status warn em falha de rede');
    eq(q(w, '[name="cidade"]').value, '', 'sem autofill em falha de rede');
    q(w, '[name="nome"]').value = 'João';
    q(w, '[name="telefone"]').value = '11988887777';
    q(w, '[name="endereco"]').value = 'Rua Y';
    q(w, '[name="numero"]').value = '50';
    addItem(w, 'mandioca-p');
    pick(w, '[name="pagamento"][value="Dinheiro"]');
    submit(w); await tick(); await tick();
    eq(q(w, '#done').style.display, 'block', 'pedido concluído apesar da falha de rede');
  },

  async 'T6 — validação exige exatamente 8 dígitos'() {
    const w = makeDom(() => Promise.reject(new Error('x')));
    q(w, '[name="nome"]').value = 'Ana';
    q(w, '[name="telefone"]').value = '11977776666';
    q(w, '[name="endereco"]').value = 'Rua Z';
    q(w, '[name="numero"]').value = '1';
    addItem(w, 'verde-g');
    pick(w, '[name="pagamento"][value="PIX"]');
    const cep = q(w, '[name="cep"]');
    cep.value = '12345'; cep.dispatchEvent(new w.Event('input', { bubbles: true }));   // 5 dígitos
    submit(w); await tick();
    ok(q(w, '#done').style.display !== 'block', 'CEP com 5 dígitos bloqueia o envio');
    ok(q(w, '[name="cep"]').closest('.field').classList.contains('invalid'), 'campo CEP marcado inválido');
    cep.value = '12345678'; cep.dispatchEvent(new w.Event('input', { bubbles: true })); // 8 dígitos
    await tick();
    submit(w); await tick(); await tick();
    eq(q(w, '#done').style.display, 'block', 'com 8 dígitos o envio é liberado');
  },

  async 'T7 — mensagem completa e invariáveis (WhatsApp/preço intactos)'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.resolve(2);   // distância mockada (2 km = frete grátis)
    await typeCep(w, '01001000'); await tick();
    q(w, '[name="nome"]').value = 'Maria Silva';
    q(w, '[name="telefone"]').value = '11999990000';
    q(w, '[name="endereco"]').value = 'Praça da Sé';
    q(w, '[name="numero"]').value = '200';
    addItem(w, 'verde-g');
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    const href = q(w, '#waLink').href;
    const msg = decodeURIComponent(href);
    ok(href.startsWith('https://wa.me/5511937223540?text='), 'número do WhatsApp inalterado');
    ok(msg.includes('*Endereço:* Praça da Sé, 200'), 'mensagem com Endereço: rua, número');
    ok(msg.includes('*CEP:* 01001-000'), 'mensagem com CEP formatado');
    ok(msg.includes('*Cidade/UF:* São Paulo/SP'), 'mensagem com Cidade/UF');
    ok(msg.includes('*Bairro:* Sé'), 'mensagem com bairro do CEP');
    ok(msg.includes('• 1x Caldo Verde (Grande)'), 'mensagem com a linha do item');
    ok(msg.includes('*Subtotal:* R$ 28,00'), 'mensagem com Subtotal (Verde Grande)');
    ok(msg.includes('*Frete:* Grátis (2,0 km)'), 'mensagem com Frete (grátis, 2,0 km)');
    ok(msg.includes('*Total:* R$ 28,00'), 'total com 1 item (R$ 28,00)');
    ok(/^#\d{3}$/.test(q(w, '#donePid').textContent), 'id do pedido no formato #NNN');
  },

  async 'T8 — frete por distância (tabela em degraus)'() {
    async function freteCase(km){
      const w = makeDom(okData);
      w.fetchDistanciaKm = () => Promise.resolve(km);
      addItem(w, 'verde-g');                 // 1 × R$ 28,00 (subtotal base do total)
      await typeCep(w, '01001000'); await tick();
      return { frete: q(w, '#sumFrete').textContent, total: q(w, '#sumTotal').textContent };
    }
    let r;
    r = await freteCase(2);   eq(r.frete, 'Grátis', '2,0 km = Grátis'); eq(r.total, 'R$ 28,00', '2 km: total = subtotal');
    r = await freteCase(2.5); eq(r.frete, 'R$ 4,00', '2,5 km = R$ 4,00'); eq(r.total, 'R$ 32,00', '2,5 km: total = subtotal + 4');
    r = await freteCase(3);   eq(r.frete, 'R$ 4,00', '3,0 km = R$ 4,00 (borda)');
    r = await freteCase(3.5); eq(r.frete, 'R$ 6,00', '3,5 km = R$ 6,00');
    r = await freteCase(5);   eq(r.frete, 'R$ 6,00', '5,0 km = R$ 6,00 (borda)');
    r = await freteCase(5.5); eq(r.frete, 'Consultar pelo WhatsApp', '5,5 km = consultar');
    r = await freteCase(7);   eq(r.frete, 'Consultar pelo WhatsApp', '7 km = consultar'); eq(r.total, 'A confirmar', '7 km: total a confirmar');
  },

  async 'T9 — falha do geocode não bloqueia (frete a confirmar)'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.reject(new Error('geocode down'));
    await typeCep(w, '01001000'); await tick();
    eq(q(w, '#sumFrete').textContent, 'A confirmar pelo WhatsApp', 'frete a confirmar quando o geocode falha');
    q(w, '[name="nome"]').value = 'Ana'; q(w, '[name="telefone"]').value = '11999998888';
    q(w, '[name="endereco"]').value = 'Rua X'; q(w, '[name="numero"]').value = '10';
    addItem(w, 'verde-g'); pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    eq(q(w, '#done').style.display, 'block', 'pedido finaliza apesar da falha do geocode');
    ok(decodeURIComponent(q(w, '#waLink').href).includes('*Frete:* A confirmar pelo WhatsApp'), 'mensagem com frete a confirmar');
  },

  async 'T10 — Haversine: distância em linha reta (km)'() {
    const w = makeDom();
    const h = w.haversineKm;
    eq(h(0,0,0,0), 0, 'mesma coordenada = 0 km');
    ok(Math.abs(h(0,0,1,0) - 111.1949) < 0.1, '1° de latitude ≈ 111,19 km  (obtido ' + h(0,0,1,0).toFixed(4) + ')');
    // ATENÇÃO: literal da base copiado de BASE_LONLAT (const não vai p/ window). Se mudar a base no index.html/harness, ATUALIZAR este valor.
    const km = h(-23.478, -46.806, -23.494849, -46.800028); // base → R. Alberto Xavier de Toledo
    ok(Math.abs(km - 2.0) < 0.15, 'base → R. Alberto Xavier de Toledo ≈ 2,0 km  (obtido ' + km.toFixed(2) + ')');
  },

  async 'T11 — trava: geocode > 30 km da base => a confirmar'() {
    const via = { logradouro: 'Rua X', bairro: 'B', localidade: 'Osasco', uf: 'SP' };
    const w = makeDom(routerFetch(via, [{ lat: '-8.79475', lon: '-63.88329' }])); // Porto Velho (~2500 km)
    await typeCep(w, '06253230'); await tick(); await tick(); await tick();
    eq(q(w, '#sumFrete').textContent, 'A confirmar pelo WhatsApp', 'coords > 30 km => frete a confirmar');
  },

  async 'T12 — trava: geocode vazio => a confirmar'() {
    const via = { logradouro: 'Rua X', bairro: 'B', localidade: 'Osasco', uf: 'SP' };
    const w = makeDom(routerFetch(via, [])); // Nominatim sem resultados
    await typeCep(w, '06253230'); await tick(); await tick(); await tick();
    eq(q(w, '#sumFrete').textContent, 'A confirmar pelo WhatsApp', 'geocode vazio => frete a confirmar');
  },

  async 'T13 — carrinho: soma de itens e msg em N linhas'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.resolve(2);   // 2 km = frete grátis
    addItem(w, 'frango-p', 1);   // 1 × 12,00
    addItem(w, 'verde-g', 2);    // 2 × 28,00 = 56,00
    await typeCep(w, '01001000'); await tick();
    eq(q(w, '#sumSub').textContent, 'R$ 68,00', 'subtotal = 12 + 56');
    eq(q(w, '#sumTotal').textContent, 'R$ 68,00', 'total = subtotal (frete grátis 2 km)');
    q(w, '[name="nome"]').value = 'Bia'; q(w, '[name="telefone"]').value = '11999990000';
    q(w, '[name="endereco"]').value = 'Rua A'; q(w, '[name="numero"]').value = '1';
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    const msg = decodeURIComponent(q(w, '#waLink').href);
    ok(msg.includes('• 1x Caldo Cremoso de Frango (Pequeno)'), 'msg com linha do Frango Pequeno');
    ok(msg.includes('• 2x Caldo Verde (Grande)'), 'msg com linha do Verde Grande');
    ok(msg.includes('*Subtotal:* R$ 68,00'), 'msg com subtotal somado');
  },

  async 'T14 — stepper por item: piso 0 e teto 20'() {
    const w = makeDom();
    removeItem(w, 'verde-p', 1);                         // já em 0 -> continua 0
    eq(q(w, '#q-verde-p').textContent, '0', 'minus em 0 mantém 0');
    addItem(w, 'verde-p', 25);                           // tenta passar de 20
    eq(q(w, '#q-verde-p').textContent, '20', 'plus respeita o teto 20');
  },

  async 'T15 — #done: resumo (itens + subtotal/frete/total) e aviso oculto'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.resolve(2);   // 2 km = frete grátis
    addItem(w, 'frango-p', 1);   // 12,00
    addItem(w, 'verde-g', 2);    // 56,00
    await typeCep(w, '01001000'); await tick();
    q(w, '[name="nome"]').value = 'Bia'; q(w, '[name="telefone"]').value = '11999990000';
    q(w, '[name="endereco"]').value = 'Rua A'; q(w, '[name="numero"]').value = '1';
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    const itensTxt = q(w, '#doneItens').textContent;
    ok(itensTxt.includes('1x Caldo Cremoso de Frango (Pequeno)'), '#done lista o Frango Pequeno');
    ok(itensTxt.includes('2x Caldo Verde (Grande)'), '#done lista o Verde Grande');
    ok(itensTxt.includes('R$ 12,00') && itensTxt.includes('R$ 56,00'), '#done mostra preço por linha (12 e 56)');
    eq(q(w, '#doneSub').textContent, 'R$ 68,00', '#done subtotal');
    eq(q(w, '#doneFrete').textContent, 'Grátis', '#done frete sem km');
    eq(q(w, '#doneTotal').textContent, 'R$ 68,00', '#done total');
    eq(q(w, '#doneAviso').style.display, 'none', 'aviso oculto com frete normal');
  },

  async 'T16 — #done: aviso visível quando frete indefinido'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.reject(new Error('geocode down'));   // status indef
    addItem(w, 'verde-g', 1);
    await typeCep(w, '01001000'); await tick();
    q(w, '[name="nome"]').value = 'Ana'; q(w, '[name="telefone"]').value = '11999998888';
    q(w, '[name="endereco"]').value = 'Rua X'; q(w, '[name="numero"]').value = '10';
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    eq(q(w, '#doneAviso').style.display, 'block', 'aviso visível com frete a confirmar');
    eq(q(w, '#doneFrete').textContent, 'A confirmar pelo WhatsApp', '#done frete a confirmar (sem km)');
  },

  async 'T17 — "Refazer pedido" preserva dados e carrinho'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.resolve(2);
    addItem(w, 'verde-g', 2);
    await typeCep(w, '01001000'); await tick();
    q(w, '[name="nome"]').value = 'Caio'; q(w, '[name="telefone"]').value = '11999991111';
    q(w, '[name="endereco"]').value = 'Rua B'; q(w, '[name="numero"]').value = '7';
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    eq(q(w, '#done').style.display, 'block', 'foi para a revisão');
    q(w, '#again').click();
    eq(q(w, '#form').style.display, 'block', 'voltou ao form');
    eq(q(w, '#done').style.display, 'none', '#done escondido');
    eq(q(w, '[name="nome"]').value, 'Caio', 'nome preservado');
    eq(q(w, '[name="telefone"]').value, '11999991111', 'telefone preservado');
    eq(q(w, '#q-verde-g').textContent, '2', 'carrinho preservado');
    eq(q(w, '#btnText').textContent, 'REVISAR PEDIDO', 'btn restaurado para REVISAR PEDIDO');
  },
};

(async () => {
  console.log('== Bloco 1 — CEP + ViaCEP (jsdom) ==');
  for (const [name, fn] of Object.entries(tests)) {
    console.log('\n' + name);
    try { await fn(); } catch (e) { fail++; fails.push(name + ' threw: ' + e.message); console.log('  ✗ exceção: ' + e.stack); }
  }
  console.log(`\n---------------------------------------`);
  console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
  if (fail) { console.log('Falhas:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
  else console.log('TODOS OS TESTES PASSARAM ✓');
})();
