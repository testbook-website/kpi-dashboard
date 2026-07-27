const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const kpiHandler = require('../api/kpi');

const app = express();
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Route the API call to our Vercel-compatible handler
app.get('/api/kpi', (req, res) => kpiHandler(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
