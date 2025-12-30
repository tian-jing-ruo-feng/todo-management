import TaskCreateModal from '@/components/TaskCreateModal'
import TaskDetailModal from '@/components/TaskDetailModal'
import TaskFilterForm, {
  type TaskFilterValues,
} from '@/components/TaskFilterForm'
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
import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteTask, getAllTasksCount, saveTask } from '@/utils/db'
import KanbanColumn from './KanbanColumn'
import KanbanItem from './KanbanItem'
import { useCrossColumnDragging, useSameColumnSorting } from './hooks'
import { Modal } from 'antd'
import { statusRepository } from '@/utils/repositories/StatusRepository'

interface Column {
  id: string
  title: string
  color?: string
}

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
}

export default function KanbanBoard({
  tasks,
  onTasksChange,
}: KanbanBoardProps) {
  // 动态状态和列管理
  const [statusList, setStatusList] = useState<
    Array<{ id: string; name: string; color: string }>
  >([])
  const [columns, setColumns] = useState<Column[]>([])

  // 加载状态数据并生成列
  useEffect(() => {
    const loadStatusData = async () => {
      try {
        const statuses = await statusRepository.getAll()
        setStatusList(statuses)

        // 根据状态数据动态生成列
        const dynamicColumns: Column[] = statuses.map((status) => ({
          id: status.id,
          title: status.name,
          color: status.color,
        }))

        setColumns(dynamicColumns)
      } catch (error) {
        console.error('加载状态数据失败:', error)
      }
    }

    loadStatusData()
  }, [])

  // 动态状态映射
  const getColumnByStatus = useCallback(
    (status: string): string => {
      return (
        statusList.find((s) => s.id === status)?.id || statusList[0]?.id || ''
      )
    },
    [statusList]
  )

  // 过滤状态
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)

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

      // 按sort倒序排列（sort值大的在上面）
      Object.keys(grouped).forEach((columnId) => {
        grouped[columnId].sort((a, b) => {
          const sortA = a.sort ?? 0
          const sortB = b.sort ?? 0
          return sortB - sortA // 倒序：b在前
        })
      })

      return grouped
    }
  )

  // 当 filteredTasks 发生变化时，重新计算 tasksByColumn
  useEffect(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach((col) => {
      grouped[col.id] = []
    })

    // 根据任务状态分配到不同列，并按sort倒序排列
    filteredTasks.forEach((task) => {
      const columnId = getColumnByStatus(task.status)
      if (grouped[columnId]) {
        grouped[columnId].push(task)
      }
    })

    // 按sort倒序排列（sort值大的在上面）
    Object.keys(grouped).forEach((columnId) => {
      grouped[columnId].sort((a, b) => {
        const sortA = a.sort ?? 0
        const sortB = b.sort ?? 0
        return sortB - sortA // 倒序：b在前
      })
    })

    // 使用 setTimeout 避免同步 setState
    const timer = setTimeout(() => {
      setTasksByColumn(grouped)
    }, 0)
    return () => clearTimeout(timer)
  }, [filteredTasks, columns, getColumnByStatus])

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const draggedTaskRef = useRef<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('')

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

  // 处理过滤变化
  const handleFilterChange = useCallback(
    (filters: TaskFilterValues) => {
      const { status, priority, group, keyword } = filters

      let result = [...tasks]

      if (status) {
        result = result.filter((task) => task.status === status)
      }
      if (priority) {
        result = result.filter((task) => task.priority === priority)
      }
      if (group) {
        result = result.filter(
          (task) => task.group && task.group.includes(group)
        )
      }
      if (keyword) {
        result = result.filter((task) =>
          task.name.toLowerCase().includes(keyword.toLowerCase())
        )
      }

      setFilteredTasks(result)
    },
    [tasks]
  )

  // 重置过滤
  const handleResetFilter = useCallback(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  // 监听 tasks 变化，更新过滤后的任务
  useEffect(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  // 使用封装的hooks
  const { handleSameColumnSorting } = useSameColumnSorting({
    tasksByColumn,
    setTasksByColumn,
    tasksSnapshot: tasksByColumn, // 直接使用当前状态
    originalTasks: tasks,
    onTasksChange,
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
    async (updatedTask: Task) => {
      // 保存到数据库
      try {
        await saveTask(updatedTask)
      } catch (error) {
        console.error('保存任务失败:', error)
      }

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

        // 重新排序该列中的任务（按sort字段倒序）
        newTasksByColumn[targetColumnId].sort((a, b) => {
          const sortA = a.sort ?? 0
          const sortB = b.sort ?? 0
          return sortB - sortA
        })

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

  // 打开新增任务弹窗
  const handleAddTask = useCallback((columnId: string) => {
    // 直接使用列ID作为状态ID
    setDefaultColumnId(columnId)
    setCreateModalVisible(true)
  }, [])

  // 删除任务，弹出确认删除提示
  const handleDeleteTask = useCallback(
    (task: Task) => {
      Modal.confirm({
        title: '确认删除任务？',
        content: '删除后将无法恢复，请确认是否删除。',
        onOk: async () => {
          try {
            await deleteTask(task.id)

            // 更新父组件状态
            if (onTasksChange) {
              const updatedTasks = tasks.filter((t) => t.id !== task.id)
              onTasksChange(updatedTasks)
            }

            // 更新本地状态
            setTasksByColumn((prev) => {
              const newTasksByColumn = { ...prev }
              Object.keys(newTasksByColumn).forEach((columnId) => {
                newTasksByColumn[columnId] = newTasksByColumn[columnId].filter(
                  (t) => t.id !== task.id
                )
              })
              return newTasksByColumn
            })
          } catch (error) {
            console.error('删除任务失败:', error)
          }
        },
      })
    },
    [tasks, onTasksChange]
  )

  const handleCreateModalClose = useCallback(() => {
    setCreateModalVisible(false)
    setDefaultColumnId('')
  }, [])

  // 创建新任务
  const handleCreateTask = useCallback(
    async (newTask: Task) => {
      let newTaskWithSort = newTask
      // 保存到数据库
      try {
        // 获取任务总数
        const taskCount = await getAllTasksCount()
        // 为新任务设置sort字段
        newTaskWithSort = { ...newTask, sort: taskCount + 1 }
        await saveTask(newTaskWithSort)
      } catch (error) {
        console.error('创建任务失败:', error)
        return // 如果保存失败，直接返回
      }

      // 更新父组件状态，使用包含sort字段的任务
      if (onTasksChange) {
        const updatedTasks = [...tasks, newTaskWithSort]
        onTasksChange(updatedTasks)
      }

      // 更新本地状态，正确添加新任务到对应列中
      const columnId = getColumnByStatus(newTaskWithSort.status)
      setTasksByColumn((prev) => {
        const newTasksByColumn = { ...prev }
        if (!newTasksByColumn[columnId]) {
          newTasksByColumn[columnId] = []
        }
        // 将新任务添加到列中，并按sort字段排序
        newTasksByColumn[columnId] = [
          ...newTasksByColumn[columnId],
          newTaskWithSort,
        ].sort((a, b) => (b.sort ?? 0) - (a.sort ?? 0))
        return newTasksByColumn
      })
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
        for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
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
      tasksByColumn,
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
    <div className="p-2 bg-gray-50 size-full overflow-hidden">
      {/* 任务过滤表单 */}
      <div className="mb-3">
        <TaskFilterForm
          onFilterChange={handleFilterChange}
          onReset={handleResetFilter}
        />
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
          <div className="flex gap-4 overflow-x-auto pb-4 size-full overflow-hidden">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasksByColumn[column.id] || []}
                color={column.color}
                onEditTask={handleEditTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
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
