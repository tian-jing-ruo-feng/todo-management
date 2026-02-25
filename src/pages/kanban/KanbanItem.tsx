import type { Group } from '@/types/Group'
import type { Priority } from '@/types/Priority'
import type { Task } from '@/types/Task'
import { groupRepository, priorityRepository } from '@/utils/repositories'
import {
  BookOutlined,
  DeleteOutlined,
  FlagOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, Button, Card, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/utils/db'

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

  // 使用 useLiveQuery 响应式获取负责人名称
  const assigneeName = useLiveQuery(async () => {
    if (!task.assignee) return ''

    try {
      // 获取所有成员，然后过滤匹配负责人
      const allMembers = await db.members.toArray()
      const member = allMembers.find(
        (m) => m.userId === task.assignee || m.email === task.assignee
      )

      if (member) {
        return member.name || member.email || '未命名'
      } else if (task.assignee) {
        // 可能是项目所有者或直接存储的 email
        return task.assignee
      }
      return ''
    } catch (error) {
      console.error('获取负责人信息失败:', error)
      return task.assignee || ''
    }
  }, [task.assignee])

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
      console.error('getPriorityByTaskPriority error:', error)
      return null
    }
  }

  useEffect(() => {
    const fetchPriority = async () => {
      const priority = await getPriorityByTaskPriority(task.priority)
      setTaskPriority(priority)
    }
    fetchPriority()
  }, [task.priority])

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

  // 使用 dayjs 格式化时间显示（带记忆化优化）
  const formatTime = useCallback((dateString?: string): string => {
    if (!dateString) return ''

    try {
      const date = dayjs(dateString)
      const now = dayjs()
      const nowStartOfDay = now.startOf('day')
      const dateStartOfDay = date.startOf('day')

      // 使用 startOfDay 准确判断是否是同一天
      if (dateStartOfDay.isSame(nowStartOfDay, 'day')) {
        // 今天 - 使用相对时间显示，更加直观
        const diffMinutes = now.diff(date, 'minute')
        if (diffMinutes < 1) {
          return '刚刚'
        } else if (diffMinutes < 60) {
          return `${diffMinutes}分钟前`
        } else if (diffMinutes < 120) {
          return '1小时前'
        } else if (diffMinutes < 1440) {
          const hours = Math.floor(diffMinutes / 60)
          return `${hours}小时前`
        } else {
          return date.format('今天 HH:mm')
        }
      } else if (
        dateStartOfDay.isSame(nowStartOfDay.subtract(1, 'day'), 'day')
      ) {
        // 昨天
        return date.format('昨天 HH:mm')
      } else if (now.diff(dateStartOfDay, 'day') < 7) {
        // 本周内 - 显示星期几
        return date.format('dddd')
      } else if (now.diff(dateStartOfDay, 'day') < 365) {
        // 本年内 - 显示月日
        return date.format('MM-DD')
      } else {
        // 超过一年 - 显示年月日
        return date.format('YYYY-MM-DD')
      }
    } catch {
      return ''
    }
  }, [])

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
            <div className="flex gap-2 flex-wrap">
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
          <div className="text-gray-600 text-xs mb-2">
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: task.content }}
            />
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
            {assigneeName && (
              <Tooltip title={`负责人: ${assigneeName}`}>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full">
                  <Avatar
                    size={16}
                    icon={<UserOutlined />}
                    className="bg-blue-400"
                  />
                  <span className="text-blue-600">{assigneeName}</span>
                </div>
              </Tooltip>
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
