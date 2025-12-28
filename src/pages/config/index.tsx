import { useState, useEffect } from 'react'
import { Button, Card, Empty, Spin, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ConfigTabs from './ConfigTabs'
import ConfigList from './ConfigList'
import ConfigForm from './ConfigForm'
import DeleteDialog from './DeleteDialog'
import {
  ConfigType,
  type ConfigItem,
  type ConfigFormData,
} from '@/types/config'
import {
  statusRepository,
  priorityRepository,
  groupRepository,
} from '@/utils/repositories'
import type { Status } from '@/types/Status'
import type { Priority } from '@/types/Priority'
import type { Group } from '@/types/Group'

export default function ConfigPage() {
  const [activeKey, setActiveKey] = useState<string>(ConfigType.Status)
  const [data, setData] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(false)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 表单相关
  const [formVisible, setFormVisible] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null)

  // 删除确认
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ConfigItem | null>(null)

  // 加载数据
  const loadData = async (type: string, page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      let items: ConfigItem[] = []
      switch (type) {
        case ConfigType.Status:
          items = await statusRepository.getPaginated(page, pageSize)
          break
        case ConfigType.Priority:
          items = await priorityRepository.getPaginated(page, pageSize)
          break
        case ConfigType.Group:
          items = await groupRepository.getPaginated(page, pageSize)
          break
      }
      setData(items)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换标签页
  const handleTabChange = (key: string) => {
    setActiveKey(key)
    setCurrentPage(1) // 切换标签时重置分页
    setPageSize(10) // 切换标签时重置分页
    loadData(key, 1, 10)
  }

  // 初始化加载
  useEffect(() => {
    loadData(activeKey, currentPage, pageSize)
  }, [activeKey, currentPage, pageSize])

  // 打开新增表单
  const handleAdd = () => {
    setFormTitle('新增配置')
    setEditingItem(null)
    setFormVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (item: ConfigItem) => {
    setFormTitle('编辑配置')
    setEditingItem(item)
    setFormVisible(true)
  }

  // 保存表单
  const handleSave = async (values: ConfigFormData) => {
    console.log(values, '<<<<< values')
    try {
      const newData: ConfigItem = {
        id: editingItem?.id || `${activeKey}_${Date.now()}`,
        name: values.name,
        color: values.color,
      }
      switch (activeKey) {
        case ConfigType.Status:
          if (editingItem) {
            await statusRepository.update(newData.id, newData)
          } else {
            await statusRepository.add(newData as Status)
          }
          break
        case ConfigType.Priority:
          if (editingItem) {
            await priorityRepository.update(newData.id, newData)
          } else {
            await priorityRepository.add(newData as Priority)
          }
          break
        case ConfigType.Group:
          if (editingItem) {
            await groupRepository.update(newData.id, newData)
          } else {
            await groupRepository.add(newData as Group)
          }
          break
      }

      message.success(editingItem ? '更新成功' : '添加成功')
      setFormVisible(false)
      loadData(activeKey)
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  // 打开删除确认
  const handleDelete = (item: ConfigItem) => {
    setDeletingItem(item)
    setDeleteVisible(true)
  }

  // 分页变化
  const handlePageChange = (page: number, newPageSize: number) => {
    setCurrentPage(page)
    setPageSize(newPageSize)
    loadData(activeKey, page, newPageSize)
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingItem) return

    try {
      switch (activeKey) {
        case ConfigType.Status:
          await statusRepository.delete(deletingItem.id)
          break
        case ConfigType.Priority:
          await priorityRepository.delete(deletingItem.id)
          break
        case ConfigType.Group:
          await groupRepository.delete(deletingItem.id)
          break
      }
      setDeleteVisible(false)
      loadData(activeKey)
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 size-full">
      <Card>
        <div className="flex justify-between items-center">
          <ConfigTabs activeKey={activeKey} onChange={handleTabChange} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增配置
          </Button>
        </div>
      </Card>

      <Card className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无配置数据" />
        ) : (
          <ConfigList
            data={data}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Card>

      <ConfigForm
        visible={formVisible}
        title={formTitle}
        initialValues={
          editingItem
            ? {
                id: editingItem.id,
                name: editingItem.name,
                color: editingItem.color,
              }
            : undefined
        }
        onConfirm={handleSave}
        onCancel={() => setFormVisible(false)}
      />

      <DeleteDialog
        visible={deleteVisible}
        item={deletingItem}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </div>
  )
}
