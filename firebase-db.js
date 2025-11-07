// Firebase Firestore 数据库操作模块
// 用于替代 IndexedDB，实现多人数据共享

const COLLECTION_MENU = 'menuItems';
const COLLECTION_ORDERS = 'orders';

// 初始化 Firestore
let firestoreDB = null;

function initFirestore() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }
        firestoreDB = firebase.firestore();
        console.log('Firestore initialized successfully');
        return Promise.resolve(firestoreDB);
    } catch (error) {
        console.error('Failed to initialize Firestore:', error);
        return Promise.reject(error);
    }
}

// 保存菜单项到 Firestore
async function saveMenuItemsToFirestore(items) {
    if (!firestoreDB) {
        throw new Error('Firestore not initialized');
    }
    
    try {
        // 使用批处理来更新所有菜单项
        const batch = firestoreDB.batch();
        
        // 先删除所有现有文档（可选，或者使用更新策略）
        // 这里我们使用更新策略：每个菜单项作为一个文档
        
        // 获取所有现有文档
        const snapshot = await firestoreDB.collection(COLLECTION_MENU).get();
        
        // 创建现有文档ID的集合
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        const newIds = new Set(items.map(item => String(item.id)));
        
        // 删除不再存在的文档
        snapshot.docs.forEach(doc => {
            if (!newIds.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });
        
        // 添加或更新所有菜单项
        items.forEach(item => {
            // 确保 id 是数字类型（用于排序）
            const itemId = typeof item.id === 'string' ? Number(item.id) || item.id : item.id;
            const docRef = firestoreDB.collection(COLLECTION_MENU).doc(String(itemId));
            
            const docData = {
                id: itemId, // 确保 id 字段类型一致
                category: item.category || '',
                name: item.name || '',
                subtitle: item.subtitle || '',
                description: item.description || '',
                price: item.price || '',
                image: item.image || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            console.log('💾 Saving item:', { docId: String(itemId), data: { id: docData.id, name: docData.name } });
            batch.set(docRef, docData, { merge: true });
        });
        
        await batch.commit();
        console.log('✅ Menu items saved to Firestore:', items.length, 'items');
        console.log('📋 Saved items:', items.map(item => ({ id: item.id, name: item.name })));
        return true;
    } catch (error) {
        console.error('Failed to save menu items to Firestore:', error);
        throw error;
    }
}

// 从 Firestore 加载菜单项
async function loadMenuItemsFromFirestore() {
    if (!firestoreDB) {
        throw new Error('Firestore not initialized');
    }
    
    try {
        // 先尝试使用 orderBy 查询
        let snapshot;
        try {
            snapshot = await firestoreDB.collection(COLLECTION_MENU)
                .orderBy('id')
                .get();
        } catch (orderByError) {
            // 如果 orderBy 失败（可能是缺少索引），尝试不使用 orderBy
            console.warn('orderBy failed, trying without orderBy:', orderByError);
            try {
                snapshot = await firestoreDB.collection(COLLECTION_MENU).get();
            } catch (getError) {
                // 如果基本查询也失败，抛出错误
                console.error('Failed to get menu items from Firestore:', getError);
                throw new Error('无法从 Firestore 加载菜单数据: ' + getError.message);
            }
        }
        
        const items = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('📄 Loading document:', doc.id, 'Data:', { id: data.id, name: data.name, category: data.category });
            items.push({
                id: data.id,
                category: data.category || '',
                name: data.name || '',
                subtitle: data.subtitle || '',
                description: data.description || '',
                price: data.price || '',
                image: data.image || ''
            });
        });
        
        // 如果没有 orderBy，手动按 id 排序
        items.sort((a, b) => {
            const idA = Number(a.id) || 0;
            const idB = Number(b.id) || 0;
            return idA - idB;
        });
        
        console.log('✅ Menu items loaded from Firestore:', items.length, 'items');
        if (items.length > 0) {
            console.log('📋 Loaded items:', items.map(item => ({ id: item.id, name: item.name, category: item.category })));
        }
        return items;
    } catch (error) {
        console.error('Failed to load menu items from Firestore:', error);
        // 抛出错误以便上层处理
        throw error;
    }
}

