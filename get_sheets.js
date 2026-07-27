const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1ihLeB9ZOJdaF841qGLoTWBULSRNsF9BjtxUXRxKuK2A';

async function run() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, 'service.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const targetSheet = response.data.sheets.find(s => s.properties.sheetId === 1233858249);
        console.log('Sheet with gid 1233858249 is:', targetSheet ? targetSheet.properties.title : 'Not Found');
        
        response.data.sheets.forEach(s => {
            console.log(s.properties.title, s.properties.sheetId);
        });

    } catch (e) {
        console.error(e.message);
    }
}
run();
