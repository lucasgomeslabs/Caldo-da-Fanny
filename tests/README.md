# Testes — Bloco 1 (CEP + ViaCEP)

Testes de integração que rodam o JavaScript real do formulário dentro de um DOM
(via [jsdom](https://github.com/jsdom/jsdom)), com o `fetch` do ViaCEP mockado.

## Como rodar

```bash
npm install jsdom      # uma única vez
node tests/run-tests.mjs
```

## O que é coberto (7 cenários / 28 verificações)

- **T1 — Máscara:** formata `00000-000`, remove não-dígitos e limita a 8 dígitos.
- **T2 — ViaCEP OK:** preenche endereço (logradouro), bairro, cidade e UF.
- **T3 — Edição manual:** campo editado pelo cliente não é sobrescrito; campo não
  editado é atualizado num novo CEP.
- **T4 — CEP inexistente (`erro:true`):** não preenche, mostra aviso e **não bloqueia**
  o pedido.
- **T5 — Falha de rede:** ViaCEP indisponível mostra aviso e **não bloqueia** o pedido.
- **T6 — Validação:** exige exatamente 8 dígitos para enviar.
- **T7 — Mensagem:** WhatsApp recebe CEP, Cidade/UF, Bairro e Área de entrega; número
  do WhatsApp e preço permanecem intactos.

## Observações

- `harness.html` contém um **snapshot** do DOM + inline script de
  `../frontend/index.html`. Ao alterar o `index.html`, atualize o harness para manter
  os testes fiéis.
- Há também um teste ao vivo opcional do ViaCEP (rede real). Em ambientes sem acesso
  à internet ele é ignorado; os testes com mock já validam o contrato da API
  (`logradouro` / `bairro` / `localidade` / `uf` / `erro`).
