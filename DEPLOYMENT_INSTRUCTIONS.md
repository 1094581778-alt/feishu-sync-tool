# ⚠️ 重要部署说明

## 🚨 关键提示

### 浏览器版本 ≠ 生产版本

**当前开发环境（浏览器）**：
- ✅ 仅用于**功能演示和测试**
- ✅ 文件扫描返回**模拟数据**
- ✅ 无法访问真实文件系统
- ❌ **不能用于实际生产**

**Tauri 桌面应用（.exe）**：
- ✅ **真实功能版本**
- ✅ 扫描**真实文件**
- ✅ 完整文件系统访问
- ✅ **生产环境使用**

---

## 📋 环境对比

| 特性 | 浏览器版本 | Tauri 桌面版 |
|------|-----------|-------------|
| 文件扫描 | ❌ 模拟数据 | ✅ 真实扫描 |
| 定时任务 | ⚠️ 页面关闭即停 | ✅ 后台运行 |
| 文件系统 | ❌ 受限 | ✅ 完整访问 |
| 飞书同步 | ✅ 正常 | ✅ 正常 |
| 使用场景 | 开发/测试 | **生产环境** |

---

## 🎯 部署流程

### 1. 开发阶段（浏览器）

```bash
# 启动开发服务器
pnpm dev --port 5000

# 访问
http://localhost:5000
```

**当前状态**：
- ✅ 所有 UI 功能正常
- ✅ 定时任务配置正常
- ⚠️ 文件扫描是模拟数据
- ⚠️ 仅用于测试流程

**控制台提示**：
```
[FileScanner] 浏览器环境，返回模拟数据
```

---

### 2. 构建生产版本（.exe）

#### 步骤 1：切换到 Tauri 版本

**重要**：打包前必须切换到 Tauri 版本的文件！

```bash
# 备份浏览器版本
cp src/services/file-scanner.ts src/services/file-scanner.browser.ts.backup

# 使用 Tauri 版本
cp src/services/file-scanner.tauri.ts src/services/file-scanner.ts
```

或者手动修改 `src/services/file-scanner.ts`：

```typescript
// 删除浏览器版本的模拟数据代码
// 使用 file-scanner.tauri.ts 中的真实实现
```

#### 步骤 2：构建 Tauri 应用

```bash
# 构建 Windows 安装包
pnpm tauri build

# 或构建当前平台
pnpm tauri build --target $(rustc -vV | grep host | cut -d' ' -f2)
```

#### 步骤 3：找到安装包

构建完成后，安装包在：

```
src-tauri/target/release/bundle/
├── msi/
│   └── your-app_1.0.0_x64_en-US.msi    # MSI 安装包
└── nsis/
    └── your-app_1.0.0_x64-setup.exe    # EXE 安装程序
```

#### 步骤 4：分发应用

**分发给用户**：
- 提供 `.msi` 或 `-setup.exe` 文件
- 用户双击安装即可使用
- **无需安装 Node.js 或其他依赖**

---

## 🔧 恢复开发环境

开发完成后，需要恢复浏览器版本：

```bash
# 恢复浏览器版本
git checkout src/services/file-scanner.ts

# 或使用备份
cp src/services/file-scanner.browser.ts.backup src/services/file-scanner.ts
```

---

## 📝 文件说明

### 关键文件列表

```
src/services/
├── file-scanner.ts              ← 当前使用的文件
│   ├── 开发时：浏览器版本（模拟数据）
│   └── 打包前：替换为 Tauri 版本（真实扫描）
│
├── file-scanner.tauri.ts        ← Tauri 版本（真实实现）
│   └── 打包时复制这个文件
│
├── file-scanner.browser.ts      ← 浏览器版本（备用）
│   └── 开发时使用
│
└── file-system.ts               ← 统一文件系统
    └── 已修复，使用 eval('import')
```

### 打包前必须修改的文件

**必须修改**：
- ✅ `src/services/file-scanner.ts`
  - 开发：使用浏览器版本（模拟数据）
  - 生产：使用 Tauri 版本（真实扫描）

**无需修改**：
- ✅ `src/services/file-system.ts`
  - 已使用 `eval('import')`，自动适配环境
- ✅ `src/services/scheduled-task-engine.ts`
  - 环境自适应，无需修改
- ✅ `src/hooks/useScheduledTaskManager.ts`
  - 使用 localStorage，自动适配

---

## ⚠️ 用户提示文案

### 在应用中添加提示

建议在应用明显位置添加提示：

```tsx
<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
  <div className="flex">
    <div className="ml-3">
      <p className="text-sm text-yellow-700">
        <strong>⚠️ 提示：</strong>
        当前运行在浏览器环境，文件扫描功能使用模拟数据。
        <br />
        <strong>请使用桌面应用版本以获取完整功能。</strong>
      </p>
    </div>
  </div>
</div>
```

