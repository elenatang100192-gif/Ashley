// MySQL Database Operations Module
// Provides API interface for MySQL database operations

const MYSQL_CONFIG = {
    TYPE: 'mysql',
    HOSTNAME: '116.6.239.70',
    DATABASE: 'order_menu',
    USERNAME: 'u_order_menu',
    PASSWORD: 'Gj9U#ERCarH-SZFGjUpvk9b',
    PORT: '20010',
    API_BASE_URL: '/api' // Backend API base URL
};

// Connection state (using MySQL-specific names to avoid conflicts with firebase-db.js)
let mysqlConnectionState = 'unknown'; // 'unknown', 'online', 'offline'
let mysqlConnectionStateListeners = [];

function updateMySQLConnectionState(newState) {
    if (mysqlConnectionState !== newState) {
        const oldState = mysqlConnectionState;
        mysqlConnectionState = newState;
        console.log(`🔌 MySQL connection state: ${oldState} → ${newState}`);
        mysqlConnectionStateListeners.forEach(listener => {
            try {
                listener(newState, oldState);
            } catch (e) {
                console.error('Error in MySQL connection state listener:', e);
            }
        });
    }
}

function onMySQLConnectionStateChange(callback) {
    mysqlConnectionStateListeners.push(callback);
    if (mysqlConnectionState !== 'unknown') {
        callback(mysqlConnectionState, mysqlConnectionState);
    }
    return () => {
        const index = mysqlConnectionStateListeners.indexOf(callback);
        if (index > -1) {
            mysqlConnectionStateListeners.splice(index, 1);
        }
    };
}

// API request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${MYSQL_CONFIG.API_BASE_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        updateMySQLConnectionState('online');
        return result;
    } catch (error) {
        console.error('API request error:', error);
        updateMySQLConnectionState('offline');
        throw error;
    }
}

// Initialize MySQL connection (test connection)
async function initMySQL() {
    try {
        const result = await apiRequest('/health', 'GET');
        console.log('✅ MySQL connection initialized:', result);
        updateMySQLConnectionState('online');
        return Promise.resolve(true);
    } catch (error) {
        console.error('❌ Failed to initialize MySQL connection:', error);
        updateMySQLConnectionState('offline');
        return Promise.reject(error);
    }
}

// Save menu items to MySQL
async function saveMenuItemsToMySQL(items) {
    return apiRequest('/menu-items', 'POST', { items });
}

// Load menu items from MySQL
async function loadMenuItemsFromMySQL() {
    const result = await apiRequest('/menu-items', 'GET');
    return result.items || [];
}

// Save single order to MySQL
async function saveSingleOrderToMySQL(order) {
    return apiRequest('/orders', 'POST', { order });
}

// Save orders to MySQL
async function saveOrdersToMySQL(orders) {
    return apiRequest('/orders/batch', 'POST', { orders });
}

// Load orders from MySQL
async function loadOrdersFromMySQL() {
    const result = await apiRequest('/orders', 'GET');
    return result.orders || [];
}

// Delete order from MySQL
async function deleteOrderFromMySQL(orderId) {
    return apiRequest(`/orders/${orderId}`, 'DELETE');
}

// Clear all orders from MySQL
async function clearAllOrdersFromMySQL() {
    return apiRequest('/orders', 'DELETE');
}

// Save hidden restaurants to MySQL
async function saveHiddenRestaurantsToMySQL(restaurantNames) {
    return apiRequest('/settings/hiddenRestaurants', 'PUT', { restaurants: restaurantNames });
}

// Load hidden restaurants from MySQL
async function loadHiddenRestaurantsFromMySQL() {
    try {
        const result = await apiRequest('/settings/hiddenRestaurants', 'GET');
        return result.restaurants || [];
    } catch (error) {
        // If setting doesn't exist, return empty array
        if (error.message.includes('404') || error.message.includes('not found')) {
            return [];
        }
        throw error;
    }
}

// Subscribe to menu items changes (polling for MySQL)
let menuItemsPollInterval = null;
function subscribeToMenuItems(callback, interval = 2000) {
    // Clear existing interval if any
    if (menuItemsPollInterval) {
        clearInterval(menuItemsPollInterval);
    }
    
    // Initial load
    loadMenuItemsFromMySQL()
        .then(items => callback(items))
        .catch(err => {
            console.error('Failed to load menu items:', err);
            callback([]);
        });
    
    // Set up polling
    menuItemsPollInterval = setInterval(() => {
        loadMenuItemsFromMySQL()
            .then(items => callback(items))
            .catch(err => {
                console.error('Failed to poll menu items:', err);
            });
    }, interval);
    
    console.log('✅ Menu items polling started (interval: ' + interval + 'ms)');
    
    // Return unsubscribe function
    return () => {
        if (menuItemsPollInterval) {
            clearInterval(menuItemsPollInterval);
            menuItemsPollInterval = null;
            console.log('🔌 Menu items polling stopped');
        }
    };
}

// Subscribe to orders changes (polling for MySQL)
let ordersPollInterval = null;
function subscribeToOrders(callback, interval = 2000) {
    // Clear existing interval if any
    if (ordersPollInterval) {
        clearInterval(ordersPollInterval);
    }
    
    // Initial load
    loadOrdersFromMySQL()
        .then(orders => callback(orders))
        .catch(err => {
            console.error('Failed to load orders:', err);
            callback([]);
        });
    
    // Set up polling
    ordersPollInterval = setInterval(() => {
        loadOrdersFromMySQL()
            .then(orders => callback(orders))
            .catch(err => {
                console.error('Failed to poll orders:', err);
            });
    }, interval);
    
    console.log('✅ Orders polling started (interval: ' + interval + 'ms)');
    
    // Return unsubscribe function
    return () => {
        if (ordersPollInterval) {
            clearInterval(ordersPollInterval);
            ordersPollInterval = null;
            console.log('🔌 Orders polling stopped');
        }
    };
}

// Subscribe to hidden restaurants changes (polling for MySQL)
let hiddenRestaurantsPollInterval = null;
function subscribeToHiddenRestaurants(callback, interval = 2000) {
    // Clear existing interval if any
    if (hiddenRestaurantsPollInterval) {
        clearInterval(hiddenRestaurantsPollInterval);
    }
    
    // Initial load
    loadHiddenRestaurantsFromMySQL()
        .then(restaurants => callback(restaurants))
        .catch(err => {
            console.error('Failed to load hidden restaurants:', err);
            callback([]);
        });
    
    // Set up polling
    hiddenRestaurantsPollInterval = setInterval(() => {
        loadHiddenRestaurantsFromMySQL()
            .then(restaurants => callback(restaurants))
            .catch(err => {
                console.error('Failed to poll hidden restaurants:', err);
            });
    }, interval);
    
    console.log('✅ Hidden restaurants polling started (interval: ' + interval + 'ms)');
    
    // Return unsubscribe function
    return () => {
        if (hiddenRestaurantsPollInterval) {
            clearInterval(hiddenRestaurantsPollInterval);
            hiddenRestaurantsPollInterval = null;
            console.log('🔌 Hidden restaurants polling stopped');
        }
    };
}

