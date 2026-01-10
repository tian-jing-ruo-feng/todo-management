import SingleTag from '@/components/SingleTag'
import mockGroups from '@/mock/group.json'
import mockPriority from '@/mock/priority.json'
import mockStatus from '@/mock/status.json'
import type { Task } from '@/types/Task'
import { Flex, Table, Tag, type TableProps } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import TaskCreateModal from '../../components/TaskCreateModal'
import TaskFilterForm from '../../components/TaskFilterForm'
import type { Status } from '../../types/Status'
import { getAllTasks, getAllTasksCount, saveTask } from '../../utils/db'
import { statusRepository } from '../../utils/repositories'
import ConfigPage from '../config'
import KanbanPage from '../kanban'
import { useTaskFilter } from '../kanban/hooks/useTaskFilter'
import SelectTab, { type ButtonItem } from './SelectTab'

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

// const tasks: Task[] = mockTasks
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
  const [statusList, setStatusList] = useState<Status[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('')
  const beforeCreateTask = () => {}
  const {
    filteredTasks,
    setTasks,
    handleFilterChange,
    handleResetFilter,
    handleUploadSuccess,
  } = useTaskFilter({ statusList, beforeCreateTask })

  useEffect(() => {
    const loadStatusData = async () => {
      try {
        const statuses = await statusRepository.getAll()
        setStatusList(statuses)
      } catch (error) {
        console.error('加载状态数据失败:', error)
      }
    }
    loadStatusData()
  }, [])

  const handleSelectTabChange = (item: ButtonItem) => {
    setSelectTab(item)
  }

  const handleRefresh = useCallback(async () => {
    const allTasks = await getAllTasks()
    setTasks(allTasks)
  }, [setTasks])

  // 打开新增任务弹窗
  const handleAddTask = useCallback(
    (columnId?: string) => {
      if (!columnId) {
        columnId = statusList.length ? statusList[0].id : ''
      }
      // 直接使用列ID作为状态ID
      setDefaultColumnId(columnId)
      setCreateModalVisible(true)
    },
    [statusList]
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
        handleRefresh()
      } catch (error) {
        console.error('创建任务失败:', error)

        return // 如果保存失败，直接返回
      }
    },
    [handleRefresh]
  )

  return (
    <div className="flex flex-col gap-3 p-3 size-full overflow-hidden">
      {/* <TaskStatistc></TaskStatistc> */}
      <SelectTab onChange={handleSelectTabChange}></SelectTab>
      {/* 任务过滤表单 */}
      <TaskFilterForm
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        onUploadSuccess={handleUploadSuccess}
        onAddTask={handleAddTask}
      ></TaskFilterForm>
      {selectTab?.key === 'kanban' && (
        <div className="flex-1 size-full overflow-auto">
          <KanbanPage
            tasks={filteredTasks}
            onRefresh={handleRefresh}
          ></KanbanPage>
        </div>
      )}

      {selectTab?.key === 'config' && <ConfigPage />}

      {selectTab?.key === 'priority' && (
        <div className="flex-1 size-full overflow-auto">
          <Table<Task>
            bordered
            rowKey="id"
            columns={columns}
            dataSource={filteredTasks}
            rowSelection={{ type: 'checkbox', ...rowSelection }}
          />
        </div>
      )}
      <TaskCreateModal
        visible={createModalVisible}
        defaultStatus={defaultColumnId}
        onClose={handleCreateModalClose}
        onSave={handleCreateTask}
      />
    </div>
  )
}
