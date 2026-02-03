// 自动化迁移脚本：从 Firestore 迁移数据到 MySQL
// 使用浏览器环境（Firebase Web SDK）

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001; // 使用不同的端口避免冲突

// 创建简单的 HTTP 服务器来运行迁移脚本
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // 返回一个包含迁移脚本的 HTML 页面
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Auto Migration</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🚀 自动迁移中...</h1>
    <pre id="log"></pre>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="http://localhost:3000/firebase-config.js"></script>
    <script>
        const log = document.getElementById('log');
        function addLog(msg) {
            const time = new Date().toLocaleTimeString();
            log.textContent += \`[\${time}] \${msg}\\n\`;
            log.scrollTop = log.scrollHeight;
            console.log(msg);
        }
        
        async function apiRequest(endpoint, method = 'GET', data = null) {
            const url = \`http://localhost:3000/api\${endpoint}\`;
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(url, options);
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(error.error || \`HTTP \${response.status}\`);
            }
            return await response.json();
        }
        
        async function migrate() {
            try {
                addLog('📋 开始迁移...');
                
                // 检查 Firebase
                if (typeof firebase === 'undefined' || !firebase.firestore) {
                    throw new Error('Firebase 未加载');
                }
                const db = firebase.firestore();
                addLog('✅ Firebase 已连接');
                
                // 检查 API
                await apiRequest('/health');
                addLog('✅ API 服务器已连接');
                
                // 迁移菜单项
                addLog('\\n📋 导出菜单项...');
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
                addLog(\`✅ 找到 \${menuItems.length} 个菜单项\`);
                
                if (menuItems.length > 0) {
                    addLog('🗑️  清空现有菜单项...');
                    await apiRequest('/menu-items', 'POST', { items: [], migration: false });
                    
                    const BATCH_SIZE = 10;
                    let migrated = 0;
                    for (let i = 0; i < menuItems.length; i += BATCH_SIZE) {
                        const batch = menuItems.slice(i, i + BATCH_SIZE);
                        await apiRequest('/menu-items?migration=true', 'POST', { items: batch, migration: true });
                        migrated += batch.length;
                        addLog(\`✅ 已迁移 \${migrated}/\${menuItems.length} 个菜单项...\`);
                    }
                    addLog(\`✅ 已迁移所有 \${menuItems.length} 个菜单项\`);
                }
                
                // 迁移订单
                addLog('\\n📦 导出订单...');
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
                addLog(\`✅ 找到 \${orders.length} 个订单\`);
                
                if (orders.length > 0) {
                    const BATCH_SIZE = 50;
                    let migrated = 0;
                    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
                        const batch = orders.slice(i, i + BATCH_SIZE);
                        await apiRequest('/orders/batch', 'POST', { orders: batch });
                        migrated += batch.length;
                        addLog(\`✅ 已迁移 \${migrated}/\${orders.length} 个订单...\`);
                    }
                    addLog(\`✅ 已迁移所有 \${orders.length} 个订单\`);
                }
                
                // 迁移设置
                addLog('\\n⚙️  导出设置...');
                const settingsDoc = await db.collection('settings').doc('hiddenRestaurants').get();
                let hiddenRestaurants = [];
                if (settingsDoc.exists) {
                    const data = settingsDoc.data();
                    hiddenRestaurants = data.restaurants || [];
                }
                addLog(\`✅ 找到 \${hiddenRestaurants.length} 个隐藏餐厅\`);
                
                await apiRequest('/settings/hiddenRestaurants', 'PUT', { restaurants: hiddenRestaurants });
                addLog('✅ 已迁移设置');
                
                addLog('\\n✅ 迁移完成！');
                addLog('\\n📊 摘要:');
                addLog(\`   - 菜单项: \${menuItems.length}\`);
                addLog(\`   - 订单: \${orders.length}\`);
                addLog(\`   - 隐藏餐厅: \${hiddenRestaurants.length}\`);
                
            } catch (error) {
                addLog(\`\\n❌ 迁移失败: \${error.message}\`);
                addLog(error.stack);
            }
        }
        
        // 自动开始迁移
        window.addEventListener('load', () => {
            setTimeout(migrate, 1000);
        });
    </script>
</body>
</html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n✅ 迁移服务器已启动！`);
    console.log(`\n📋 请按以下步骤操作：`);
    console.log(`1. 打开浏览器访问: http://localhost:${PORT}`);
    console.log(`2. 页面会自动开始迁移`);
    console.log(`3. 等待迁移完成（查看页面日志）`);
    console.log(`4. 迁移完成后，刷新主页面查看菜单数据\n`);
});
