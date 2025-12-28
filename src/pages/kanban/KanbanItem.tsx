import type { Group } from '@/types/Group'
import type { Priority } from '@/types/Priority'
import type { Task } from '@/types/Task'
import { groupRepository, priorityRepository } from '@/utils/repositories'
import { BookOutlined, DeleteOutlined, FlagOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Card, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect, useState } from 'react'

// 配置 dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface KanbanItemProps {
  task: Task
  isDragging?: boolean // 拖拽浮层中的状态
  onEdit?: (task: Task) => void // 添加编辑回调
  onDelete?: (task: Task) => void // 添加删除回调
}

export default function KanbanItem({
  task,
  isDragging: isOverlayDragging = false,
  onEdit,
  onDelete,
}: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })
  const [taskPriority, setTaskPriority] = useState<Priority | null | undefined>(
    null
  )
  const [groupList, setGroupList] = useState<Group[]>([])

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

  const getPriorityByTaskPriority = async (taskPriority: string) => {
    try {
      return await priorityRepository.getById(taskPriority)
    } catch (error) {
      console.log(error, 'getPriorityByTaskPriority error')
      return null
    }
  }

  useEffect(() => {
    const fetchPriority = async () => {
      const priority = await getPriorityByTaskPriority(task.priority)
      setTaskPriority(priority)
    }
    fetchPriority()
  }, [])

  useEffect(() => {
    const fetchGroup = async () => {
      const groupList = await groupRepository.getAll()
      setGroupList(groupList)
    }
    fetchGroup()
  }, [])

  const getGroupById = (groupId: string) => {
    return groupList.find((group) => group.id === groupId)
  }

  // 安全的HTML内容清理，移除危险标签和属性
  const sanitizeHTML = (html: string): string => {
    // 移除script标签、on事件属性、javascript:协议等危险内容
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
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
        title={
          <div className="flex flex-col pb-2">
            <div className="flex justify-between items-center">
              <p
                className="size-full overflow-hidden text-ellipsis"
                title={task.name}
              >
                {task.name}
              </p>
              <Button
                danger
                icon={<DeleteOutlined />}
                type="link"
                onClick={(e) => {
                  e.stopPropagation() // 防止触发编辑事件
                  onDelete?.(task)
                }}
              ></Button>
            </div>
            <div className="flex gap-2">
              {task.group?.map((groupId) => {
                const group = getGroupById(groupId)
                if (group) {
                  return (
                    <Tag
                      variant="outlined"
                      icon={<BookOutlined />}
                      key={group.id}
                      color={group.color}
                    >
                      {group.name}
                    </Tag>
                  )
                }
              })}
            </div>
          </div>
        }
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
              <div
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(task.content) }}
              />
            ) : (
              <p className="line-clamp-2 leading-relaxed">{task.content}</p>
            )}
          </div>
        )}
        <div className="flex justify-between items-center text-xs mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {taskPriority && (
              <p style={{ color: taskPriority.color, fontWeight: 'bold' }}>
                <FlagOutlined />
                <span className="ml-1">{taskPriority.name}</span>
              </p>
            )}
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
