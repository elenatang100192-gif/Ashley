// Test MySQL connection and create tables
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '116.6.239.70',
    port: 20010,
    database: 'order_menu',
    user: 'u_order_menu',
    password: 'Gj9U#ERCarH-SZFGjUpvk9b',
    charset: 'utf8mb4'
};

async function testConnection() {
    let connection;
    try {
        console.log('🔌 Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL');

        // Check if tables exist
        const [tables] = await connection.execute("SHOW TABLES");
        console.log('📋 Existing tables:', tables.map(t => Object.values(t)[0]));

        // Create menu_items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`menu_items\` (
              \`id\` INT(11) NOT NULL AUTO_INCREMENT,
              \`category\` VARCHAR(100) DEFAULT NULL,
              \`name\` VARCHAR(255) NOT NULL,
              \`tag\` VARCHAR(255) DEFAULT NULL COMMENT 'Restaurant name',
              \`subtitle\` VARCHAR(255) DEFAULT NULL,
              \`description\` TEXT DEFAULT NULL,
              \`price\` VARCHAR(50) DEFAULT NULL,
              \`image\` LONGTEXT DEFAULT NULL COMMENT 'Base64 encoded image',
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              KEY \`idx_category\` (\`category\`),
              KEY \`idx_tag\` (\`tag\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ menu_items table created/verified');

        // Create orders table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`orders\` (
              \`id\` INT(11) NOT NULL AUTO_INCREMENT,
              \`name\` VARCHAR(255) NOT NULL COMMENT 'Customer name',
              \`order\` TEXT DEFAULT NULL COMMENT 'Order details',
              \`items\` JSON DEFAULT NULL COMMENT 'Order items array',
              \`date\` VARCHAR(100) DEFAULT NULL COMMENT 'Order date string',
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              KEY \`idx_name\` (\`name\`),
              KEY \`idx_date\` (\`date\`),
              KEY \`idx_created_at\` (\`created_at\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ orders table created/verified');

        // Create settings table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`settings\` (
              \`id\` INT(11) NOT NULL AUTO_INCREMENT,
              \`key\` VARCHAR(100) NOT NULL UNIQUE,
              \`value\` JSON DEFAULT NULL,
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`idx_key\` (\`key\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ settings table created/verified');

        // Insert default settings
        await connection.execute(`
            INSERT INTO \`settings\` (\`key\`, \`value\`) 
            VALUES ('hiddenRestaurants', JSON_ARRAY())
            ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)
        `);
        console.log('✅ Default settings inserted');

        // Verify tables
        const [tablesAfter] = await connection.execute("SHOW TABLES");
        console.log('📋 Tables after creation:', tablesAfter.map(t => Object.values(t)[0]));

        console.log('\n✅ All tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connection closed');
        }
    }
}

testConnection()
    .then(() => {
        console.log('\n🎉 Database setup completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Database setup failed:', error);
        process.exit(1);
    });

