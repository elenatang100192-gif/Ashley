// Node.js Express API Server for MySQL Database
// Run: node api-server.js

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// MySQL Configuration from environment variables
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit to 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
app.use(express.static('.')); // Serve static files

// Create MySQL connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        res.json({ status: 'ok', message: 'MySQL connection successful' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Menu Items Endpoints
app.get('/api/menu-items', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM menu_items ORDER BY id ASC');
        res.json({ items: rows });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/menu-items', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Items must be an array' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // For batch migration, don't delete existing items, just insert/update
            // This allows multiple batches to be uploaded without overwriting previous batches
            const isMigration = req.query.migration === 'true' || req.body.migration === true;
            
            if (!isMigration) {
                // Normal mode: delete all existing items (for regular save operations)
                await connection.execute('DELETE FROM menu_items');
            }
            
            // Insert new items (let MySQL auto-generate id, store original firestore_id if provided)
            for (const item of items) {
                // Check if firestore_id column exists, if not, just ignore it
                const hasFirestoreId = item.firestore_id !== undefined;
                const firestoreId = item.firestore_id || item.id || null;
                
                // Convert id to integer if it's a valid number, otherwise use NULL for auto-increment
                let mysqlId = null;
                if (item.id !== undefined && item.id !== null) {
                    const idNum = parseInt(item.id);
                    if (!isNaN(idNum) && idNum > 0 && idNum <= 2147483647) {
                        mysqlId = idNum;
                    }
                }
                
                if (mysqlId !== null) {
                    // Try to insert with specific ID
                    try {
                        await connection.execute(
                            `INSERT INTO menu_items (id, category, name, tag, subtitle, description, price, image) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                mysqlId,
                                item.category || null,
                                item.name || '',
                                item.tag || null,
                                item.subtitle || null,
                                item.description || null,
                                item.price || null,
                                item.image || null
                            ]
                        );
                    } catch (error) {
                        // If ID conflict or out of range, use auto-increment
                        if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_DATA_TOO_LONG' || error.message.includes('Out of range')) {
                            await connection.execute(
                                `INSERT INTO menu_items (category, name, tag, subtitle, description, price, image) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    item.category || null,
                                    item.name || '',
                                    item.tag || null,
                                    item.subtitle || null,
                                    item.description || null,
                                    item.price || null,
                                    item.image || null
                                ]
                            );
                        } else {
                            throw error;
                        }
                    }
                } else {
                    // Use auto-increment (don't specify id)
                    await connection.execute(
                        `INSERT INTO menu_items (category, name, tag, subtitle, description, price, image) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
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
            }

            await connection.commit();
            res.json({ success: true, message: `Saved ${items.length} menu items` });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error saving menu items:', error);
        res.status(500).json({ error: error.message });
    }
});

// Orders Endpoints
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );
        
        // Parse JSON fields
        const orders = rows.map(row => ({
            id: row.id,
            name: row.name,
            order: row.order,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
            date: row.date
        }));
        
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { order } = req.body;
        if (!order) {
            return res.status(400).json({ error: 'Order is required' });
        }

        // Convert id to integer if valid, otherwise use NULL for auto-increment
        let mysqlId = null;
        if (order.id !== undefined && order.id !== null) {
            const idNum = parseInt(order.id);
            if (!isNaN(idNum) && idNum > 0 && idNum <= 2147483647) {
                mysqlId = idNum;
            }
        }
        
        let result;
        if (mysqlId !== null) {
            [result] = await pool.execute(
                `INSERT INTO orders (id, name, \`order\`, items, date) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 name = VALUES(name), 
                 \`order\` = VALUES(\`order\`), 
                 items = VALUES(items), 
                 date = VALUES(date)`,
                [
                    mysqlId,
                    order.name || '',
                    order.order || '',
                    JSON.stringify(order.items || []),
                    order.date || new Date().toLocaleString('en-US')
                ]
            );
        } else {
            // Use auto-increment
            [result] = await pool.execute(
                `INSERT INTO orders (name, \`order\`, items, date) 
                 VALUES (?, ?, ?, ?)`,
                [
                    order.name || '',
                    order.order || '',
                    JSON.stringify(order.items || []),
                    order.date || new Date().toLocaleString('en-US')
                ]
            );
        }

        res.json({ success: true, id: result.insertId || order.id });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders/batch', async (req, res) => {
    try {
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: 'Orders must be an array' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Get existing order IDs
            const [existingRows] = await connection.execute('SELECT id FROM orders');
            const existingIds = new Set(existingRows.map(row => String(row.id)));
            const newIds = new Set(orders.map(order => String(order.id)));

            // Delete orders that are not in the new list
            const toDelete = Array.from(existingIds).filter(id => !newIds.has(id));
            if (toDelete.length > 0) {
                await connection.execute(
                    `DELETE FROM orders WHERE id IN (${toDelete.map(() => '?').join(',')})`,
                    toDelete
                );
            }

            // Insert or update orders
            for (const order of orders) {
                // Convert id to integer if valid, otherwise use NULL for auto-increment
                let mysqlId = null;
                if (order.id !== undefined && order.id !== null) {
                    const idNum = parseInt(order.id);
                    if (!isNaN(idNum) && idNum > 0 && idNum <= 2147483647) {
                        mysqlId = idNum;
                    }
                }
                
                if (mysqlId !== null) {
                    try {
                        await connection.execute(
                            `INSERT INTO orders (id, name, \`order\`, items, date) 
                             VALUES (?, ?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE 
                             name = VALUES(name), 
                             \`order\` = VALUES(\`order\`), 
                             items = VALUES(items), 
                             date = VALUES(date)`,
                            [
                                mysqlId,
                                order.name || '',
                                order.order || '',
                                JSON.stringify(order.items || []),
                                order.date || new Date().toLocaleString('en-US')
                            ]
                        );
                    } catch (error) {
                        // If ID out of range or conflict, use auto-increment
                        if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_DATA_TOO_LONG' || error.message.includes('Out of range')) {
                            await connection.execute(
                                `INSERT INTO orders (name, \`order\`, items, date) 
                                 VALUES (?, ?, ?, ?)`,
                                [
                                    order.name || '',
                                    order.order || '',
                                    JSON.stringify(order.items || []),
                                    order.date || new Date().toLocaleString('en-US')
                                ]
                            );
                        } else {
                            throw error;
                        }
                    }
                } else {
                    // Use auto-increment
                    await connection.execute(
                        `INSERT INTO orders (name, \`order\`, items, date) 
                         VALUES (?, ?, ?, ?)`,
                        [
                            order.name || '',
                            order.order || '',
                            JSON.stringify(order.items || []),
                            order.date || new Date().toLocaleString('en-US')
                        ]
                    );
                }
            }

            await connection.commit();
            res.json({ success: true, message: `Saved ${orders.length} orders` });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error saving orders batch:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/orders', async (req, res) => {
    try {
        await pool.execute('DELETE FROM orders');
        res.json({ success: true, message: 'All orders deleted' });
    } catch (error) {
        console.error('Error clearing orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Settings Endpoints
app.get('/api/settings/hiddenRestaurants', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT value FROM settings WHERE `key` = ?',
            ['hiddenRestaurants']
        );
        
        if (rows.length === 0) {
            return res.json({ restaurants: [] });
        }
        
        const value = typeof rows[0].value === 'string' 
            ? JSON.parse(rows[0].value) 
            : rows[0].value;
        
        res.json({ restaurants: value || [] });
    } catch (error) {
        console.error('Error fetching hidden restaurants:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings/hiddenRestaurants', async (req, res) => {
    try {
        const { restaurants } = req.body;
        if (!Array.isArray(restaurants)) {
            return res.status(400).json({ error: 'Restaurants must be an array' });
        }

        await pool.execute(
            `INSERT INTO settings (\`key\`, value) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            ['hiddenRestaurants', JSON.stringify(restaurants)]
        );

        res.json({ success: true, message: 'Hidden restaurants saved' });
    } catch (error) {
        console.error('Error saving hidden restaurants:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 MySQL Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
});

