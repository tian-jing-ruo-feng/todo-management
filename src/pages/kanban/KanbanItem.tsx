import type { Task } from '@/types/Task'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

// 配置 dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface KanbanItemProps {
  task: Task
  isDragging?: boolean // 拖拽浮层中的状态
  onEdit?: (task: Task) => void // 添加编辑回调
}

export default function KanbanItem({
  task,
  isDragging: isOverlayDragging = false,
  onEdit,
}: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  // 如果是拖拽浮层中的组件，不需要使用dnd-kit的样式
  const style = isOverlayDragging
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition: isSortableDragging ? 'none' : transition, // 拖拽时移除过渡效果
        opacity: isSortableDragging ? 0.8 : 1,
        zIndex: isSortableDragging ? 1000 : 'auto',
        position: isSortableDragging
          ? ('relative' as const)
          : ('static' as const),
      }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  // 检查内容是否包含HTML标签
  const isHTMLContent = (content: string): boolean => {
    return /<[^>]+>/.test(content)
  }

  // 使用 dayjs 格式化时间显示
  const formatTime = (dateString?: string): string => {
    if (!dateString) return ''

    try {
      const date = dayjs(dateString)
      const now = dayjs()
      const diffDays = now.diff(date, 'day')

      if (diffDays === 0) {
        // 今天 - 显示具体时间
        return date.format('今天 HH:mm')
      } else if (diffDays === 1) {
        // 昨天
        return date.format('昨天 HH:mm')
      } else if (diffDays < 7) {
        // 本周内 - 显示星期几
        return date.format('dddd')
      } else if (diffDays < 365) {
        // 本年内 - 显示月日
        return date.format('MM-DD')
      } else {
        // 超过一年 - 显示年月日
        return date.format('YYYY-MM-DD')
      }
    } catch {
      return ''
    }
  }

  return (
    <div
      ref={!isOverlayDragging ? setNodeRef : undefined}
      style={style}
      {...(!isOverlayDragging && attributes)}
      {...(!isOverlayDragging && listeners)}
      className={`transition-all duration-200 ${
        isOverlayDragging
          ? 'cursor-grabbing'
          : isSortableDragging
            ? 'cursor-grabbing scale-105'
            : 'cursor-grab hover:scale-[1.01]'
      }`}
      onClick={() => onEdit?.(task)}
    >
      <Card
        size="small"
        title={task.name}
        className={`transition-all duration-200 ${
          isOverlayDragging
            ? 'shadow-2xl border-blue-500 bg-white'
            : isSortableDragging
              ? 'shadow-2xl border-blue-400'
              : 'hover:shadow-lg hover:border-gray-300'
        }`}
      >
        {task.content && (
          <div className="text-gray-600 text-sm mb-2">
            {isHTMLContent(task.content) ? (
              <div dangerouslySetInnerHTML={{ __html: task.content }} />
            ) : (
              <p className="line-clamp-2 leading-relaxed">{task.content}</p>
            )}
          </div>
        )}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority === 'high'
                ? '高'
                : task.priority === 'medium'
                  ? '中'
                  : '低'}
              优先级
            </span>
            {task.isTop && (
              <span className="text-orange-500 font-semibold bg-orange-50 px-2 py-1 rounded">
                置顶
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span>更新：{formatTime(task.updateTime || task.createTime)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
