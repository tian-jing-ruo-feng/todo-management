import type { Task } from '@/types/Task'
import { groupRepository } from '@/utils/repositories/GroupRepository'
import { priorityRepository } from '@/utils/repositories/PriorityRepository'
import { statusRepository } from '@/utils/repositories/StatusRepository'
import { Form, Input, Modal, Select, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import DateTimePicker from '../DateTimePicker'
import MemberSelector from '../MemberSelector'
import RichTextEditor from '../RichTextEditor'
import { useUser } from '@/hooks/useUser'
import { useProjectPermission } from '@/services/projectService'

interface TaskDetailModalProps {
  visible: boolean
  task: Task | null
  onClose: () => void
  onSave: (task: Task) => void
}

export default function TaskDetailModal({
  visible,
  task,
  onClose,
  onSave,
}: TaskDetailModalProps) {
  const [form] = Form.useForm()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusOptions, setStatusOptions] = useState<
    Array<{ id: string; name: string; color: string }>
  >([])
  const [priorityOptions, setPriorityOptions] = useState<
    Array<{ id: string; name: string; color: string }>
  >([])
  const [groupOptions, setGroupOptions] = useState<
    Array<{ id: string; name: string; color: string }>
  >([])

  const { userId } = useUser()
  const projectPermission = useProjectPermission(task?.projectId)

  // 检查是否有编辑权限
  const canEdit = (() => {
    if (!task || !userId) return false

    // 项目所有者可以编辑
    if (projectPermission?.isOwner) return true

    // 管理员可以编辑
    if (projectPermission?.role === 'admin') return true

    // 任务所有者可以编辑
    if (task.owner === userId) return true

    // 任务负责人可以编辑
    if (task.assignee === userId) return true

    // 如果任务没有 owner 且没有 assignee，允许编辑（新创建的任务）
    if (!task.owner && !task.assignee) return true

    // 其他情况不能编辑
    return false
  })()

  // 获取无权限提示信息
  const getNoPermissionTip = () => {
    if (!task) return ''

    // 检查任务是否有负责人
    const hasAssignee = !!task.assignee

    if (!hasAssignee) {
      return '此任务由其他成员创建，尚未指定负责人。只有创建者、管理员和项目所有者可以编辑。'
    }

    return '此任务已分配给其他成员，您只能查看，无法编辑。'
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [statuses, priorities, groups] = await Promise.all([
          statusRepository.getAll(task?.projectId),
          priorityRepository.getAll(task?.projectId),
          groupRepository.getAll(task?.projectId),
        ])
        // 按 sort 字段正序排列
        setStatusOptions(statuses.sort((a, b) => (a.sort || 0) - (b.sort || 0)))
        setPriorityOptions(
          priorities.sort((a, b) => (a.sort || 0) - (b.sort || 0))
        )
        setGroupOptions(groups.sort((a, b) => (a.sort || 0) - (b.sort || 0)))
      } catch (error) {
        console.error('加载配置数据失败:', error)
      }
    }

    if (task?.projectId) {
      loadOptions()
    }
  }, [task?.projectId])

  // 当任务改变时，更新表单和内容
  useEffect(() => {
    if (task && visible) {
      // 只有在 Modal 可见且有任务时才设置表单值
      form.setFieldsValue({
        name: task.name,
        status: task.status,
        priority: task.priority,
        group: task.group || [],
        isTop: task.isTop,
        expectStartTime: task.expectStartTime,
        expectEndTime: task.expectEndTime,
        assignee: task.assignee,
      })
      setContent(task.content || '')
    }
  }, [task, form, visible])

  const handleOk = async () => {
    if (!canEdit) {
      message.warning('您没有权限编辑此任务')
      return
    }

    try {
      setLoading(true)
      const values = await form.validateFields()

      if (task) {
        const updatedTask: Task = {
          ...task,
          ...values,
          content,
          updateTime: new Date().toISOString(),
        }
        onSave(updatedTask)
        onClose()
      }
    } catch (error) {
      console.error('保存任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setContent('')
    onClose()
  }

  return (
    <Modal
      title={canEdit ? '编辑任务详情' : '任务详情（只读）'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      okText={canEdit ? '保存' : '确定'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
      okButtonProps={{ style: canEdit ? {} : { display: 'none' } }}
    >
      {!canEdit && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          {getNoPermissionTip()}
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="输入任务名称" disabled={!canEdit} />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择任务状态' }]}
        >
          <Select placeholder="选择任务状态" disabled={!canEdit}>
            {statusOptions.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                <span style={{ color: status.color }}>●</span> {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="优先级"
          rules={[{ required: true, message: '请选择优先级' }]}
        >
          <Select placeholder="选择优先级" disabled={!canEdit}>
            {priorityOptions.map((priority) => (
              <Select.Option key={priority.id} value={priority.id}>
                <span style={{ color: priority.color }}>●</span> {priority.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="expectStartTime" label="期望开始时间">
          <DateTimePicker placeholder="选择期望开始时间" disabled={!canEdit} />
        </Form.Item>

        <Form.Item name="expectEndTime" label="期望结束时间">
          <DateTimePicker placeholder="选择期望结束时间" disabled={!canEdit} />
        </Form.Item>

        <Form.Item name="group" label="分组">
          <Select
            mode="multiple"
            placeholder="选择任务分组"
            allowClear
            disabled={!canEdit}
          >
            {groupOptions.map((group) => (
              <Select.Option key={group.id} value={group.id}>
                <span style={{ color: group.color }}>●</span> {group.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="assignee" label="负责人">
          <MemberSelector projectId={task?.projectId} disabled={!canEdit} />
        </Form.Item>

        <Form.Item name="isTop" label="是否置顶" valuePropName="checked">
          <Switch disabled={!canEdit} />
        </Form.Item>

        <Form.Item label="任务内容">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="输入任务详细内容..."
            editable={canEdit}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
