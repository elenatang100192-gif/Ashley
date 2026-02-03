// Data Migration Script: Firestore to MySQL (using Firebase Web SDK)
// Run: node migrate-firestore-to-mysql.js
// Note: This script uses Firebase Web SDK, so it needs to run in a browser environment
// For Node.js, use migrate-to-mysql.js with Firebase Admin SDK

const mysql = require('mysql2/promise');
const fs = require('fs');

// MySQL Configuration
const mysqlConfig = {
    host: '116.6.239.70',
    port: 20010,
    database: 'order_menu',
    user: 'u_order_menu',
    password: 'Gj9U#ERCarH-SZFGjUpvk9b',
    charset: 'utf8mb4'
};

// Firebase Admin SDK approach (requires service account key)
// Alternative: Use browser-based export script first

async function migrateFromFirestore() {
    console.log('📋 Firestore to MySQL Migration');
    console.log('================================\n');
    
    console.log('⚠️  Note: This script requires Firebase Admin SDK.');
    console.log('For browser-based migration, use the export script first.\n');
    
    // Check if we have Firebase Admin SDK
    let admin;
    try {
        admin = require('firebase-admin');
        console.log('✅ Firebase Admin SDK found');
    } catch (e) {
        console.log('❌ Firebase Admin SDK not found');
        console.log('Please install: npm install firebase-admin');
        console.log('Or use the browser-based export script first.\n');
        return;
    }
    
    // Check for service account key
    let serviceAccount;
    try {
        serviceAccount = require('./firebase-service-account-key.json');
        console.log('✅ Service account key found');
    } catch (e) {
        console.log('❌ Service account key not found');
        console.log('Please create firebase-service-account-key.json');
        console.log('Or use the browser-based export script first.\n');
        return;
    }
    
    let mysqlConnection;
    let db;
    
    try {
        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('✅ Connected to Firebase\n');
        
        // Connect to MySQL
        console.log('🔌 Connecting to MySQL...');
        mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log('✅ Connected to MySQL\n');
        
        // Migrate Menu Items
        console.log('📋 Migrating menu items from Firestore...');
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
        console.log(`📦 Found ${menuItems.length} menu items in Firestore`);
        
        if (menuItems.length > 0) {
            await mysqlConnection.beginTransaction();
            try {
                // Clear existing menu items
                await mysqlConnection.execute('DELETE FROM menu_items');
                console.log('🗑️  Cleared existing menu items');
                
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
                console.log(`✅ Migrated ${menuItems.length} menu items to MySQL\n`);
            } catch (error) {
                await mysqlConnection.rollback();
                throw error;
            }
        } else {
            console.log('⚠️  No menu items to migrate\n');
        }
        
        // Migrate Orders
        console.log('📦 Migrating orders from Firestore...');
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
        console.log(`📦 Found ${orders.length} orders in Firestore`);
        
        if (orders.length > 0) {
            await mysqlConnection.beginTransaction();
            try {
                // Clear existing orders
                await mysqlConnection.execute('DELETE FROM orders');
                console.log('🗑️  Cleared existing orders');
                
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
                console.log(`✅ Migrated ${orders.length} orders to MySQL\n`);
            } catch (error) {
                await mysqlConnection.rollback();
                throw error;
            }
        } else {
            console.log('⚠️  No orders to migrate\n');
        }
        
        // Migrate Settings (Hidden Restaurants)
        console.log('⚙️  Migrating settings from Firestore...');
        const settingsDoc = await db.collection('settings').doc('hiddenRestaurants').get();
        let hiddenRestaurants = [];
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            hiddenRestaurants = data.restaurants || [];
            console.log(`📦 Found ${hiddenRestaurants.length} hidden restaurants in Firestore`);
        } else {
            console.log('⚠️  No hidden restaurants settings found in Firestore');
        }
        
        await mysqlConnection.execute(
            `INSERT INTO settings (\`key\`, value) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            ['hiddenRestaurants', JSON.stringify(hiddenRestaurants)]
        );
        console.log(`✅ Migrated hidden restaurants settings to MySQL\n`);
        
        console.log('✅ Migration completed successfully!\n');
        
        // Summary
        console.log('📊 Migration Summary:');
        console.log(`   - Menu Items: ${menuItems.length}`);
        console.log(`   - Orders: ${orders.length}`);
        console.log(`   - Hidden Restaurants: ${hiddenRestaurants.length}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n🔌 MySQL connection closed');
        }
    }
}

// Run migration
migrateFromFirestore()
    .then(() => {
        console.log('\n🎉 Migration completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Migration failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    });

