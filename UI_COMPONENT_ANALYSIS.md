# UI 组件使用分析报告

## Radix UI 包检查结果

### package.json 中的 Radix UI 包
所有 package.json 中的 Radix UI 包都在 UI 组件文件中被使用，没有未使用的 Radix UI 包。

## 实际业务组件使用的 UI 组件

根据代码分析，业务组件实际使用的 UI 组件只有以下几种：

### 核心组件（大量使用）
- ✅ Button - 多处使用
- ✅ Card - 多处使用
- ✅ Input - 多处使用
- ✅ Label - 多处使用
- ✅ DropdownMenu - 多处使用
- ✅ Badge - 少量使用

### 未使用的 UI 组件文件

以下 UI 组件文件存在于项目中，但业务组件中**未使用**：

#### 基础组件
- ❌ accordion.tsx - 手风琴
- ❌ alert.tsx - 警告提示
- ❌ alert-dialog.tsx - 警告对话框
- ❌ aspect-ratio.tsx - 宽高比
- ❌ avatar.tsx - 头像
- ❌ breadcrumb.tsx - 面包屑
- ❌ button-group.tsx - 按钮组
- ❌ calendar.tsx - 日历
- ❌ carousel.tsx - 轮播
- ❌ chart.tsx - 图表
- ❌ checkbox.tsx - 复选框
- ❌ collapsible.tsx - 折叠面板
- ❌ command.tsx - 命令面板
- ❌ context-menu.tsx - 上下文菜单
- ❌ dialog.tsx - 对话框（使用 sheet 替代）
- ❌ drawer.tsx - 抽屉
- ❌ empty.tsx - 空状态
- ❌ field.tsx - 表单字段
- ❌ form.tsx - 表单
- ❌ hover-card.tsx - 悬浮卡片
- ❌ input-group.tsx - 输入组
- ❌ input-otp.tsx - OTP 输入
- ❌ item.tsx - 列表项
- ❌ kbd.tsx - 键盘快捷键
- ❌ menubar.tsx - 菜单栏
- ❌ navigation-menu.tsx - 导航菜单
- ❌ popover.tsx - 气泡弹窗
- ❌ progress.tsx - 进度条
- ❌ radio-group.tsx - 单选组
- ❌ resizable.tsx - 可调整大小
- ❌ scroll-area.tsx - 滚动区域
- ❌ select.tsx - 下拉选择
- ❌ separator.tsx - 分割线（被 sidebar 使用）
- ❌ sheet.tsx - 侧边面板（被 sidebar 使用）
- ❌ sidebar.tsx - 侧边栏（自引用）
- ❌ skeleton.tsx - 骨架屏（被 sidebar 使用）
- ❌ slider.tsx - 滑块
- ❌ sonner.tsx - Toast 通知
- ❌ spinner.tsx - 加载中
- ❌ switch.tsx - 开关
- ❌ table.tsx - 表格
- ❌ tabs.tsx - 标签页
- ❌ textarea.tsx - 多行输入
- ❌ toggle-group.tsx - 切换组
- ❌ toggle.tsx - 切换
- ❌ tooltip.tsx - 工具提示（被 sidebar 使用）

## 优化建议

### 可以安全删除的组件（47个）
由于这些组件在业务代码中完全未被使用，可以考虑删除以减少代码体积：

**基础组件**：
- accordion, alert, alert-dialog, aspect-ratio, avatar, breadcrumb, button-group

**表单组件**：
- calendar, checkbox, collapsible, field, form, input-group, input-otp, item, radio-group, slider, switch, table, tabs, textarea

**导航组件**：
- command, context-menu, drawer, hover-card, menubar, navigation-menu

**其他组件**：
- carousel, chart, dialog, empty, kbd, popover, progress, resizable, scroll-area, select, sonner, spinner, toggle, toggle-group

### 注意事项
- 删除前请备份 `src/components/ui/` 目录
- 如果将来需要这些组件，可以重新从 shadcn/ui 添加
- 建议先备份整个项目

## 预期收益
- 减少约 40-50 个未使用的组件文件
- 减少 node_modules 体积（如果移除对应的 Radix UI 依赖）
- 提升构建速度
- 简化项目结构
