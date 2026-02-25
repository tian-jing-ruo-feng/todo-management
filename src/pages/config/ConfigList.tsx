import type { ConfigItem } from '@/types/config'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Space, Table, Tag, type TableProps } from 'antd'

export interface ConfigListProps {
  data: ConfigItem[]
  loading?: boolean
  tagIcon?: React.ReactNode
  canManage?: boolean
  onEdit: (item: ConfigItem) => void
  onDelete: (item: ConfigItem) => void
  currentPage: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
  onSortChange: (activeId: string, overId: string) => void
}

export interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string
}

export default function ConfigList({
  data,
  loading,
  tagIcon,
  canManage = true,
  onEdit,
  onDelete,
  currentPage,
  pageSize,
  onPageChange,
  onSortChange,
}: ConfigListProps) {
  const Row: React.FC<Readonly<RowProps>> = (props) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: props['data-row-key'],
      disabled: !canManage,
    })

    const style: React.CSSProperties = {
      ...props.style,
      transform: CSS.Translate.toString(transform),
      transition,
      ...(canManage ? { cursor: 'move' } : {}),
      ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    }

    return (
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...(canManage ? attributes : {})}
        {...(canManage ? listeners : {})}
      />
    )
  }
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
      render: (_, record) =>
        canManage ? (
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
        ) : (
          <span className="text-gray-400 text-sm">无权限</span>
        ),
    },
  ]
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
        distance: 1,
      },
    })
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      onSortChange(active.id as string, over?.id as string)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        // rowKey array
        items={data.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <Table<ConfigItem>
          className="size-full flex flex-col flex-1 overflow-hidden"
          components={{
            body: { row: Row },
          }}
          scroll={{ y: 'calc(100% - 64px)' }} // 减去分页器高度
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
        />
      </SortableContext>
    </DndContext>
  )
}
