import TaskCreateModal from '@/components/TaskCreateModal'
import TaskDetailModal from '@/components/TaskDetailModal'
import type { Task } from '@/types/Task'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import KanbanItem from './KanbanItem'
import { useCrossColumnDragging, useSameColumnSorting } from './hooks'

interface Column {
  id: string
  title: string
  color?: string
}

const initialColumns: Column[] = [
  { id: 'todo', title: '待办', color: '#ff4d4f' },
  { id: 'in-progress', title: '进行中', color: '#1890ff' },
  { id: 'review', title: '待审核', color: '#faad14' },
  { id: 'done', title: '已完成', color: '#52c41a' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
}

export default function KanbanBoard({
  tasks,
  onTasksChange,
}: KanbanBoardProps) {
  const columns = useMemo(() => initialColumns, [])

  const getColumnByStatus = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      status_1: 'todo', // 待开始 -> 待办
      status_2: 'in-progress', // 进行中 -> 进行中
      status_3: 'done', // 已完成 -> 已完成
      status_4: 'review', // 已延期 -> 待审核
      status_5: 'todo', // 已取消 -> 待办
      // 兼容旧的status值
      todo: 'todo',
      pending: 'todo',
      'in-progress': 'in-progress',
      progress: 'in-progress',
      review: 'review',
      testing: 'review',
      done: 'done',
      completed: 'done',
    }
    return statusMap[status] || 'todo'
  }, [])

  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>(
    () => {
      const grouped: Record<string, Task[]> = {}
      columns.forEach((col) => {
        grouped[col.id] = []
      })

      // 根据任务状态分配到不同列
      tasks.forEach((task) => {
        const columnId = getColumnByStatus(task.status)
        if (grouped[columnId]) {
          grouped[columnId].push(task)
        }
      })

      return grouped
    }
  )

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const draggedTaskRef = useRef<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('status_1')

  // 简化的查找函数，不依赖状态，避免循环依赖
  const findTaskByIdSimple = useCallback(
    (taskId: string, currentState: Record<string, Task[]>): Task | null => {
      for (const columnTasks of Object.values(currentState)) {
        const task = columnTasks.find((t) => t.id === taskId)
        if (task) return task
      }
      return null
    },
    []
  )

  // 记忆化当前任务分布，避免不必要的计算
  const memoizedTasksByColumn = useMemo(() => tasksByColumn, [tasksByColumn])

  // 使用封装的hooks
  const { handleSameColumnSorting } = useSameColumnSorting({
    tasksByColumn,
    setTasksByColumn,
    findTaskById: findTaskByIdSimple,
    tasksSnapshot: memoizedTasksByColumn, // 实际会在初始化时更新
  })

  const {
    dragStateRef,
    initializeDrag,
    updateTargetColumn,
    handleCrossColumnMove,
  } = useCrossColumnDragging({
    tasksByColumn,
    setTasksByColumn,
    columns,
    originalTasks: tasks,
    onTasksChange,
  })

  // 处理任务更新
  const handleTaskUpdate = useCallback(
    (updatedTask: Task) => {
      if (onTasksChange) {
        const updatedTasks = tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
        onTasksChange(updatedTasks)
      }

      // 更新本地状态 - 处理跨列移动
      setTasksByColumn((prev) => {
        const newTasksByColumn = { ...prev }

        // 首先从所有列中移除原任务
        Object.keys(newTasksByColumn).forEach((columnId) => {
          newTasksByColumn[columnId] = newTasksByColumn[columnId].filter(
            (task) => task.id !== updatedTask.id
          )
        })

        // 然后将更新后的任务添加到正确的列中
        const targetColumnId = getColumnByStatus(updatedTask.status)
        if (!newTasksByColumn[targetColumnId]) {
          newTasksByColumn[targetColumnId] = []
        }
        newTasksByColumn[targetColumnId].push(updatedTask)

        return newTasksByColumn
      })
    },
    [tasks, onTasksChange, getColumnByStatus]
  )

  // 打开编辑弹窗
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setModalVisible(true)
  }, [])

  // 关闭弹窗
  const handleModalClose = useCallback(() => {
    setModalVisible(false)
    setEditingTask(null)
  }, [])

  // 保存任务
  const handleSaveTask = useCallback(
    (updatedTask: Task) => {
      handleTaskUpdate(updatedTask)
    },
    [handleTaskUpdate]
  )

  // 列ID到Status ID的映射
  const getColumnToStatusMap = useCallback(() => {
    return {
      todo: 'status_1', // 待开始
      'in-progress': 'status_2', // 进行中
      review: 'status_3', // 已完成（作为审核状态）
      done: 'status_3', // 已完成
    }
  }, [])

  // 打开新增任务弹窗
  const handleAddTask = useCallback(
    (columnId: string) => {
      const statusMap = getColumnToStatusMap()
      const defaultStatus =
        statusMap[columnId as keyof typeof statusMap] || 'status_1'
      setDefaultColumnId(defaultStatus)
      setCreateModalVisible(true)
    },
    [getColumnToStatusMap]
  )

  // 关闭新增任务弹窗
  const handleCreateModalClose = useCallback(() => {
    setCreateModalVisible(false)
    setDefaultColumnId('status_1')
  }, [])

  // 创建新任务
  const handleCreateTask = useCallback(
    (newTask: Task) => {
      if (onTasksChange) {
        const updatedTasks = [...tasks, newTask]
        onTasksChange(updatedTasks)
      }

      // 更新本地状态
      const columnId = getColumnByStatus(newTask.status)
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), newTask],
      }))
    },
    [tasks, onTasksChange, getColumnByStatus]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const task = findTaskByIdSimple(active.id as string, tasksByColumn)
      setActiveTask(task)
      draggedTaskRef.current = task

      // 找到源列
      let sourceColumn = null
      for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
        if (columnTasks.some((task) => task.id === active.id)) {
          sourceColumn = columnId
          break
        }
      }

      if (sourceColumn) {
        initializeDrag(active.id as string, sourceColumn, tasksByColumn)
      }
    },
    [tasksByColumn, findTaskByIdSimple, initializeDrag]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string
      const dragState = dragStateRef.current

      // 如果拖拽到自己身上，不处理
      if (activeId === overId) return

      // 确定目标列 - overId可能是列ID或任务ID
      let targetColumnId = columns.find((col) => col.id === overId)?.id

      // 如果不是列ID，查找overId所在的任务所在列
      if (!targetColumnId) {
        for (const [columnId, columnTasks] of Object.entries(
          memoizedTasksByColumn
        )) {
          if (columnTasks.some((task) => task.id === overId)) {
            targetColumnId = columnId
            break
          }
        }
      }

      // 如果还是找不到目标列或源列无效，不处理
      if (!targetColumnId || !dragState.sourceColumn) return

      // 区分处理同列排序和跨列移动
      if (dragState.sourceColumn === targetColumnId) {
        // 同列内排序：使用同列排序hook
        handleSameColumnSorting(event, activeId, overId, targetColumnId)
      } else {
        // 跨列移动：只记录最后一次目标列，避免重复处理
        updateTargetColumn(targetColumnId)
      }
    },
    [
      columns,
      memoizedTasksByColumn,
      handleSameColumnSorting,
      updateTargetColumn,
      dragStateRef,
    ]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const draggedTask = draggedTaskRef.current
      if (!draggedTask) return

      // 使用跨列拖拽hook处理结束逻辑
      handleCrossColumnMove(event, draggedTask)

      setActiveTask(null)
      draggedTaskRef.current = null
    },
    [handleCrossColumnMove]
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">任务看板</h1>
        <p className="text-gray-600">拖拽任务卡片来改变状态和顺序</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext
          items={columns.map((col) => col.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasksByColumn[column.id] || []}
                color={column.color}
                onEditTask={handleEditTask}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeTask ? (
            <div className="rotate-3 shadow-2xl scale-105 border-2 border-blue-400 rounded-lg bg-white">
              <KanbanItem task={activeTask} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        visible={modalVisible}
        task={editingTask}
        onClose={handleModalClose}
        onSave={handleSaveTask}
      />

      <TaskCreateModal
        visible={createModalVisible}
        defaultStatus={defaultColumnId}
        onClose={handleCreateModalClose}
        onSave={handleCreateTask}
      />
    </div>
  )
}
