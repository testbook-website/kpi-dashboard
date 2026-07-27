# Team KPI Dashboard

A live KPI dashboard web application for the content-writing team. It pulls data directly from the Google Sheet and calculates elapsed/remaining working days to show Current and Required Run Rates.

## Setup

1. **Install Dependencies**
   Make sure you have Node.js installed. Open a terminal in this project folder and run:
   ```bash
   npm install
   ```

2. **Service Account Setup**
   Ensure your `service.json` file is present in the root of the project (same directory as `server.js`). The email inside this JSON file must have "Viewer" access to the Google Sheet.

3. **Start the Server**
   Run the following command to start the backend:
   ```bash
   node server.js
   ```

4. **View the Dashboard**
   Open your browser and navigate to:
   http://localhost:3000

## Features
- Fetches live data from the "Summary" and "Day-Wise" tabs.
- Calculates total working days elapsed vs remaining for accurate run rates.
- Responsive, modern dashboard design with vanilla CSS.
- Sortable columns and highlighting for "Behind" status writers.
- Refresh button to manually pull the latest data.