// 保存订单到 Firestore
async function saveOrdersToFirestore(orders) {
    if (!firestoreDB) {
        throw new Error('Firestore not initialized');
    }
    
    try {
        const batch = firestoreDB.batch();
        
        // 获取所有现有订单
        const snapshot = await firestoreDB.collection(COLLECTION_ORDERS).get();
        
        // 创建现有订单ID的集合
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        const newIds = new Set(orders.map(order => String(order.id)));
        
        // 删除不再存在的订单
        snapshot.docs.forEach(doc => {
            if (!newIds.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });
        
        // 添加或更新所有订单
        orders.forEach(order => {
            const docRef = firestoreDB.collection(COLLECTION_ORDERS).doc(String(order.id));
            batch.set(docRef, {
                id: order.id,
                name: order.name || '',
                order: order.order || '',
                items: order.items || [],
                date: order.date || new Date().toLocaleString('en-US'),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        
        await batch.commit();
        console.log('Orders saved to Firestore:', orders.length, 'orders');
        return true;
    } catch (error) {
        console.error('Failed to save orders to Firestore:', error);
        throw error;
    }
}

// 从 Firestore 加载订单
async function loadOrdersFromFirestore() {
    if (!firestoreDB) {
        throw new Error('Firestore not initialized');
    }
    
    try {
        // 先尝试使用 orderBy 查询（需要索引）
        let snapshot;
        try {
            snapshot = await firestoreDB.collection(COLLECTION_ORDERS)
                .orderBy('createdAt', 'desc')
                .get();
        } catch (orderByError) {
            // 如果 orderBy 失败（可能是缺少索引或字段），尝试不使用 orderBy
            console.warn('orderBy failed, trying without orderBy:', orderByError);
            try {
                snapshot = await firestoreDB.collection(COLLECTION_ORDERS).get();
            } catch (getError) {
                // 如果基本查询也失败，抛出错误
                console.error('Failed to get orders from Firestore:', getError);
                throw new Error('无法从 Firestore 加载订单数据: ' + getError.message);
            }
        }
        
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: data.id,
                name: data.name || '',
                order: data.order || '',
                items: data.items || [],
                date: data.date || ''
            });
        });
        
        // 如果没有 createdAt 字段，使用 date 字段排序（降序）
        orders.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
        });
        
        console.log('Orders loaded from Firestore:', orders.length, 'orders');
        return orders;
    } catch (error) {
        console.error('Failed to load orders from Firestore:', error);
        // 抛出错误以便上层处理
        throw error;
    }
}

