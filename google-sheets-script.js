/**
 * SCRIPT PARA O GOOGLE APPS SCRIPT (CONEXÃO COM GOOGLE PLANILHAS)
 * Casamento Izabela & Ivan
 * 
 * COMO USAR:
 * 1. Abra uma nova Planilha no Google Sheets (planilhas.google.com).
 * 2. Clique no menu Extensões > Apps Script.
 * 3. Apague qualquer código existente no editor e cole todo o conteúdo deste arquivo.
 * 4. Clique em Implantar (botão azul no canto superior direito) > Nova implantação.
 * 5. Clique no ícone de engrenagem ao lado de Selecione o tipo e escolha Aplicativo da Web.
 * 6. Preencha:
 *    - Descrição: API Casamento Izabela e Ivan
 *    - Executar como: Eu (seu email)
 *    - Quem pode acessar: Qualquer pessoa (Anyone)
 * 7. Clique em Implantar, conceda as permissões da sua conta Google e COPIE a URL do aplicativo da Web.
 * 8. Cole essa URL no painel admin.html (Nuvem / Planilha) do site!
 */

const SHEET_NAME = Respostas;

function setupSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      ID,
      Data/Hora,
      Nome Completo,
      WhatsApp,
      Presença,
      Total Pessoas,
      Acompanhantes,
      Recado dos Noivos
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight(bold).setBackground(#220308).setFontColor(#FFE082);
    sheet.setFrozenRows(1);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  setupSheet(sheet);
  return sheet;
}

// Recebe novos RSVPs enviados pelo site
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = getOrCreateSheet();
    const data = JSON.parse(e.postData.contents);

    const row = [
      data.id || (rsvp_ + Date.now()),
      data.createdAt || new Date().toISOString(),
      data.fullName || ",
 data.phone || ,
 data.attending === yes ? SIM : NÃO,
 data.attending === yes ? (data.guestsCount || 1) : 0,
 data.guestsNames || ,
 data.message || 
 ];

 sheet.appendRow(row);

 return ContentService
 .createTextOutput(JSON.stringify({ success: true, id: data.id }))
 .setMimeType(ContentService.MimeType.JSON);

 } catch (error) {
 return ContentService
 .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
 .setMimeType(ContentService.MimeType.JSON);
 } finally {
 lock.releaseLock();
 }
}

// Retorna todos os RSVPs cadastrados para o painel admin
function doGet(e) {
 try {
 const sheet = getOrCreateSheet();
 const rows = sheet.getDataRange().getValues();

 if (rows.length <= 1) {
 return ContentService
 .createTextOutput(JSON.stringify([]))
 .setMimeType(ContentService.MimeType.JSON);
 }

 const rsvps = [];
 for (let i = 1; i < rows.length; i++) {
 const r = rows[i];
 rsvps.push({
 id: String(r[0]),
 createdAt: r[1],
 fullName: r[2],
 phone: r[3],
 attending: String(r[4]).toUpperCase().includes(SIM) ? yes : no,
 guestsCount: Number(r[5]) || 0,
 guestsNames: r[6],
 message: r[7]
 });
 }

 // Ordena mais recentes primeiro
 rsvps.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

 return ContentService
 .createTextOutput(JSON.stringify(rsvps))
 .setMimeType(ContentService.MimeType.JSON);

 } catch (error) {
 return ContentService
 .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
 .setMimeType(ContentService.MimeType.JSON);
 }
}
