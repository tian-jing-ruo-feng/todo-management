import { Tag, type TableProps } from 'antd'
import { Button, Space, Table } from 'antd'
import type { ConfigItem } from '@/types/config'

export interface ConfigListProps {
  data: ConfigItem[]
  loading?: boolean
  tagIcon?: React.ReactNode
  onEdit: (item: ConfigItem) => void
  onDelete: (item: ConfigItem) => void
  currentPage: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
}

export default function ConfigList({
  data,
  loading,
  tagIcon,
  onEdit,
  onDelete,
  currentPage,
  pageSize,
  onPageChange,
}: ConfigListProps) {
  const columns: TableProps<ConfigItem>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      ellipsis: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Tag color={record.color} icon={tagIcon}>
          {record.name || '-'}
        </Tag>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 150,
      render: (color: string) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-gray-600">{color}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => onDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]
  // 分页状态由父组件控制，移除本地冗余状态

  return (
    <Table<ConfigItem>
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: data.length,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '20', '50'],
        showQuickJumper: true,
        showTotal: (total, range) =>
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        onChange: onPageChange,
      }}
      scroll={{ x: 800 }}
    />
  )
}