// 监听菜单项变化（实时同步）
function subscribeToMenuItems(callback) {
    if (!firestoreDB) {
        console.warn('Firestore not initialized, cannot subscribe');
        return () => {};
    }
    
    // 尝试使用 orderBy，如果失败则回退到不使用 orderBy
    let unsubscribe = null;
    
    try {
        unsubscribe = firestoreDB.collection(COLLECTION_MENU)
            .orderBy('id')
            .onSnapshot((snapshot) => {
                console.log('🔄 Real-time update received:', snapshot.size, 'documents');
                const items = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    console.log('📄 Document:', doc.id, 'Data:', { id: data.id, name: data.name });
                    items.push({
                        id: data.id,
                        category: data.category || '',
                        name: data.name || '',
                        subtitle: data.subtitle || '',
                        description: data.description || '',
                        price: data.price || '',
                        image: data.image || ''
                    });
                });
                
                // 手动按 id 排序（确保顺序一致）
                items.sort((a, b) => {
                    const idA = Number(a.id) || 0;
                    const idB = Number(b.id) || 0;
                    return idA - idB;
                });
                
                console.log('✅ Processed', items.length, 'menu items from real-time update');
                callback(items);
            }, (error) => {
                console.error('❌ Error listening to menu items with orderBy:', error);
                // 如果 orderBy 失败（可能是缺少索引），尝试不使用 orderBy
                if (error.code === 'failed-precondition' || error.message.includes('index')) {
                    console.warn('⚠️ orderBy failed, retrying without orderBy...');
                    unsubscribe = firestoreDB.collection(COLLECTION_MENU)
                        .onSnapshot((snapshot) => {
                            console.log('🔄 Real-time update received (no orderBy):', snapshot.size, 'documents');
                            const items = [];
                            snapshot.forEach(doc => {
                                const data = doc.data();
                                items.push({
                                    id: data.id,
                                    category: data.category || '',
                                    name: data.name || '',
                                    subtitle: data.subtitle || '',
                                    description: data.description || '',
                                    price: data.price || '',
                                    image: data.image || ''
                                });
                            });
                            
                            // 手动按 id 排序
                            items.sort((a, b) => {
                                const idA = Number(a.id) || 0;
                                const idB = Number(b.id) || 0;
                                return idA - idB;
                            });
                            
                            console.log('✅ Processed', items.length, 'menu items from real-time update (no orderBy)');
                            callback(items);
                        }, (fallbackError) => {
                            console.error('❌ Error listening to menu items (fallback):', fallbackError);
                        });
                }
            });
    } catch (error) {
        console.error('❌ Failed to set up real-time listener:', error);
        // 如果完全失败，返回一个空函数
        return () => {};
    }
    
    return unsubscribe || (() => {});
}

// 监听订单变化（实时同步）
function subscribeToOrders(callback) {
    if (!firestoreDB) {
        console.warn('Firestore not initialized, cannot subscribe');
        return () => {};
    }
    
    // 先尝试使用 orderBy 监听
    let unsubscribe;
    let fallbackUnsubscribe = null;
    
    try {
        unsubscribe = firestoreDB.collection(COLLECTION_ORDERS)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const orders = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    orders.push({
                        id: data.id,
                        name: data.name || '',
                        order: data.order || '',
                        items: data.items || [],
                        date: data.date || ''
                    });
                });
                // 如果没有 createdAt 字段，使用 date 字段排序
                orders.sort((a, b) => {
                    const dateA = a.date || '';
                    const dateB = b.date || '';
                    return dateB.localeCompare(dateA);
                });
                callback(orders);
            }, (error) => {
                console.error('Error listening to orders with orderBy:', error);
                // 如果 orderBy 失败，取消当前订阅并使用不带 orderBy 的监听
                if (unsubscribe) {
                    unsubscribe();
                }
                console.warn('Falling back to subscription without orderBy');
                fallbackUnsubscribe = firestoreDB.collection(COLLECTION_ORDERS)
                    .onSnapshot((snapshot) => {
                        const orders = [];
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            orders.push({
                                id: data.id,
                                name: data.name || '',
                                order: data.order || '',
                                items: data.items || [],
                                date: data.date || ''
                            });
                        });
                        orders.sort((a, b) => {
                            const dateA = a.date || '';
                            const dateB = b.date || '';
                            return dateB.localeCompare(dateA);
                        });
                        callback(orders);
                    }, (fallbackError) => {
                        console.error('Error listening to orders:', fallbackError);
                    });
            });
    } catch (error) {
        console.error('Failed to set up order subscription:', error);
        // 如果设置失败，使用不带 orderBy 的监听
        unsubscribe = firestoreDB.collection(COLLECTION_ORDERS)
            .onSnapshot((snapshot) => {
                const orders = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    orders.push({
                        id: data.id,
                        name: data.name || '',
                        order: data.order || '',
                        items: data.items || [],
                        date: data.date || ''
                    });
                });
                orders.sort((a, b) => {
                    const dateA = a.date || '';
                    const dateB = b.date || '';
                    return dateB.localeCompare(dateA);
                });
                callback(orders);
            }, (fallbackError) => {
                console.error('Error listening to orders:', fallbackError);
            });
    }
    
    // 返回取消订阅函数
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
        if (fallbackUnsubscribe) {
            fallbackUnsubscribe();
        }
    };
}

