const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SPREADSHEET_ID = '1ihLeB9ZOJdaF841qGLoTWBULSRNsF9BjtxUXRxKuK2A';
const SHEET_NAME = 'Daily Work Report AMJ';

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let auth;
        // Vercel Environment Variables
        if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
        } else {
            // Local fallback
            const keyPath = path.join(process.cwd(), 'service.json');
            if (fs.existsSync(keyPath)) {
                auth = new google.auth.GoogleAuth({
                    keyFile: keyPath,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
                });
            } else {
                return res.status(500).json({ error: 'Google credentials not configured. Please add service.json or set Vercel Environment Variables.' });
            }
        }

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: SPREADSHEET_ID,
            ranges: [SHEET_NAME, 'Daily Word Count <AMJ>'],
        });

        const summaryData = response.data.valueRanges[0].values;
        const wordcountData = response.data.valueRanges[1]?.values;
        if (!summaryData) {
            return res.status(500).json({ error: 'Missing data in sheet' });
        }

        // Calculate 66 working days elapsed/remaining for JAS quarter
        const quarterStart = new Date('2026-07-01T00:00:00');
        const quarterEnd = new Date('2026-09-30T23:59:59');
        const today = new Date();
        
        let calcEnd = today > quarterEnd ? quarterEnd : today;
        let elapsed = 0;
        
        if (calcEnd >= quarterStart) {
            let curDate = new Date(quarterStart.getTime());
            while (curDate <= calcEnd) {
                const dayOfWeek = curDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) elapsed++;
                curDate.setDate(curDate.getDate() + 1);
            }
        }
        
        const remaining = Math.max(0, 66 - elapsed);

        const rowIndices = {};
        for (let i = 0; i < summaryData.length; i++) {
            const label = summaryData[i][0];
            if (label) {
                rowIndices[label.toString().trim()] = i;
            }
        }

        let maxCols = 0;
        summaryData.forEach(row => { if (row.length > maxCols) maxCols = row.length; });

        const writers = [];

        // Assume row 1 has the writer names (Index 1) because the screenshot shows names on row 1
        let nameRowIndex = 0;
        for (let i = 0; i < Math.min(10, summaryData.length); i++) {
            if (summaryData[i] && summaryData[i].some(val => val && val.toString().trim() === 'Aditi')) {
                nameRowIndex = i;
                break;
            }
        }

        // Map wordcount data
        const wcRowIndices = {};
        let wcNameRowIndex = 0;
        const wcColByName = {};
        
        if (wordcountData) {
            for (let i = 0; i < wordcountData.length; i++) {
                const label = wordcountData[i][0];
                if (label) wcRowIndices[label.toString().trim()] = i;
            }
            for (let i = 0; i < Math.min(10, wordcountData.length); i++) {
                if (wordcountData[i] && wordcountData[i].some(val => val && val.toString().trim() === 'Aditi')) {
                    wcNameRowIndex = i;
                    break;
                }
            }
            if (wordcountData[wcNameRowIndex]) {
                for (let c = 1; c < wordcountData[wcNameRowIndex].length; c++) {
                    const wname = wordcountData[wcNameRowIndex][c];
                    if (wname && wname.trim()) wcColByName[wname.trim()] = c;
                }
            }
        }

        for (let col = 1; col < maxCols; col++) {
            const writerName = summaryData[nameRowIndex] ? summaryData[nameRowIndex][col] : null;
            if (!writerName || writerName.trim() === '') continue;

            const getVal = (label) => {
                const rowIndex = rowIndices[label];
                if (rowIndex !== undefined && summaryData[rowIndex]) {
                    const val = summaryData[rowIndex][col];
                    if (!val) return 0;
                    const num = parseFloat(val.toString().replace(/,/g, '').replace(/%/g, '').trim());
                    return isNaN(num) ? 0 : num;
                }
                return 0;
            };

            const todayVal = getVal('Today');
            const julyVal = getVal('July');
            const augustVal = getVal('August');
            const septVal = getVal('September');
            const jasKpi = getVal('JAS KPI');

            const tillNow = julyVal + augustVal + septVal;
            const target = jasKpi;
            
            // Calculate wordcount
            let totalWordcount = 0;
            const writerCleanName = writerName.trim();
            const wcCol = wcColByName[writerCleanName];
            if (wcCol !== undefined && wordcountData) {
                const getWcVal = (label) => {
                    const rIdx = wcRowIndices[label];
                    if (rIdx !== undefined && wordcountData[rIdx]) {
                        const val = wordcountData[rIdx][wcCol];
                        if (!val) return 0;
                        const num = parseFloat(val.toString().replace(/,/g, '').replace(/%/g, '').trim());
                        return isNaN(num) ? 0 : num;
                    }
                    return 0;
                };
                totalWordcount = getWcVal('July') + getWcVal('August') + getWcVal('September');
            }
            
            const avgWordcount = tillNow > 0 ? (totalWordcount / tillNow).toFixed(0) : 0;
            
            const currentRunRate = elapsed > 0 ? (tillNow / elapsed) : 0;
            
            let requiredRunRateNum = 0;
            let requiredRunRateDisplay = '-';
            let status = 'BEHIND';

            if (remaining > 0) {
                requiredRunRateNum = (target - tillNow) / remaining;
                requiredRunRateDisplay = requiredRunRateNum.toFixed(1);
                status = currentRunRate >= requiredRunRateNum ? 'ON TRACK' : 'BEHIND';
            } else {
                status = tillNow >= target ? 'ON TRACK' : 'BEHIND';
            }

            writers.push({
                name: writerName,
                target: target,
                achievedToday: todayVal,
                tillNow: tillNow,
                totalWordcount: totalWordcount,
                avgWordcount: avgWordcount,
                currentRunRate: currentRunRate.toFixed(1),
                requiredRunRate: requiredRunRateDisplay,
                status: status
            });
        }

        res.status(200).json({ elapsed, remaining, writers });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
};
