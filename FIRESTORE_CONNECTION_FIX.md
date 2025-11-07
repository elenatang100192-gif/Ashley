# Firestore 连接错误修复指南

## 问题描述

如果遇到以下错误：
```
ERR_CONNECTION_CLOSED
Failed to load resource: net::ERR_CONNECTION_CLOSED
```

这表示 Firestore 连接被意外关闭。可能的原因包括：
- 网络不稳定或中断
- 防火墙或代理服务器阻止连接
- Firebase SDK 版本问题
- 浏览器兼容性问题

## 已实施的修复

### 1. 自动重试机制
- 所有 Firestore 操作（保存、加载）现在都包含自动重试功能
- 最多重试 3 次，使用指数退避策略（1秒、2秒、4秒）
- 自动检测连接错误并重试

### 2. 连接状态监听
- 实时监控 Firestore 连接状态（在线/离线）
- 监听浏览器在线/离线事件
- 自动尝试重新连接

### 3. 实时监听器改进
- 自动检测连接错误
- 最多尝试 5 次自动重连
- 如果连接失败，自动降级到不使用 orderBy 的查询方式

### 4. 离线持久化支持
- 尝试启用 Firestore 离线持久化（如果浏览器支持）
- 在网络恢复时自动同步数据

## 如何验证修复

1. **打开浏览器控制台**（F12）
2. **查看连接状态日志**：
   - `✅ Firestore initialized successfully` - 初始化成功
   - `🔌 Firestore connection state: offline → online` - 连接状态变化
   - `✅ Firestore network enabled` - 网络已启用

3. **测试连接恢复**：
   - 断开网络连接
   - 应该看到：`⚠️ Browser is offline`
   - 重新连接网络
   - 应该看到：`🌐 Browser is online, reconnecting Firestore...`
   - 然后：`✅ Network re-enabled`

## 如果问题仍然存在

### 检查清单

1. **Firebase 配置**
   - 确认 `firebase-config.js` 中的配置正确
   - 确认项目 ID 正确：`ashley-menu`

2. **Firestore 安全规则**
   - 访问 [Firebase Console](https://console.firebase.google.com/)
   - 进入 Firestore Database → Rules
   - 确认规则允许读写：
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

3. **网络连接**
   - 检查网络连接是否稳定
   - 尝试刷新页面
   - 检查是否有防火墙或代理阻止 Firebase 连接

4. **浏览器兼容性**
   - 尝试使用 Chrome 或 Firefox 最新版本
   - 清除浏览器缓存和 Cookie
   - 尝试使用无痕模式

5. **Firebase 项目状态**
   - 访问 [Firebase Console](https://console.firebase.google.com/)
   - 确认项目未被暂停或禁用
   - 检查 Firestore Database 是否已启用

### 手动重连

如果自动重连失败，可以尝试：

1. **刷新页面** - 最简单的方法
2. **手动重新初始化**：
   ```javascript
   // 在浏览器控制台中运行
   firebase.firestore().enableNetwork().then(() => {
     console.log('Network re-enabled');
   });
   ```

### 诊断信息

在浏览器控制台中运行以下代码以获取诊断信息：

```javascript
// 检查 Firebase 是否加载
console.log('Firebase loaded:', typeof firebase !== 'undefined');

// 检查 Firestore 是否初始化
console.log('Firestore DB:', typeof firestoreDB !== 'undefined' ? 'Initialized' : 'Not initialized');

// 检查连接状态
console.log('Connection state:', connectionState);

// 测试基本连接
firebase.firestore().collection('menuItems').limit(1).get()
  .then(snapshot => {
    console.log('✅ Connection test successful');
  })
  .catch(error => {
    console.error('❌ Connection test failed:', error);
  });
```

## 技术细节

### 重试机制
- **最大重试次数**：3 次（保存/加载操作）
- **重试延迟**：指数退避（1秒、2秒、4秒）
- **连接错误检测**：检测 `ERR_CONNECTION_CLOSED`、`unavailable`、`Failed to fetch` 等错误

### 实时监听器重连
- **最大重连次数**：5 次
- **重连延迟**：2秒 × 重连次数（指数退避）
- **自动降级**：如果重连失败，自动切换到不使用 orderBy 的查询

### 连接状态管理
- **状态类型**：`unknown`、`online`、`offline`
- **状态监听**：支持多个监听器
- **自动更新**：监听 Firestore 同步事件和浏览器在线/离线事件

## 相关文件

- `firebase-db.js` - Firestore 数据库操作模块（已更新）
- `firebase-config.js` - Firebase 配置
- `FIREBASE_SETUP.md` - Firebase 设置指南
- `TROUBLESHOOTING.md` - 通用故障排除指南

## 更新日志

### 2024-01-XX - 连接错误修复
- ✅ 添加自动重试机制
- ✅ 添加连接状态监听
- ✅ 改进实时监听器错误处理
- ✅ 添加自动重连功能
- ✅ 支持离线持久化（如果可用）

