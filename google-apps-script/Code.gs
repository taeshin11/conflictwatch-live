/**
 * ConflictWatch Analytics — Google Apps Script
 * Receives POST requests from the frontend and logs to Google Sheets.
 *
 * Deployment:
 * 1. Create a new Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy > New Deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into js/config.js SHEET_WEBHOOK_URL
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.query || '',
      JSON.stringify(data.filters) || '',
      data.region || '',
      data.userAgent || '',
      data.referrer || ''
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok' })
    ).setMIMEType(ContentService.MIMEType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMIMEType(ContentService.MIMEType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'ConflictWatch Analytics endpoint active' })
  ).setMIMEType(ContentService.MIMEType.JSON);
}

/**
 * Run once to set up column headers
 */
function setupHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange(1, 1, 1, 6).setValues([[
    'Timestamp', 'Search Query', 'Filters Applied', 'Region', 'User Agent', 'Referrer'
  ]]);
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
}
