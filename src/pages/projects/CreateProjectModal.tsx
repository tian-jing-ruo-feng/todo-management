import { Modal, Form, Input } from 'antd'

const { TextArea } = Input

export interface CreateProjectModalProps {
  visible: boolean
  loading?: boolean
  onClose: () => void
  onCreate: (name: string, description?: string) => void
}

export default function CreateProjectModal({
  visible,
  loading,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const [form] = Form.useForm()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onCreate(values.name, values.description)
      form.resetFields()
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
      title="创建新项目"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建"
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

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">
          创建项目后将自动初始化以下配置：
        </p>
        <ul className="text-sm text-gray-600 mt-2 space-y-1">
          <li>• 默认状态：待办、进行中、已完成</li>
          <li>• 默认优先级：低、中、高</li>
        </ul>
      </div>
    </Modal>
  )
}
