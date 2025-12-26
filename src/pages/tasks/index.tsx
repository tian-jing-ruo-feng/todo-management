import type { Task } from '@/types/Task'
import { type TableProps, Flex, Table, Tag } from 'antd'
// import TaskItem from './TaskItem'
import SingleTag from '@/components/SingleTag'
import mockGroups from '@/mock/group.json'
import mockPriority from '@/mock/priority.json'
import mockStatus from '@/mock/status.json'
import mockTasks from '@/mock/task.json'
import dayjs from 'dayjs'
import { useState } from 'react'
import KanbanPage from '../kanban'
import SelectTab, { type ButtonItem } from './SelectTab'
import TaskStatistc from './TaskStatistc'

const groupTags = (groups: string[]) => {
  const tags = groups.map((groupId) => {
    const group = mockGroups.find((g) => g.id === groupId)
    return group ? (
      <Tag key={groupId} color={group.color}>
        {group.name}
      </Tag>
    ) : (
      ''
    )
  })
  return (
    <Flex gap="small" align="center" wrap>
      {tags}
    </Flex>
  )
}

const statusTags = (statusIds: string[]) => {
  return statusIds.map((statusId) => {
    const status = mockStatus.find((s) => s.id === statusId)
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
    const priority = mockPriority.find((p) => p.id === priorityId)
    return priority ? (
      <Tag key={priorityId} color={priority.color}>
        {priority.name}
      </Tag>
    ) : (
      ''
    )
  })
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

const tasks: Task[] = mockTasks
const columns: TableProps<Task>['columns'] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
    render: (text: string) => text || '-',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (statusId: string) => statusTags([statusId]) || '-',
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 100,
    render: (priorityId: string) => priorityTags([priorityId]) || '-',
  },
  {
    title: '分组',
    dataIndex: 'group',
    key: 'group',
    width: 120,
    render: (groups: string[]) => groupTags(groups) || '-',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
    render: (time: string) =>
      time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
    width: 180,
    render: (time: string) =>
      time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '期望开始时间',
    dataIndex: 'expectedStartTime',
    key: 'expectedStartTime',
    width: 180,
    render: (time: string) =>
      time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '期望结束时间',
    dataIndex: 'expectedEndTime',
    key: 'expectedEndTime',
    width: 180,
    render: (time: string) =>
      time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '是否置顶',
    dataIndex: 'isTop',
    key: 'isTop',
    width: 100,
    render: (isTop: boolean) =>
      isTop ? (
        <SingleTag color="red" id="isTop">
          是
        </SingleTag>
      ) : (
        <SingleTag color="gray" id="notTop">
          否
        </SingleTag>
      ),
  },
  {
    title: '是否移除',
    dataIndex: 'isRemoved',
    key: 'isRemoved',
    width: 100,
    render: (isRemoved: boolean) =>
      isRemoved ? (
        <SingleTag color="red" id="isRemoved">
          是
        </SingleTag>
      ) : (
        <SingleTag color="gray" id="notRemoved">
          否
        </SingleTag>
      ),
  },
]
export default function Tasks() {
  const [selectTab, setSelectTab] = useState<ButtonItem>()
  const handleSelectTabChange = (item: ButtonItem) => {
    setSelectTab(item)
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <TaskStatistc></TaskStatistc>
      <SelectTab onChange={handleSelectTabChange}></SelectTab>
      {selectTab?.key === 'kanban' && <KanbanPage></KanbanPage>}

      {selectTab?.key === 'priority' && (
        <Table<Task>
          bordered
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          rowSelection={{ type: 'checkbox', ...rowSelection }}
        />
      )}
    </div>
  )
}
