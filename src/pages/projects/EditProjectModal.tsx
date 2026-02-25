import { Modal, Form, Input } from 'antd'
import { useEffect } from 'react'
import type { Project } from '@/types/Project'

const { TextArea } = Input

export interface EditProjectModalProps {
  visible: boolean
  project: Project | null
  loading?: boolean
  onClose: () => void
  onUpdate: (name: string, description?: string) => void
}

export default function EditProjectModal({
  visible,
  project,
  loading,
  onClose,
  onUpdate,
}: EditProjectModalProps) {
  const [form] = Form.useForm()

  // 当项目数据变化时，更新表单
  useEffect(() => {
    if (project && visible) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
      })
    }
  }, [project, form, visible])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onUpdate(values.name, values.description)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="编辑项目"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={520}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="项目名称"
          rules={[
            { required: true, message: '请输入项目名称' },
            { min: 2, message: '项目名称至少2个字符' },
            { max: 50, message: '项目名称最多50个字符' },
          ]}
        >
          <Input placeholder="请输入项目名称" size="large" />
        </Form.Item>

        <Form.Item
          name="description"
          label="项目描述"
          rules={[{ max: 200, message: '项目描述最多200个字符' }]}
        >
          <TextArea
            placeholder="请输入项目描述（可选）"
            rows={4}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
