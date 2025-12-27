# Todo Management

一个基于 React 和 Rsbuild 的现代化待办事项管理应用。

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
pnpm run dev
```

Build the app for production:

```bash
pnpm run build
```

Preview the production build locally:

```bash
pnpm run preview
```

## 功能特性

### 📋 看板视图

看板视图是本应用的核心功能，提供直观的任务管理界面，支持拖拽操作和实时状态更新。

#### 功能概览

- **四个状态列**：待办、进行中、待审核、已完成
- **拖拽操作**：支持同列排序和跨列移动
- **任务管理**：创建、编辑、删除任务
- **优先级显示**：高、中、低三级优先级
- **时间追踪**：智能显示更新时间
- **响应式设计**：适配各种屏幕尺寸

#### 技术实现

**核心组件**

- **`KanbanBoard`** (`src/pages/kanban/KanbanBoard.tsx`)
  - 看板主容器，管理整体状态和拖拽逻辑
  - 使用 `@dnd-kit/core` 实现拖拽功能
  - 集成任务详情和创建弹窗

- **`KanbanColumn`** (`src/pages/kanban/KanbanColumn.tsx`)
  - 状态列组件，支持拖放和任务列表渲染
  - 实时显示任务数量和拖拽状态
  - 空状态提示和视觉反馈

- **`KanbanItem`** (`src/pages/kanban/KanbanItem.tsx`)
  - 任务卡片组件，展示任务详情
  - 支持富文本内容显示
  - 优先级和置顶标记显示
  - 智能时间格式化

**自定义 Hooks**

- **`useCrossColumnDragging`** (`src/pages/kanban/hooks/useCrossColumnDragging.ts`)
  - 管理跨列拖拽逻辑
  - 处理任务状态转换
  - 优化拖拽性能

- **`useSameColumnSorting`** (`src/pages/kanban/hooks/useSameColumnSorting.ts`)
  - 处理同列内任务排序
  - 维护任务顺序状态
  - 提供流畅的拖拽体验

#### 状态映射

看板使用智能状态映射系统，支持多种状态格式：

```typescript
const statusMap = {
  status_1: 'todo', // 待开始 -> 待办
  status_2: 'in-progress', // 进行中 -> 进行中
  status_3: 'done', // 已完成 -> 已完成
  status_4: 'review', // 已延期 -> 待审核
  status_5: 'todo', // 已取消 -> 待办
  // 兼容旧格式
  todo: 'todo',
  pending: 'todo',
  progress: 'in-progress',
  testing: 'review',
  completed: 'done',
}
```

#### 交互特性

**拖拽操作**

- 鼠标拖拽：支持点击拖拽，最小移动距离 8px
- 键盘操作：完整的键盘导航支持
- 视觉反馈：拖拽时的缩放、旋转和阴影效果
- 碰撞检测：智能识别目标列和位置

**视觉反馈**

- 拖拽悬浮：3px 旋转和蓝色边框高亮
- 列高亮：拖拽悬停时的渐变背景
- 空状态：友好的空列表提示
- 过渡动画：流畅的状态转换效果

**时间显示**

- 今天：显示 "今天 HH:mm"
- 昨天：显示 "昨天 HH:mm"
- 本周：显示星期几
- 本年内：显示 "MM-DD"
- 超过一年：显示 "YYYY-MM-DD"

#### 使用方式

1. **访问看板**：在应用中导航到看板页面
2. **添加任务**：点击列顶部 "添加任务" 按钮
3. **移动任务**：拖拽任务卡片到目标列
4. **调整顺序**：在同一列内拖拽调整任务顺序
5. **编辑任务**：点击任务卡片打开详情编辑
6. **查看状态**：实时查看各列任务数量

#### 性能优化

- **记忆化状态**：避免不必要的重新渲染
- **状态快照**：拖拽时缓存状态，提升响应性
- **懒加载**：按需渲染任务内容
- **事件防抖**：优化频繁的状态更新

#### 扩展性

看板模块设计高度模块化，支持：

- 自定义列配置
- 插件式功能扩展
- 主题定制
- 状态流程自定义

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
