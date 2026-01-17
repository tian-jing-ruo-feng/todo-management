import type { Task } from '@/types/Task'
import { Table, Tag, type TableProps } from 'antd'
import type { Group } from '../../types/Group'
import type { Priority } from '../../types/Priority'
import type { Status } from '../../types/Status'

interface TaskTableProps {
  statusOptions: Status[]
  priorityOptions: Priority[]
  groupOptions: Group[]
  filteredTasks: Task[]
}

export default function TaskTable({
  statusOptions,
  priorityOptions,
  groupOptions,
  filteredTasks,
}: TaskTableProps) {
  const groupTags = (groups: string[]) => {
    return groups.map((groupId) => {
      const group = groupOptions.find((g) => g.id === groupId)
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
      const status = statusOptions.find((s) => s.id === statusId)
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
      const priority = priorityOptions.find((p) => p.id === priorityId)
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
    const statusObj = statusOptions.find((s) => s.id === status)
    return statusObj ? statusObj.color : ''
  }

  const rowSelection: TableProps<Task>['rowSelection'] = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(
        `selectedRowKeys: ${selectedRowKeys}`,
        'selectedRows:',
        selectedRows
      )
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
      // onCell: (record) => ({
      //   style: {
      //     borderTop: `4px solid ${statusColor(record.status)}`,
      //   },
      // }),
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
      title: '截止时间',
      key: 'deadLine',
      width: 100,
      render() {
        return '--'
      },
    },
    {
      title: 'SLA剩余',
      key: 'sla',
      width: 100,
      render() {
        return '--'
      },
    },
  ]

  return (
    <Table<Task>
      className="size-full flex flex-col flex-1"
      bordered
      rowKey="id"
      columns={columns}
      scroll={{ y: 'calc(100% - 64px)' }} // 减去分页器高度
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