### 关于页面提示

在"关于"或"帮助"页面添加：

```markdown
## 运行环境

### 浏览器环境（开发/测试）
- 当前您正在浏览器中运行此应用
- 文件扫描功能使用模拟数据进行演示
- 定时任务在页面关闭后会停止

### 桌面应用环境（生产）
- 请下载并安装桌面应用版本
- 完整文件系统访问权限
- 定时任务后台持续运行
- 下载地址：[提供下载链接]
```

---

## 🎯 验证清单

### 打包前检查

- [ ] 已切换到 Tauri 版本文件
- [ ] `file-scanner.ts` 使用真实实现
- [ ] 运行 `pnpm tauri build`
- [ ] 检查构建输出无错误
- [ ] 测试安装包安装正常
- [ ] 测试 .exe 文件扫描功能

### 开发环境检查

- [ ] 使用浏览器版本文件
- [ ] 运行 `pnpm dev --port 5000`
- [ ] 控制台显示"浏览器环境，返回模拟数据"
- [ ] 所有 UI 功能正常
- [ ] 无编译错误

---

## 📦 自动化脚本（推荐）

### 创建打包脚本

**scripts/build-tauri.js**：

```javascript
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 切换到 Tauri 版本...');

// 备份浏览器版本
fs.copyFileSync(
  'src/services/file-scanner.ts',
  'src/services/file-scanner.browser.ts.backup'
);

// 使用 Tauri 版本
fs.copyFileSync(
  'src/services/file-scanner.tauri.ts',
  'src/services/file-scanner.ts'
);

console.log('✅ 文件切换完成');

console.log('🔨 开始构建 Tauri 应用...');
try {
  execSync('pnpm tauri build', { stdio: 'inherit' });
  console.log('✅ 构建完成！');
  
  console.log('\n📦 安装包位置：');
  console.log('  - MSI: src-tauri/target/release/bundle/msi/');
  console.log('  - NSIS: src-tauri/target/release/bundle/nsis/');
} catch (error) {
  console.error('❌ 构建失败:', error);
  process.exit(1);
}
```

**package.json** 添加脚本：

```json
{
  "scripts": {
    "dev": "pnpm dev --port 5000",
    "build:tauri": "node scripts/build-tauri.js",
    "restore:dev": "node scripts/restore-dev.js"
  }
}
```

**恢复开发环境脚本** (scripts/restore-dev.js)：

```javascript
const fs = require('fs');

console.log('🔄 恢复开发环境...');

if (fs.existsSync('src/services/file-scanner.browser.ts.backup')) {
  fs.copyFileSync(
    'src/services/file-scanner.browser.ts.backup',
    'src/services/file-scanner.ts'
  );
  console.log('✅ 已恢复浏览器版本');
} else {
  console.log('⚠️ 未找到备份文件，请手动恢复');
}
```

---

## 🚀 使用流程

### 开发流程

```bash
# 1. 启动开发服务器
pnpm dev --port 5000

# 2. 开发和测试功能
# 浏览器访问 http://localhost:5000

# 3. 功能测试完成
```

### 打包流程

```bash
# 1. 构建 Tauri 应用
pnpm build:tauri

# 2. 测试安装包
# 安装生成的 .exe 或 .msi

# 3. 验证功能正常
# 特别是文件扫描功能

# 4. 分发给用户
```

### 继续开发

```bash
# 1. 恢复开发环境
pnpm restore:dev

# 2. 继续开发
pnpm dev --port 5000
```

---

## 📞 常见问题

### Q1: 打包后还是模拟数据怎么办？

**A**: 确保打包前已切换到 Tauri 版本：

```bash
# 检查当前使用的版本
cat src/services/file-scanner.ts | grep "浏览器版本\|Tauri 版本"

# 如果显示"浏览器版本"，需要切换
pnpm build:tauri
```

### Q2: 开发时显示真实文件怎么办？

**A**: 确保使用浏览器版本：

```bash
pnpm restore:dev
```

### Q3: 用户反馈无法使用怎么办？

**A**: 确认用户是否安装了正确的桌面应用版本，而不是在浏览器中访问网页。

---

## 🎉 总结

### 重要提醒

1. **浏览器版本** = 模拟器（测试用）
2. **桌面应用** = 真实功能（生产用）
3. **打包前** = 必须切换文件
4. **开发后** = 记得恢复环境

### 成功标志

- ✅ 开发环境：模拟数据，流程测试正常
- ✅ 生产环境：真实扫描，功能完整
- ✅ 自动切换：脚本化管理，不易出错
- ✅ 用户提示：明确说明环境要求

---

**⚠️ 最后提醒：浏览器版本仅用于测试，真实使用请部署桌面应用！**
