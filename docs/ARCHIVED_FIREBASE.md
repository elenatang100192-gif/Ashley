# Archived: Firebase/Firestore Documentation

> **Note**: This project has been migrated from Firebase Firestore to MySQL.  
> Firebase-related files are kept for reference but are no longer used.

## Archived Files

- `firebase-config.js` - Firebase configuration (not loaded when USE_MYSQL=true)
- `firebase-db.js` - Firebase database operations (not loaded when USE_MYSQL=true)
- `FIRESTORE_CONNECTION_FIX.md` - Firestore connection troubleshooting (archived)
- `FIREBASE_SETUP.md` - Firebase setup guide (archived)
- `FIREBASE_404_ERRORS.md` - Firebase 404 errors guide (archived)

## Migration Status

✅ **Completed**: All data has been migrated from Firestore to MySQL  
✅ **Status**: Application now uses MySQL database exclusively  
⚠️ **Legacy Code**: Firebase code remains in codebase but is disabled

## Current Configuration

```javascript
// script.js
const USE_FIREBASE = false;  // Firebase disabled
const USE_MYSQL = true;      // MySQL enabled
```

## If You Need to Re-enable Firebase

1. Set `USE_FIREBASE = true` in `script.js`
2. Set `USE_MYSQL = false` in `script.js`
3. Ensure Firebase configuration is correct in `firebase-config.js`
4. Firebase SDK is still loaded in `index.html` (for compatibility)

## Migration History

- **Date**: 2024-11-27
- **Method**: Browser-based export from Firestore, import to MySQL
- **Data Migrated**: 52 menu items, 0 orders, 0 hidden restaurants
- **Status**: Successfully completed

For migration details, see `MYSQL_MIGRATION.md` and `MIGRATION_COMPLETE.md`.

