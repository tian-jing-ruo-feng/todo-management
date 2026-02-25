import { Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'

interface ProfileModalProps {
  visible: boolean
  onClose: () => void
}

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const currentUserId = db.cloud.currentUserId

  // 从成员记录中获取用户别名（响应式）
  const memberName = useLiveQuery(async () => {
    if (!currentUserId) return null

    // 获取所有成员，然后过滤匹配当前用户
    const allMembers = await db.members.toArray()
    const member = allMembers.find(
      (m) => m.userId === currentUserId || m.email === currentUserId
    )

    return member?.name || null
  }, [currentUserId])

  useEffect(() => {
    if (visible && user) {
      // 优先显示成员记录中的别名
      form.setFieldsValue({
        name: memberName || user.name || '',
        email: user.email || '',
      })
    }
  }, [visible, user, memberName, form])

  const handleOk = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      const newName = values.name?.trim()

      if (!newName) {
        message.error('用户别名不能为空')
        return
      }

      const currentUserId = db.cloud.currentUserId
      if (!currentUserId) {
        message.error('用户未登录')
        return
      }

      // 更新所有项目中当前用户的成员记录名称
      const members = await db.members
        .where('userId')
        .equals(currentUserId)
        .toArray()

      if (members.length > 0) {
        await Promise.all(
          members.map((member) =>
            db.members.update(member.id, { name: newName })
          )
        )
      }

      message.success('用户别名更新成功')
      onClose()
    } catch (error) {
      console.error('更新用户别名失败:', error)
      message.error('更新用户别名失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="个人中心"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="email" label="邮箱">
          <Input disabled placeholder="用户邮箱" />
        </Form.Item>

        <Form.Item
          name="name"
          label="用户别名"
          rules={[{ required: true, message: '请输入用户别名' }]}
        >
          <Input placeholder="请输入用户别名" maxLength={50} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
