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

  // 从 users 表获取用户别名（响应式，优先级最高）
  const userProfile = useLiveQuery(async () => {
    if (!currentUserId) return null

    // 从 users 表获取全局用户配置
    const user = await db.users.where('userId').equals(currentUserId).first()

    return user
  }, [currentUserId])

  useEffect(() => {
    if (visible && user) {
      // 优先显示 users 表中的别名，其次显示 currentUser.name
      form.setFieldsValue({
        name: userProfile?.name || user.name || '',
        email: user.email || '',
      })
    }
  }, [visible, user, userProfile, form])

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

      const currentUser = db.cloud.currentUser.value
      const now = new Date().toISOString()

      // 1. 更新 users 表（全局用户配置，会同步到云端）
      const existingUser = await db.users
        .where('userId')
        .equals(currentUserId)
        .first()
      console.log(db.users, '<<<<< db.users')
      console.log(existingUser, '<<<<<< TodoDB_z2quxatc8 existingUser')

      if (existingUser) {
        await db.users.update(existingUser.id, {
          name: newName,
          updatedAt: now,
        })
      } else {
        // 创建新的用户配置
        await db.users.add({
          id: `user_${currentUserId}`,
          userId: currentUserId,
          email: currentUser?.email,
          name: newName,
          owner: currentUserId,
          realmId: currentUserId, // 用户配置使用 userId 作为 realmId
          createdAt: now,
          updatedAt: now,
        })
      }

      // 2. 更新所有项目中当前用户的成员记录名称
      const allMembers = await db.members.toArray()
      const members = allMembers.filter(
        (m) => m.userId === currentUserId || m.email === currentUserId
      )

      if (members.length > 0) {
        await Promise.all(
          members.map((member) =>
            db.members.update(member.id, { name: newName })
          )
        )
      }

      // 3. 同步更新 currentUser.name（内存中的 BehaviorSubject）
      if (currentUser) {
        db.cloud.currentUser.next({
          ...currentUser,
          name: newName,
        })
      }

      // 4. 触发同步，确保更新同步到云端
      try {
        await db.cloud.sync()
      } catch (e) {
        console.error('同步失败:', e)
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
