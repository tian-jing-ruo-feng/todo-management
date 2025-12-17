import { type TableProps, Table, Tag } from 'antd';
import type { Task } from '@/types/Task';
// import TaskItem from './TaskItem'
import SingleTag from '@/components/SingleTag';
import mockTasks from '@/mock/task.json'
import mockGroups from '@/mock/group.json'
import mockStatus from '@/mock/status.json'
import mockPriority from '@/mock/priority.json'
import dayjs from 'dayjs'

const groupTags = (groups: string[]) => {
  return groups.map(groupId => {
    const group = mockGroups.find(g => g.id === groupId);
    return group ? <Tag key={groupId} color={group.color}>{group.name}</Tag>: '';
  });
};

const statusTags = (statusIds: string[]) => {
  return statusIds.map(statusId => {
    const status = mockStatus.find(s => s.id === statusId);
    return status ? <Tag key={statusId} color={status.color}>{status.name}</Tag>: '';
  });
};

const priorityTags = (priorityIds: string[]) => {
  return priorityIds.map(priorityId => {
    const priority = mockPriority.find(p => p.id === priorityId);
    return priority ? <Tag key={priorityId} color={priority.color}>{priority.name}</Tag>: '';
  });
};

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
    render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
    width: 180,
    render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '期望开始时间',
    dataIndex: 'expectStartTime',
    key: 'expectStartTime',
    width: 180,
    render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '期望结束时间',
    dataIndex: 'expectEndTime',
    key: 'expectEndTime',
    width: 180,
    render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '是否置顶',
    dataIndex: 'isTop',
    key: 'isTop',
    width: 100,
    render: (isTop: boolean) => isTop ? SingleTag({color: 'red', id: 'isTop', children: '是'}) : SingleTag({color: 'gray', id: 'notTop', children: '否'}),
  },
  {
    title: '是否移除',
    dataIndex: 'isRemoved',
    key: 'isRemoved',
    width: 100,
    render: (isRemoved: boolean) => isRemoved ? SingleTag({color: 'red', id: 'isRemoved', children: '是'}) : SingleTag({color: 'gray', id: 'notRemoved', children: '否'}),
  },
]
export default function index() {
  return (
    <ul>
      {/* {
        tasks.map((task, taskIndex) => <TaskItem task={task} key={taskIndex} />)
      } */}
      <Table<Task> bordered columns={columns} dataSource={tasks} />
    </ul>
  )
}
