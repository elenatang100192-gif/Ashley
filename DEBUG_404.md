# 404 错误调试指南

## 问题
前端页面显示 404 错误，无法加载数据。

## 可能的原因

### 1. API 服务器未运行
**检查方法：**
```bash
curl http://localhost:3000/api/health
```

**解决方法：**
```bash
cd /Users/et/Desktop/menu
node api-server.js
```

### 2. 浏览器缓存问题
**解决方法：**
- 硬刷新页面：`Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)
- 清除浏览器缓存
- 使用无痕模式打开页面

### 3. 页面访问方式错误
**错误方式：**
- 直接打开 `index.html` 文件（file:// 协议）
- 使用错误的端口

**正确方式：**
- 通过 API 服务器访问：`http://localhost:3000/index.html`
- 确保 API 服务器在端口 3000 运行

### 4. 文件路径问题
**检查：**
- `mysql-db.js` 文件是否存在
- `script.js` 文件是否正确引用

**验证：**
```bash
curl http://localhost:3000/mysql-db.js
curl http://localhost:3000/script.js
```

## 调试步骤

### 步骤 1: 检查 API 服务器
```bash
# 检查进程
ps aux | grep "node api-server"

# 测试 API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/menu-items
```

### 步骤 2: 检查浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 查看 Network 标签页
4. 检查哪些请求返回 404

### 步骤 3: 测试 API 连接
打开测试页面：
```
http://localhost:3000/test-api.html
```

### 步骤 4: 检查配置
确保 `script.js` 中：
```javascript
const USE_MYSQL = true;
const USE_FIREBASE = false;
```

## 常见 404 错误

### `/api/menu-items` 返回 404
- **原因**: API 服务器未运行或路径错误
- **解决**: 启动 API 服务器，确保在 `http://localhost:3000` 运行

### `mysql-db.js` 返回 404
- **原因**: 文件不存在或路径错误
- **解决**: 检查文件是否存在，清除浏览器缓存

### `script.js` 返回 404
- **原因**: 文件不存在或路径错误
- **解决**: 检查文件是否存在，清除浏览器缓存

## 快速修复

1. **重启 API 服务器**:
   ```bash
   pkill -f "node api-server.js"
   node api-server.js
   ```

2. **清除浏览器缓存**:
   - 硬刷新：`Ctrl+Shift+R` 或 `Cmd+Shift+R`
   - 或使用无痕模式

3. **检查 URL**:
   - 确保通过 `http://localhost:3000/index.html` 访问
   - 不要直接打开文件

4. **检查浏览器控制台**:
   - 打开 F12
   - 查看具体哪个资源返回 404
   - 检查错误信息

## 验证修复

打开测试页面验证：
```
http://localhost:3000/test-api.html
```

应该看到：
- ✅ API Connection Successful
- Menu Items: 52 items

