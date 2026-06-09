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
const okData = () => Promise.resolve({ ok: true, json: async () => (
  { logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }) });

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
    await typeCep(w, '01001000');
    eq(q(w, '[name="endereco"]').value, 'Praça da Sé', 'endereço (logradouro) preenchido');
    eq(q(w, '[name="bairro_cep"]').value, 'Sé', 'bairro preenchido');
    eq(q(w, '[name="cidade"]').value, 'São Paulo', 'cidade preenchida');
    eq(q(w, '[name="uf"]').value, 'SP', 'UF preenchida');
    ok(q(w, '#cepStatus').className.includes('ok'), 'status de sucesso (classe ok)');
  },

  async 'T3 — edição manual é preservada; campo não editado atualiza'() {
    const w = makeDom(okData);
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
    pick(w, '[name="caldo"][value="Caldo Verde"]');
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
    pick(w, '[name="caldo"][value="Caldo de Mandioca"]');
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
    pick(w, '[name="caldo"][value="Caldo Verde"]');
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
    pick(w, '[name="caldo"][value="Caldo Verde"]');
    pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    const href = q(w, '#waLink').href;
    const msg = decodeURIComponent(href);
    ok(href.startsWith('https://wa.me/5511937223540?text='), 'número do WhatsApp inalterado');
    ok(msg.includes('*Endereço:* Praça da Sé, 200'), 'mensagem com Endereço: rua, número');
    ok(msg.includes('*CEP:* 01001-000'), 'mensagem com CEP formatado');
    ok(msg.includes('*Cidade/UF:* São Paulo/SP'), 'mensagem com Cidade/UF');
    ok(msg.includes('*Bairro:* Sé'), 'mensagem com bairro do CEP');
    ok(msg.includes('*Subtotal:* R$ 24,90'), 'mensagem com Subtotal');
    ok(msg.includes('*Frete:* Grátis (2 km)'), 'mensagem com Frete (grátis, 2 km)');
    ok(msg.includes('*Total:* R$ 24,90'), 'preço inalterado (R$ 24,90)');
    ok(/^#\d{3}$/.test(q(w, '#donePid').textContent), 'id do pedido no formato #NNN');
  },

  async 'T8 — frete por distância (tabela em degraus)'() {
    async function freteCase(km){
      const w = makeDom(okData);
      w.fetchDistanciaKm = () => Promise.resolve(km);
      await typeCep(w, '01001000'); await tick();
      return { frete: q(w, '#sumFrete').textContent, total: q(w, '#sumTotal').textContent };
    }
    let r;
    r = await freteCase(2);   eq(r.frete, 'Grátis', '2 km = Grátis'); eq(r.total, 'R$ 24,90', '2 km: total = subtotal');
    r = await freteCase(3);   eq(r.frete, 'Grátis', '3 km = Grátis (limite inferior)');
    r = await freteCase(3.5); eq(r.frete, 'R$ 4,00', '3,5 km = R$ 4,00'); eq(r.total, 'R$ 28,90', '3,5 km: total = subtotal + 4');
    r = await freteCase(4.5); eq(r.frete, 'R$ 6,00', '4,5 km = R$ 6,00');
    r = await freteCase(5.5); eq(r.frete, 'R$ 8,00', '5,5 km = R$ 8,00');
    r = await freteCase(7);   eq(r.frete, 'Consultar pelo WhatsApp', '7 km = consultar'); eq(r.total, 'A confirmar', '7 km: total a confirmar');
  },

  async 'T9 — falha do ORS não bloqueia (frete a confirmar)'() {
    const w = makeDom(okData);
    w.fetchDistanciaKm = () => Promise.reject(new Error('ors down'));
    await typeCep(w, '01001000'); await tick();
    eq(q(w, '#sumFrete').textContent, 'A confirmar pelo WhatsApp', 'frete a confirmar quando o ORS falha');
    q(w, '[name="nome"]').value = 'Ana'; q(w, '[name="telefone"]').value = '11999998888';
    q(w, '[name="endereco"]').value = 'Rua X'; q(w, '[name="numero"]').value = '10';
    pick(w, '[name="caldo"][value="Caldo Verde"]'); pick(w, '[name="pagamento"][value="PIX"]');
    submit(w); await tick(); await tick();
    eq(q(w, '#done').style.display, 'block', 'pedido finaliza apesar da falha do ORS');
    ok(decodeURIComponent(q(w, '#waLink').href).includes('*Frete:* A confirmar pelo WhatsApp'), 'mensagem com frete a confirmar');
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
