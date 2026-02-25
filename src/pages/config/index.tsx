import type { Group } from '@/types/Group'
import type { Priority } from '@/types/Priority'
import type { Status } from '@/types/Status'
import {
  ConfigType,
  type ConfigFormData,
  type ConfigItem,
} from '@/types/config'
import {
  groupRepository,
  priorityRepository,
  statusRepository,
} from '@/utils/repositories'
import db from '@/utils/db'
import {
  DownloadOutlined,
  FlagOutlined,
  GroupOutlined,
  PlusOutlined,
  ScheduleFilled,
  ToolOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { arrayMove } from '@dnd-kit/sortable'
import { Alert, Button, Card, Empty, Spin, Upload, message } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { downloadFile } from '../../utils/common'
import { useProjectPermission } from '@/services/projectService'
import ConfigForm from './ConfigForm'
import ConfigList from './ConfigList'
import ConfigTabs from './ConfigTabs'
import DeleteDialog from './DeleteDialog'

export interface ConfigPageProps {
  projectId?: string
}

export default function ConfigPage({ projectId }: ConfigPageProps) {
  const [tagIcon, setTagIcon] = useState<React.ReactNode>(<ToolOutlined />)
  const [activeKey, setActiveKey] = useState<string>(ConfigType.Status)
  const [data, setData] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(false)

  // 权限检查
  const permission = useProjectPermission(projectId || '')
  const canManage = permission?.isOwner || permission?.role === 'admin'

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

  // 导入相关
  const [uploading, setUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // 初始化加载
  useEffect(() => {
    if (projectId) {
      loadData(activeKey, currentPage, pageSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, currentPage, pageSize, projectId])

  useEffect(() => {
    switch (activeKey) {
      case ConfigType.Status:
        setTagIcon(<ScheduleFilled />)
        break
      case ConfigType.Priority:
        setTagIcon(<FlagOutlined />)
        break
      case ConfigType.Group:
        setTagIcon(<GroupOutlined />)
        break
    }
  }, [activeKey])

  // 检查是否有项目ID - 在所有 hooks 之后
  if (!projectId) {
    return (
      <div className="flex flex-col flex-1 gap-4 size-full overflow-hidden">
        <Alert
          message="请先选择项目"
          description="配置管理需要在项目上下文中使用。请先选择一个项目，或在项目详情页面中访问配置管理。"
          type="warning"
          showIcon
        />
      </div>
    )
  }

  // 加载数据
  const loadData = async (type: string, page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      let items: ConfigItem[] = []
      switch (type) {
        case ConfigType.Status:
          items = await statusRepository.getPaginated(page, pageSize, projectId)
          break
        case ConfigType.Priority:
          items = await priorityRepository.getPaginated(
            page,
            pageSize,
            projectId
          )
          break
        case ConfigType.Group:
          items = await groupRepository.getPaginated(page, pageSize, projectId)
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
    try {
      if (!projectId) {
        message.error('缺少项目ID')
        return
      }

      // 获取当前用户
      const currentUser = db.cloud.currentUser.value
      const userId = currentUser?.userId || ''

      // 获取项目的 realmId
      const project = await db.projects.get(projectId)
      const realmId = project?.realmId || projectId

      // 计算下一个排序值（新增时）
      let nextSort = 1
      if (!editingItem) {
        const allItems = await (async () => {
          switch (activeKey) {
            case ConfigType.Status:
              return await statusRepository.getAll(projectId)
            case ConfigType.Priority:
              return await priorityRepository.getAll(projectId)
            case ConfigType.Group:
              return await groupRepository.getAll(projectId)
            default:
              return []
          }
        })()
        nextSort =
          allItems.length > 0
            ? Math.max(...allItems.map((item) => item.sort || 0)) + 1
            : 1
      }

      // 构建完整的配置数据，包含 Dexie Cloud 需要的字段
      const baseData = {
        id: editingItem?.id || `${activeKey}_${Date.now()}`,
        name: values.name,
        color: values.color,
        sort: editingItem?.sort || nextSort,
        projectId,
        realmId,
        owner: editingItem?.owner || userId,
      }

      switch (activeKey) {
        case ConfigType.Status:
          if (editingItem) {
            await statusRepository.update(baseData.id, baseData)
          } else {
            await statusRepository.add(baseData as Status)
          }
          break
        case ConfigType.Priority:
          if (editingItem) {
            await priorityRepository.update(baseData.id, baseData)
          } else {
            await priorityRepository.add(baseData as Priority)
          }
          break
        case ConfigType.Group:
          if (editingItem) {
            await groupRepository.update(baseData.id, baseData)
          } else {
            await groupRepository.add(baseData as Group)
          }
          break
      }

      message.success(editingItem ? '更新成功' : '添加成功')
      setFormVisible(false)
      // 立即重新加载数据
      await loadData(activeKey, currentPage, pageSize)
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
  // 导出处理
  const handleExport = async () => {
    let jsonData
    try {
      setIsExporting(true)
      switch (activeKey) {
        case ConfigType.Status:
          jsonData = await statusRepository.getAll(projectId)
          break
        case ConfigType.Priority:
          jsonData = await priorityRepository.getAll(projectId)
          break
        case ConfigType.Group:
          jsonData = await groupRepository.getAll(projectId)
          break
      }
      const fileName = `${activeKey}-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`
      const blob = new Blob([JSON.stringify(jsonData)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      downloadFile(url, fileName)
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  // 排序处理
  const handleSortChange = async (activeId: string, overId: string) => {
    try {
      const activeIndex = data.findIndex((i) => i.id === activeId)
      const overIndex = data.findIndex((i) => i.id === overId)
      const sortedData = arrayMove(data, activeIndex, overIndex).map(
        (item, index) => ({ ...item, sort: index + 1 }) as ConfigItem
      )
      // 保存排序结果
      switch (activeKey) {
        case ConfigType.Status:
          await statusRepository.bulkUpdate(sortedData as Status[])
          break
        case ConfigType.Priority:
          await priorityRepository.bulkUpdate(sortedData as Priority[])
          break
        case ConfigType.Group:
          await groupRepository.bulkUpdate(sortedData as Group[])
          break
      }
      loadData(activeKey, currentPage, pageSize)
    } catch (error) {
      console.error('排序失败:', error)
      message.error('排序失败')
    }
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
      loadData(activeKey, currentPage, pageSize)
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 处理JSON文件导入
  const handleImport = async (file: File) => {
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const jsonData = JSON.parse(content)

          // 验证JSON格式
          if (!Array.isArray(jsonData)) {
            message.error('JSON文件格式错误：必须是数组格式')
            setUploading(false)
            return
          }

          // 根据当前激活的标签页导入相应数据
          let successCount = 0
          for (const item of jsonData) {
            try {
              switch (activeKey) {
                case ConfigType.Status:
                  // 导入Status数据
                  if (
                    item &&
                    typeof item.id === 'string' &&
                    item.id.startsWith('status_')
                  ) {
                    const statusItem = item as unknown as Status
                    // 检查是否已存在
                    const exists = data.some((d) => d.id === statusItem.id)
                    if (!exists) {
                      await statusRepository.add(statusItem)
                      successCount++
                    }
                  }
                  break
                case ConfigType.Priority:
                  // 导入Priority数据
                  if (
                    item.id &&
                    typeof item.id === 'string' &&
                    item.id.startsWith('priority_')
                  ) {
                    const priorityItem = item as unknown as Priority
                    // 检查是否已存在
                    const exists = data.some((d) => d.id === priorityItem.id)
                    if (!exists) {
                      await priorityRepository.add(priorityItem)
                      successCount++
                    }
                  }
                  break
                case ConfigType.Group:
                  // 导入Group数据
                  if (
                    item.id &&
                    typeof item.id === 'string' &&
                    item.id.startsWith('group_')
                  ) {
                    const groupItem = item as unknown as Group
                    // 检查是否已存在
                    const exists = data.some((d) => d.id === groupItem.id)
                    if (!exists) {
                      await groupRepository.add(groupItem)
                      successCount++
                    }
                  }
                  break
              }
            } catch (err) {
              console.error('导入单条数据失败:', err)
            }
          }

          if (successCount > 0) {
            message.success(`成功导入 ${successCount} 条数据`)
            loadData(activeKey, currentPage, pageSize)
          } else {
            message.warning('没有导入新数据，可能数据已存在或格式不正确')
          }
        } catch (parseError) {
          console.error('JSON解析失败:', parseError)
          message.error('JSON文件解析失败，请检查文件格式')
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        message.error('文件读取失败')
        setUploading(false)
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入失败')
      setUploading(false)
    }
    return false // 阻止默认上传行为
  }

  // 上传前验证
  const beforeUpload = (file: File) => {
    const isJson =
      file.type === 'application/json' || file.name.endsWith('.json')
    if (!isJson) {
      message.error('只能上传JSON文件')
      return Upload.LIST_IGNORE
    }
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件大小不能超过10MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  return (
    <div className="flex flex-col flex-1 gap-4 size-full overflow-hidden">
      {/* 无权限提示 */}
      {!canManage && (
        <Alert
          message="权限提示"
          description="您当前是项目成员，只能查看配置。只有项目创建者和管理员可以进行配置管理操作。"
          type="info"
          showIcon
        />
      )}

      <Card classNames={{ body: 'p-3!' }}>
        <div className="flex justify-between items-center">
          <ConfigTabs activeKey={activeKey} onChange={handleTabChange} />
          <div className="flex gap-2">
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={beforeUpload}
              customRequest={({ file }) => handleImport(file as File)}
              disabled={uploading || !canManage}
              maxCount={1}
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                disabled={!canManage}
              >
                导入JSON
              </Button>
            </Upload>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              loading={isExporting}
              onClick={handleExport}
              disabled={!canManage}
            >
              导出JSON
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={!canManage}
            >
              新增配置
            </Button>
          </div>
        </div>
      </Card>

      <Card
        className="flex-1 size-full overflow-hidden"
        classNames={{
          body: 'size-full overflow-hidden p-3!',
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无配置数据" />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden size-full">
            <ConfigList
              data={data}
              tagIcon={tagIcon}
              canManage={canManage}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSortChange={handleSortChange}
            />
          </div>
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
