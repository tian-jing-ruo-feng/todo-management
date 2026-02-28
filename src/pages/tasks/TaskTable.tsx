import type { Task } from '@/types/Task'
import { Avatar, Table, Tag, Tooltip, type TableProps } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { Group } from '../../types/Group'
import type { Priority } from '../../types/Priority'
import type { Status } from '../../types/Status'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/utils/db'

interface TaskTableProps {
  projectId?: string
  statusList: Status[]
  priorityList: Priority[]
  groupList: Group[]
  filteredTasks: Task[]
}

export default function TaskTable({
  projectId,
  statusList,
  priorityList,
  groupList,
  filteredTasks,
}: TaskTableProps) {
  // 获取成员信息
  const members = useLiveQuery(async () => {
    if (!projectId) return []

    const project = await db.projects.get(projectId)
    if (!project) return []

    const projectMembers = await db.members
      .where('realmId')
      .equals(project.realmId)
      .toArray()

    const ownerMember = projectMembers.find(
      (m) => m.userId === project.owner || m.email === project.owner
    )

    const allMembers = [
      {
        id: project.owner || '',
        name: ownerMember?.name || '项目所有者',
        email: ownerMember?.email || project.owner,
        isOwner: true,
      },
      ...projectMembers
        .filter((m) => m.userId !== project.owner && m.email !== project.owner)
        .map((m) => ({
          id: m.userId || m.email || '',
          name: m.name || m.email || m.userId || '未命名成员',
          email: m.email,
          isOwner: false,
        })),
    ]

    return Array.from(new Map(allMembers.map((m) => [m.id, m])).values())
  }, [projectId])

  // 获取负责人显示名称
  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId || !members) return '-'
    const member = members.find((m) => m.id === assigneeId)
    return member?.name || assigneeId
  }

  // 计算截止时间显示
  const formatDeadline = (expectEndTime?: string) => {
    if (!expectEndTime) return null
    const endTime = new Date(expectEndTime)
    const now = new Date()
    const isOverdue = endTime < now

    const formatted = endTime.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

    return { text: formatted, isOverdue }
  }

  // 计算SLA剩余时间
  const calculateSLA = (expectEndTime?: string) => {
    if (!expectEndTime) return null

    const endTime = new Date(expectEndTime)
    const now = new Date()
    const diffMs = endTime.getTime() - now.getTime()

    if (diffMs <= 0) return { text: '已超时', isOverdue: true }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    let text = ''
    if (diffDays > 0) {
      text = `${diffDays}天${diffHours}小时`
    } else if (diffHours > 0) {
      text = `${diffHours}小时${diffMinutes}分钟`
    } else {
      text = `${diffMinutes}分钟`
    }

    // 少于1天显示警告色
    const isWarning = diffDays === 0

    return { text, isOverdue: false, isWarning }
  }

  const groupTags = (groups: string[]) => {
    return groups.map((groupId) => {
      const group = groupList.find((g) => g.id === groupId)
      return group ? (
        <Tag key={groupId} color={group.color}>
          {group.name}
        </Tag>
      ) : (
        ''
      )
    })
  }

  const statusTags = (statusIds: string[]) => {
    return statusIds.map((statusId) => {
      const status = statusList.find((s) => s.id === statusId)
      return status ? (
        <Tag key={statusId} color={status.color}>
          {status.name}
        </Tag>
      ) : (
        ''
      )
    })
  }

  const priorityTags = (priorityIds: string[]) => {
    return priorityIds.map((priorityId) => {
      const priority = priorityList.find((p) => p.id === priorityId)
      return priority ? (
        <Tag key={priorityId} color={priority.color}>
          {priority.name}
        </Tag>
      ) : (
        ''
      )
    })
  }

  const statusColor = (status: string) => {
    const statusObj = statusList.find((s) => s.id === status)
    return statusObj ? statusObj.color : ''
  }

  const rowSelection: TableProps<Task>['rowSelection'] = {
    onChange: () => {
      // 处理行选择变化
    },
    getCheckboxProps: (record) => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  }

  const columns: TableProps<Task>['columns'] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      onCell: (record) => ({
        style: {
          borderLeft: `4px solid ${statusColor(record.status)}`,
        },
      }),
      render: (text: string, record: Task, index: number) => index + 1,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      minWidth: 200,
      render: (text: string, record: Task) => (
        <>
          <div className="flex flex-col gap-y-3">
            {record && (
              <ul className="flex gap-x-1 flex-wrap text-xs">
                {record.group && <li>分组：{groupTags(record.group || [])}</li>}
                {record.status && <li>状态：{statusTags([record.status])}</li>}
                {record.priority && (
                  <li>优先级：{priorityTags([record.priority])}</li>
                )}
              </ul>
            )}
            <p>{text || ''}</p>
          </div>
        </>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => (
        <div
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: text || '-' }}
        ></div>
      ),
      minWidth: 200,
    },
    {
      title: '负责人',
      key: 'assignee',
      width: 180,
      render: (_: unknown, record: Task) => {
        const assigneeName = getAssigneeName(record.assignee)
        if (assigneeName === '-') return '-'

        const member = members?.find((m) => m.id === record.assignee)
        return (
          <Tooltip title={member?.email || record.assignee}>
            <div className="flex items-center gap-2">
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{
                  backgroundColor: member?.isOwner ? '#6253e1' : '#04befe',
                }}
              >
                {assigneeName?.charAt(0).toUpperCase()}
              </Avatar>
              <span className="truncate">{assigneeName}</span>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: '截止时间',
      key: 'deadLine',
      width: 140,
      render: (_: unknown, record: Task) => {
        const result = formatDeadline(record.expectEndTime)
        if (!result) return '-'

        return (
          <span style={{ color: result.isOverdue ? '#ff4d4f' : undefined }}>
            {result.text}
          </span>
        )
      },
    },
    {
      title: 'SLA剩余',
      key: 'sla',
      width: 120,
      render: (_: unknown, record: Task) => {
        const result = calculateSLA(record.expectEndTime)
        if (!result) return '-'

        return (
          <span
            style={{
              color: result.isOverdue
                ? '#ff4d4f'
                : result.isWarning
                  ? '#faad14'
                  : undefined,
            }}
          >
            {result.text}
          </span>
        )
      },
    },
  ]

  return (
    <Table<Task>
      className="size-full flex flex-col flex-1"
      bordered
      rowKey="id"
      columns={columns}
      scroll={{ x: 'max-content', y: 'calc(100% - 64px)' }} // 减去分页器高度
      dataSource={filteredTasks}
      rowSelection={{ type: 'checkbox', ...rowSelection }}
      pagination={{
        pageSize: 10,
        placement: ['bottomEnd'],
        showTotal: (total) => `共 ${total} 条`,
        total: filteredTasks.length,
      }}
    />
  )
}
