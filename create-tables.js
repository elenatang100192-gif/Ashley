// Script to create MySQL tables
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '116.6.239.70',
    port: 20010,
    database: 'order_menu',
    user: 'u_order_menu',
    password: 'Gj9U#ERCarH-SZFGjUpvk9b',
    charset: 'utf8mb4'
};

async function createTables() {
    let connection;
    try {
        console.log('🔌 Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL');

        // Read and execute SQL schema
        const fs = require('fs');
        const sql = fs.readFileSync('./mysql-schema.sql', 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed.length > 0 && !trimmed.startsWith('--')) {
                try {
                    await connection.execute(trimmed);
                    console.log('✅ Executed SQL statement');
                } catch (error) {
                    // Ignore "table already exists" errors
                    if (error.message.includes('already exists')) {
                        console.log('ℹ️  Table already exists, skipping...');
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        console.log('✅ All tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connection closed');
        }
    }
}

createTables()
    .then(() => {
        console.log('\n🎉 Database setup completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Database setup failed:', error);
        process.exit(1);
    });

