// Run this in browser console to export Firestore data
// Copy and paste this code into browser console when your app is loaded

(async function exportFirestoreData() {
    console.log('📋 Starting Firestore data export...\n');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('❌ Firebase not loaded. Please ensure firebase-config.js is loaded.');
        return;
    }
    
    const db = firebase.firestore();
    
    try {
        // Export Menu Items
        console.log('📋 Exporting menu items...');
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
        console.log(`✅ Exported ${menuItems.length} menu items`);
        
        // Download menu items JSON
        const menuBlob = new Blob([JSON.stringify(menuItems, null, 2)], { type: 'application/json' });
        const menuUrl = URL.createObjectURL(menuBlob);
        const menuLink = document.createElement('a');
        menuLink.href = menuUrl;
        menuLink.download = 'menu-items-export.json';
        menuLink.click();
        URL.revokeObjectURL(menuUrl);
        console.log('📥 Downloaded menu-items-export.json');
        
        // Export Orders
        console.log('\n📦 Exporting orders...');
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
        console.log(`✅ Exported ${orders.length} orders`);
        
        // Download orders JSON
        const ordersBlob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
        const ordersUrl = URL.createObjectURL(ordersBlob);
        const ordersLink = document.createElement('a');
        ordersLink.href = ordersUrl;
        ordersLink.download = 'orders-export.json';
        ordersLink.click();
        URL.revokeObjectURL(ordersUrl);
        console.log('📥 Downloaded orders-export.json');
        
        // Export Settings
        console.log('\n⚙️  Exporting settings...');
        const settingsDoc = await db.collection('settings').doc('hiddenRestaurants').get();
        let hiddenRestaurants = [];
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            hiddenRestaurants = data.restaurants || [];
        }
        console.log(`✅ Exported ${hiddenRestaurants.length} hidden restaurants`);
        
        const settings = { hiddenRestaurants };
        const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const settingsUrl = URL.createObjectURL(settingsBlob);
        const settingsLink = document.createElement('a');
        settingsLink.href = settingsUrl;
        settingsLink.download = 'settings-export.json';
        settingsLink.click();
        URL.revokeObjectURL(settingsUrl);
        console.log('📥 Downloaded settings-export.json');
        
        console.log('\n✅ Export completed!');
        console.log('\nNext steps:');
        console.log('1. Place the downloaded JSON files in the project directory');
        console.log('2. Run: node migrate-from-json.js');
        
    } catch (error) {
        console.error('❌ Export failed:', error);
    }
})();

