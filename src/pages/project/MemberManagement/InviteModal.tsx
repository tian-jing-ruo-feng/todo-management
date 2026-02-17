import { useState } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import { MemberService } from '@/services/memberService'
import { useRoles } from '@/services/roleService'

export interface InviteModalProps {
  visible: boolean
  projectId: string
  onClose: () => void
}

export default function InviteModal({
  visible,
  projectId,
  onClose,
}: InviteModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const roles = useRoles()

  const handleOk = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      await MemberService.inviteMember(projectId, values.email, values.role)

      message.success('邀请已发送')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('邀请失败:', error)
      message.error(error instanceof Error ? error.message : '邀请失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="邀请成员"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="发送邀请"
      cancelText="取消"
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="email"
          label="邮箱地址"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input placeholder="输入成员的邮箱地址" size="large" />
        </Form.Item>

        <Form.Item
          name="role"
          label="角色"
          rules={[{ required: true, message: '请选择角色' }]}
          initialValue="member"
        >
          <Select placeholder="选择角色" size="large">
            {roles?.map((role) => (
              <Select.Option key={role.id} value={role.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-gray-500">
                    {role.description}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
        <p>邀请将通过邮箱发送给成员，成员接受邀请后即可加入项目。</p>
      </div>
    </Modal>
  )
}
