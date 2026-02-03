# Firestore to MySQL Migration Steps

## Quick Start

### Option 1: Browser Export (Easiest)

1. **Start API Server** (if not running):
   ```bash
   node api-server.js
   ```

2. **Open Export Page**:
   - Open: http://localhost:3000/export-firestore-data.html
   - Click "Connect to Firestore"
   - Click "Export All"
   - Download the JSON files

3. **Run Migration**:
   ```bash
   node migrate-from-json.js
   ```

### Option 2: Browser Console Export

1. **Open your app** in browser (with Firebase loaded)
2. **Open browser console** (F12)
3. **Copy and paste** the code from `export-in-browser.js`
4. **Download** the JSON files
5. **Run migration**:
   ```bash
   node migrate-from-json.js
   ```

### Option 3: Firebase Admin SDK (Requires Service Account Key)

1. **Get Firebase Service Account Key**:
   - Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `firebase-service-account-key.json`

2. **Run Migration**:
   ```bash
   node migrate-firestore-to-mysql.js
   ```

## Verify Migration

After migration, verify data:

```bash
# Check menu items
curl http://localhost:3000/api/menu-items

# Check orders
curl http://localhost:3000/api/orders

# Check settings
curl http://localhost:3000/api/settings/hiddenRestaurants
```

## Troubleshooting

- **No JSON files**: Make sure you exported data first
- **Connection errors**: Check MySQL credentials and network
- **Table errors**: Run `node test-db-connection.js` to create tables
