// Data Migration Script: JSON files to MySQL
// Run: node migrate-from-json.js
// First export data from Firestore using export-firestore-data.html

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// MySQL Configuration
const mysqlConfig = {
    host: '116.6.239.70',
    port: 20010,
    database: 'order_menu',
    user: 'u_order_menu',
    password: 'Gj9U#ERCarH-SZFGjUpvk9b',
    charset: 'utf8mb4'
};

async function migrateFromJSON() {
    let mysqlConnection;
    
    try {
        console.log('📋 JSON to MySQL Migration');
        console.log('==========================\n');
        
        // Connect to MySQL
        console.log('🔌 Connecting to MySQL...');
        mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log('✅ Connected to MySQL\n');
        
        // Migrate Menu Items
        console.log('📋 Migrating menu items...');
        let menuItems = [];
        const menuItemsPath = path.join(__dirname, 'menu-items-export.json');
        
        if (fs.existsSync(menuItemsPath)) {
            try {
                const menuData = JSON.parse(fs.readFileSync(menuItemsPath, 'utf8'));
                menuItems = Array.isArray(menuData) ? menuData : menuData.items || [];
                console.log(`📦 Loaded ${menuItems.length} menu items from JSON file`);
            } catch (error) {
                console.log(`⚠️  Error reading menu-items-export.json: ${error.message}`);
            }
        } else {
            console.log('⚠️  menu-items-export.json not found, skipping menu items migration');
        }
        
        if (menuItems.length > 0) {
            await mysqlConnection.beginTransaction();
            try {
                // Clear existing menu items
                await mysqlConnection.execute('DELETE FROM menu_items');
                console.log('🗑️  Cleared existing menu items');
                
                // Insert menu items
                let inserted = 0;
                for (const item of menuItems) {
                    try {
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
                        inserted++;
                    } catch (error) {
                        if (error.code === 'ER_DUP_ENTRY') {
                            console.log(`⚠️  Menu item ${item.id} already exists, skipping...`);
                        } else {
                            throw error;
                        }
                    }
                }
                await mysqlConnection.commit();
                console.log(`✅ Migrated ${inserted} menu items to MySQL\n`);
            } catch (error) {
                await mysqlConnection.rollback();
                throw error;
            }
        } else {
            console.log('⚠️  No menu items to migrate\n');
        }
        
        // Migrate Orders
        console.log('📦 Migrating orders...');
        let orders = [];
        const ordersPath = path.join(__dirname, 'orders-export.json');
        
        if (fs.existsSync(ordersPath)) {
            try {
                const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
                orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
                console.log(`📦 Loaded ${orders.length} orders from JSON file`);
            } catch (error) {
                console.log(`⚠️  Error reading orders-export.json: ${error.message}`);
            }
        } else {
            console.log('⚠️  orders-export.json not found, skipping orders migration');
        }
        
        if (orders.length > 0) {
            await mysqlConnection.beginTransaction();
            try {
                // Clear existing orders
                await mysqlConnection.execute('DELETE FROM orders');
                console.log('🗑️  Cleared existing orders');
                
                // Insert orders
                let inserted = 0;
                for (const order of orders) {
                    try {
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
                        inserted++;
                    } catch (error) {
                        if (error.code === 'ER_DUP_ENTRY') {
                            console.log(`⚠️  Order ${order.id} already exists, skipping...`);
                        } else {
                            throw error;
                        }
                    }
                }
                await mysqlConnection.commit();
                console.log(`✅ Migrated ${inserted} orders to MySQL\n`);
            } catch (error) {
                await mysqlConnection.rollback();
                throw error;
            }
        } else {
            console.log('⚠️  No orders to migrate\n');
        }
        
        // Migrate Settings (Hidden Restaurants)
        console.log('⚙️  Migrating settings...');
        let hiddenRestaurants = [];
        const settingsPath = path.join(__dirname, 'settings-export.json');
        
        if (fs.existsSync(settingsPath)) {
            try {
                const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                hiddenRestaurants = settingsData.hiddenRestaurants || [];
                console.log(`📦 Loaded ${hiddenRestaurants.length} hidden restaurants from JSON file`);
            } catch (error) {
                console.log(`⚠️  Error reading settings-export.json: ${error.message}`);
            }
        } else {
            console.log('⚠️  settings-export.json not found, using empty array');
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
        console.error('❌ Migration failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        throw error;
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n🔌 MySQL connection closed');
        }
    }
}

// Run migration
migrateFromJSON()
    .then(() => {
        console.log('\n🎉 Migration completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    });

