import React from 'react'
import type { Task } from '@/types/Task'
import { Form, Input, Modal, Select, Switch } from 'antd'
import { useState, useEffect } from 'react'
import RichTextEditor from '../RichTextEditor'
import DateTimePicker from '../DateTimePicker'
import { getStatusOptions, getPriorityOptions } from '@/utils/taskHelpers'

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

  useEffect(() => {
    setStatusOptions(getStatusOptions())
    setPriorityOptions(getPriorityOptions())
  }, [])

  // 当任务改变时，更新表单和内容
  React.useEffect(() => {
    if (task && visible) {
      // 只有在 Modal 可见且有任务时才设置表单值
      form.setFieldsValue({
        name: task.name,
        status: task.status,
        priority: task.priority,
        isTop: task.isTop,
        expectStartTime: task.expectStartTime,
        expectEndTime: task.expectEndTime,
      })
      setContent(task.content || '')
    }
  }, [task, form, visible])

  // 当 Modal 关闭时重置表单
  React.useEffect(() => {
    if (!visible) {
      form.resetFields()
      setContent('')
    }
  }, [visible, form])

  const handleOk = async () => {
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
      title="编辑任务详情"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        // 移除 initialValues，让 useEffect 控制表单值
      >
        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="输入任务名称" />
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Select placeholder="选择任务状态">
            {statusOptions.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                <span style={{ color: status.color }}>●</span> {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级">
          <Select placeholder="选择优先级">
            {priorityOptions.map((priority) => (
              <Select.Option key={priority.id} value={priority.id}>
                <span style={{ color: priority.color }}>●</span> {priority.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="expectStartTime" label="期望开始时间">
          <DateTimePicker placeholder="选择期望开始时间" />
        </Form.Item>

        <Form.Item name="expectEndTime" label="期望结束时间">
          <DateTimePicker placeholder="选择期望结束时间" />
        </Form.Item>

        <Form.Item name="isTop" label="是否置顶" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="任务内容">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="输入任务详细内容..."
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
