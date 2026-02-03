// Direct Migration: Firestore to MySQL via API
// This script uses the existing Firebase connection in the browser
// Run this in browser console or create a simple HTML page

// Since we can't directly access Firestore from Node.js without Admin SDK,
// we'll use a browser-based approach

console.log(`
==========================================
Firestore to MySQL Migration Guide
==========================================

Method 1: Browser Export (Recommended)
----------------------------------------
1. Open: http://localhost:3000/export-firestore-data.html
2. Click "Export All" button
3. Download the JSON files
4. Run: node migrate-from-json.js

Method 2: Direct API Migration
--------------------------------
If you have Firebase Admin SDK service account key:
1. Place firebase-service-account-key.json in project root
2. Run: node migrate-firestore-to-mysql.js

Method 3: Manual Export via Browser Console
---------------------------------------------
1. Open your app in browser
2. Open browser console (F12)
3. Run the export commands below
`);

