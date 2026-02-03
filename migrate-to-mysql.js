// Data Migration Script: Firestore to MySQL
// Run: node migrate-to-mysql.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
const fs = require('fs');

// MySQL Configuration from environment variables
const mysqlConfig = {
    host: process.env.DB_HOST || '116.6.239.70',
    port: parseInt(process.env.DB_PORT) || 20010,
    database: process.env.DB_NAME || 'order_menu',
    user: process.env.DB_USER || 'u_order_menu',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4'
};

// Validate required environment variables
if (!process.env.DB_PASSWORD) {
    console.error('❌ Error: DB_PASSWORD environment variable is required!');
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
}

// Firebase Configuration (you need to provide service account key)
// const serviceAccount = require('./firebase-service-account-key.json');

async function migrateData() {
    let mysqlConnection;
    
    try {
        // Connect to MySQL
        console.log('🔌 Connecting to MySQL...');
        mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log('✅ Connected to MySQL');

        // Initialize Firebase Admin (if migrating from Firestore)
        // Uncomment if you have Firebase service account key
        /*
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        const db = admin.firestore();
        console.log('✅ Connected to Firebase');
        */

        // Migrate Menu Items
        console.log('\n📋 Migrating menu items...');
        // Option 1: From Firebase
        /*
        const menuSnapshot = await db.collection('menuItems').get();
        const menuItems = [];
        menuSnapshot.forEach(doc => {
            const data = doc.data();
            menuItems.push({
                id: data.id,
                category: data.category || null,
                name: data.name || '',
                tag: data.tag || null,
                subtitle: data.subtitle || null,
                description: data.description || null,
                price: data.price || null,
                image: data.image || null
            });
        });
        */
        
        // Option 2: From JSON file (export from Firebase first)
        // Read menu items from exported JSON file
        let menuItems = [];
        try {
            const menuData = JSON.parse(fs.readFileSync('./menu-items-export.json', 'utf8'));
            menuItems = Array.isArray(menuData) ? menuData : menuData.items || [];
            console.log(`📦 Loaded ${menuItems.length} menu items from JSON file`);
        } catch (error) {
            console.log('⚠️ No menu-items-export.json found, skipping menu items migration');
        }

        if (menuItems.length > 0) {
            await mysqlConnection.beginTransaction();
            try {
                // Clear existing menu items
                await mysqlConnection.execute('DELETE FROM menu_items');
                
                // Insert menu items
                for (const item of menuItems) {
                    await mysqlConnection.execute(
                        `INSERT INTO menu_items (id, category, name, tag, subtitle, description, price, image) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.id,
                            item.category || null,
                            item.name || '',
                            item.tag || null,
                            item.subtitle || null,
                            item.description || null,
                            item.price || null,
                            item.image || null
                        ]
                    );
                }
                await mysqlConnection.commit();
                console.log(`✅ Migrated ${menuItems.length} menu items`);
            } catch (error) {
                await mysqlConnection.rollback();
                throw error;
            }
        }

        // Migrate Orders
        console.log('\n📦 Migrating orders...');
        // Option 1: From Firebase
        /*
        const ordersSnapshot = await db.collection('orders').get();
        const orders = [];
        ordersSnapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: data.id,
                name: data.name || '',
                order: data.order || '',
                items: data.items || [],
                date: data.date || ''
            });
        });
        */
        
        // Option 2: From JSON file
        let orders = [];
        try {
            const ordersData = JSON.parse(fs.readFileSync('./orders-export.json', 'utf8'));
            orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
            console.log(`📦 Loaded ${orders.length} orders from JSON file`);
        } catch (error) {
            console.log('⚠️ No orders-export.json found, skipping orders migration');
        }

        if (orders.length > 0) {
            await mysqlConnection.beginTransaction();
            try {
                // Clear existing orders
                await mysqlConnection.execute('DELETE FROM orders');
                
                // Insert orders
                for (const order of orders) {
                    await mysqlConnection.execute(
                        `INSERT INTO orders (id, name, \`order\`, items, date) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            order.id,
                            order.name || '',
                            order.order || '',
                            JSON.stringify(order.items || []),
                            order.date || ''
                        ]
                    );
                }
                await mysqlConnection.commit();
                console.log(`✅ Migrated ${orders.length} orders`);
            } catch (error) {
                await mysqlConnection.rollback();
                throw error;
            }
        }

        // Migrate Settings (Hidden Restaurants)
        console.log('\n⚙️ Migrating settings...');
        // Option 1: From Firebase
        /*
        const settingsDoc = await db.collection('settings').doc('hiddenRestaurants').get();
        let hiddenRestaurants = [];
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            hiddenRestaurants = data.restaurants || [];
        }
        */
        
        // Option 2: From JSON file or localStorage export
        let hiddenRestaurants = [];
        try {
            const settingsData = JSON.parse(fs.readFileSync('./settings-export.json', 'utf8'));
            hiddenRestaurants = settingsData.hiddenRestaurants || [];
            console.log(`📦 Loaded ${hiddenRestaurants.length} hidden restaurants from JSON file`);
        } catch (error) {
            console.log('⚠️ No settings-export.json found, skipping settings migration');
        }

        if (hiddenRestaurants.length > 0 || true) {
            await mysqlConnection.execute(
                `INSERT INTO settings (\`key\`, value) 
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE value = VALUES(value)`,
                ['hiddenRestaurants', JSON.stringify(hiddenRestaurants)]
            );
            console.log(`✅ Migrated hidden restaurants settings`);
        }

        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('🔌 MySQL connection closed');
        }
    }
}

// Run migration
migrateData()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    });

