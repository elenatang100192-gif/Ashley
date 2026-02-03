# MySQL Migration Guide

This guide explains how to migrate the Menu Selection System from Firestore to MySQL.

## Overview

The migration involves:
1. Setting up MySQL database tables
2. Creating a backend API server
3. Updating frontend code to use MySQL API
4. Migrating existing data from Firestore to MySQL

## Prerequisites

- Node.js (v14 or higher)
- MySQL database access
- npm or yarn package manager

## Step 1: Create Database Tables

Run the SQL script to create the required tables:

```bash
mysql -h 116.6.239.70 -P 20010 -u u_order_menu -p order_menu < mysql-schema.sql
```

Or manually execute the SQL in `mysql-schema.sql` using your MySQL client.

## Step 2: Install Dependencies

Install Node.js dependencies for the API server:

```bash
npm install
```

This will install:
- express (web framework)
- mysql2 (MySQL driver)
- cors (CORS middleware)

## Step 3: Start API Server

Start the API server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The API server will run on `http://localhost:3000` by default.

## Step 4: Update Frontend Configuration

In `script.js`, change:

```javascript
const USE_FIREBASE = true;
```

to:

```javascript
const USE_FIREBASE = false;
const USE_MYSQL = true;
```

Update `index.html` to include the MySQL database module:

```html
<!-- Replace firebase-db.js with mysql-db.js -->
<script src="mysql-db.js"></script>
```

Update `mysql-db.js` to point to your API server URL:

```javascript
const MYSQL_CONFIG = {
    // ... other config ...
    API_BASE_URL: 'http://your-api-server-url/api' // Update this
};
```

## Step 5: Export Data from Firestore

Before migrating, export your data from Firestore:

1. Use Firebase Console to export data, or
2. Use the export functions in the app to download JSON files

Export:
- Menu items → `menu-items-export.json`
- Orders → `orders-export.json`
- Settings → `settings-export.json`

## Step 6: Migrate Data

Run the migration script:

```bash
node migrate-to-mysql.js
```

The script will:
- Read exported JSON files
- Insert data into MySQL tables
- Handle transactions and errors

## Step 7: Deploy API Server

Deploy the API server to a hosting service (e.g., Heroku, Railway, DigitalOcean):

1. Set environment variables if needed
2. Update `API_BASE_URL` in `mysql-db.js` to point to deployed API
3. Ensure MySQL database is accessible from the API server

## API Endpoints

The API server provides the following endpoints:

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Save menu items (batch)

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Save single order
- `POST /api/orders/batch` - Save multiple orders
- `DELETE /api/orders/:id` - Delete single order
- `DELETE /api/orders` - Delete all orders

### Settings
- `GET /api/settings/hiddenRestaurants` - Get hidden restaurants
- `PUT /api/settings/hiddenRestaurants` - Update hidden restaurants

### Health Check
- `GET /api/health` - Check API and database connection

## Differences from Firestore

1. **Real-time Updates**: MySQL uses polling (every 2 seconds) instead of real-time listeners
2. **API Required**: Frontend communicates with MySQL through REST API
3. **Backend Server**: Requires a Node.js server to handle database operations
4. **Connection**: Direct MySQL connection from frontend is not possible (security)

## Troubleshooting

### API Server Connection Issues
- Check if API server is running
- Verify `API_BASE_URL` in `mysql-db.js`
- Check CORS settings if accessing from different domain

### MySQL Connection Issues
- Verify database credentials
- Check firewall rules allow connection from API server
- Ensure database and tables exist

### Data Migration Issues
- Verify JSON export files are valid
- Check MySQL table structure matches schema
- Review error logs for specific issues

## Security Considerations

1. **API Authentication**: Consider adding API key or JWT authentication
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all inputs on API server
4. **SQL Injection**: Use parameterized queries (already implemented)
5. **HTTPS**: Use HTTPS for API communication in production

## Rollback Plan

If you need to rollback to Firestore:

1. Change `USE_FIREBASE = true` in `script.js`
2. Restore `firebase-db.js` in `index.html`
3. Data in Firestore should still be available (if not deleted)

## Support

For issues or questions, check:
- API server logs
- Browser console for frontend errors
- MySQL error logs

