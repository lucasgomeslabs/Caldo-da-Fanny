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
 */

// Nome da aba onde os pedidos serão gravados:
const ABA = "Pedidos";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000); // evita pedidos simultâneos gravando errado

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ABA);

    // Cria a aba e o cabeçalho na primeira vez
    if (!sheet) {
      sheet = ss.insertSheet(ABA);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Pedido", "Horário", "Nome", "Telefone", "Endereço",
        "Bairro", "Caldo", "Qtde", "Pagamento", "Observações", "Total", "Status"
      ]);
      sheet.getRange("A1:L1").setFontWeight("bold").setBackground("#c1440e").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    const d = JSON.parse(e.postData.contents);

    // Número oficial do pedido = quantidade de linhas já existentes
    const numero = sheet.getLastRow(); // 1 = só cabeçalho => 1º pedido vira #001
    const pid = "#" + String(numero).padStart(3, "0");

    sheet.appendRow([
      pid,
      d.horario || new Date().toLocaleString("pt-BR"),
      d.nome || "",
      d.telefone || "",
      d.endereco || "",
      d.bairro || "",
      d.caldo || "",
      d.qtde || "",
      d.pagamento || "",
      d.obs || "",
      d.total || "",
      "Recebido"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, pedido: pid }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, erro: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Permite testar a URL no navegador (deve mostrar "Caldo da Fanny — ativo")
function doGet() {
  return ContentService.createTextOutput("Caldo da Fanny — ativo");
}
