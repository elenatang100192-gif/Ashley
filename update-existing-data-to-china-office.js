// Update existing menu items and orders to China Office
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
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

async function updateExistingData() {
    let connection;
    try {
        console.log('🔌 Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL\n');
        
        // Check if country column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'menu_items' 
            AND COLUMN_NAME = 'country'
        `, [dbConfig.database]);
        
        if (columns.length === 0) {
            console.log('📋 Adding country column to menu_items...');
            await connection.execute(`
                ALTER TABLE menu_items 
                ADD COLUMN country VARCHAR(50) DEFAULT 'China Office' AFTER tag,
                ADD INDEX idx_country (country)
            `);
            console.log('✅ Country column added to menu_items\n');
        } else {
            console.log('✅ Country column already exists in menu_items\n');
        }
        
        // Update existing menu items
        console.log('🔄 Updating existing menu items to China Office...');
        const [updateResult] = await connection.execute(
            `UPDATE menu_items SET country = 'China Office' WHERE country IS NULL OR country = ''`
        );
        console.log(`✅ Updated ${updateResult.affectedRows} menu items to China Office\n`);
        
        // Check if country column exists in orders
        const [orderColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME = 'country'
        `, [dbConfig.database]);
        
        if (orderColumns.length === 0) {
            console.log('📋 Adding country column to orders...');
            await connection.execute(`
                ALTER TABLE orders 
                ADD COLUMN country VARCHAR(50) DEFAULT 'China Office' AFTER name,
                ADD INDEX idx_country (country)
            `);
            console.log('✅ Country column added to orders\n');
        } else {
            console.log('✅ Country column already exists in orders\n');
        }
        
        // Update existing orders
        console.log('🔄 Updating existing orders to China Office...');
        const [orderUpdateResult] = await connection.execute(
            `UPDATE orders SET country = 'China Office' WHERE country IS NULL OR country = ''`
        );
        console.log(`✅ Updated ${orderUpdateResult.affectedRows} orders to China Office\n`);
        
        console.log('✅ All existing data updated to China Office!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed');
        }
    }
}

updateExistingData()
    .then(() => {
        console.log('\n🎉 Update completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Update failed:', error);
        process.exit(1);
    });

